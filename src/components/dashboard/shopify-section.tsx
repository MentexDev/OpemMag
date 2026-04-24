"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle, ShoppingBag, Link2, Unlink } from "lucide-react";

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
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          Conexión Shopify
        </h2>
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
