import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import AdminShell from "@/components/admin/shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const allowed = await isSuperAdmin(user.id);
  if (!allowed) redirect("/admin/login?error=forbidden");

  return <AdminShell user={user}>{children}</AdminShell>;
}
