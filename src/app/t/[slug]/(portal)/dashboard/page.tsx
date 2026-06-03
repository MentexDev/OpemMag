import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchTenantProducts } from "@/lib/shopify";
import { ShoppingBag, TrendingUp, DollarSign, Star } from "lucide-react";
import DashboardProductsSection from "./client";

export const dynamic = "force-dynamic";

export default async function AmbassadorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, shopify_domain, shopify_token, catalog_product_ids")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) redirect("/login");

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, referral_code")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  // Sales summary
  const { data: sales } = await admin
    .from("sales")
    .select("amount, commission_amt, status, created_at")
    .eq("tenant_id", tenant.id)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  type Sale = { amount: unknown; commission_amt: unknown; status: string; created_at: string };
  const salesArr = (sales ?? []) as Sale[];
  const totalSales = salesArr.reduce((s, r) => s + Number(r.amount), 0);
  const totalComm = salesArr.reduce((s, r) => s + Number(r.commission_amt), 0);
  const pendingComm = salesArr
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + Number(r.commission_amt), 0);

  // Shopify products
  let products: import("@/lib/shopify").ShopifyProduct[] = [];
  if (tenant.shopify_domain && tenant.shopify_token) {
    const all = await fetchTenantProducts({
      domain: tenant.shopify_domain as string,
      encryptedToken: tenant.shopify_token as string,
    });
    const catalogIds = tenant.catalog_product_ids as string[] | null;
    products = catalogIds && catalogIds.length > 0
      ? all.filter((p) => catalogIds.includes(String(p.id)))
      : all;
  }

  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = products.filter((p) => {
    if (!p.created_at) return false;
    return now - new Date(p.created_at).getTime() < week;
  }).length;

  const primary = (tenant as { primary_color: string }).primary_color;

  const stats = [
    { label: "Total Productos", value: products.length, sub: "En catálogo", icon: ShoppingBag },
    { label: "Nuevos esta semana", value: newThisWeek, sub: "Últimos 7 días", icon: TrendingUp },
    { label: "Mis Ventas", value: `$${totalSales.toLocaleString("es-CO")}`, sub: "Total histórico", icon: DollarSign },
    { label: "Comisiones", value: `$${totalComm.toLocaleString("es-CO")}`, sub: `$${pendingComm.toLocaleString("es-CO")} por cobrar`, icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 font-medium">{s.label}</p>
              <s.icon className="h-4 w-4 text-white/20" />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/30">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Products with search + drawer */}
      <DashboardProductsSection
        products={products}
        primaryColor={primary}
        refCode={profile?.referral_code ?? null}
        tenantSlug={slug}
      />
    </div>
  );
}
