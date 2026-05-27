import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeShopDomain } from "@/lib/shopify-oauth";
import { encrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shop, token } = await request.json();
  if (!shop || !token) {
    return NextResponse.json({ error: "Faltan el dominio o el token." }, { status: 400 });
  }

  const normalizedShop = normalizeShopDomain(shop);
  if (!normalizedShop) {
    return NextResponse.json({ error: "Dominio Shopify inválido. Debe terminar en .myshopify.com" }, { status: 400 });
  }

  if (!token.startsWith("shpat_") && !token.startsWith("shpca_")) {
    return NextResponse.json({ error: "Token inválido. Debe empezar con shpat_ o shpca_" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({
      shopify_domain: normalizedShop,
      shopify_token: encrypt(token),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.tenant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
