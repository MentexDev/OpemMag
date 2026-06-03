"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-7">
        {/* Logo + orb */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative mx-auto w-20 h-20 mb-2">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40 bg-white/20" />
            <div className="relative h-20 w-20 rounded-full border border-white/10 flex items-center justify-center"
              style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.15) 0%, rgba(20,20,20,0.95) 60%, rgba(10,10,10,1) 100%)" }}>
              <span className="text-xl font-bold text-white/80">OM</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
            <p className="text-sm text-white/40 mt-1">Ingresa a tu panel de administración</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Correo electrónico*</label>
            <input
              type="email"
              placeholder="hola@mitienda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-[#161616] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Contraseña*</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 pr-11 bg-[#161616] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold bg-white text-black transition-all hover:bg-white/90 disabled:opacity-50 mt-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <><Zap className="h-4 w-4" /> Iniciar sesión</>}
          </button>
        </form>

        <p className="text-center text-sm text-white/40">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-white font-semibold hover:opacity-80 transition-opacity">
            Crear tienda gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
