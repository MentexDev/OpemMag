"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Building2, ExternalLink, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  owner_email: string;
  ambassadors: number;
  sales: number;
  shopify_domain: string | null;
  primary_color: string;
  subscription_status: string;
  trial_ends_at: string;
  current_period_end: string | null;
}

const SUB_LABEL: Record<string, { label: string; className: string }> = {
  trialing: { label: "Trial", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  active: { label: "Activa", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  past_due: { label: "Atrasada", className: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  canceled: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
  unpaid: { label: "Sin pagar", className: "bg-destructive/15 text-destructive" },
  incomplete: { label: "Incompleta", className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  paused: { label: "Pausada", className: "bg-muted text-muted-foreground" },
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/tenants");
    if (res.ok) {
      const { tenants } = await res.json();
      setTenants(tenants);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(id: string, current: boolean) {
    setUpdating(id);
    setOpenMenu(null);
    await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    setTenants(arr => arr.map(t => (t.id === id ? { ...t, is_active: !current } : t)));
    setUpdating(null);
  }

  async function changePlan(id: string, plan: string) {
    setUpdating(id);
    setOpenMenu(null);
    await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, plan }),
    });
    setTenants(arr => arr.map(t => (t.id === id ? { ...t, plan } : t)));
    setUpdating(null);
  }

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.owner_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tiendas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona todas las tiendas registradas en OpenMag.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, slug o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? "Sin resultados." : "Aún no hay tiendas registradas."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Tienda</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Plan</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Suscripción</th>
                  <th className="px-4 py-3 font-medium hidden xl:table-cell text-right">Embajadoras</th>
                  <th className="px-4 py-3 font-medium hidden xl:table-cell text-right">Ventas</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ backgroundColor: t.primary_color }}
                        >
                          {t.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            {t.slug}.openmag.co
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{t.owner_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                          t.plan === "starter" && "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                          t.plan === "pro" && "bg-purple-500/15 text-purple-600 dark:text-purple-400",
                          t.plan === "enterprise" && "bg-pink-500/15 text-pink-600 dark:text-pink-400"
                        )}
                      >
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(() => {
                        const sub = SUB_LABEL[t.subscription_status] ?? SUB_LABEL.trialing;
                        return (
                          <span className={cn("inline-flex items-center text-xs px-2 py-0.5 rounded-full", sub.className)}>
                            {sub.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-right text-muted-foreground">
                      {t.ambassadors}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-right text-muted-foreground">
                      {t.sales}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                          t.is_active
                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                            : "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                        )}
                      >
                        {t.is_active ? "Activa" : "Suspendida"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                          disabled={updating === t.id}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {updating === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </button>

                        {openMenu === t.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 mt-1 w-44 rounded-lg border bg-popover shadow-lg z-20 py-1 text-left text-sm">
                              <a
                                href={`/t/${t.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Ver portal
                              </a>
                              <button
                                onClick={() => toggleActive(t.id, t.is_active)}
                                className={cn(
                                  "flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-muted transition-colors",
                                  t.is_active ? "text-orange-500" : "text-green-500"
                                )}
                              >
                                {t.is_active ? "Suspender tienda" : "Reactivar tienda"}
                              </button>
                              <div className="border-t my-1" />
                              <p className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">Plan</p>
                              {["starter", "pro", "enterprise"].map(p => (
                                <button
                                  key={p}
                                  disabled={t.plan === p}
                                  onClick={() => changePlan(t.id, p)}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-sm capitalize hover:bg-muted transition-colors",
                                    t.plan === p && "text-pink-500 font-medium cursor-default"
                                  )}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
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
