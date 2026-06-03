import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import AmbassadorShell from "@/components/ambassador-shell";
import { Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) redirect("/login");

  const { data: membership } = await admin
    .from("tenant_users")
    .select("status, role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  // Admins don't use the ambassador portal
  if (membership.role === "admin" || membership.role === "owner") {
    redirect("/dashboard");
  }

  if (membership.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/15 mx-auto">
            <Clock className="h-7 w-7 text-yellow-500" />
          </div>
          <h1 className="text-xl font-bold">Solicitud pendiente</h1>
          <p className="text-sm text-muted-foreground">
            Tu solicitud para {tenant.name} está siendo revisada. Recibirás acceso cuando sea aprobada.
          </p>
          <form action={`/api/ambassador/logout?slug=${slug}`} method="POST">
            <button className="text-sm text-muted-foreground underline">Cerrar sesión</button>
          </form>
        </div>
      </div>
    );
  }

  if (membership.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 mx-auto">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Solicitud rechazada</h1>
          <p className="text-sm text-muted-foreground">
            Tu solicitud no fue aprobada. Contacta directamente con {tenant.name}.
          </p>
          <form action={`/api/ambassador/logout?slug=${slug}`} method="POST">
            <button className="text-sm text-muted-foreground underline">Cerrar sesión</button>
          </form>
        </div>
      </div>
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, referral_code, avatar_url")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  return (
    <AmbassadorShell
      tenant={tenant}
      profile={profile ?? null}
    >
      {children}
    </AmbassadorShell>
  );
}
