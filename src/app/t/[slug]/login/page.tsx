"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AmbassadorLoginPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Verify ambassador belongs to this tenant
    const res = await fetch(`/api/ambassador/verify?slug=${slug}`);
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("No tienes acceso a este programa de embajadoras.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Bienvenida de vuelta</h1>
          <p className="text-sm text-muted-foreground">Accede a tu panel de embajadora</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="underline hover:text-foreground">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
