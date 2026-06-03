"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingBag, X, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { shopifyImageUrl } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";
import { cn } from "@/lib/utils";

interface Props {
  products: ShopifyProduct[];
  primaryColor: string;
  refCode: string | null;
  tenantSlug: string;
}

function totalStock(p: ShopifyProduct) {
  return p.variants.reduce((s, v) => s + (v.inventory_quantity ?? 0), 0);
}

function sizeStock(p: ShopifyProduct): Map<string, number> {
  const map = new Map<string, number>();
  for (const v of p.variants) {
    const size = v.option1 ?? v.title;
    if (size && size !== "Default Title") {
      map.set(size, (map.get(size) ?? 0) + (v.inventory_quantity ?? 0));
    }
  }
  return map;
}

/* ─── Product Drawer ─── */
function ProductDrawer({
  product,
  onClose,
  primary,
  refCode,
  tenantSlug,
}: {
  product: ShopifyProduct;
  onClose: () => void;
  primary: string;
  refCode: string | null;
  tenantSlug: string;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [copied, setCopied] = useState(false);

  const price = Number(product.variants[0]?.price ?? 0);
  const comparePrice = product.variants[0]?.compare_at_price
    ? Number(product.variants[0].compare_at_price)
    : null;
  const sku = product.variants[0]?.sku;
  const stock = totalStock(product);
  const sizes = sizeStock(product);
  const colors = [...new Set(product.variants.map((v) => v.option2).filter(Boolean))] as string[];

  const productUrl = `https://${tenantSlug}.myshopify.com/products/${product.handle}${refCode ? `?ref=${refCode}` : ""}`;
  const whatsappText = encodeURIComponent(`¡Mira este producto! 🛍️\n\n*${product.title}*\nPrecio: $${price.toLocaleString("es-CO")}\n\n${productUrl}`);

  function copyLink() {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer — right on desktop, bottom sheet on mobile */}
      <div className={cn(
        "fixed z-50 bg-[#0f0f0f] border-white/10 overflow-y-auto",
        // Mobile: bottom sheet
        "bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[88vh]",
        // Desktop: right panel
        "sm:bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:w-[420px] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0 sm:max-h-full sm:h-full",
      )}>
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-[#0f0f0f] z-10">
          <p className="font-semibold text-sm text-white">Detalle del Producto</p>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 pb-8">
          {/* Main image */}
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5">
            {product.images[activeImg]?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shopifyImageUrl(product.images[activeImg].src, 480, 640)}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-white/10" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.slice(0, 6).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id ?? i}
                  src={shopifyImageUrl(img.src, 80, 80)}
                  alt=""
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "h-14 w-14 flex-shrink-0 rounded-lg object-cover cursor-pointer border-2 transition-all",
                    activeImg === i ? "border-white/60" : "border-transparent opacity-50 hover:opacity-80"
                  )}
                />
              ))}
              {product.images.length > 6 && (
                <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/40">
                  +{product.images.length - 6}
                </div>
              )}
            </div>
          )}

          {/* Name & price */}
          <div>
            <p className="text-base font-bold text-white leading-snug">{product.title}</p>
            {product.vendor && <p className="text-xs text-white/40 mt-0.5">{product.vendor}</p>}
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xl font-bold" style={{ color: primary }}>
                ${price.toLocaleString("es-CO")}
              </p>
              {comparePrice && comparePrice > price && (
                <p className="text-sm text-white/30 line-through">
                  ${comparePrice.toLocaleString("es-CO")}
                </p>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="rounded-xl bg-white/5 border border-white/8 divide-y divide-white/5">
            {[
              { label: "Tipo", value: product.product_type || "—" },
              { label: "SKU", value: sku || "—" },
              { label: "Estado", value: product.status === "active" ? "Activo" : product.status },
              { label: "Inventario", value: stock > 0 ? `${stock} unidades` : "Sin stock" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-white/40">{row.label}</span>
                <span className={cn("text-xs font-medium", row.label === "Inventario" ? (stock > 0 ? "text-green-400" : "text-red-400") : "text-white/70")}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Sizes */}
          {sizes.size > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Tallas disponibles</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(sizes.entries()).map(([size, qty]) => (
                  <div key={size}
                    className={cn("px-3 py-1 rounded-lg border text-xs font-medium transition-all", qty > 0 ? "border-white/15 text-white/70" : "border-white/5 text-white/20 line-through")}
                  >
                    {size}
                    {qty > 0 && <span className="ml-1.5 text-[10px] text-green-400">{qty}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Colores</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <span key={c} className="px-3 py-1 rounded-lg border border-white/15 text-xs text-white/70">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/40">{tag}</span>
              ))}
            </div>
          )}

          {/* Description */}
          {product.body_html && (
            <div className="rounded-xl bg-white/5 border border-white/8 p-4">
              <p className="text-xs text-white/40 mb-2">Descripción</p>
              <div
                className="text-xs text-white/60 leading-relaxed prose-invert [&_*]:text-white/60 [&_strong]:text-white/80"
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            </div>
          )}

          {/* Share actions */}
          <div className="space-y-2 pt-1">
            <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              Compartir por WhatsApp
            </a>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={copyLink}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <a href={productUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium">
                <ExternalLink className="h-3.5 w-3.5" /> Ver producto
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Dashboard Products Section ─── */
export default function DashboardProductsSection({ products, primaryColor, refCode, tenantSlug }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ShopifyProduct | null>(null);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q) ||
      p.vendor?.toLowerCase().includes(q)
    );
  }, [products, search]);

  if (products.length === 0) return null;

  return (
    <>
      <div className="rounded-xl bg-white/5 border border-white/8 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-sm font-semibold text-white flex-shrink-0">Productos Recientes</h2>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
          </div>
          <a href="/revista" className="text-xs font-medium flex-shrink-0 sm:ml-auto" style={{ color: primaryColor }}>
            Ver revista →
          </a>
        </div>

        {/* Table */}
        {displayed.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag className="h-6 w-6 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/30">Sin resultados para &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
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
                {displayed.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-5 py-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                        {p.images?.[0]?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={shopifyImageUrl(p.images[0].src, 80, 80)}
                            alt={p.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
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
                      <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                        ${Number(p.variants?.[0]?.price ?? 0).toLocaleString("es-CO")}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <ProductDrawer
          product={selected}
          onClose={() => setSelected(null)}
          primary={primaryColor}
          refCode={refCode}
          tenantSlug={tenantSlug}
        />
      )}
    </>
  );
}
