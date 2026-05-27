import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
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
    .select("id, primary_color")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) redirect("/login");

  const { data: sales } = await admin
    .from("sales")
    .select("id, amount, commission_amt, status, customer_name, notes, sale_date, created_at")
    .eq("tenant_id", tenant.id)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  type Sale = { id: string; amount: unknown; commission_amt: unknown; status: string; customer_name: string | null; notes: string | null; sale_date: string };
  const salesArr = (sales ?? []) as Sale[];
  const totalAmount = salesArr.reduce((s, r) => s + Number(r.amount), 0);
  const totalComm = salesArr.reduce((s, r) => s + Number(r.commission_amt), 0);
  const pendingComm = salesArr.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.commission_amt), 0);
  const primary = tenant.primary_color;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mis Ventas</h1>
        <p className="text-sm text-white/40 mt-0.5">Historial de ventas y comisiones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Ventas totales", value: `$${totalAmount.toLocaleString("es-CO")}`, color: "text-white" },
          { label: "Comisiones ganadas", value: `$${totalComm.toLocaleString("es-CO")}`, color: "text-green-400" },
          { label: "Por cobrar", value: `$${pendingComm.toLocaleString("es-CO")}`, color: "text-yellow-400" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-white/5 border border-white/8 p-4">
            <p className="text-xs text-white/40 mb-2">{m.label}</p>
            <p className={cn("text-2xl font-bold", m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white/5 border border-white/8 overflow-hidden">
        {salesArr.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-4">
              <ShoppingBag className="h-5 w-5 text-white/20" />
            </div>
            <p className="font-medium text-white/60">Aún no tienes ventas</p>
            <p className="text-sm text-white/30 mt-1">Comparte tu enlace para que aparezcan aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-[10px] uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Cliente</th>
                  <th className="px-5 py-3 font-medium text-right">Monto</th>
                  <th className="px-5 py-3 font-medium text-right">Comisión</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {salesArr.map((s) => (
                  <tr key={s.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 text-white/50 whitespace-nowrap text-xs">
                      {new Date(s.sale_date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-white/50 hidden md:table-cell text-xs">{s.customer_name ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white/80">
                      ${Number(s.amount).toLocaleString("es-CO")}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-green-400">
                      ${Number(s.commission_amt).toLocaleString("es-CO")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", STATUS_STYLE[s.status] ?? "bg-white/10 text-white/40")}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
