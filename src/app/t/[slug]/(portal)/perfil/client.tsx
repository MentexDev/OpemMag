"use client";

import { useState } from "react";
import { User, CreditCard, Link2, Settings, Check, Eye, EyeOff, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  full_name: string;
  referral_code: string;
  avatar_url: string | null;
  phone?: string;
  city?: string;
  bio?: string;
  bank_name?: string;
  account_type?: string;
  account_number?: string;
  document_type?: string;
  document_number?: string;
}

interface Props {
  userId: string;
  email: string;
  isGoogleUser: boolean;
  profile: Profile | null;
  tenantSlug: string;
  tenantName: string;
  primaryColor: string;
}

const TABS = [
  { id: "info", label: "Información", icon: User },
  { id: "banco", label: "Datos Bancarios", icon: CreditCard },
  { id: "ficha", label: "Mi Ficha ID", icon: Link2 },
  { id: "ajustes", label: "Ajustes", icon: Settings },
];

export default function PerfilClient({
  userId,
  email,
  isGoogleUser,
  profile: initialProfile,
  tenantSlug,
  tenantName,
  primaryColor,
}: Props) {
  const [tab, setTab] = useState("info");
  const [profile, setProfile] = useState(initialProfile ?? {} as Profile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  const fichaUrl = typeof window !== "undefined"
    ? `${window.location.origin}/t/${tenantSlug}/card/${profile.referral_code}`
    : `/t/${tenantSlug}/card/${profile.referral_code}`;

  function field(key: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/ambassador/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          bio: profile.bio,
          bank_name: profile.bank_name,
          account_type: profile.account_type,
          account_number: profile.account_number,
          document_type: profile.document_type,
          document_number: profile.document_number,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPassError("");
    if (newPass.length < 6) { setPassError("Mínimo 6 caracteres."); return; }
    if (newPass !== confirmPass) { setPassError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/ambassador/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const d = await res.json();
      if (!res.ok) { setPassError(d.error ?? "Error al cambiar contraseña."); return; }
      setPassSaved(true);
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      setTimeout(() => setPassSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function copyFicha() {
    navigator.clipboard.writeText(fichaUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "E";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
        <p className="text-sm text-white/40 mt-0.5">Gestiona tu información y configuraciones</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
              tab === t.id ? "text-black" : "text-white/40 hover:text-white/70"
            )}
            style={tab === t.id ? { backgroundColor: primaryColor } : {}}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Información personal */}
      {tab === "info" && (
        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile.full_name || "Sin nombre"}</p>
              <p className="text-xs text-white/40 font-mono">{profile.referral_code}</p>
              <p className="text-xs text-white/30 mt-0.5">{tenantName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Nombre completo", key: "full_name" as const, type: "text" },
              { label: "Teléfono", key: "phone" as const, type: "tel" },
              { label: "Ciudad", key: "city" as const, type: "text" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs text-white/40 mb-1.5 block">{f.label}</label>
                <input
                  type={f.type}
                  value={(profile[f.key] as string) ?? ""}
                  onChange={(e) => field(f.key, e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs text-white/40 mb-1.5 block">Bio (opcional)</label>
              <textarea
                value={(profile.bio as string) ?? ""}
                onChange={(e) => field("bio", e.target.value)}
                rows={2}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {saved ? <><Check className="h-4 w-4" /> Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Datos bancarios */}
      {tab === "banco" && (
        <div className="space-y-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-xs text-white/50 leading-relaxed">
            Los pagos de comisiones se realizan los primeros 5 días hábiles del mes por las ventas del mes anterior.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Banco</label>
              <select
                value={profile.bank_name ?? ""}
                onChange={(e) => field("bank_name", e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/25"
              >
                <option value="">Seleccionar banco</option>
                {["Bancolombia", "Davivienda", "BBVA", "Banco de Bogotá", "Nequi", "Daviplata", "Banco Popular", "Banco Caja Social"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Tipo de cuenta</label>
              <select
                value={profile.account_type ?? ""}
                onChange={(e) => field("account_type", e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/25"
              >
                <option value="">Seleccionar tipo</option>
                <option value="ahorros">Ahorros</option>
                <option value="corriente">Corriente</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Número de cuenta</label>
              <div className="relative">
                <input
                  type={showAccount ? "text" : "password"}
                  value={profile.account_number ?? ""}
                  onChange={(e) => field("account_number", e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
                <button type="button" onClick={() => setShowAccount(!showAccount)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showAccount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Tipo de documento</label>
              <select
                value={profile.document_type ?? ""}
                onChange={(e) => field("document_type", e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/25"
              >
                <option value="">Seleccionar tipo</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="NIT">NIT</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Número de documento</label>
              <div className="relative">
                <input
                  type={showDoc ? "text" : "password"}
                  value={profile.document_number ?? ""}
                  onChange={(e) => field("document_number", e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
                <button type="button" onClick={() => setShowDoc(!showDoc)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showDoc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}>
            {saved ? <><Check className="h-4 w-4" /> Guardado</> : saving ? "Guardando..." : "Guardar datos"}
          </button>
        </div>
      )}

      {/* Ficha ID */}
      {tab === "ficha" && (
        <div className="space-y-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs text-white/40 mb-1.5">Tu enlace de Ficha ID</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white/60 truncate">
                  {fichaUrl}
                </div>
                <button onClick={copyFicha}
                  className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-white/50 hover:text-white">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <a href={fichaUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-black"
              style={{ backgroundColor: primaryColor }}>
              Ver mi Ficha ID
            </a>
          </div>

          <p className="text-xs text-white/30 text-center">
            Comparte este enlace con tus clientes. Muestra tus productos favoritos y tu información de contacto.
          </p>
        </div>
      )}

      {/* Ajustes */}
      {tab === "ajustes" && (
        <div className="space-y-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-1">
            <p className="text-xs text-white/40">Email actual</p>
            <p className="text-sm text-white font-mono">{email}</p>
          </div>

          {isGoogleUser ? (
            <div className="bg-white/5 border border-white/8 rounded-xl p-5 text-sm text-white/40">
              Iniciaste sesión con Google. Gestiona tu contraseña desde tu cuenta de Google.
            </div>
          ) : (
            <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-white">Cambiar contraseña</p>
              {[
                { label: "Nueva contraseña", value: newPass, set: setNewPass },
                { label: "Confirmar contraseña", value: confirmPass, set: setConfirmPass },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs text-white/40 mb-1.5 block">{f.label}</label>
                  <input type="password" value={f.value} onChange={(e) => f.set(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/25" />
                </div>
              ))}
              {passError && <p className="text-xs text-red-400">{passError}</p>}
              {passSaved && <p className="text-xs text-green-400">Contraseña actualizada correctamente.</p>}
              <button onClick={handleChangePassword} disabled={saving || !newPass || !confirmPass}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}>
                Actualizar contraseña
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
