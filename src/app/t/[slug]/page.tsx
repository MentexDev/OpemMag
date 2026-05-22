import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ArrowRight, Star, Users } from "lucide-react";

async function getTenant(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

async function getStats(tenantId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("tenant_users")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "ambassador");
  return { ambassadors: count ?? 0 };
}

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const stats = await getStats(tenant.id);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-primary, #6366f1)10" }}
    >
      {/* Nav */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: "var(--brand-primary, #6366f1)" }}
              >
                {tenant.name[0].toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground">{tenant.name}</span>
          </div>
          <Link
            href={`/login`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ backgroundColor: "var(--brand-primary, #6366f1)" }}
        />

        <div className="relative space-y-6 max-w-xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{
              borderColor: "color-mix(in srgb, var(--brand-primary, #6366f1) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--brand-primary, #6366f1) 10%, transparent)",
              color: "var(--brand-primary, #6366f1)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Programa de embajadoras activo
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Vende{" "}
            <span
              style={{ color: "var(--brand-primary, #6366f1)" }}
            >
              {tenant.name}
            </span>{" "}
            y gana comisiones
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Únete al programa de embajadoras de {tenant.name}. Comparte productos,
            registra ventas y recibe comisiones directamente en tu cuenta.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: "var(--brand-primary, #6366f1)" }}
            >
              Unirme gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/login`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats */}
          {stats.ambassadors > 0 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{stats.ambassadors} embajadora{stats.ambassadors !== 1 ? "s" : ""} activa{stats.ambassadors !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          Programa de embajadoras de {tenant.name} · Powered by{" "}
          <span className="font-medium">OpenMag</span>
        </p>
      </footer>
    </div>
  );
}
