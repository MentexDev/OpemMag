"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Search, Copy, Check, Users, Trash2, X, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  commission_rate: number | null;
}

function DeleteConfirmModal({
  ambassador,
  onConfirm,
  onCancel,
  loading,
}: {
  ambassador: Ambassador;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-background border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <button onClick={onCancel} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">¿Eliminar embajadora?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vas a eliminar a <span className="font-medium text-foreground">{ambassador.full_name || ambassador.email}</span> del programa. Esta acción <span className="font-medium text-destructive">no se puede deshacer</span> y perderás todo el historial de esta embajadora.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Sí, eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommissionCell({
  ambassador,
  tenantDefault,
  onSave,
}: {
  ambassador: Ambassador;
  tenantDefault: number;
  onSave: (user_id: string, rate: number | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    ambassador.commission_rate !== null ? String(ambassador.commission_rate) : ""
  );
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setValue(ambassador.commission_rate !== null ? String(ambassador.commission_rate) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSave() {
    setSaving(true);
    const parsed = value.trim() === "" ? null : parseFloat(value);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      setSaving(false);
      return;
    }
    await onSave(ambassador.user_id, parsed);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(false);
  }

  const displayRate = ambassador.commission_rate !== null ? ambassador.commission_rate : tenantDefault;
  const isCustom = ambassador.commission_rate !== null;

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <div className="relative w-24">
          <input
            ref={inputRef}
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={String(tenantDefault)}
            className="w-full text-xs border rounded-md px-2 py-1 pr-6 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded hover:bg-green-500/10 text-green-600 transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
        isCustom
          ? "bg-primary/10 text-primary hover:bg-primary/20 font-medium"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
      title={isCustom ? "Comisión personalizada. Haz clic para editar" : "Usando comisión por defecto. Haz clic para personalizar"}
    >
      <Percent className="h-3 w-3" />
      {displayRate}%
      {!isCustom && <span className="text-[9px] opacity-60 ml-0.5">default</span>}
    </button>
  );
}

export default function EmbajadorasPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ambassador | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tenantDefault, setTenantDefault] = useState(15);

  const load = useCallback(async () => {
    setLoading(true);
    const [embRes, tenantRes] = await Promise.all([
      fetch("/api/dashboard/embajadoras"),
      fetch("/api/tenant/me"),
    ]);
    if (embRes.ok) {
      const { ambassadors } = await embRes.json();
      setAmbassadors(ambassadors);
    }
    if (tenantRes.ok) {
      const { tenant } = await tenantRes.json();
      setTenantDefault(tenant?.commission_rate ?? 15);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  async function saveCommission(user_id: string, rate: number | null) {
    await fetch("/api/dashboard/embajadoras", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, commission_rate: rate }),
    });
    setAmbassadors(arr =>
      arr.map(a => (a.user_id === user_id ? { ...a, commission_rate: rate } : a))
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/dashboard/embajadoras", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: deleteTarget.user_id }),
    });
    setDeleting(false);
    if (res.ok) {
      setAmbassadors(arr => arr.filter(a => a.user_id !== deleteTarget.user_id));
      setDeleteTarget(null);
    }
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
      {deleteTarget && (
        <DeleteConfirmModal
          ambassador={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Embajadoras</h1>
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
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Comisión</th>
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
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <CommissionCell
                        ambassador={a}
                        tenantDefault={tenantDefault}
                        onSave={saveCommission}
                      />
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
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
                          ) : a.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Eliminar embajadora"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

function StatCard({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", accent && "text-green-600 dark:text-green-400", muted && "text-muted-foreground")}>
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
        {search ? "Prueba con otro término de búsqueda." : "Comparte el link de tu portal para que se registren."}
      </p>
    </div>
  );
}
