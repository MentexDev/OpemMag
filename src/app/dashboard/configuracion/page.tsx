"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useCallback } from "react";
import { Moon, Sun, Monitor, Upload, Loader2, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CustomDomainSection from "@/components/dashboard/custom-domain";
import BillingSection from "@/components/dashboard/billing-section";
import ShopifySection from "@/components/dashboard/shopify-section";

const themes = [
  { id: "light", label: "Claro", description: "Ideal para ambientes iluminados.", icon: Sun },
  { id: "dark", label: "Oscuro", description: "Ideal para ambientes con poca luz.", icon: Moon },
  { id: "system", label: "Sistema", description: "Sigue la preferencia de tu dispositivo.", icon: Monitor },
];

interface TenantData {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  shopify_domain: string | null;
}

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [accentColor, setAccentColor] = useState("#a5b4fc");

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadTenant = useCallback(async () => {
    const res = await fetch("/api/tenant/me");
    if (!res.ok) return;
    const { tenant: t } = await res.json();
    setTenant(t);
    setName(t.name ?? "");
    setPrimaryColor(t.primary_color ?? "#6366f1");
    setAccentColor(t.accent_color ?? "#a5b4fc");
    setLogoUrl(t.logo_url ?? null);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadTenant();
  }, [loadTenant]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/tenant/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        primary_color: primaryColor,
        accent_color: accentColor,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/tenant/logo", { method: "POST", body: fd });
    setLogoUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      setLogoUrl(url + "?t=" + Date.now());
    }
  }

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajusta los datos, branding y conexiones de tu tienda.
        </p>
      </div>

      {/* ── Suscripción ── */}
      <section>
        <BillingSection />
      </section>

      <Separator />

      {/* ── Apariencia del panel ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Apariencia del panel</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Elige el tema de tu panel de administración.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => {
            const active = mounted && theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  active
                    ? "border-pink-500 bg-pink-500/5 ring-1 ring-pink-500/30"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/40"
                )}
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? "bg-pink-500/15" : "bg-muted")}>
                  <t.icon className={cn("h-4 w-4", active ? "text-pink-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("text-sm font-medium", active && "text-pink-500")}>{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* ── Datos de la tienda ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Datos de tu tienda</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Nombre e identidad visual que verán tus embajadoras.</p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {name?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {logoUploading ? "Subiendo…" : "Subir logo"}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG o SVG. Máx 2 MB.</p>
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la tienda</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Mi Tienda Moda" />
        </div>

        {/* URL */}
        {tenant && (
          <div className="space-y-1.5">
            <Label>URL de tu portal</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground flex-1">{tenant.slug}.openmag.co</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Colores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary">Color principal</Label>
            <div className="flex items-center gap-2">
              <input
                id="primary"
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="h-9 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                maxLength={7}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent">Color de acento</Label>
            <div className="flex items-center gap-2">
              <input
                id="accent"
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="h-9 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                maxLength={7}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview colores */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="h-8 w-8 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
          <div className="h-8 w-8 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
          <p className="text-xs text-muted-foreground">Previsualización de colores del portal</p>
        </div>
      </section>

      <Separator />

      <Separator />

      {/* ── Dominio personalizado ── */}
      <section>
        <CustomDomainSection />
      </section>

      <Separator />

      {/* ── Shopify (OAuth) ── */}
      <section>
        <ShopifySection />
      </section>

      {/* Guardar */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando…</>
          ) : saved ? (
            <><Check className="h-4 w-4 mr-2" /> Guardado</>
          ) : (
            "Guardar cambios"
          )}
        </Button>
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Cambios guardados correctamente.</p>}
      </div>
    </div>
  );
}
