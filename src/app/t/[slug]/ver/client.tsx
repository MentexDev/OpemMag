"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag, MessageCircle } from "lucide-react";

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
  images: { src: string }[];
  variants: { price: string }[];
  product_type?: string;
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

  function shopifyUrl(handle: string) {
    if (!tenant.shopify_domain) return "#";
    const domain = tenant.shopify_domain.replace(/^https?:\/\//, "");
    return `https://${domain}/products/${handle}${refCode ? `?ref=${refCode}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/t/${tenant.slug}`} className="flex items-center gap-2">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-auto object-contain" />
            ) : (
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: tenant.primary_color }}
              >
                {tenant.name[0].toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-sm">{tenant.name}</span>
          </Link>

          {refCode && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Ref: <span className="font-mono">{refCode}</span>
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Revista {tenant.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ids
              ? `Selección personalizada · ${products.length} producto${products.length !== 1 ? "s" : ""}`
              : `Catálogo completo · ${products.length} producto${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Shopify not configured */}
        {!loading && !shopifyConfigured && (
          <EmptyShop message="Esta tienda aún no ha conectado su catálogo Shopify." />
        )}

        {/* Empty */}
        {!loading && shopifyConfigured && products.length === 0 && (
          <EmptyShop message={ids ? "No se encontraron productos con los IDs proporcionados." : "Sin productos disponibles."} />
        )}

        {/* Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map(p => {
              const img = p.images?.[0]?.src;
              const price = p.variants?.[0]?.price;
              return (
                <a
                  key={p.id}
                  href={shopifyUrl(p.handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl overflow-hidden border bg-card hover:shadow-lg transition-all"
                >
                  <div className="aspect-[3/4] bg-muted overflow-hidden relative">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-2 leading-snug">{p.title}</p>
                    {price && (
                      <p
                        className="text-sm font-bold"
                        style={{ color: tenant.primary_color }}
                      >
                        ${Number(price).toLocaleString("es-CO")}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Floating WhatsApp / share — solo si hay ref */}
        {refCode && products.length > 0 && (
          <Link
            href={`/t/${tenant.slug}/card/${refCode}`}
            className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-2xl transition-transform hover:scale-105"
            style={{ backgroundColor: tenant.primary_color }}
          >
            <MessageCircle className="h-4 w-4" />
            Contáctame
          </Link>
        )}
      </main>
    </div>
  );
}

function EmptyShop({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">Catálogo vacío</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{message}</p>
    </div>
  );
}
