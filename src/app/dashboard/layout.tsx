import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: tenantUser } = await admin
    .from("tenant_users")
    .select("role, tenants(id, name, slug, primary_color, accent_color, logo_url)")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!tenantUser) redirect("/register");

  const tenant = Array.isArray(tenantUser.tenants)
    ? tenantUser.tenants[0]
    : tenantUser.tenants;

  return (
    <DashboardShell tenant={tenant} user={user}>
      {children}
    </DashboardShell>
  );
}
