import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DollarSign, ShoppingBag, Share2, LogOut } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AmbassadorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login`);

  const admin = createAdminClient();

  // Get tenant
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) redirect(`/login`);

  // Verify membership
  const { data: membership } = await admin
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect(`/login`);

  // Get profile
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, referral_code, avatar_url")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  // Get sales summary
  const { data: sales } = await admin
    .from("sales")
    .select("amount, commission_amt, status")
    .eq("seller_id", user.id)
    .eq("tenant_id", tenant.id);

  type Sale = { amount: unknown; commission_amt: unknown; status: string };
  const salesArr = (sales ?? []) as Sale[];
  const totalSales = salesArr.reduce((s: number, r: Sale) => s + Number(r.amount), 0);
  const totalComm = salesArr.reduce((s: number, r: Sale) => s + Number(r.commission_amt), 0);
  const pendingComm = salesArr
    .filter((r: Sale) => r.status === "pending")
    .reduce((s: number, r: Sale) => s + Number(r.commission_amt), 0);

  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${slug}/ref/${profile?.referral_code}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-auto object-contain" />
            ) : (
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: tenant.primary_color }}
              >
                {tenant.name[0].toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-sm">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.full_name ?? user.email}
            </span>
            <form action={`/api/ambassador/logout?slug=${slug}`} method="POST">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-bold">
            Hola, {profile?.full_name?.split(" ")[0] ?? "embajadora"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí está el resumen de tu actividad como embajadora.
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Ventas totales", value: `$${totalSales.toLocaleString("es-CO")}`, icon: ShoppingBag, color: "text-blue-500" },
            { label: "Comisiones ganadas", value: `$${totalComm.toLocaleString("es-CO")}`, icon: DollarSign, color: "text-green-500" },
            { label: "Comisiones pendientes", value: `$${pendingComm.toLocaleString("es-CO")}`, icon: DollarSign, color: "text-yellow-500" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Mi enlace */}
        {profile?.referral_code && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Mi enlace de referidos</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
                {cardUrl}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(cardUrl)}
                className="flex-shrink-0 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Código: <span className="font-mono font-medium">{profile.referral_code}</span>
            </p>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h2 className="font-semibold text-sm">Mis ventas</h2>
            <p className="text-sm text-muted-foreground">Historial de ventas registradas y comisiones.</p>
            <Link
              href="/ventas"
              className="inline-flex items-center gap-1.5 text-sm font-medium mt-1 hover:underline"
              style={{ color: "var(--brand-primary, #6366f1)" }}
            >
              Ver ventas →
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h2 className="font-semibold text-sm">Ranking</h2>
            <p className="text-sm text-muted-foreground">Compara tu desempeño con otras embajadoras.</p>
            <Link
              href="/ranking"
              className="inline-flex items-center gap-1.5 text-sm font-medium mt-1 hover:underline"
              style={{ color: "var(--brand-primary, #6366f1)" }}
            >
              Ver ranking →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
