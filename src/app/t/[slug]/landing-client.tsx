"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { shopifyImageUrl } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";
import {
  ShoppingBag, TrendingUp, Users, DollarSign, BarChart3, BookOpen,
  ArrowRight, Star, CheckCircle, Sparkles, Trophy, Share2, Menu, X,
} from "lucide-react";

interface Tenant {
  name: string;
  slug: string;
  primary_color: string;
  logo_url: string | null;
}

interface Props {
  tenant: Tenant;
  ambassadorCount: number;
}

function hex(color: string) { return color || "#ec4899"; }

/* ─── Product Carousel ─── */
function ProductCarousel({ products, primary }: { products: ShopifyProduct[]; primary: string }) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  const items = products.slice(0, 5).map((p) => ({
    img: p.images?.[0]?.src ? shopifyImageUrl(p.images[0].src, 480, 640) : "",
    name: p.title,
    ref: p.product_type ?? "Nueva colección",
  }));

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setCurrent((prev) => (prev + 1) % items.length); setFade(true); }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return <div className="relative w-full max-w-[320px] sm:max-w-sm mx-auto aspect-[3/4] rounded-3xl bg-neutral-900 animate-pulse" />;
  }

  const product = items[current];
  const ghost1 = items[(current + 1) % items.length];
  const ghost2 = items[(current + 2) % items.length];

  return (
    <div className="relative w-full max-w-[320px] sm:max-w-sm mx-auto sm:pl-14">
      <div className="absolute -inset-6 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primary }} />

      <div className="hidden sm:block absolute inset-y-[7%] left-0 right-[24%] rounded-2xl overflow-hidden opacity-25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {ghost2.img && <img src={ghost2.img} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-neutral-950/50" />
      </div>
      <div className="hidden sm:block absolute inset-y-[3.5%] left-[9%] right-[13%] rounded-2xl overflow-hidden opacity-45">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {ghost1.img && <img src={ghost1.img} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-neutral-950/30" />
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/60 aspect-[3/4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {product.img && (
          <img src={product.img} alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className={`absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: primary + "cc" }}>Nueva colección</p>
          <p className="text-white font-semibold text-sm">{product.name}</p>
          <p className="text-neutral-400 text-xs mt-0.5">{product.ref}</p>
        </div>
        <div className="absolute top-4 right-4 flex gap-1.5">
          {items.map((_, i) => (
            <button key={i}
              onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 400); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/30"}`} />
          ))}
        </div>
      </div>

      <div className="hidden sm:block absolute -right-4 top-1/2 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur px-4 py-3 shadow-xl">
        <p className="text-[10px] text-neutral-400">Moda de calidad</p>
        <p className="text-xl font-bold text-green-400">100%</p>
      </div>
      <div className="hidden sm:block absolute left-2 bottom-1/4 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur px-4 py-3 shadow-xl">
        <p className="text-[10px] text-neutral-400">Revista digital</p>
        <p className="text-sm font-bold text-white">Siempre activo</p>
      </div>
    </div>
  );
}

