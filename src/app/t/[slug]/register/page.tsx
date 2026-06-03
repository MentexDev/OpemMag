import { createAdminClient } from "@/lib/supabase/server";
import RegisterClient from "./client";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("name, logo_url, primary_color")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return (
    <RegisterClient
      slug={slug}
      tenantName={(tenant?.name as string) ?? ""}
      logoUrl={(tenant?.logo_url as string | null) ?? null}
      primaryColor={(tenant?.primary_color as string) ?? "#6366f1"}
    />
  );
}
