"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Clock } from "lucide-react";

export default function AmbassadorRegisterPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/ambassador/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al registrarse.");
      setLoading(false);
      return;
    }

    // Sign in after registration (so session is active)
    const supabase = createClient();
    await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (data.pending) {
      setPending(true);
      setLoading(false);
      return;
    }

    router.push(`/dashboard`);
  }

  if (pending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/15 mx-auto">
            <Clock className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Solicitud enviada</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu cuenta está pendiente de aprobación por parte del administrador de la tienda.
              Te avisarán cuando tu acceso esté activo.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Registrada como: <span className="font-medium text-foreground">{form.email}</span>
          </div>
          <Link
            href="/login"
            className="inline-block text-sm underline text-muted-foreground hover:text-foreground"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Únete como embajadora</h1>
          <p className="text-sm text-muted-foreground">Crea tu cuenta gratis y empieza a ganar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              placeholder="María García"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: "var(--brand-primary, #6366f1)" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><span>Crear mi cuenta</span><ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
