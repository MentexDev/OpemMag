"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Sparkles, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingState {
  plan: string;
  status: string;
  trialEndsAt: string;
  trialActive: boolean;
  trialDaysLeft: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  stripeConfigured: boolean;
  availablePlans: { id: string; label: string }[];
}

const STATUS_LABEL: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  trialing: { label: "Periodo de prueba", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400", icon: Clock },
  active: { label: "Activa", className: "bg-green-500/15 text-green-600 dark:text-green-400", icon: CheckCircle2 },
  past_due: { label: "Pago atrasado", className: "bg-orange-500/15 text-orange-600 dark:text-orange-400", icon: AlertCircle },
  canceled: { label: "Cancelada", className: "bg-muted text-muted-foreground", icon: AlertCircle },
  unpaid: { label: "Sin pagar", className: "bg-destructive/15 text-destructive", icon: AlertCircle },
  incomplete: { label: "Incompleta", className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", icon: AlertCircle },
  paused: { label: "Pausada", className: "bg-muted text-muted-foreground", icon: AlertCircle },
};

export default function BillingSection() {
  const [state, setState] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/billing/status");
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function checkout(plan: string) {
    setSubmitting(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      alert(data.error ?? "Error al iniciar el checkout");
      setSubmitting(null);
    }
  }

  async function openPortal() {
    setSubmitting("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      alert(data.error ?? "Error al abrir el portal");
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="py-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando suscripción...
      </div>
    );
  }
  if (!state) return null;

  const statusInfo = STATUS_LABEL[state.status] ?? STATUS_LABEL.trialing;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Suscripción
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Plan, estado y facturación de tu cuenta OpenMag.
        </p>
      </div>

      {!state.stripeConfigured && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Stripe no está configurado en el servidor. Las suscripciones están en modo de solo lectura. Pídele al administrador de OpenMag que configure <span className="font-mono">STRIPE_SECRET_KEY</span> y los <span className="font-mono">STRIPE_PRICE_*</span>.
          </span>
        </div>
      )}

      {/* Plan actual */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan actual</p>
            <p className="text-2xl font-bold capitalize">{state.plan}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
              statusInfo.className
            )}
          >
            <statusInfo.icon className="h-3 w-3" />
            {statusInfo.label}
          </span>
        </div>

        {/* Trial */}
        {state.trialActive && (
          <div className="rounded-md border border-blue-500/30 bg-blue-500/5 px-3 py-2.5 text-sm flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Periodo de prueba — {state.trialDaysLeft} día{state.trialDaysLeft !== 1 ? "s" : ""} restante{state.trialDaysLeft !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Termina el {new Date(state.trialEndsAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}. Suscríbete para no perder acceso.
              </p>
            </div>
          </div>
        )}

        {/* Cancelación pendiente */}
        {state.cancelAtPeriodEnd && state.currentPeriodEnd && (
          <div className="rounded-md border border-orange-500/30 bg-orange-500/5 px-3 py-2.5 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-orange-700 dark:text-orange-300">
              Cancelación programada el {new Date(state.currentPeriodEnd).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
          </div>
        )}

        {/* Periodo activo */}
        {state.status === "active" && state.currentPeriodEnd && !state.cancelAtPeriodEnd && (
          <p className="text-xs text-muted-foreground">
            Próximo cobro: {new Date(state.currentPeriodEnd).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        {/* Upgrade / Suscribirse */}
        {state.stripeConfigured && state.availablePlans.length > 0 && !state.hasActiveSubscription && (
          <>
            {state.availablePlans.map(p => (
              <Button
                key={p.id}
                onClick={() => checkout(p.id)}
                disabled={submitting !== null}
                className="capitalize"
              >
                {submitting === p.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Suscribirme a {p.label}
              </Button>
            ))}
          </>
        )}

        {/* Upgrade desde activa */}
        {state.stripeConfigured && state.hasActiveSubscription && state.availablePlans.length > 1 && (
          <>
            {state.availablePlans
              .filter(p => p.id !== state.plan)
              .map(p => (
                <Button
                  key={p.id}
                  variant="outline"
                  onClick={() => checkout(p.id)}
                  disabled={submitting !== null}
                  className="capitalize"
                >
                  {submitting === p.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cambiar a {p.label}
                </Button>
              ))}
          </>
        )}

        {/* Portal */}
        {state.hasStripeCustomer && (
          <Button
            variant="outline"
            onClick={openPortal}
            disabled={submitting !== null}
          >
            {submitting === "portal" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Gestionar facturación
          </Button>
        )}
      </div>
    </div>
  );
}
