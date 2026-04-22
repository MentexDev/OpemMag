import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMetrics() {
  const admin = createAdminClient();

  const [
    { count: tenantsTotal },
    { count: tenantsActive },
    { count: ambassadors },
    { data: salesData },
  ] = await Promise.all([
    admin.from("tenants").select("*", { count: "exact", head: true }),
    admin.from("tenants").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("tenant_users").select("*", { count: "exact", head: true }).eq("role", "ambassador"),
    admin.from("sales").select("amount, commission_amt"),
  ]);

  type Sale = { amount: unknown; commission_amt: unknown };
  const sales = (salesData ?? []) as Sale[];
  const totalSales = sales.reduce((s: number, r: Sale) => s + Number(r.amount), 0);
  const totalComm = sales.reduce((s: number, r: Sale) => s + Number(r.commission_amt), 0);

  return {
    tenantsTotal: tenantsTotal ?? 0,
    tenantsActive: tenantsActive ?? 0,
    tenantsInactive: (tenantsTotal ?? 0) - (tenantsActive ?? 0),
    ambassadors: ambassadors ?? 0,
    salesCount: sales.length,
    totalSales,
    totalComm,
  };
}

async function getRecentTenants() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("id, name, slug, plan, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export default async function AdminDashboardPage() {
  const m = await getMetrics();
  const recent = await getRecentTenants();

  const cards = [
    { label: "Tiendas activas", value: m.tenantsActive, icon: CheckCircle2, color: "text-green-500" },
    { label: "Tiendas suspendidas", value: m.tenantsInactive, icon: XCircle, color: "text-orange-500" },
    { label: "Total embajadoras", value: m.ambassadors, icon: Users, color: "text-blue-500" },
    { label: "Ventas registradas", value: m.salesCount, icon: ShoppingBag, color: "text-purple-500" },
    { label: "GMV total", value: `$${m.totalSales.toLocaleString("es-CO")}`, icon: DollarSign, color: "text-pink-500" },
    { label: "Comisiones generadas", value: `$${m.totalComm.toLocaleString("es-CO")}`, icon: DollarSign, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Resumen global</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Métricas agregadas de todas las tiendas en NexusStore.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tenants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Últimas tiendas registradas</h2>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin tiendas todavía.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Tienda</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Slug</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Plan</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Creada</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((t: { id: string; name: string; slug: string; plan: string; is_active: boolean; created_at: string }) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-muted-foreground">{t.slug}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground capitalize">{t.plan}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          t.is_active
                            ? "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400"
                            : "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400"
                        }
                      >
                        {t.is_active ? "Activa" : "Suspendida"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
