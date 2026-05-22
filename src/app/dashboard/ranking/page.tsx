"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingRow {
  position: number;
  seller_id: string;
  full_name: string;
  referral_code: string;
  avatar_url: string | null;
  sales_count: number;
  total_amount: number;
  total_commission: number;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function RankingPage() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/ranking");
    if (res.ok) {
      const { ranking } = await res.json();
      setRows(ranking ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Embajadoras ordenadas por volumen de ventas.
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Top 3 highlight */}
            {rows.length >= 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
                {rows.slice(0, Math.min(3, rows.length)).map((r) => (
                  <div key={r.seller_id} className="bg-card p-5 text-center space-y-2">
                    <div className="text-3xl">{MEDAL[r.position - 1]}</div>
                    <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-base font-bold text-pink-500">
                      {r.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <p className="font-semibold text-sm">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.referral_code}</p>
                    <p className="text-xl font-bold">${r.total_amount.toLocaleString("es-CO")}</p>
                    <p className="text-xs text-muted-foreground">{r.sales_count} venta{r.sales_count !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            {rows.length > 3 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium w-12">#</th>
                      <th className="px-4 py-3 font-medium">Embajadora</th>
                      <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Ventas</th>
                      <th className="px-4 py-3 font-medium text-right">Monto total</th>
                      <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Comisiones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(3).map((r) => (
                      <tr key={r.seller_id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {r.position}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                              "bg-muted text-muted-foreground"
                            )}>
                              {r.full_name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-medium">{r.full_name}</p>
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
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 hidden md:table-cell">
                          ${r.total_commission.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center px-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Trophy className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-medium">Sin datos de ranking</p>
      <p className="text-sm text-muted-foreground mt-1">
        El ranking aparecerá cuando tus embajadoras empiecen a generar ventas.
      </p>
    </div>
  );
}
