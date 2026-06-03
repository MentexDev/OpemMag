import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchTenantProducts } from "@/lib/shopify";
import TenantLandingClient from "./landing-client";

export const dynamic = "force-dynamic";

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, logo_url, shopify_domain, shopify_token")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) notFound();

  const [{ count }, products] = await Promise.all([
    admin
      .from("tenant_users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("role", "ambassador")
      .eq("status", "approved"),
    tenant.shopify_domain && tenant.shopify_token
      ? fetchTenantProducts({ domain: tenant.shopify_domain, encryptedToken: tenant.shopify_token }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <TenantLandingClient
      tenant={{
        name: tenant.name as string,
        slug: tenant.slug as string,
        primary_color: (tenant.primary_color as string) || "#ec4899",
        logo_url: tenant.logo_url as string | null,
      }}
      products={products}
      ambassadorCount={count ?? 0}
    />
  );
}
