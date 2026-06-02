import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: tenantUser } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .eq("role", "admin")
    .maybeSingle();

  const tenantId = tenantUser?.tenant_id;

  const [{ count: ambassadorCount }, { data: salesData }] = await Promise.all([
    admin
      .from("tenant_users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "ambassador"),
    admin
      .from("sales")
      .select("amount, commission_amt")
      .eq("tenant_id", tenantId),
  ]);

  const totalSales =
    salesData?.reduce((s: number, r: { amount: unknown; commission_amt: unknown }) => s + Number(r.amount), 0) ?? 0;
  const totalComm =
    salesData?.reduce((s: number, r: { amount: unknown; commission_amt: unknown }) => s + Number(r.commission_amt), 0) ?? 0;

  const stats = [
    {
      title: "Embajadoras",
      value: ambassadorCount ?? 0,
      icon: Users,
      description: "registradas",
    },
    {
      title: "Ventas totales",
      value: `$${totalSales.toLocaleString("es-CO")}`,
      icon: TrendingUp,
      description: "en el período",
    },
    {
      title: "Comisiones",
      value: `$${totalComm.toLocaleString("es-CO")}`,
      icon: DollarSign,
      description: "generadas",
    },
    {
      title: "Ranking activo",
      value: salesData?.length ?? 0,
      icon: Star,
      description: "ventas registradas",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel General</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
