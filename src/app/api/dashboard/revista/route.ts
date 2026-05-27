import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchTenantProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

async function getAdminTenantId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data?.tenant_id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getAdminTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, shopify_domain, shopify_token")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  if (!tenant.shopify_domain || !tenant.shopify_token) {
    return NextResponse.json({ products: [], shopifyConfigured: false, selected: [] });
  }

  // Fetch products and catalog selection in parallel
  const [products, catalogRow] = await Promise.all([
    fetchTenantProducts({
      domain: tenant.shopify_domain as string,
      encryptedToken: tenant.shopify_token as string,
    }),
    admin
      .from("tenants")
      .select("catalog_product_ids")
      .eq("id", tenantId)
      .maybeSingle()
      .then(r => r.data),
  ]);

  const selected: string[] = (catalogRow?.catalog_product_ids as string[] | null) ?? [];

  return NextResponse.json({ products, shopifyConfigured: true, selected });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getAdminTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { selected } = await request.json() as { selected: string[] };
  if (!Array.isArray(selected)) {
    return NextResponse.json({ error: "selected debe ser un array" }, { status: 400 });
  }

  const admin = createAdminClient();
  const value = selected.length === 0 ? null : selected;

  const { error } = await admin
    .from("tenants")
    .update({ catalog_product_ids: value, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
