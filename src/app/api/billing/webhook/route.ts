import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, string> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "unpaid",
  incomplete: "incomplete",
  incomplete_expired: "canceled",
  paused: "paused",
};

async function findTenantId(admin: ReturnType<typeof createAdminClient>, opts: { customerId?: string; tenantId?: string }): Promise<string | null> {
  if (opts.tenantId) return opts.tenantId;
  if (!opts.customerId) return null;
  const { data } = await admin
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", opts.customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function applySubscription(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const tenantId = (sub.metadata?.tenant_id as string | undefined)
    ?? (await findTenantId(admin, { customerId }));
  if (!tenantId) return;

  const status = STATUS_MAP[sub.status] ?? sub.status;
  const plan = (sub.metadata?.plan as string | undefined) ?? null;

  // current_period_end exists on subscription items
  const item = sub.items.data[0];
  const periodEndUnix = item?.current_period_end ?? null;

  const updates: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    subscription_status: status,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (plan) updates.plan = plan;

  await admin.from("tenants").update(updates).eq("id", tenantId);
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip if already processed
  const { data: existing } = await admin
    .from("billing_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(admin, sub);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(admin, sub);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        const tenantId = await findTenantId(admin, { customerId });
        if (tenantId) {
          await admin
            .from("tenants")
            .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
            .eq("id", tenantId);
        }
        break;
      }
    }

    // Record event for audit / idempotency
    const customerId = "customer" in event.data.object && typeof event.data.object.customer === "string"
      ? event.data.object.customer
      : undefined;
    const tenantId = customerId ? await findTenantId(admin, { customerId }) : null;

    await admin.from("billing_events").insert({
      tenant_id: tenantId,
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
