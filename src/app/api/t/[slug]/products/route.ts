import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchTenantProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, shopify_domain, shopify_token, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  if (!tenant.shopify_domain || !tenant.shopify_token) {
    return NextResponse.json({ products: [], shopifyConfigured: false });
  }

  const products = await fetchTenantProducts({
    domain: tenant.shopify_domain,
    encryptedToken: tenant.shopify_token,
  });

  // Filter by IDs if provided
  const idsParam = request.nextUrl.searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    const idSet = new Set(ids);
    return NextResponse.json({
      products: products.filter(p => idSet.has(String(p.id))),
      shopifyConfigured: true,
    });
  }

  return NextResponse.json({ products, shopifyConfigured: true });
}
