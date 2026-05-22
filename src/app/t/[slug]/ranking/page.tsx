import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
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
    .select("id, name, primary_color")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) notFound();

  const { data: membership } = await admin
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  const [{ data: sales }, { data: profiles }] = await Promise.all([
    admin
      .from("sales")
      .select("seller_id, amount")
      .eq("tenant_id", tenant.id),
    admin
      .from("profiles")
      .select("id, full_name, referral_code")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true),
  ]);

  type SaleRow = { seller_id: string; amount: unknown };
  type ProfileRow = { id: string; full_name: string; referral_code: string };
  const salesArr = (sales ?? []) as SaleRow[];
  const profilesArr = (profiles ?? []) as ProfileRow[];

  const ranking = profilesArr
    .map((p: ProfileRow) => {
      const own = salesArr.filter((s) => s.seller_id === p.id);
      const total = own.reduce((acc, s) => acc + Number(s.amount), 0);
      return {
        id: p.id,
        full_name: p.full_name,
        referral_code: p.referral_code,
        sales_count: own.length,
        total_amount: total,
        isMe: p.id === user.id,
      };
    })
    .sort((a, b) => b.total_amount - a.total_amount)
    .map((r, i) => ({ ...r, position: i + 1 }));

  const myPosition = ranking.find((r) => r.isMe);

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
          <h1 className="font-semibold text-sm">Ranking de embajadoras</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Mi posición */}
        {myPosition && (
          <div
            className="rounded-xl border-2 p-4 flex items-center gap-4"
            style={{ borderColor: tenant.primary_color + "40", backgroundColor: tenant.primary_color + "08" }}
          >
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: tenant.primary_color }}
            >
              {myPosition.position <= 3 ? MEDAL[myPosition.position - 1] : `#${myPosition.position}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Tu posición actual</p>
              <p className="font-semibold">{myPosition.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {myPosition.sales_count} venta{myPosition.sales_count !== 1 ? "s" : ""} ·{" "}
                ${myPosition.total_amount.toLocaleString("es-CO")}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-bold" style={{ color: tenant.primary_color }}>
                #{myPosition.position}
              </p>
              <p className="text-xs text-muted-foreground">de {ranking.length}</p>
            </div>
          </div>
        )}

        {/* Top 3 */}
        {ranking.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ranking.slice(0, Math.min(3, ranking.length)).map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-xl border bg-card p-5 text-center space-y-2",
                  r.isMe && "ring-2"
                )}
                style={r.isMe ? { outline: `2px solid ${tenant.primary_color}` } : {}}
              >
                <div className="text-3xl">{MEDAL[r.position - 1]}</div>
                <div
                  className="h-11 w-11 mx-auto rounded-full flex items-center justify-center text-base font-bold text-white"
                  style={{ backgroundColor: r.isMe ? tenant.primary_color : "#94a3b8" }}
                >
                  {r.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <p className="font-semibold text-sm truncate">{r.isMe ? "Tú ✨" : r.full_name}</p>
                <p className="text-lg font-bold">${r.total_amount.toLocaleString("es-CO")}</p>
                <p className="text-xs text-muted-foreground">
                  {r.sales_count} venta{r.sales_count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Full list */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {ranking.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium">El ranking estará disponible pronto</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sé la primera en generar ventas y aparecer en el ranking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium w-12">#</th>
                    <th className="px-4 py-3 font-medium">Embajadora</th>
                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Ventas</th>
                    <th className="px-4 py-3 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ranking.map((r) => (
                    <tr
                      key={r.id}
                      className={cn(
                        "transition-colors",
                        r.isMe ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20"
                      )}
                    >
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {r.position <= 3 ? MEDAL[r.position - 1] : r.position}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                            style={{ backgroundColor: r.isMe ? tenant.primary_color : "#94a3b8" }}
                          >
                            {r.full_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {r.isMe ? (
                                <span>
                                  {r.full_name}{" "}
                                  <span className="text-xs font-normal text-muted-foreground">(tú)</span>
                                </span>
                              ) : r.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{r.referral_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                        {r.sales_count}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${r.total_amount.toLocaleString("es-CO")}
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
