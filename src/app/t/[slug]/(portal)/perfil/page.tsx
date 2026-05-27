import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import PerfilClient from "./client";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
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
    .select("full_name, referral_code, avatar_url, phone, city, bio, bank_name, account_type, account_number, document_type, document_number")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const isGoogleUser = authUser?.user?.app_metadata?.provider === "google";

  return (
    <PerfilClient
      userId={user.id}
      email={user.email ?? ""}
      isGoogleUser={isGoogleUser}
      profile={profile ?? null}
      tenantSlug={slug}
      tenantName={tenant.name as string}
      primaryColor={(tenant as { primary_color: string }).primary_color}
    />
  );
}
