"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, DollarSign, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommissionRow {
  seller_id: string;
  full_name: string;
  referral_code: string;
  avatar_url: string | null;
  sales_count: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
}

export default function ComisionesPage() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/comisiones");
    if (res.ok) {
      const { commissions } = await res.json();
      setRows(commissions ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markPaid(seller_id: string) {
    setPaying(seller_id);
    await fetch("/api/dashboard/comisiones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seller_id }),
    });
    setRows((prev) =>
      prev.map((r) =>
        r.seller_id === seller_id
          ? { ...r, paid_commission: r.total_commission, pending_commission: 0 }
          : r
      )
    );
    setPaying(null);
  }

  const totalPending = rows.reduce((acc, r) => acc + r.pending_commission, 0);
  const totalPaid = rows.reduce((acc, r) => acc + r.paid_commission, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comisiones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen de comisiones por embajadora y gestión de pagos.
        </p>
      </div>

      {/* Totales */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Embajadoras" value={rows.length} unit="" color="" icon={Users} />
          <SummaryCard
            label="Por pagar"
            value={totalPending}
            unit="$"
            color="text-yellow-600 dark:text-yellow-400"
            icon={DollarSign}
          />
          <SummaryCard
            label="Ya pagado"
            value={totalPaid}
            unit="$"
            color="text-green-600 dark:text-green-400"
            icon={Check}
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Embajadora</th>
                  <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Ventas</th>
                  <th className="px-4 py-3 font-medium text-right">Por pagar</th>
                  <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Ya pagado</th>
                  <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.seller_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-pink-500 flex-shrink-0">
                          {r.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{r.referral_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {r.sales_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-semibold",
                          r.pending_commission > 0
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      >
                        ${r.pending_commission.toLocaleString("es-CO")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 hidden md:table-cell">
                      ${r.paid_commission.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold hidden md:table-cell">
                      ${r.total_commission.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.pending_commission > 0 ? (
                        <button
                          onClick={() => markPaid(r.seller_id)}
                          disabled={paying === r.seller_id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          {paying === r.seller_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Marcar pagada
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Al día</span>
                      )}
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

function SummaryCard({
  label,
  value,
  unit,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={cn("text-2xl font-bold", color)}>
        {unit}{value.toLocaleString("es-CO")}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center px-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-medium">Sin datos de comisiones</p>
      <p className="text-sm text-muted-foreground mt-1">
        Aquí aparecerán las comisiones cuando tus embajadoras generen ventas.
      </p>
    </div>
  );
}
