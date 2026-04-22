import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no está configurada");
  _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export interface PlanPrice {
  id: "pro" | "enterprise";
  label: string;
  priceId: string | undefined;
}

export function availablePlans(): PlanPrice[] {
  return [
    { id: "pro", label: "Pro", priceId: process.env.STRIPE_PRICE_PRO },
    { id: "enterprise", label: "Enterprise", priceId: process.env.STRIPE_PRICE_ENTERPRISE },
  ];
}

export function priceIdForPlan(plan: string): string | null {
  const map: Record<string, string | undefined> = {
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[plan] ?? null;
}
