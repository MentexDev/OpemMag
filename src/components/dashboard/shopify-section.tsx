"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle, ShoppingBag, Link2, Unlink, HelpCircle, X, ExternalLink } from "lucide-react";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{n}</div>
      <div className="space-y-1.5 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {children}
      </div>
    </div>
  );
}

function GuideCustomApp() {
  return (
    <div className="space-y-5">
      <Step n={1} title="Abre el admin de tu tienda Shopify">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ve a <span className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">tu-tienda.myshopify.com/admin</span> e inicia sesión como dueño de la tienda.
        </p>
      </Step>
      <Step n={2} title="Ve a Configuración → Apps y canales de ventas">
        <p className="text-xs text-muted-foreground leading-relaxed">
          En el menú inferior izquierdo haz clic en <span className="font-medium">Configuración</span>, luego en <span className="font-medium">Apps y canales de ventas</span>.
        </p>
      </Step>
      <Step n={3} title="Desarrollar apps → Crear una app">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Haz clic en <span className="font-medium">Desarrollar apps</span> (esquina superior derecha) y luego en <span className="font-medium">Crear una app</span>. Dale cualquier nombre, por ejemplo <span className="italic">"OpenMag"</span>.
        </p>
      </Step>
      <Step n={4} title="Configura los permisos de la API de Admin">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dentro de la app ve a la pestaña <span className="font-medium">Configuración de la API</span>. En <span className="font-medium">Permisos de la API de Admin</span> activa al menos: <span className="font-medium">Pedidos (lectura)</span> y <span className="font-medium">Productos (lectura)</span>. Guarda.
        </p>
      </Step>
      <Step n={5} title="Instala la app y copia el token">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ve a la pestaña <span className="font-medium">Instalar app</span> y haz clic en el botón de instalar. Shopify te mostrará el <span className="font-medium">Token de acceso de la API de Admin</span> (<span className="font-mono text-[11px]">shpat_...</span>). <span className="text-foreground font-medium">Cópialo, solo se muestra una vez.</span>
        </p>
      </Step>
      <Step n={6} title="Conecta en OpenMag">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cierra esta guía, selecciona la pestaña <span className="font-medium">App personalizada (token)</span>, escribe el nombre de tu tienda y pega el token. Haz clic en <span className="font-medium">Conectar tienda</span>.
        </p>
      </Step>
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2.5 text-xs text-green-700 dark:text-green-400 leading-relaxed">
        <strong>Recomendado para tu propia tienda.</strong> Es la opción más rápida si solo vas a conectar una tienda.
      </div>
    </div>
  );
}

function GuidePartnersApp() {
  return (
    <div className="space-y-5">
      <Step n={1} title="Crea una cuenta en Shopify Partners">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ve a <span className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">partners.shopify.com</span> y regístrate gratis.
        </p>
        <a href="https://partners.shopify.com/signup" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Ir a Shopify Partners <ExternalLink className="h-3 w-3" />
        </a>
      </Step>
      <Step n={2} title="Crea una nueva app">
        <p className="text-xs text-muted-foreground leading-relaxed">
          En el panel de Partners ve a <span className="font-medium">Apps → Crear app → Crear app manualmente</span>. Ponle cualquier nombre, por ejemplo <span className="italic">"OpenMag"</span>.
        </p>
      </Step>
      <Step n={3} title="Configura la URL de redirección">
        <p className="text-xs text-muted-foreground leading-relaxed">
          En la configuración de la app, busca <span className="font-medium">URLs de redirección permitidas</span> y agrega exactamente:
        </p>
        <div className="bg-muted rounded-lg px-3 py-2">
          <code className="text-xs break-all">https://openmag.co/api/shopify/callback</code>
        </div>
      </Step>
      <Step n={4} title="Copia el Client ID y Client Secret">
        <p className="text-xs text-muted-foreground leading-relaxed">
          En <span className="font-medium">Credenciales de la app</span> encontrarás el <span className="font-medium">Client ID</span> y el <span className="font-medium">Client Secret</span>. El administrador de OpenMag debe configurarlos como secretos del servidor (<span className="font-mono text-[11px]">SHOPIFY_API_KEY</span> y <span className="font-mono text-[11px]">SHOPIFY_API_SECRET</span>).
        </p>
      </Step>
      <Step n={5} title="Conecta en OpenMag">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Una vez configurados los secretos, selecciona la pestaña <span className="font-medium">Shopify Partners (OAuth)</span>, escribe el nombre de tu tienda y haz clic en <span className="font-medium">Conectar</span>. Te redirigirá a Shopify para autorizar.
        </p>
      </Step>
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
        <strong>Recomendado si gestionas múltiples tiendas.</strong> Permite que cualquier comerciante de Shopify conecte su tienda con un clic.
      </div>
    </div>
  );
}

function ShopifyGuideModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"custom" | "partners">("custom");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
          <div className="space-y-3 flex-1 min-w-0 pr-4">
            <div>
              <h2 className="font-semibold text-base">Cómo conectar tu tienda Shopify</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Elige el método que mejor se adapte a ti</p>
            </div>
            <div className="flex rounded-lg border overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setTab("custom")}
                className={`flex-1 py-2 px-3 transition-colors font-medium ${tab === "custom" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
              >
                App personalizada
              </button>
              <button
                type="button"
                onClick={() => setTab("partners")}
                className={`flex-1 py-2 px-3 transition-colors font-medium ${tab === "partners" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
              >
                Shopify Partners
              </button>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {tab === "custom" ? <GuideCustomApp /> : <GuidePartnersApp />}
        </div>
      </div>
    </div>
  );
}

interface ShopifyState {
  connected: boolean;
  shop: string | null;
  oauthConfigured: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Faltan parámetros del callback de Shopify.",
  invalid_hmac: "La firma de Shopify no coincide. Intenta de nuevo.",
  invalid_state: "Estado inválido. Reinicia el proceso de conexión.",
  missing_tenant: "No se identificó tu tienda. Asegúrate de estar logueado.",
  shop_mismatch: "La tienda autorizada no coincide con la solicitada.",
  token_exchange_failed: "Shopify rechazó el intercambio de credenciales.",
  encryption_failed: "Error en el servidor al guardar el token.",
  persist_failed: "Error al guardar la conexión. Intenta de nuevo.",
};

