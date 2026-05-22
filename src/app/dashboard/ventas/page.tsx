"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingBag, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  sale_date: string;
  ambassador_name: string;
  referral_code: string;
  customer_name: string | null;
  amount: number;
  commission_amt: number;
  status: "pending" | "confirmed" | "paid";
  notes: string | null;
}

const STATUS_OPTS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "paid", label: "Pagada" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  paid: "bg-green-500/15 text-green-700 dark:text-green-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  paid: "Pagada",
};

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/dashboard/ventas?${params}`);
    if (res.ok) {
      const { sales } = await res.json();
      setSales(sales ?? []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch("/api/dashboard/ventas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: status as Sale["status"] } : s))
    );
    setUpdating(null);
  }

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.ambassador_name.toLowerCase().includes(q) ||
      (s.customer_name ?? "").toLowerCase().includes(q) ||
      s.referral_code.toLowerCase().includes(q)
    );
  });

  const totalAmount = filtered.reduce((acc, s) => acc + Number(s.amount), 0);
  const totalComm = filtered.reduce((acc, s) => acc + Number(s.commission_amt), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ventas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historial de todas las ventas registradas en tu programa.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar embajadora, cliente o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Summary */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Ventas mostradas</p>
            <p className="text-2xl font-bold mt-1">{filtered.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Monto total</p>
            <p className="text-2xl font-bold mt-1">${totalAmount.toLocaleString("es-CO")}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Comisiones totales</p>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              ${totalComm.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Embajadora</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Cliente</th>
                  <th className="px-4 py-3 font-medium text-right">Monto</th>
                  <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Comisión</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(s.sale_date).toLocaleDateString("es-CO", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{s.ambassador_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.referral_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {s.customer_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${Number(s.amount).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 hidden sm:table-cell">
                      ${Number(s.commission_amt).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] border-0", STATUS_STYLE[s.status])}>
                        {STATUS_LABEL[s.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {updating === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin inline text-muted-foreground" />
                      ) : (
                        <StatusActions status={s.status} onUpdate={(st) => updateStatus(s.id, st)} />
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

function StatusActions({
  status,
  onUpdate,
}: {
  status: Sale["status"];
  onUpdate: (s: string) => void;
}) {
  if (status === "pending") {
    return (
      <button
        onClick={() => onUpdate("confirmed")}
        className="text-xs font-medium px-2.5 py-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
      >
        Confirmar
      </button>
    );
  }
  if (status === "confirmed") {
    return (
      <button
        onClick={() => onUpdate("paid")}
        className="text-xs font-medium px-2.5 py-1 rounded-md text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors"
      >
        Marcar pagada
      </button>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="py-16 text-center px-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-medium">
        {hasSearch ? "Sin resultados" : "Aún no hay ventas"}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        {hasSearch
          ? "Prueba con otro término de búsqueda."
          : "Las ventas aparecerán aquí cuando Shopify registre órdenes con código de referido."}
      </p>
    </div>
  );
}
