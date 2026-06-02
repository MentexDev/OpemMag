"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingBag, Share2, Eye, X, Check, LayoutGrid, List, ChevronLeft, ChevronRight, Link2, ExternalLink } from "lucide-react";
import { shopifyImageUrl } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";

interface Props {
  products: ShopifyProduct[];
  tenantSlug: string;
  tenantName: string;
  primaryColor: string;
  refCode: string | null;
  userId: string;
  tenantId: string;
}

type SortKey = "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

const ITEMS_PER_PAGE = 12;

function totalStock(p: ShopifyProduct) {
  return p.variants.reduce((s, v) => s + (v.inventory_quantity ?? 0), 0);
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "price_asc", label: "Precio menor" },
  { key: "price_desc", label: "Precio mayor" },
  { key: "stock_asc", label: "Menos stock" },
  { key: "stock_desc", label: "Más stock" },
];

export default function RevistaPortalClient({
  products,
  tenantSlug,
  primaryColor,
  refCode,
}: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey | null>(null);
  const [sizeFilter, setSizeFilter] = useState("Todas");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareProduct, setShareProduct] = useState<ShopifyProduct | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRevistaName, setNewRevistaName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [createError, setCreateError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) =>
      p.variants.forEach((v) => {
        const part = v.title.split(" / ")[0].trim();
        if (part && part !== "Default Title") set.add(part);
      })
    );
    return ["Todas", ...Array.from(set).sort()];
  }, [products]);

  const processed = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.product_type?.toLowerCase().includes(q) ||
          p.vendor?.toLowerCase().includes(q) ||
          p.tags?.toLowerCase().includes(q)
      );
    }
    if (sizeFilter !== "Todas") {
      list = list.filter((p) =>
        p.variants.some((v) => v.title.split(" / ")[0].trim() === sizeFilter)
      );
    }
    if (sort === "price_asc") list.sort((a, b) => Number(a.variants[0]?.price ?? 0) - Number(b.variants[0]?.price ?? 0));
    else if (sort === "price_desc") list.sort((a, b) => Number(b.variants[0]?.price ?? 0) - Number(a.variants[0]?.price ?? 0));
    else if (sort === "stock_asc") list.sort((a, b) => totalStock(a) - totalStock(b));
    else if (sort === "stock_desc") list.sort((a, b) => totalStock(b) - totalStock(a));
    return list;
  }, [products, search, sizeFilter, sort]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const allSelected = processed.length > 0 && processed.every((p) => selected.has(String(p.id)));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(processed.map((p) => String(p.id))));
  }

  function productUrl(handle: string) {
    return `https://${tenantSlug}.myshopify.com/products/${handle}${refCode ? `?ref=${refCode}` : ""}`;
  }

  function whatsappShare(product: ShopifyProduct) {
    const url = productUrl(product.handle);
    const price = product.variants?.[0]?.price;
    const text = `¡Mira este producto! 🛍️\n\n*${product.title}*${price ? `\nPrecio: $${Number(price).toLocaleString("es-CO")}` : ""}\n\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function handleCreateRevista() {
    if (!newRevistaName.trim() || selected.size === 0) return;
    setSaving(true);
    setCreateError("");
    try {
      const res = await fetch("/api/ambassador/mis-revistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRevistaName.trim(), product_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedMsg(`Revista "${newRevistaName}" creada`);
        setShowCreateModal(false);
        setNewRevistaName("");
        setSelected(new Set());
        setTimeout(() => setSavedMsg(""), 3000);
      } else {
        setCreateError(data.error ?? "Error al crear la revista");
      }
    } catch {
      setCreateError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + Crear */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo, marca o SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 text-sm bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90 text-white"
            style={{ backgroundColor: primaryColor, color: "#000" }}
          >
            <Link2 className="h-4 w-4" />
            Crear Revista ({selected.size})
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
          <Check className="h-4 w-4 flex-shrink-0" />
          {savedMsg} ·{" "}
          <a href="/mis-revistas" className="underline">Ver Mis Revistas</a>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-white/40 flex-shrink-0">Ordenar:</span>
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setSort(sort === opt.key ? null : opt.key); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
              style={
                sort === opt.key
                  ? { backgroundColor: primaryColor, color: "#000" }
                  : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {sizes.length > 2 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-white/40">Talla:</span>
            <select
              value={sizeFilter}
              onChange={(e) => { setSizeFilter(e.target.value); setPage(1); }}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/70 focus:outline-none"
            >
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5 flex-shrink-0 ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
            style={viewMode === "grid" ? { backgroundColor: "rgba(255,255,255,0.15)", color: "white" } : { color: "rgba(255,255,255,0.35)" }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
            style={viewMode === "list" ? { backgroundColor: "rgba(255,255,255,0.15)", color: "white" } : { color: "rgba(255,255,255,0.35)" }}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Select all + Pagination */}
      {processed.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              allSelected
                ? { backgroundColor: primaryColor + "25", color: "white" }
                : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }
            }
          >
            <div
              className="h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={allSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: "rgba(255,255,255,0.4)" }}
            >
              {allSelected && <Check className="h-2.5 w-2.5 text-black" />}
            </div>
            Seleccionar todos
          </button>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all"
                  style={
                    page === p
                      ? { backgroundColor: primaryColor, color: "#000" }
                      : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products */}
      {processed.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Sin productos{search ? ` para "${search}"` : ""}.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {paginated.map((p) => {
            const id = String(p.id);
            const isSelected = selected.has(id);
            const img = p.images?.[0]?.src;
            const price = p.variants?.[0]?.price;
            const stock = totalStock(p);
            return (
              <div
                key={p.id}
                className="group relative rounded-2xl overflow-hidden border bg-[#161616] transition-all duration-200 cursor-pointer"
                style={isSelected ? { borderColor: primaryColor } : { borderColor: "rgba(255,255,255,0.08)" }}
                onClick={() => toggleSelect(id)}
              >
                {/* Checkbox top-left */}
                <div
                  className="absolute top-2.5 left-2.5 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: primaryColor, borderColor: primaryColor }
                      : { backgroundColor: "rgba(0,0,0,0.55)", borderColor: "rgba(255,255,255,0.5)" }
                  }
                >
                  {isSelected && <Check className="h-3 w-3 text-black" />}
                </div>

                {/* Image */}
                <div className="aspect-[3/4] bg-[#1a1a1a] overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shopifyImageUrl(img, 480, 640)}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-white/10" />
                    </div>
                  )}
                </div>

                {/* Hover actions bottom-right over image */}
                <div className="absolute bottom-[5.5rem] right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareProduct(p); }}
                    className="h-7 w-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>
                  <a
                    href={productUrl(p.handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                  </a>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-white line-clamp-1">{p.title}</p>
                  <p className="text-[10px] text-white/30 truncate mt-0.5">{p.vendor ?? p.product_type ?? ""}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs font-bold" style={{ color: primaryColor }}>
                      {price ? `$ ${Number(price).toLocaleString("es-CO")}` : "—"}
                    </p>
                    {stock > 0 && <p className="text-[10px] font-medium text-green-400">{stock} uds</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {paginated.map((p) => {
            const id = String(p.id);
            const isSelected = selected.has(id);
            const img = p.images?.[0]?.src;
            const price = p.variants?.[0]?.price;
            const stock = totalStock(p);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all"
                style={
                  isSelected
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                    : { borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }
                }
                onClick={() => toggleSelect(id)}
              >
                <div
                  className="h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: "rgba(255,255,255,0.3)" }}
                >
                  {isSelected && <Check className="h-3 w-3 text-black" />}
                </div>
                <div className="h-11 w-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shopifyImageUrl(img, 88, 88)} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><ShoppingBag className="h-4 w-4 text-white/20" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{p.title}</p>
                  <p className="text-[10px] text-white/30 truncate">{p.vendor ?? p.product_type ?? ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {price && <p className="text-xs font-bold" style={{ color: primaryColor }}>${Number(price).toLocaleString("es-CO")}</p>}
                  {stock > 0 && <p className="text-[10px] text-green-400">{stock} uds</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareProduct(p); }}
                    className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={productUrl(p.handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share product modal */}
      {shareProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShareProduct(null)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <p className="font-semibold text-sm text-white">Compartir producto</p>
              <button onClick={() => setShareProduct(null)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
              {shareProduct.images?.[0]?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shopifyImageUrl(shareProduct.images[0].src, 150, 200)} alt={shareProduct.title}
                  className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border border-white/10" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white line-clamp-1">{shareProduct.title}</p>
                {shareProduct.variants?.[0]?.price && (
                  <p className="text-xs font-bold mt-0.5" style={{ color: primaryColor }}>
                    ${Number(shareProduct.variants[0].price).toLocaleString("es-CO")}
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <a href={whatsappShare(shareProduct)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }} onClick={() => setShareProduct(null)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
                Compartir por WhatsApp
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(productUrl(shareProduct.handle)); setShareProduct(null); }}
                className="flex items-center gap-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-white/30" />
                Copiar enlace del producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Revista modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-white">Crear Mi Revista</h2>
                <p className="text-xs text-white/40 mt-0.5">{selected.size} productos seleccionados</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Nombre de la revista</label>
              <input
                type="text"
                placeholder="Ej: Colección Verano"
                value={newRevistaName}
                onChange={(e) => { setNewRevistaName(e.target.value); setCreateError(""); }}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateRevista()}
              />
            </div>
            {createError && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{createError}</p>
            )}
            <button
              onClick={handleCreateRevista}
              disabled={saving || !newRevistaName.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-black transition-opacity disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? "Guardando..." : "Guardar Revista"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
