import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function AmbassadorRankingPage({
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

  const [{ data: sales }, { data: profiles }] = await Promise.all([
    admin.from("sales").select("seller_id, amount").eq("tenant_id", tenant.id),
    admin.from("profiles").select("id, full_name, referral_code, city").eq("tenant_id", tenant.id).eq("is_active", true),
  ]);

  type SaleRow = { seller_id: string; amount: unknown };
  type ProfileRow = { id: string; full_name: string; referral_code: string; city?: string };
  const salesArr = (sales ?? []) as SaleRow[];
  const profilesArr = (profiles ?? []) as ProfileRow[];

  const ranking = profilesArr
    .map((p) => {
      const own = salesArr.filter((s) => s.seller_id === p.id);
      const total = own.reduce((acc, s) => acc + Number(s.amount), 0);
      return { ...p, sales_count: own.length, total_amount: total, isMe: p.id === user.id };
    })
    .sort((a, b) => b.total_amount - a.total_amount)
    .map((r, i) => ({ ...r, position: i + 1 }));

  const myPosition = ranking.find((r) => r.isMe);
  const primary = tenant.primary_color;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Ranking</h1>
        <p className="text-sm text-white/40 mt-0.5">Top embajadoras del programa</p>
      </div>

      {/* Mi posición */}
      {myPosition && (
        <div className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: primary + "40", backgroundColor: primary + "10" }}>
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: primary }}>
            {myPosition.position <= 3 ? MEDAL[myPosition.position - 1] : `#${myPosition.position}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 mb-0.5">Tu posición actual</p>
            <p className="font-semibold text-white">{myPosition.full_name}</p>
            <p className="text-sm text-white/50">
              {myPosition.sales_count} venta{myPosition.sales_count !== 1 ? "s" : ""} · ${myPosition.total_amount.toLocaleString("es-CO")}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold" style={{ color: primary }}>#{myPosition.position}</p>
            <p className="text-xs text-white/30">de {ranking.length}</p>
          </div>
        </div>
      )}

      {/* Top 3 */}
      {ranking.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ranking.slice(0, Math.min(3, ranking.length)).map((r) => (
            <div key={r.id} className={cn("rounded-xl bg-white/5 p-5 text-center space-y-2")}
              style={{ border: r.isMe ? `1px solid ${primary}` : "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-3xl">{MEDAL[r.position - 1]}</div>
              <div className="h-11 w-11 mx-auto rounded-full flex items-center justify-center text-base font-bold text-white"
                style={{ backgroundColor: r.isMe ? primary : "#334155" }}>
                {r.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <p className="font-semibold text-sm text-white truncate">{r.isMe ? "Tú ✨" : r.full_name}</p>
              <p className="text-lg font-bold text-white">${r.total_amount.toLocaleString("es-CO")}</p>
              <p className="text-xs text-white/40">{r.sales_count} venta{r.sales_count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full list */}
      <div className="rounded-xl bg-white/5 border border-white/8 overflow-hidden">
        {ranking.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-4">
              <Trophy className="h-5 w-5 text-white/20" />
            </div>
            <p className="font-medium text-white/60">El ranking estará disponible pronto</p>
            <p className="text-sm text-white/30 mt-1">Sé la primera en generar ventas.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-left text-[10px] uppercase tracking-wider text-white/30">
                <th className="px-5 py-3 font-medium w-12">#</th>
                <th className="px-5 py-3 font-medium">Embajadora</th>
                <th className="px-5 py-3 font-medium text-right hidden sm:table-cell">Ventas</th>
                <th className="px-5 py-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ranking.map((r) => (
                <tr key={r.id} className={cn("transition-colors", r.isMe ? "bg-white/5" : "hover:bg-white/3")}>
                  <td className="px-5 py-3 text-white/40 font-mono text-xs">
                    {r.position <= 3 ? MEDAL[r.position - 1] : r.position}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: r.isMe ? primary : "#334155" }}>
                        {r.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-white/80">
                          {r.isMe ? <span>{r.full_name} <span className="text-xs text-white/30">(tú)</span></span> : r.full_name}
                        </p>
                        {r.city && <p className="text-xs text-white/30">{r.city}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-white/40 hidden sm:table-cell">{r.sales_count}</td>
                  <td className="px-5 py-3 text-right font-semibold text-white/80">
                    ${r.total_amount.toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
