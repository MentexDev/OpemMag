"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Trophy,
  BookOpen,
  LayoutList,
  Menu,
  X,
  HeartHandshake,
  ChevronRight,
  Copy,
  Check,
  Settings,
  UserCircle,
} from "lucide-react";
import { useState } from "react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  logo_url: string | null;
}

interface Profile {
  full_name: string;
  referral_code: string;
  avatar_url: string | null;
}

interface Props {
  tenant: Tenant;
  profile: Profile | null;
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/ventas", label: "Mis Ventas", icon: ShoppingBag, exact: false },
  { href: "/ranking", label: "Ranking", icon: Trophy, exact: false },
  { href: "/revista", label: "Revista", icon: BookOpen, exact: false },
  { href: "/mis-revistas", label: "Mis Revistas", icon: LayoutList, exact: false },
];

export default function AmbassadorShell({ tenant, profile, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const primary = tenant.primary_color;

  const fichaUrl = typeof window !== "undefined"
    ? `${window.location.origin}/t/${tenant.slug}/card/${profile?.referral_code ?? ""}`
    : `/t/${tenant.slug}/card/${profile?.referral_code ?? ""}`;

  function copyLink() {
    navigator.clipboard.writeText(fichaUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsapp() {
    const text = encodeURIComponent(`¡Mira mi catálogo de ${tenant.name}! ${fichaUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTwitter() {
    const text = encodeURIComponent(`¡Mira mi catálogo de ${tenant.name}!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fichaUrl)}`, "_blank");
  }

  function shareTelegram() {
    const text = encodeURIComponent(`¡Mira mi catálogo de ${tenant.name}!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(fichaUrl)}&text=${text}`, "_blank");
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href || pathname.endsWith("/dashboard");
    return pathname.endsWith(href) || pathname.includes(href + "/");
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "E";

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/5">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
        {tenant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain" />
        ) : (
          <>
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ backgroundColor: primary }}
            >
              {tenant.name[0].toUpperCase()}
            </div>
            <span className="font-semibold text-sm text-white truncate">{tenant.name}</span>
          </>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-3">Menú</p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
                style={active ? { backgroundColor: primary + "25", color: "white" } : {}}
              >
                <item.icon
                  className="h-4 w-4 flex-shrink-0"
                  style={active ? { color: primary } : {}}
                />
                {item.label}
                {active && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        {/* Share card */}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all text-left"
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primary + "25" }}
          >
            <HeartHandshake className="h-3.5 w-3.5" style={{ color: primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Comparte {tenant.name}</p>
            <p className="text-[10px] text-white/40">con tus amigas</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
        </button>

        {/* Bottom icon buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/perfil"
            onClick={() => setMobileOpen(false)}
            title="Configuración"
            className={cn(
              "flex-1 flex items-center justify-center h-9 rounded-lg transition-all",
              isActive("/perfil", false)
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Link
            href="/perfil"
            onClick={() => setMobileOpen(false)}
            title="Mi perfil"
            className={cn(
              "flex-1 flex items-center justify-center h-9 rounded-lg transition-all",
              isActive("/perfil", false)
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            )}
          >
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {initials}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
      {/* Share modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShareOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="pt-8 pb-4 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
                style={{ backgroundColor: primary + "20" }}>
                <HeartHandshake className="h-7 w-7" style={{ color: primary }} />
              </div>
              <h2 className="text-xl font-bold text-white">Comparte tu enlace</h2>
              <p className="text-sm text-white/40 mt-1.5 px-6">
                Comparte tu catálogo de <span className="text-white/70 font-medium">{tenant.name}</span> con tus amigas y clientes.
              </p>
            </div>

            <div className="px-5 pb-6 space-y-3">
              {/* Copy link */}
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "¡Enlace copiado!" : "Copiar enlace"}
              </button>

              {/* WhatsApp */}
              <button
                onClick={shareWhatsapp}
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Compartir por WhatsApp
              </button>

              {/* Social row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={shareTwitter}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-all text-sm text-white/70 hover:text-white font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X (Twitter)
                </button>
                <button
                  onClick={shareTelegram}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-all text-sm text-white/70 hover:text-white font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">0</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Compartidos</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">{profile?.referral_code ?? "—"}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Tu código</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 flex flex-col md:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
        {mobileOpen && (
          <button
            className="absolute top-4 right-[-44px] h-9 w-9 bg-white/10 rounded-full flex items-center justify-center"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-[#0a0a0a] border-b border-white/5 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.name} className="h-6 w-auto object-contain" />
          ) : (
            <span className="font-semibold text-sm text-white">{tenant.name}</span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
