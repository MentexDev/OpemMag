import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchTenantProducts } from "@/lib/shopify";
import MisRevistasClient from "./client";

export const dynamic = "force-dynamic";

export default async function MisRevistasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, shopify_domain, shopify_token, catalog_product_ids")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) redirect("/login");

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  // Fetch ambassador's custom catalogs
  const { data: catalogs } = await admin
    .from("ambassador_catalogs")
    .select("id, name, product_ids, created_at")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  // Fetch all products for preview images
  let allProducts: import("@/lib/shopify").ShopifyProduct[] = [];
  if (tenant.shopify_domain && tenant.shopify_token) {
    const all = await fetchTenantProducts({
      domain: tenant.shopify_domain as string,
      encryptedToken: tenant.shopify_token as string,
    });
    const catalogIds = tenant.catalog_product_ids as string[] | null;
    allProducts = catalogIds && catalogIds.length > 0
      ? all.filter((p) => catalogIds.includes(String(p.id)))
      : all;
  }

  const productMap = Object.fromEntries(allProducts.map((p) => [String(p.id), p]));

  return (
    <MisRevistasClient
      catalogs={(catalogs ?? []) as { id: string; name: string; product_ids: string[]; created_at: string }[]}
      productMap={productMap}
      primaryColor={(tenant as { primary_color: string }).primary_color}
      tenantSlug={slug}
      refCode={profile?.referral_code ?? null}
    />
  );
}
