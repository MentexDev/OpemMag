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
  UserCircle,
  LogOut,
  Menu,
  X,
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
  const primary = tenant.primary_color;

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
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        <Link
          href="/perfil"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            isActive("/perfil", false)
              ? "text-white"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          )}
          style={isActive("/perfil", false) ? { backgroundColor: primary + "25" } : {}}
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: primary }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">
              {profile?.full_name ?? "Mi Perfil"}
            </p>
            <p className="text-[10px] text-white/30 font-mono truncate">
              {profile?.referral_code}
            </p>
          </div>
        </Link>

        <form action={`/api/ambassador/logout?slug=${tenant.slug}`} method="POST">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
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
        <button
          className="absolute top-4 right-[-44px] h-9 w-9 bg-white/10 rounded-full flex items-center justify-center"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4 text-white" />
        </button>
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
