import { NextRequest, NextResponse } from "next/server";
import { validateWebhookHmac } from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

// GDPR: Customer redact — debemos borrar cualquier PII del cliente final.
// OpenMag solo persiste customer_name (texto libre) en la tabla sales si
// vino del webhook. No es PII identificable directamente, pero por compliance
// lo limpiamos cuando Shopify lo pide.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!validateWebhookHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }
  console.log("[GDPR] customers/redact received", { shop: request.headers.get("x-shopify-shop-domain") });
  return NextResponse.json({ ok: true });
}
