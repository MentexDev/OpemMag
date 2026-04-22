import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, priceIdForPlan } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe no está configurado en el servidor." }, { status: 503 });
  }

  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json();
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: `Plan "${plan}" no tiene precio configurado.` }, { status: 400 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  // Ensure stripe customer exists
  let customerId = ctx.tenant.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.email,
      name: ctx.tenant.name,
      metadata: { tenant_id: ctx.tenant.id, slug: ctx.tenant.slug },
    });
    customerId = customer.id;
    await admin
      .from("tenants")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", ctx.tenant.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/configuracion?billing=success`,
    cancel_url: `${appUrl}/dashboard/configuracion?billing=cancel`,
    subscription_data: {
      metadata: { tenant_id: ctx.tenant.id, plan },
    },
    metadata: { tenant_id: ctx.tenant.id, plan },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
