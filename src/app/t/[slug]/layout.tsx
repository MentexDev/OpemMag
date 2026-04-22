import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
}

async function getTenant(slug: string): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const style = {
    "--brand-primary": tenant.primary_color,
    "--brand-accent": tenant.accent_color,
  } as React.CSSProperties;

  return (
    <div style={style} className="min-h-screen">
      {children}
    </div>
  );
}
