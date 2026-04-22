"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Palette,
  Zap,
  Users,
  BarChart3,
  ShoppingBag,
  Sparkles,
  Star,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const stats = [
  { value: "∞", label: "Embajadoras por tienda" },
  { value: "15%", label: "Comisión configurable" },
  { value: "100%", label: "Tu marca y dominio" },
  { value: "24/7", label: "Panel en tiempo real" },
];

const features = [
  {
    icon: Globe,
    title: "Tu subdominio propio",
    description:
      "Cada tienda obtiene su espacio en {tutienda}.nexusstore.com o dominio personalizado.",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Palette,
    title: "Branding dinámico",
    description:
      "Logo, colores y tipografías propias. Tus embajadoras ven tu marca, no la nuestra.",
    color: "text-pink-500 dark:text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Zap,
    title: "Listo en minutos",
    description:
      "Conecta tu tienda Shopify, configura comisiones y empieza a invitar embajadoras hoy.",
    color: "text-yellow-500 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Users,
    title: "Gestión de embajadoras",
    description:
      "Panel completo para ver, activar y administrar todas tus vendedoras en un solo lugar.",
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "Ventas y comisiones",
    description:
      "Registro automático de ventas, cálculo de comisiones y pagos. Todo trazable.",
    color: "text-green-500 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Revista digital Shopify",
    description:
      "Tus embajadoras comparten productos de tu tienda Shopify como revista interactiva.",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
];

const steps = [
  {
    step: "01",
    title: "Crea tu tienda",
    description:
      "Regístrate, elige el nombre de tu programa y en 2 minutos tienes tu panel listo.",
  },
  {
    step: "02",
    title: "Conecta Shopify",
    description:
      "Vincula tu tienda Shopify. Tus productos aparecen automáticamente en la revista digital.",
  },
  {
    step: "03",
    title: "Invita embajadoras",
    description:
      "Comparte el link de registro de tu programa. Ellas se registran y empiezan a vender.",
  },
];

const included = [
  "Ficha ID personal para cada embajadora",
  "Revista digital con tus productos Shopify",
  "Registro automático de ventas y comisiones",
  "Ranking de embajadoras del mes",
  "Asistente IA integrado",
  "Panel de administración completo",
  "Subdominio propio incluido",
  "Branding con tu logo y colores",
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileMenu(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[oklch(0.08_0_0)] text-neutral-900 dark:text-white transition-colors duration-300">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex-1">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                NexusStore
              </span>
            </div>

            <div className="hidden md:flex items-center gap-7">
              {["how-it-works", "features", "included"].map((id, i) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  {["Cómo funciona", "Funcionalidades", "Incluido"][i]}
                </button>
              ))}
            </div>

            <div className="flex-1 hidden md:flex items-center justify-end gap-4">
              <Link
                href="/login"
                className="text-sm text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-pink-500 hover:bg-pink-600 px-5 py-2 text-sm font-semibold text-white transition-colors shadow-lg shadow-pink-500/20"
              >
                Empezar gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-white/5">
            <div className="px-4 py-4 space-y-3">
              {["how-it-works", "features", "included"].map((id, i) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="block w-full text-left text-sm text-neutral-600 dark:text-neutral-300 py-2"
                >
                  {["Cómo funciona", "Funcionalidades", "Incluido"][i]}
                </button>
              ))}
              <Link href="/login" className="block text-sm text-neutral-600 dark:text-neutral-300 py-2">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white mt-2"
              >
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-pink-500/10 dark:bg-pink-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-pink-600 dark:text-pink-300">
              La plataforma de embajadoras para tu tienda Shopify
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
            Lanza tu programa de{" "}
            <span className="bg-gradient-to-r from-pink-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              embajadoras
            </span>{" "}
            con tu marca
          </h1>

          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            NexusStore te da todo lo que necesitas para gestionar embajadoras,
            comisiones y ventas — con tu logo, tus colores y tu dominio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-500 hover:bg-pink-600 px-8 py-3.5 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-pink-500/25"
            >
              Crear mi tienda gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 px-8 py-3.5 text-base font-medium text-neutral-700 dark:text-neutral-300 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Ver cómo funciona
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-neutral-50/50 dark:bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-300 mb-6">
              Cómo funciona
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tu programa listo en{" "}
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                3 simples pasos
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-neutral-200 dark:from-white/10 to-transparent" />
                )}
                <div className="rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8 text-center shadow-sm dark:shadow-none">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 mb-5">
                    <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 border-t border-neutral-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs font-medium text-pink-600 dark:text-pink-300 mb-6">
              Funcionalidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesitas para{" "}
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                escalar tus ventas
              </span>
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
              Herramientas diseñadas para que tus embajadoras vendan más fácil,
              con seguimiento completo de comisiones.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 hover:border-neutral-300 dark:hover:border-white/10 hover:shadow-md dark:hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} mb-4`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included */}
      <section id="included" className="py-20 sm:py-28 border-t border-neutral-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-600 dark:text-green-300 mb-6">
              Incluido
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Sin límites artificiales.{" "}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Todo desde el día uno.
              </span>
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              Cada tienda accede a todas las funcionalidades desde el primer día.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-14">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{item}</span>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px]" />
            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <Sparkles className="h-10 w-10 text-pink-500 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                ¿Listo para lanzar tu programa?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-8">
                Crea tu tienda gratis hoy. Sin tarjeta de crédito, sin
                compromisos. Tu programa de embajadoras en minutos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-pink-500 hover:bg-pink-600 px-8 py-3.5 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-pink-500/25"
                >
                  Crear mi tienda gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ThemeToggle />

      {/* Footer */}
      <footer className="border-t border-neutral-100 dark:border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              NexusStore
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-xs text-neutral-400 ml-2">Potenciado por IA</span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-600">
              © {new Date().getFullYear()} NexusStore · Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
