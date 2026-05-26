"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle, ShoppingBag, Link2, Unlink, HelpCircle, X, ExternalLink } from "lucide-react";

function ShopifyGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold text-base">Cómo crear tu app en Shopify</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Guía paso a paso — 5 minutos</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Paso 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-medium">Crea una cuenta en Shopify Partners</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ve a <span className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">partners.shopify.com</span> y regístrate gratis. Si ya tienes cuenta, inicia sesión.
              </p>
              <a
                href="https://partners.shopify.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ir a Shopify Partners <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-medium">Crea una nueva app</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En el panel de Partners ve a <span className="font-medium">Apps → Crear app → Crear app manualmente</span>. Ponle cualquier nombre, por ejemplo <span className="italic">"OpenMag"</span>.
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-medium">Configura la URL de redirección</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En la configuración de la app, busca <span className="font-medium">URLs de redirección permitidas</span> y agrega exactamente esta URL:
              </p>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 mt-1">
                <code className="text-xs flex-1 break-all">https://openmag.co/api/shopify/callback</code>
              </div>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-medium">Copia el Client ID y Client Secret</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En la sección <span className="font-medium">Credenciales de la app</span> encontrarás el <span className="font-medium">Client ID</span> (Clave API) y el <span className="font-medium">Client Secret</span>. Envíaselos al administrador de OpenMag para que los configure en el servidor.
              </p>
            </div>
          </div>

          {/* Paso 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-medium">Conecta tu tienda</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Una vez configurado el servidor, vuelve aquí, escribe el nombre de tu tienda (ej. <span className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">mi-tienda</span>) y haz clic en <span className="font-medium">Conectar mi tienda Shopify</span>. Te redirigirá a Shopify para autorizar.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            <strong>¿Por qué se necesita esto?</strong> Shopify requiere que registres tu app para poder leer órdenes y productos de tu tienda de forma segura y automática.
          </div>
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

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const shop = shopInput.trim();
    if (!shop) return;
    setSubmitting(true);
    // Full page redirect — Shopify OAuth requires top-level navigation
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shop)}`;
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={submitting || !state.oauthConfigured}
              className="text-destructive hover:text-destructive"
            >
              <Unlink className="h-3.5 w-3.5 mr-1.5" />
              Desconectar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="shop">Nombre de tu tienda Shopify</Label>
            <div className="flex items-center rounded-md border bg-muted/50 overflow-hidden">
              <Input
                id="shop"
                placeholder="mi-tienda"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                required
                className="border-0 rounded-none focus-visible:ring-0 bg-transparent"
              />
              <span className="px-3 py-2 text-xs text-muted-foreground border-l bg-muted select-none">
                .myshopify.com
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Si tu URL de admin es <span className="font-mono">mi-tienda.myshopify.com</span>, solo escribe <span className="font-mono">mi-tienda</span>.
            </p>
          </div>
          <Button type="submit" disabled={submitting || !state.oauthConfigured || !shopInput}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
            Conectar mi tienda Shopify
          </Button>
          <p className="text-xs text-muted-foreground">
            Te llevaremos a Shopify para autorizar. Pediremos permisos de solo lectura: productos, órdenes, clientes e inventario.
          </p>
        </form>
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
