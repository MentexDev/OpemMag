import { NextResponse } from "next/server";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import { createAdminClient } from "@/lib/supabase/server";
import { isShopifyConfigured } from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("shopify_domain, shopify_token")
    .eq("id", ctx.tenant.id)
    .maybeSingle();

  return NextResponse.json({
    connected: !!(data?.shopify_domain && data?.shopify_token),
    shop: data?.shopify_domain ?? null,
    oauthConfigured: isShopifyConfigured(),
  });
}
