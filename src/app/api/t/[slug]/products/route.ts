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
    .select("id, shopify_domain, shopify_token, is_active, catalog_product_ids")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  if (!tenant.shopify_domain || !tenant.shopify_token) {
    return NextResponse.json({ products: [], shopifyConfigured: false });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam), 250) : 250;

  let products = await fetchTenantProducts({
    domain: tenant.shopify_domain,
    encryptedToken: tenant.shopify_token,
  }, { limit });

  // Apply tenant's curated catalog selection if set
  const catalogIds = tenant.catalog_product_ids as string[] | null;
  if (catalogIds && catalogIds.length > 0) {
    const catalogSet = new Set(catalogIds);
    products = products.filter(p => catalogSet.has(String(p.id)));
  }

  // Filter by explicit IDs param (ambassador personal selection)
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
