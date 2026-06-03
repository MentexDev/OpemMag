"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Zap, Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";

interface Props {
  slug: string;
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string;
}

export default function ForgotPasswordClient({ tenantName, logoUrl, primaryColor }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (err) {
      setError("No encontramos una cuenta con ese correo.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ backgroundColor: primaryColor }} />
            <div className="relative h-20 w-20 rounded-full flex items-center justify-center border border-white/10"
              style={{ backgroundColor: primaryColor + "20" }}>
              <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Revisa tu correo</h1>
            <p className="text-sm text-white/40 mt-2 leading-relaxed">
              Enviamos un enlace de recuperación a <span className="text-white/70 font-medium">{email}</span>.
              Haz clic en el enlace para crear una nueva contraseña.
            </p>
          </div>
          <p className="text-xs text-white/25">Si no ves el correo, revisa tu carpeta de spam.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-7">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={tenantName} className="h-10 w-auto object-contain mb-1" />
          ) : (
            <div className="relative mx-auto w-20 h-20 mb-2">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ backgroundColor: primaryColor }} />
              <div className="relative h-20 w-20 rounded-full border border-white/10 flex items-center justify-center"
                style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18) 0%, rgba(20,20,20,0.95) 60%, rgba(10,10,10,1) 100%)` }}>
                <Mail className="h-7 w-7 text-white/60" />
              </div>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h1>
            <p className="text-sm text-white/40 mt-1">
              Ingresa tu correo y te enviaremos un enlace para recuperarla.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <><Zap className="h-4 w-4" /> Enviar enlace</>}
          </button>
        </form>

        <p className="text-center text-sm text-white/40">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
