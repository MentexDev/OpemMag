import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchTenantProducts } from "@/lib/shopify";
import { ShoppingBag, TrendingUp, DollarSign, Star } from "lucide-react";
import Link from "next/link";

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
  let products: { id: number; title: string; handle: string; product_type?: string; images: { src: string }[]; variants: { price: string }[]; created_at?: string }[] = [];
  if (tenant.shopify_domain && tenant.shopify_token) {
    const all = await fetchTenantProducts({
      domain: tenant.shopify_domain as string,
      encryptedToken: tenant.shopify_token as string,
    });
    const catalogIds = tenant.catalog_product_ids as string[] | null;
    products = (catalogIds && catalogIds.length > 0
      ? all.filter((p) => catalogIds.includes(String(p.id)))
      : all) as typeof products;
  }

  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = products.filter((p) => {
    if (!p.created_at) return false;
    return now - new Date(p.created_at).getTime() < week;
  }).length;

  const recentProducts = products.slice(0, 8);
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

      {/* Recent products */}
      {recentProducts.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Productos Recientes</h2>
            <Link href="/revista" className="text-xs font-medium" style={{ color: primary }}>
              Ver revista →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-[10px] uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3 font-medium">Imagen</th>
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Tipo</th>
                  <th className="px-5 py-3 font-medium text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                        {p.images?.[0]?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0].src}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-4 w-4 m-3 text-white/20" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-white/80 font-medium line-clamp-1 max-w-[200px]">{p.title}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-xs text-white/40">{p.product_type ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <p className="text-sm font-semibold" style={{ color: primary }}>
                        ${Number(p.variants?.[0]?.price ?? 0).toLocaleString("es-CO")}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
