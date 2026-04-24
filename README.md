# OpenMag

SaaS multi-tenant que permite a cualquier dueño de tienda Shopify ofrecer un programa de embajadoras (afiliadas) con su propia marca, dominio y branding.

> Inspirado en NINA-Embajadoras, generalizado para servir a cualquier tienda.

---

## Arquitectura en 30 segundos

- **Un solo proyecto** Next.js 16 + Supabase, multi-tenant via `tenant_id`.
- **Routing por host**: `openmag.co` = landing, `{slug}.openmag.co` = dashboard de la tienda, `admin.openmag.co` = super-admin.
- **3 niveles de usuario**: super-admin (OpenMag), tenant-admin (dueño de tienda), embajadora.
- **Branding dinámico**: cada tienda elige logo + colores, aplicado vía CSS variables.
- **Shopify per-tenant**: cada tienda guarda su propio dominio + access token (encriptado).

---

## Documentación

- **[PROJECT.md](./PROJECT.md)** — arquitectura completa, schema DB, roadmap por fases.

---

## Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Shadcn/ui · Supabase · Shopify Admin API · Groq · Resend · (Stripe/Wompi pendiente)

---

## Empezar a trabajar

```bash
cd openmag
npm install
cp .env.example .env.local   # configurar variables
npm run dev
```

Más detalles en [PROJECT.md](./PROJECT.md).