function ShopifySectionInner() {
  const searchParams = useSearchParams();
  const initialFlash = (() => {
    const status = searchParams.get("shopify");
    if (status === "connected") return { type: "success" as const, msg: "Tienda Shopify conectada correctamente." };
    if (status === "error") {
      const reason = searchParams.get("reason") ?? "";
      return { type: "error" as const, msg: ERROR_MESSAGES[reason] ?? "Error al conectar Shopify." };
    }
    return null;
  })();

  const [state, setState] = useState<ShopifyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopInput, setShopInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [mode, setMode] = useState<"oauth" | "token">("token");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(initialFlash);
  const [showGuide, setShowGuide] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shopify/status");
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleOAuthConnect(e: React.FormEvent) {
    e.preventDefault();
    const shop = shopInput.trim();
    if (!shop) return;
    setSubmitting(true);
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shop)}`;
  }

  async function handleTokenConnect(e: React.FormEvent) {
    e.preventDefault();
    const shop = shopInput.trim();
    const token = tokenInput.trim();
    if (!shop || !token) return;
    setSubmitting(true);
    const res = await fetch("/api/shopify/connect-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: shop.includes(".") ? shop : `${shop}.myshopify.com`, token }),
    });
    setSubmitting(false);
    if (res.ok) {
      await load();
      setFlash({ type: "success", msg: "Tienda Shopify conectada correctamente." });
      setShopInput("");
      setTokenInput("");
    } else {
      const { error } = await res.json();
      setFlash({ type: "error", msg: error ?? "Error al conectar la tienda." });
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar tu tienda Shopify? La revista quedará vacía hasta que reconectes.")) return;
    setSubmitting(true);
    await fetch("/api/shopify/disconnect", { method: "POST" });
    await load();
    setSubmitting(false);
    setFlash({ type: "success", msg: "Tienda desconectada." });
  }

  if (loading) {
    return (
      <div className="py-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando estado de Shopify...
      </div>
    );
  }
  if (!state) return null;

  return (
    <div className="space-y-5">
      {showGuide && <ShopifyGuideModal onClose={() => setShowGuide(false)} />}

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            Conexión Shopify
          </h2>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            title="¿Cómo crear la app en Shopify?"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Conecta tu tienda para que tus embajadoras compartan tus productos y se registren las ventas automáticamente.
        </p>
      </div>

      {!state.oauthConfigured && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Shopify OAuth no está configurado en el servidor. Pídele al administrador de OpenMag que añada <span className="font-mono">SHOPIFY_API_KEY</span> y <span className="font-mono">SHOPIFY_API_SECRET</span>.
          </span>
        </div>
      )}

      {flash && (
        <div
          className={
            flash.type === "success"
              ? "rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-700 dark:text-green-400 flex gap-2 items-start"
              : "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex gap-2 items-start"
          }
        >
          {flash.type === "success" ? <Check className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
          <span>{flash.msg}</span>
        </div>
      )}

      {state.connected ? (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/15 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">Tienda conectada</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{state.shop}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={submitting}
            className="text-destructive hover:text-destructive"
          >
            <Unlink className="h-3.5 w-3.5 mr-1.5" />
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toggle de modo */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode("token")}
              className={`flex-1 py-2 px-3 transition-colors font-medium ${mode === "token" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
            >
              App personalizada (token)
            </button>
            <button
              type="button"
              onClick={() => setMode("oauth")}
              className={`flex-1 py-2 px-3 transition-colors font-medium ${mode === "oauth" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
            >
              Shopify Partners (OAuth)
            </button>
          </div>

          {mode === "token" ? (
            <form onSubmit={handleTokenConnect} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="shop-token">Nombre de tu tienda</Label>
                <div className="flex items-center rounded-md border bg-muted/50 overflow-hidden">
                  <Input
                    id="shop-token"
                    placeholder="mi-tienda"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    required
                    className="border-0 rounded-none focus-visible:ring-0 bg-transparent"
                  />
                  <span className="px-3 py-2 text-xs text-muted-foreground border-l bg-muted select-none">.myshopify.com</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token de acceso de la app</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  En tu admin de Shopify: <span className="font-medium">Configuración → Apps → Apps personalizadas</span> → tu app → <span className="font-medium">Token de acceso de la API de Admin</span>.
                </p>
              </div>
              <Button type="submit" disabled={submitting || !shopInput || !tokenInput}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                Conectar tienda
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOAuthConnect} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="shop-oauth">Nombre de tu tienda</Label>
                <div className="flex items-center rounded-md border bg-muted/50 overflow-hidden">
                  <Input
                    id="shop-oauth"
                    placeholder="mi-tienda"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    required
                    className="border-0 rounded-none focus-visible:ring-0 bg-transparent"
                  />
                  <span className="px-3 py-2 text-xs text-muted-foreground border-l bg-muted select-none">.myshopify.com</span>
                </div>
              </div>
              <Button type="submit" disabled={submitting || !state.oauthConfigured || !shopInput}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                Conectar con Shopify Partners
              </Button>
              <p className="text-xs text-muted-foreground">
                Requiere una app creada en <span className="font-medium">partners.shopify.com</span>. Haz clic en el <HelpCircle className="h-3 w-3 inline" /> para ver la guía.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function ShopifySection() {
  return (
    <Suspense fallback={<div className="py-6 text-sm text-muted-foreground">Cargando...</div>}>
      <ShopifySectionInner />
    </Suspense>
  );
}
