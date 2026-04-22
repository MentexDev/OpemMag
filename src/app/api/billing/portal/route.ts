import { NextResponse } from "next/server";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe no está configurado en el servidor." }, { status: 503 });
  }

  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ctx.tenant.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aún no tienes una suscripción activa. Suscríbete primero." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: ctx.tenant.stripe_customer_id,
    return_url: `${appUrl}/dashboard/configuracion`,
  });

  return NextResponse.json({ url: session.url });
}
