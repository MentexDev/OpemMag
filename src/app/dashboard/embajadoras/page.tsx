"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Copy, Check, MoreVertical, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Ambassador {
  user_id: string;
  email: string;
  full_name: string;
  referral_code: string;
  is_active: boolean;
  phone: string;
  city: string;
  joined_at: string;
}

export default function EmbajadorasPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/embajadoras");
    if (res.ok) {
      const { ambassadors } = await res.json();
      setAmbassadors(ambassadors);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(user_id: string, current: boolean) {
    setUpdating(user_id);
    await fetch("/api/dashboard/embajadoras", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, is_active: !current }),
    });
    setAmbassadors(arr =>
      arr.map(a => (a.user_id === user_id ? { ...a, is_active: !current } : a))
    );
    setUpdating(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  const filtered = ambassadors.filter(a => {
    const q = search.toLowerCase();
    return (
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.referral_code.toLowerCase().includes(q)
    );
  });

  const activeCount = ambassadors.filter(a => a.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Embajadoras</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona las embajadoras de tu programa.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total" value={ambassadors.length} />
        <StatCard label="Activas" value={activeCount} accent />
        <StatCard label="Inactivas" value={ambassadors.length - activeCount} muted />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={!!search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Embajadora</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Código</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Ciudad</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(a => (
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
                    <td className="px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => copyCode(a.referral_code)}
                        className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70 transition-colors"
                      >
                        {a.referral_code}
                        {copied === a.referral_code ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {a.city || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={a.is_active ? "default" : "secondary"}
                        className={cn(
                          "text-[10px]",
                          a.is_active
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                            : ""
                        )}
                      >
                        {a.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(a.user_id, a.is_active)}
                        disabled={updating === a.user_id}
                        className={cn(
                          "text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50",
                          a.is_active
                            ? "text-destructive hover:bg-destructive/10"
                            : "text-green-600 dark:text-green-400 hover:bg-green-500/10"
                        )}
                      >
                        {updating === a.user_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
                        ) : a.is_active ? (
                          "Desactivar"
                        ) : (
                          "Activar"
                        )}
                      </button>
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

function StatCard({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold mt-1",
          accent && "text-green-600 dark:text-green-400",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ search }: { search: boolean }) {
  return (
    <div className="py-16 text-center px-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-medium">
        {search ? "Sin resultados" : "Aún no tienes embajadoras"}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        {search
          ? "Prueba con otro término de búsqueda."
          : "Comparte el link de tu portal para que se registren."}
      </p>
    </div>
  );
}
