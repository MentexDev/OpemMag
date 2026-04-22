import { NextResponse } from "next/server";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import { isStripeConfigured, availablePlans } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const t = ctx.tenant;
  const trialEndsAt = new Date(t.trial_ends_at);
  const now = new Date();
  const trialActive = trialEndsAt > now && t.subscription_status === "trialing";
  const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000)) : 0;

  return NextResponse.json({
    plan: t.plan,
    status: t.subscription_status,
    trialEndsAt: t.trial_ends_at,
    trialActive,
    trialDaysLeft,
    currentPeriodEnd: t.current_period_end,
    cancelAtPeriodEnd: t.cancel_at_period_end,
    hasStripeCustomer: !!t.stripe_customer_id,
    hasActiveSubscription: !!t.stripe_subscription_id && ["active", "trialing"].includes(t.subscription_status),
    stripeConfigured: isStripeConfigured(),
    availablePlans: availablePlans()
      .filter(p => !!p.priceId)
      .map(p => ({ id: p.id, label: p.label })),
  });
}
