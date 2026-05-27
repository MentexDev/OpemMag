"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  ShoppingBag,
  Check,
  BookOpen,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  title: string;
  handle: string;
  product_type?: string;
  images: { src: string }[];
  variants: { price: string }[];
}

export default function RevistaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopifyConfigured, setShopifyConfigured] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/revista")
      .then(r => r.json())
      .then(d => {
        setProducts(d.products ?? []);
        setShopifyConfigured(d.shopifyConfigured !== false);
        setSelected(new Set((d.selected ?? []) as string[]));
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const types = products.map(p => p.product_type?.trim()).filter(Boolean) as string[];
    return ["Todos", ...Array.from(new Set(types))];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === "Todos" || p.product_type?.trim() === activeCategory;
      const q = search.toLowerCase();
      return matchCat && (!q || p.title.toLowerCase().includes(q));
    });
  }, [products, activeCategory, search]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  function selectAll() {
    setSelected(new Set(filtered.map(p => String(p.id))));
    setSaved(false);
  }

  function deselectAll() {
    setSelected(prev => {
      const next = new Set(prev);
      filtered.forEach(p => next.delete(String(p.id)));
      return next;
    });
    setSaved(false);
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(String(p.id)));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/revista", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: Array.from(selected) }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Mi Revista</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Elige qué productos pueden ver tus embajadoras. Si no seleccionas ninguno se muestran todos.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex-shrink-0"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? "Guardado" : "Guardar selección"}
        </Button>
      </div>

      {/* Not configured */}
      {!loading && !shopifyConfigured && (
        <div className="py-24 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Tienda no conectada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Conecta tu tienda Shopify en Configuración para gestionar tu revista.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-24 flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando productos…</p>
        </div>
      )}

      {!loading && shopifyConfigured && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={allFilteredSelected ? deselectAll : selectAll}
              className="flex-shrink-0"
            >
              {allFilteredSelected ? "Deseleccionar vista" : "Seleccionar vista"}
            </Button>
          </div>

          {/* Category pills */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Count */}
          <p className="text-xs text-muted-foreground">
            {selected.size} de {products.length} producto{products.length !== 1 ? "s" : ""} seleccionados
            {selected.size === 0 && " · Se mostrarán todos"}
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Sin productos{search ? ` para "${search}"` : ""}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(p => {
                const id = String(p.id);
                const isSelected = selected.has(id);
                const img = p.images?.[0]?.src;
                const price = p.variants?.[0]?.price;

                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(id)}
                    className={cn(
                      "group relative rounded-2xl overflow-hidden border text-left transition-all duration-200",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-md"
                        : "border-border hover:border-primary/50 hover:shadow-sm opacity-60 hover:opacity-100"
                    )}
                  >
                    {/* Image */}
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
                          <ShoppingBag className="h-7 w-7 text-muted-foreground opacity-30" />
                        </div>
                      )}
                    </div>

                    {/* Checkmark badge */}
                    <div className={cn(
                      "absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-white/80 dark:bg-black/50 border"
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-xs font-medium line-clamp-2 leading-snug">{p.title}</p>
                      {price && (
                        <p className="text-xs font-bold text-primary">
                          ${Number(price).toLocaleString("es-CO")}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sticky save hint */}
          {!saved && selected.size > 0 && (
            <div className="sticky bottom-4 flex justify-center pointer-events-none">
              <div className="pointer-events-auto bg-background border rounded-full shadow-lg px-5 py-2.5 flex items-center gap-3 text-sm">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cambios sin guardar</span>
                <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full h-7 px-3 text-xs">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
