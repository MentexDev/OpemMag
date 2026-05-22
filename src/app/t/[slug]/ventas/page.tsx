import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0",
  paid: "bg-green-500/15 text-green-700 dark:text-green-400 border-0",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  paid: "Pagada",
};

export default async function AmbassadorVentasPage({
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
    .select("id, name, primary_color")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) redirect("/login");

  const { data: membership } = await admin
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  const { data: sales } = await admin
    .from("sales")
    .select("id, amount, commission_amt, status, customer_name, referral_code, notes, sale_date, created_at")
    .eq("tenant_id", tenant.id)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  type Sale = { id: string; amount: unknown; commission_amt: unknown; status: string; customer_name: string | null; referral_code: string; notes: string | null; sale_date: string };
  const salesArr = (sales ?? []) as Sale[];

  const totalAmount = salesArr.reduce((acc, s) => acc + Number(s.amount), 0);
  const totalComm = salesArr.reduce((acc, s) => acc + Number(s.commission_amt), 0);
  const pendingComm = salesArr
    .filter((s) => s.status === "pending")
    .reduce((acc, s) => acc + Number(s.commission_amt), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="font-semibold text-sm">Mis ventas</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Ventas totales", value: `$${totalAmount.toLocaleString("es-CO")}`, color: "" },
            { label: "Comisiones ganadas", value: `$${totalComm.toLocaleString("es-CO")}`, color: "text-green-600 dark:text-green-400" },
            { label: "Por cobrar", value: `$${pendingComm.toLocaleString("es-CO")}`, color: "text-yellow-600 dark:text-yellow-400" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">{m.label}</p>
              <p className={cn("text-2xl font-bold", m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {salesArr.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium">Aún no tienes ventas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comparte tu enlace de referido para que las ventas aparezcan aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Cliente</th>
                    <th className="px-4 py-3 font-medium text-right">Monto</th>
                    <th className="px-4 py-3 font-medium text-right">Comisión</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {salesArr.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(s.sale_date).toLocaleDateString("es-CO", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {s.customer_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${Number(s.amount).toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-medium">
                        ${Number(s.commission_amt).toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px]", STATUS_STYLE[s.status] ?? "border-0")}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
