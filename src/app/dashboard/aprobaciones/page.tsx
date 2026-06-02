"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Ambassador {
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  email: string;
  full_name: string;
  referral_code: string;
  city: string;
  phone: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0",
  approved: "bg-green-500/15 text-green-700 dark:text-green-400 border-0",
  rejected: "bg-destructive/15 text-destructive border-0",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

type Filter = "all" | "pending" | "approved" | "rejected";

export default function AprobacionesPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/aprobaciones");
    if (res.ok) {
      const { ambassadors } = await res.json();
      setAmbassadors(ambassadors ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(user_id: string, action: "approve" | "reject") {
    setUpdating(user_id);
    await fetch("/api/dashboard/aprobaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, action }),
    });
    setAmbassadors((prev) =>
      prev.map((a) =>
        a.user_id === user_id
          ? { ...a, status: action === "approve" ? "approved" : "rejected" }
          : a
      )
    );
    setUpdating(null);
  }

  const counts = {
    all: ambassadors.length,
    pending: ambassadors.filter((a) => a.status === "pending").length,
    approved: ambassadors.filter((a) => a.status === "approved").length,
    rejected: ambassadors.filter((a) => a.status === "rejected").length,
  };

  const filtered = filter === "all" ? ambassadors : ambassadors.filter((a) => a.status === filter);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pendientes" },
    { key: "approved", label: "Aprobadas" },
    { key: "rejected", label: "Rechazadas" },
    { key: "all", label: "Todas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprobaciones</h1>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pendientes" value={counts.pending} color="text-yellow-600 dark:text-yellow-400" icon={Clock} />
          <StatCard label="Aprobadas" value={counts.approved} color="text-green-600 dark:text-green-400" icon={Check} />
          <StatCard label="Rechazadas" value={counts.rejected} color="text-destructive" icon={X} />
          <StatCard label="Total" value={counts.all} color="" icon={Users} />
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
              filter === f.key
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {f.label}
            {f.key !== "all" && counts[f.key] > 0 && (
              <span className={cn(
                "ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold h-4 min-w-4 px-1",
                filter === f.key ? "bg-background text-foreground" : "bg-muted text-muted-foreground"
              )}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Embajadora</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Ciudad</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((a) => (
                  <tr key={a.user_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-pink-500 flex-shrink-0">
                          {a.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{a.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {a.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString("es-CO", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px]", STATUS_STYLE[a.status])}>
                        {STATUS_LABEL[a.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {updating === a.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin inline text-muted-foreground" />
                      ) : (
                        <div className="inline-flex gap-1.5 justify-end">
                          {a.status !== "approved" && (
                            <button
                              onClick={() => handleAction(a.user_id, "approve")}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors border border-green-500/20"
                            >
                              <Check className="h-3 w-3" />
                              Aprobar
                            </button>
                          )}
                          {a.status !== "rejected" && (
                            <button
                              onClick={() => handleAction(a.user_id, "reject")}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20"
                            >
                              <X className="h-3 w-3" />
                              Rechazar
                            </button>
                          )}
                          {a.status === "approved" && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
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

function StatCard({
  label, value, color, icon: Icon,
}: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, string> = {
    pending: "No hay solicitudes pendientes.",
    approved: "Aún no has aprobado ninguna embajadora.",
    rejected: "No has rechazado ninguna embajadora.",
    all: "Aún no hay solicitudes registradas.",
  };
  return (
    <div className="py-16 text-center px-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-medium">{messages[filter]}</p>
    </div>
  );
}
