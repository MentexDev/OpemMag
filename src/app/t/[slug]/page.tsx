import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
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
    .select("id, name, slug, primary_color, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) notFound();

  const { count } = await admin
    .from("tenant_users")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("role", "ambassador")
    .eq("status", "approved");

  return (
    <TenantLandingClient
      tenant={{
        name: tenant.name as string,
        slug: tenant.slug as string,
        primary_color: (tenant.primary_color as string) || "#ec4899",
        logo_url: tenant.logo_url as string | null,
      }}
      ambassadorCount={count ?? 0}
    />
  );
}
