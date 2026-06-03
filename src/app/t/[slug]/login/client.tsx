"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react";

interface Props {
  slug: string;
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string;
}

function BrandOrb({ color }: { color: string }) {
  return (
    <div className="relative mx-auto w-20 h-20 mb-2 flex-shrink-0">
      <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ backgroundColor: color }} />
      <div
        className="relative h-20 w-20 rounded-full border border-white/10 overflow-hidden"
        style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18) 0%, rgba(20,20,20,0.95) 60%, rgba(10,10,10,1) 100%)` }}
      >
        <div className="absolute top-2.5 left-3.5 h-4 w-4 rounded-full blur-md opacity-60" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function LoginClient({ slug, tenantName, logoUrl, primaryColor }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
    const res = await fetch(`/api/ambassador/verify?slug=${slug}`);
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("No tienes acceso a este programa de embajadoras.");
      setLoading(false);
      return;
    }
    router.push(`/dashboard`);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-7">
        {/* Orb + brand */}
        <div className="flex flex-col items-center text-center space-y-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={tenantName} className="h-10 w-auto object-contain mb-1" />
          ) : (
            <BrandOrb color={primaryColor} />
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">¡Bienvenida de vuelta!</h1>
            <p className="text-sm text-white/40 mt-1">
              Accede a tu panel de embajadora{tenantName ? ` de ${tenantName}` : ""}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Correo electrónico*</label>
            <input
              type="email"
              placeholder="example@gmail.com"
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
                placeholder="@Sn123hsn#"
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

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
                style={remember ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: "rgba(255,255,255,0.2)" }}
                onClick={() => setRemember(!remember)}
              >
                {remember && <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className="text-xs text-white/50 select-none" onClick={() => setRemember(!remember)}>Recordarme</span>
            </label>
            <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Iniciar sesión</>}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-white/30">O continúa con</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/70 font-medium hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continuar con Google
        </button>

        {/* Footer link */}
        <p className="text-center text-sm text-white/40">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-white font-semibold hover:opacity-80 transition-opacity">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