/* ─── Main Landing ─── */
export default function TenantLandingClient({ tenant, ambassadorCount }: Props) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const primary = hex(tenant.primary_color);

  useEffect(() => {
    fetch(`/api/t/${tenant.slug}/products?limit=6`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {});
  }, [tenant.slug]);
  const name = tenant.name;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  }

  const features = [
    { icon: BookOpen, title: "Revista digital", description: `Comparte el catálogo completo de ${name} con tus clientes. Siempre actualizado con los últimos productos.`, color: "text-pink-400", bg: "bg-pink-500/10" },
    { icon: DollarSign, title: "Comisiones automáticas", description: "Gana comisiones por cada venta. El sistema calcula y registra todo automáticamente.", color: "text-green-400", bg: "bg-green-500/10" },
    { icon: BarChart3, title: "Dashboard en tiempo real", description: "Visualiza tus ventas, comisiones y ranking al instante. Todo en un solo lugar.", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: Trophy, title: "Ranking competitivo", description: "Compite con otras embajadoras y escala posiciones. Las mejores obtienen reconocimientos.", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { icon: Share2, title: "Tu Ficha ID digital", description: `Tu ficha como embajadora ${name}. Compártela como un Linktree en tus redes.`, color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: ShoppingBag, title: "Revista interactiva", description: "Explora los productos en formato revista y compártelos directamente por WhatsApp.", color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  const steps = [
    { step: "01", title: "Regístrate gratis", description: "Crea tu cuenta en menos de 1 minuto. Solo necesitas tu nombre, teléfono y correo." },
    { step: "02", title: "Comparte la revista", description: "Usa tu enlace personalizado para compartir los productos con tus clientes por redes sociales." },
    { step: "03", title: "Gana comisiones", description: "Por cada venta que generes, recibes tu comisión directamente en tu cuenta bancaria." },
  ];

  const testimonials = [
    { name: "Daniela M.", city: "Bogotá", text: "En mi primer mes gané más de $200.000 en comisiones. La plataforma es super fácil de usar.", rating: 5 },
    { name: "Camila R.", city: "Medellín", text: "Me encanta poder ver mis ventas en tiempo real y compartir la revista por WhatsApp. ¡Muy práctico!", rating: 5 },
    { name: "Laura P.", city: "Cali", text: "El ranking me motiva a crecer cada mes. Las comisiones son geniales y todo es muy transparente.", rating: 5 },
  ];

  const stats = [
    { value: ambassadorCount > 0 ? `${ambassadorCount}+` : "10+", label: "Embajadoras activas" },
    { value: "100%", label: "Gratis para unirse" },
    { value: products.length > 0 ? `${products.length}+` : "50+", label: "Productos disponibles" },
    { value: "24/7", label: "Acceso a tu panel" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-neutral-950/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex-1 flex items-center gap-3">
              {tenant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logo_url} alt={name} className="h-8 w-auto object-contain" />
              ) : (
                <>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: primary }}>
                    {name[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-white">{name}</span>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-7">
              {[["how-it-works", "Cómo funciona"], ["top-products", "Productos"], ["features", "Herramienta"], ["testimonials", "Testimonios"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-sm text-neutral-400 hover:text-white transition-colors">{label}</button>
              ))}
            </div>

            <div className="flex-1 hidden md:flex items-center justify-end gap-4">
              <Link href="/login" className="text-sm text-neutral-300 hover:text-white transition-colors">Iniciar sesión</Link>
              <Link href="/register"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: primary }}>
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button className="md:hidden p-2 text-neutral-400 hover:text-white" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-neutral-950/95 backdrop-blur-xl border-t border-white/5">
            <div className="px-4 py-4 space-y-3">
              {[["how-it-works", "Cómo funciona"], ["top-products", "Productos"], ["features", "Herramienta"], ["testimonials", "Testimonios"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-neutral-300 py-2">{label}</button>
              ))}
              <Link href="/login" className="block text-sm text-neutral-300 py-2">Iniciar sesión</Link>
              <Link href="/register" className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white mt-2"
                style={{ backgroundColor: primary }}>
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ backgroundColor: primary }} />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-8"
                style={{ borderColor: primary + "50", backgroundColor: primary + "18" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-medium" style={{ color: primary }}>
                  Plataforma activa — Únete como embajadora
                </span>
              </div>

              <h1 className="text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15] mb-6">
                Comparte moda{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${primary}, #a855f7)` }}>
                  y gana comisiones
                </span>{" "}
                con {name}
              </h1>

              <p className="text-lg text-neutral-400 mb-10 leading-relaxed">
                La plataforma que te permite compartir la revista de moda {name}, registrar ventas y ganar comisiones — todo desde tu celular.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ backgroundColor: primary, boxShadow: `0 0 0 0 ${primary}` }}>
                  Únete gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <button onClick={() => scrollTo("how-it-works")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-medium text-neutral-300 transition-all">
                  <Sparkles className="h-4 w-4" /> Ver cómo funciona
                </button>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <ProductCarousel products={products} primary={primary} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(to right, ${primary}, #a855f7)` }}>
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300 mb-6">
              Cómo funciona
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Empieza a ganar en{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, #a855f7, ${primary})` }}>
                3 simples pasos
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border mb-5"
                    style={{ backgroundColor: primary + "20", borderColor: primary + "30" }}>
                    <span className="text-xl font-bold bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(to right, ${primary}, #a855f7)` }}>
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top products */}
      <section id="top-products" className="py-20 sm:py-28 border-t border-white/5 relative overflow-hidden">
        {products[3] && <div className="hidden lg:block absolute -left-6 top-[20%] w-28 h-40 rounded-2xl overflow-hidden rotate-[-7deg] opacity-20 border border-white/10 shadow-2xl pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shopifyImageUrl(products[3].images?.[0]?.src ?? "", 112, 160)} alt="" className="w-full h-full object-cover" />
        </div>}
        {products[1] && <div className="hidden lg:block absolute -right-6 top-[15%] w-24 h-36 rounded-2xl overflow-hidden rotate-[8deg] opacity-15 border border-white/10 shadow-2xl pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shopifyImageUrl(products[1].images?.[0]?.src ?? "", 96, 144)} alt="" className="w-full h-full object-cover" />
        </div>}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-5" style={{ backgroundColor: primary }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6"
              style={{ borderColor: primary + "50", backgroundColor: primary + "18", color: primary }}>
              <TrendingUp className="h-3 w-3" /> Lo más vendido
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Productos que{" "}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, ${primary}, #a855f7)` }}>
                se venden solos
              </span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
              Los favoritos de nuestras embajadoras. Compártelos con tus clientes y genera comisiones fácilmente.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] sm:auto-rows-[230px] md:auto-rows-[220px] gap-3 sm:gap-4">
            {products.length === 0 && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`${i === 0 ? "col-span-2 row-span-2" : ""} rounded-2xl bg-neutral-900 animate-pulse`} />
            ))}

            {products[0] && (
              <div className="col-span-2 row-span-2 relative rounded-3xl overflow-hidden group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shopifyImageUrl(products[0].images?.[0]?.src ?? "", 600, 800)} alt={products[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 shadow-lg" style={{ backgroundColor: primary }}>
                  <TrendingUp className="h-3 w-3 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wide">Más vendido</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: primary + "cc" }}>{name}</p>
                  <p className="text-white font-bold text-lg sm:text-xl leading-tight">{products[0].title}</p>
                  <p className="text-neutral-400 text-xs mt-1">{products[0].product_type ?? "Nueva colección"}</p>
                </div>
              </div>
            )}

            {products.slice(1, 5).map((p, i) => (
              <div key={p.id} className="relative rounded-2xl overflow-hidden group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.images?.[0]?.src && <img src={shopifyImageUrl(p.images[0].src, 300, 300)} alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {i === 0 && (
                  <div className="absolute top-3 left-3 rounded-full bg-purple-500/80 px-2.5 py-0.5">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wide">Top 2</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold leading-tight line-clamp-1">{p.title}</p>
                  <p className="text-neutral-400 text-[10px] mt-0.5">{p.product_type ?? "Nueva colección"}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/ver?all=true" target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-7 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-all">
              <BookOpen className="h-4 w-4" /> Ver revista completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border px-4 py-1.5 text-xs font-medium mb-6"
              style={{ borderColor: primary + "50", backgroundColor: primary + "18", color: primary }}>
              Herramienta
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesitas para{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${primary}, #a855f7)` }}>
                ganar más
              </span>
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Herramientas diseñadas para que compartas más fácil, rápido y con seguimiento completo de tus comisiones.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-300 mb-6">
              Testimonios
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Lo que dicen nuestras{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">embajadoras</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Daniela M.", city: "Bogotá", text: "En mi primer mes gané más de $200.000 en comisiones. La plataforma es super fácil de usar.", rating: 5 },
              { name: "Camila R.", city: "Medellín", text: "Me encanta poder ver mis ventas en tiempo real y compartir la revista por WhatsApp. ¡Muy práctico!", rating: 5 },
              { name: "Laura P.", city: "Cali", text: "El ranking me motiva a crecer cada mes. Las comisiones son geniales y todo es muy transparente.", rating: 5 },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: primary + "30", color: primary }}>
                    {t.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(135deg, ${primary}55, transparent)` }} />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ backgroundColor: primary }} />
            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-6" style={{ color: primary }} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Lista para empezar a ganar?</h2>
              <p className="text-neutral-400 max-w-xl mx-auto mb-8">
                Únete a la comunidad de embajadoras {name} y empieza a generar ingresos desde hoy. Sin inversión, sin riesgo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ backgroundColor: primary }}>
                  Crear mi cuenta gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logo_url} alt={name} className="h-7 w-auto object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>
                  {name[0]}
                </div>
              )}
              <span className="text-xs text-neutral-600">Plataforma de Embajadoras</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-xs text-neutral-500 hover:text-white transition-colors">Iniciar sesión</Link>
              <span className="text-neutral-700">·</span>
              <Link href="/register" className="text-xs transition-colors hover:opacity-80" style={{ color: primary }}>Registrarse</Link>
            </div>
            <p className="text-xs text-neutral-600">© {new Date().getFullYear()} {name} · Powered by OpenMag</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
