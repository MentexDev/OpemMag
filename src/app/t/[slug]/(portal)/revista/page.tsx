import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import RevistaPortalClient from "./client";

export const dynamic = "force-dynamic";

export default async function AmbassadorRevistaPage({
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
    .select("id, name, slug, primary_color")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) redirect("/login");

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  return (
    <RevistaPortalClient
      products={[]}
      tenantSlug={slug}
      tenantName={tenant.name as string}
      primaryColor={(tenant as { primary_color: string }).primary_color}
      refCode={profile?.referral_code ?? null}
      userId={user.id}
      tenantId={tenant.id as string}
    />
  );
}
