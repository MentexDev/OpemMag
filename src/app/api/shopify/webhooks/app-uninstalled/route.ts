import { NextRequest, NextResponse } from "next/server";
import { validateWebhookHmac } from "@/lib/shopify-oauth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Disparado cuando el merchant desinstala la app desde su Shopify Admin.
// Limpiamos el token (ya no nos sirve) y dominio.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!validateWebhookHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const shop = request.headers.get("x-shopify-shop-domain");
  if (shop) {
    const admin = createAdminClient();
    await admin
      .from("tenants")
      .update({
        shopify_domain: null,
        shopify_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("shopify_domain", shop);
  }

  return NextResponse.json({ ok: true });
}
