"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingBag, Share2, ExternalLink, X, Plus, Check } from "lucide-react";
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

export default function RevistaPortalClient({
  products,
  tenantSlug,
  primaryColor,
  refCode,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareProduct, setShareProduct] = useState<ShopifyProduct | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRevistaName, setNewRevistaName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const categories = useMemo(() => {
    const types = products.map((p) => p.product_type?.trim()).filter(Boolean) as string[];
    return ["Todos", ...Array.from(new Set(types))];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "Todos" || p.product_type?.trim() === activeCategory;
      const q = search.toLowerCase();
      return matchCat && (!q || p.title.toLowerCase().includes(q));
    });
  }, [products, activeCategory, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function productUrl(handle: string) {
    const domain = `${tenantSlug}.myshopify.com`;
    return `https://${domain}/products/${handle}${refCode ? `?ref=${refCode}` : ""}`;
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
    try {
      const res = await fetch("/api/ambassador/mis-revistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRevistaName.trim(),
          product_ids: Array.from(selected),
        }),
      });
      if (res.ok) {
        setSavedMsg(`Revista "${newRevistaName}" creada`);
        setShowCreateModal(false);
        setNewRevistaName("");
        setSelected(new Set());
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Revista</h1>
          <p className="text-sm text-white/40 mt-0.5">{filtered.length} productos disponibles</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            Crear Mi Revista ({selected.size})
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
          <Check className="h-4 w-4" />
          {savedMsg} · <a href="/mis-revistas" className="underline">Ver Mis Revistas</a>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Limpiar selección
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={
                activeCategory === cat
                  ? { backgroundColor: primaryColor, color: "#000" }
                  : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Sin productos{search ? ` para "${search}"` : ""}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((p) => {
            const id = String(p.id);
            const isSelected = selected.has(id);
            const img = p.images?.[0]?.src;
            const price = p.variants?.[0]?.price;

            return (
              <div
                key={p.id}
                className="group relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer"
                style={
                  isSelected
                    ? { borderColor: primaryColor, boxShadow: `0 0 0 2px ${primaryColor}40` }
                    : { borderColor: "rgba(255,255,255,0.08)" }
                }
                onClick={() => toggleSelect(id)}
              >
                <div className="aspect-[3/4] bg-white/5 overflow-hidden">
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
                      <ShoppingBag className="h-6 w-6 text-white/15" />
                    </div>
                  )}
                </div>

                {/* Checkbox */}
                <div
                  className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all border"
                  style={
                    isSelected
                      ? { backgroundColor: primaryColor, borderColor: primaryColor }
                      : { backgroundColor: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.2)" }
                  }
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-black" />}
                </div>

                {/* Share button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShareProduct(p); }}
                  className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Share2 className="h-3 w-3 text-white" />
                </button>

                <div className="p-2.5 bg-[#111]">
                  <p className="text-xs font-medium text-white/70 line-clamp-2 leading-snug">{p.title}</p>
                  {price && (
                    <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                      ${Number(price).toLocaleString("es-CO")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share modal */}
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
              <button onClick={() => { navigator.clipboard.writeText(productUrl(shareProduct.handle)); setShareProduct(null); }}
                className="flex items-center gap-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors">
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
          <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-white">Crear Mi Revista</h2>
                <p className="text-xs text-white/40 mt-1">{selected.size} productos seleccionados</p>
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
                onChange={(e) => setNewRevistaName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateRevista()}
              />
            </div>
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
