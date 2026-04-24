import { NextRequest, NextResponse } from "next/server";
import { validateWebhookHmac } from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

// GDPR: Customer data request — Shopify exige responder 200 a esto.
// Como OpenMag solo guarda datos del merchant (no del cliente final),
// no tenemos PII del cliente. Logueamos por trazabilidad.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!validateWebhookHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }
  console.log("[GDPR] customers/data_request received", { shop: request.headers.get("x-shopify-shop-domain") });
  return NextResponse.json({ ok: true });
}
