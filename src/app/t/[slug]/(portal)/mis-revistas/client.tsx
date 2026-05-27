"use client";

import { useState } from "react";
import { LayoutList, Trash2, Share2, ShoppingBag, ExternalLink, X, Check } from "lucide-react";
import { shopifyImageUrl } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";

interface Catalog {
  id: string;
  name: string;
  product_ids: string[];
  created_at: string;
}

interface Props {
  catalogs: Catalog[];
  productMap: Record<string, ShopifyProduct>;
  primaryColor: string;
  tenantSlug: string;
  refCode: string | null;
}

export default function MisRevistasClient({
  catalogs: initialCatalogs,
  productMap,
  primaryColor,
  tenantSlug,
  refCode,
}: Props) {
  const [catalogs, setCatalogs] = useState(initialCatalogs);
  const [deleteTarget, setDeleteTarget] = useState<Catalog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState<Catalog | null>(null);
  const [copied, setCopied] = useState(false);

  function getCatalogLink(catalog: Catalog) {
    const ids = catalog.product_ids.join(",");
    const base = `${window.location.origin}/t/${tenantSlug}/ver`;
    return `${base}?ids=${ids}${refCode ? `&ref=${refCode}` : ""}`;
  }

  function whatsappShare(catalog: Catalog) {
    const url = getCatalogLink(catalog);
    const text = `¡Mira mi revista de productos! 🛍️\n\n*${catalog.name}*\n${catalog.product_ids.length} productos seleccionados\n\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ambassador/mis-revistas?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setCatalogs((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  function copyLink(catalog: Catalog) {
    navigator.clipboard.writeText(getCatalogLink(catalog));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Mis Revistas</h1>
          <p className="text-sm text-white/40 mt-0.5">Tus catálogos personalizados para compartir</p>
        </div>
        <a
          href="/revista"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black"
          style={{ backgroundColor: primaryColor }}
        >
          + Nueva
        </a>
      </div>

      {catalogs.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/5 mb-4">
            <LayoutList className="h-6 w-6 text-white/20" />
          </div>
          <p className="font-medium text-white/60">Aún no tienes revistas</p>
          <p className="text-sm text-white/30 mt-1 mb-5">Ve a Revista, selecciona productos y crea tu primera revista.</p>
          <a href="/revista" className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: primaryColor }}>
            Ir a Revista
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogs.map((catalog) => {
            const previewProducts = catalog.product_ids
              .slice(0, 4)
              .map((id) => productMap[id])
              .filter(Boolean);

            return (
              <div key={catalog.id} className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden group">
                {/* Preview grid */}
                <div className="aspect-[4/3] grid grid-cols-2 gap-0.5 bg-white/5">
                  {previewProducts.length > 0 ? (
                    previewProducts.map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={shopifyImageUrl(p.images?.[0]?.src ?? "", 300, 300)}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ))
                  ) : (
                    <div className="col-span-2 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-white/15" />
                    </div>
                  )}
                  {previewProducts.length < 4 &&
                    Array.from({ length: 4 - previewProducts.length }).map((_, i) => (
                      <div key={i} className="bg-white/3" />
                    ))}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-white text-sm line-clamp-1">{catalog.name}</p>
                    <button
                      onClick={() => setDeleteTarget(catalog)}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-white/30">{catalog.product_ids.length} productos</p>

                  <button
                    onClick={() => setShareTarget(catalog)}
                    className="mt-3 flex items-center gap-2 w-full justify-center py-2 rounded-xl text-xs font-semibold text-black transition-opacity hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Compartir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share modal */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShareTarget(null); setCopied(false); }} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <p className="font-semibold text-sm text-white">Compartir "{shareTarget.name}"</p>
              <button onClick={() => { setShareTarget(null); setCopied(false); }} className="p-1 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <a href={whatsappShare(shareTarget)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
                style={{ backgroundColor: "#25D366" }} onClick={() => setShareTarget(null)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
                Compartir por WhatsApp
              </a>
              <button onClick={() => copyLink(shareTarget)}
                className="flex items-center gap-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <ExternalLink className="h-4 w-4 text-white/30" />}
                {copied ? "¡Enlace copiado!" : "Copiar enlace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Eliminar revista</p>
                <p className="text-xs text-white/40">"{deleteTarget.name}"</p>
              </div>
            </div>
            <p className="text-sm text-white/50">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-sm text-white font-semibold disabled:opacity-50">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
