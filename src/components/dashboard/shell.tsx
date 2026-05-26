"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  DollarSign,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
}

interface Props {
  tenant: Tenant;
  user: User;
  pendingCount?: number;
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/embajadoras", label: "Embajadoras", icon: Users },
  { href: "/dashboard/aprobaciones", label: "Aprobaciones", icon: ClipboardCheck },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingBag },
  { href: "/dashboard/comisiones", label: "Comisiones", icon: DollarSign },
  { href: "/dashboard/ranking", label: "Ranking", icon: Trophy },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export default function DashboardShell({ tenant, user, pendingCount = 0, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const style = {
    "--brand-primary": tenant.primary_color,
    "--brand-accent": tenant.accent_color,
  } as React.CSSProperties;

  const Sidebar = () => (
    <aside className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        {tenant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 rounded-md object-contain" />
        ) : (
          <div
            className="h-8 w-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: tenant.primary_color }}
          >
            {tenant.name[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{tenant.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {tenant.slug}.openmag.co
          </p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard/aprobaciones" && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-yellow-500 text-white text-[10px] font-bold h-4 min-w-4 px-1">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {user.email?.[0].toUpperCase()}
          </div>
          <p className="text-xs text-muted-foreground truncate flex-1">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={style}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col md:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-background flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm">{tenant.name}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
