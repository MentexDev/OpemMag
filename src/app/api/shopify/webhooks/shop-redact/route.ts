import { NextRequest, NextResponse } from "next/server";
import { validateWebhookHmac } from "@/lib/shopify-oauth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GDPR: Shop redact — disparado 48h después de que el merchant desinstala la app.
// Debemos borrar todos los datos del shop. Limpiamos el token y dominio,
// pero conservamos las ventas históricas para no romper reportes del tenant
// (asumimos que el tenant puede re-conectar si quiere).
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!validateWebhookHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  let body: { shop_domain?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.shop_domain) {
    const admin = createAdminClient();
    await admin
      .from("tenants")
      .update({
        shopify_domain: null,
        shopify_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("shopify_domain", body.shop_domain);
  }

  return NextResponse.json({ ok: true });
}
