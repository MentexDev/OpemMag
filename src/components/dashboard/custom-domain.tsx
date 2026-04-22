"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle, Trash2, Globe, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationRecord {
  type: string;
  domain: string;
  value: string;
  reason?: string;
}

interface DomainState {
  domain: string | null;
  verified?: boolean;
  verification?: VerificationRecord[];
  vercelConfigured: boolean;
}

export default function CustomDomainSection() {
  const [state, setState] = useState<DomainState | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tenant/custom-domain");
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/tenant/custom-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: input.trim() }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Error al añadir dominio");
      return;
    }
    setInput("");
    setState({ ...data, vercelConfigured: state?.vercelConfigured ?? false });
  }

  async function handleRemove() {
    if (!confirm("¿Quitar el dominio personalizado?")) return;
    setSubmitting(true);
    await fetch("/api/tenant/custom-domain", { method: "DELETE" });
    setSubmitting(false);
    setState(s => s ? { ...s, domain: null, verified: false, verification: [] } : null);
  }

  async function handleVerify() {
    setVerifying(true);
    await fetch("/api/tenant/custom-domain", { method: "PATCH" });
    await load();
    setVerifying(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return (
      <div className="py-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando dominio...
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Dominio personalizado
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Usa tu propio dominio (ej: <span className="font-mono">tienda.com</span>) en lugar del subdominio NexusStore.
        </p>
      </div>

      {!state.vercelConfigured && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Vercel no está configurado en el servidor. El dominio se guardará pero la verificación SSL no se ejecutará. Pídele al administrador de NexusStore que añada <span className="font-mono">VERCEL_TOKEN</span> y <span className="font-mono">VERCEL_PROJECT_ID</span>.
          </span>
        </div>
      )}

      {/* Sin dominio configurado */}
      {!state.domain && (
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="custom-domain">Tu dominio</Label>
            <Input
              id="custom-domain"
              placeholder="tudominio.com"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Sin <span className="font-mono">www</span> ni protocolo. Solo el dominio raíz.
            </p>
          </div>
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <Button type="submit" disabled={submitting || !input}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Añadir dominio
          </Button>
        </form>
      )}

      {/* Con dominio configurado */}
      {state.domain && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-sm truncate">{state.domain}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {state.verified ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">Verificado · SSL activo</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">Pendiente de verificación</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={submitting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Instrucciones DNS */}
          {!state.verified && state.verification && state.verification.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Configura tu DNS</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Añade estos registros donde administras tu dominio (GoDaddy, Namecheap, Cloudflare, etc.).
                </p>
              </div>
              <div className="space-y-2">
                {state.verification.map((rec, i) => (
                  <div key={i} className="rounded-md border bg-background p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider mb-1">Tipo</p>
                        <p className="font-mono font-medium">{rec.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider mb-1">Nombre</p>
                        <button
                          onClick={() => copy(rec.domain)}
                          className="font-mono font-medium hover:text-pink-500 inline-flex items-center gap-1"
                        >
                          {rec.domain}
                          {copied === rec.domain ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-50" />}
                        </button>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider mb-1">Valor</p>
                        <button
                          onClick={() => copy(rec.value)}
                          className="font-mono font-medium hover:text-pink-500 inline-flex items-center gap-1 truncate max-w-full"
                        >
                          <span className="truncate">{rec.value}</span>
                          {copied === rec.value ? <Check className="h-3 w-3 text-green-500 flex-shrink-0" /> : <Copy className="h-3 w-3 opacity-50 flex-shrink-0" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Verificar ahora
              </Button>
            </div>
          )}

          {state.verified && (
            <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>
                Tu portal está disponible en{" "}
                <a
                  href={`https://${state.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-mono"
                >
                  https://{state.domain}
                </a>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
