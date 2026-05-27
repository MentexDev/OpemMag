"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag, Search, Share2, ExternalLink, X } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  shopify_domain: string | null;
}

interface Product {
  id: number;
  title: string;
  handle: string;
  product_type?: string;
  images: { src: string }[];
  variants: { price: string; compare_at_price?: string | null }[];
}

interface Props {
  tenant: Tenant;
  ids: string | null;
  refCode: string | null;
}

export default function RevistaClient({ tenant, ids, refCode }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopifyConfigured, setShopifyConfigured] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [shareProduct, setShareProduct] = useState<Product | null>(null);

  useEffect(() => {
    const url = new URL(`/api/t/${tenant.slug}/products`, window.location.origin);
    if (ids) url.searchParams.set("ids", ids);
    fetch(url.toString())
      .then(r => r.json())
      .then(d => {
        setProducts(d.products ?? []);
        setShopifyConfigured(d.shopifyConfigured !== false);
      })
      .finally(() => setLoading(false));
  }, [tenant.slug, ids]);

  const categories = useMemo(() => {
    const types = products.map(p => p.product_type?.trim()).filter(Boolean) as string[];
    return ["Todos", ...Array.from(new Set(types))];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === "Todos" || p.product_type?.trim() === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  function productUrl(handle: string) {
    if (!tenant.shopify_domain) return "#";
    const domain = tenant.shopify_domain.replace(/^https?:\/\//, "");
    return `https://${domain}/products/${handle}${refCode ? `?ref=${refCode}` : ""}`;
  }

  function shareUrl(handle: string) {
    return `${window.location.origin}/t/${tenant.slug}/ver?ref=${refCode ?? ""}&ids=`;
  }

  function whatsappShare(product: Product) {
    const url = productUrl(product.handle);
    const price = product.variants?.[0]?.price;
    const text = `¡Mira este producto de ${tenant.name}! 🛍️\n\n*${product.title}*${price ? `\nPrecio: $${Number(price).toLocaleString("es-CO")}` : ""}\n\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function copyLink(product: Product) {
    navigator.clipboard.writeText(productUrl(product.handle));
    setShareProduct(null);
  }

  const primary = tenant.primary_color;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-auto object-contain" />
            ) : (
              <>
                <div className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: primary }}>
                  {tenant.name[0].toUpperCase()}
                </div>
                <span className="font-semibold text-sm">{tenant.name}</span>
              </>
            )}
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-full border bg-muted/50 focus:outline-none focus:ring-1 focus:border-transparent transition"
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
            </div>
          </div>

          {refCode && (
            <span className="text-xs text-muted-foreground hidden md:block flex-shrink-0">
              Código: <span className="font-mono font-medium">{refCode}</span>
            </span>
          )}
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-full border bg-muted/50 focus:outline-none focus:ring-1 transition"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Title + count ── */}
        {!loading && shopifyConfigured && products.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold">Catálogo {tenant.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
                {search && ` · "${search}"`}
              </p>
            </div>

            {/* Category pills */}
            {categories.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all border"
                    style={activeCategory === cat
                      ? { backgroundColor: primary, color: "#fff", borderColor: primary }
                      : { borderColor: "transparent", backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="py-24 flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: primary }} />
            <p className="text-sm text-muted-foreground">Cargando catálogo…</p>
          </div>
        )}

        {/* ── Not configured ── */}
        {!loading && !shopifyConfigured && <EmptyState icon="shop" message="Esta tienda aún no ha conectado su catálogo Shopify." />}

        {/* ── Empty ── */}
        {!loading && shopifyConfigured && filtered.length === 0 && (
          <EmptyState icon="search" message={search ? `Sin resultados para "${search}".` : "Sin productos disponibles."} />
        )}

        {/* ── Grid ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map(p => {
              const img = p.images?.[0]?.src;
              const price = p.variants?.[0]?.price;
              const compareAt = p.variants?.[0]?.compare_at_price;
              const hasDiscount = compareAt && Number(compareAt) > Number(price);

              return (
                <div key={p.id} className="group relative rounded-2xl overflow-hidden border bg-card hover:shadow-md transition-all duration-300">
                  {/* Image */}
                  <a href={productUrl(p.handle)} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="aspect-[3/4] bg-muted overflow-hidden">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-30" />
                        </div>
                      )}
                    </div>
                  </a>

                  {/* Discount badge */}
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: primary }}>
                      -{Math.round((1 - Number(price) / Number(compareAt)) * 100)}%
                    </div>
                  )}

                  {/* Share button */}
                  <button
                    onClick={() => setShareProduct(p)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                  >
                    <Share2 className="h-3.5 w-3.5 text-foreground" />
                  </button>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <a href={productUrl(p.handle)} target="_blank" rel="noopener noreferrer">
                      <p className="text-xs font-medium line-clamp-2 leading-snug hover:underline">{p.title}</p>
                    </a>
                    <div className="flex items-center gap-1.5">
                      {price && (
                        <p className="text-sm font-bold" style={{ color: primary }}>
                          ${Number(price).toLocaleString("es-CO")}
                        </p>
                      )}
                      {hasDiscount && (
                        <p className="text-xs text-muted-foreground line-through">
                          ${Number(compareAt).toLocaleString("es-CO")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Floating contact button ── */}
      {refCode && !loading && filtered.length > 0 && (
        <Link
          href={`/card/${refCode}`}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: primary }}
        >
          <Share2 className="h-4 w-4" />
          Mi perfil
        </Link>
      )}

      {/* ── Share modal ── */}
      {shareProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareProduct(null)} />
          <div className="relative bg-background border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <p className="font-semibold text-sm">Compartir producto</p>
              <button onClick={() => setShareProduct(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Product preview */}
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              {shareProduct.images?.[0]?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shareProduct.images[0].src} alt={shareProduct.title}
                  className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium line-clamp-1">{shareProduct.title}</p>
                {shareProduct.variants?.[0]?.price && (
                  <p className="text-xs font-bold mt-0.5" style={{ color: primary }}>
                    ${Number(shareProduct.variants[0].price).toLocaleString("es-CO")}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <a
                href={whatsappShare(shareProduct)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
                onClick={() => setShareProduct(null)}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
                Compartir por WhatsApp
              </a>

              <button
                onClick={() => copyLink(shareProduct)}
                className="flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                Copiar enlace del producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: "shop" | "search"; message: string }) {
  return (
    <div className="py-24 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">Sin productos</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{message}</p>
    </div>
  );
}
