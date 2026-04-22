# NexusStore

> **SaaS multi-tenant de embajadoras para tiendas Shopify.** Cada tienda tiene su propio dashboard con branding personalizado, su API de Shopify, y su propio equipo de embajadoras independiente.

---

## Visión

Replicar la experiencia de **NINA-Embajadoras** como una plataforma genérica donde cualquier dueño de tienda Shopify pueda:

1. Registrar su tienda en NexusStore.
2. Configurar branding (logo, colores).
3. Conectar su Shopify (dominio + API).
4. Invitar/recibir embajadoras independientes.
5. Sus embajadoras crean revistas, comparten Ficha ID, registran ventas, reciben comisiones.

Cada tienda vive bajo su propio subdominio (`mitienda.nexusstore.com`) con su branding aplicado a todas las páginas (sidebar, ficha pública, revistas, etc.).

---

## Arquitectura multi-tenant

### Modelo: Single DB con `tenant_id`

Un solo proyecto de Supabase compartido. Cada tabla relevante tiene una columna `tenant_id` que apunta a `public.tenants`. Todas las queries filtran por `tenant_id`.

**Ventajas:**
- Costo controlado (un solo proyecto).
- Migraciones únicas.
- Backup centralizado.
- Fácil dashboard global del super-admin.

**Desventajas mitigadas con RLS:**
- Riesgo de leak entre tenants → **RLS estricta**: cada policy filtra por `tenant_id` derivado del subdomain.

### Detección del tenant (routing)

Middleware de Next.js (`middleware.ts`) lee el header `host`:

```
host = "mitienda.nexusstore.com"  →  subdomain = "mitienda"  →  tenantSlug = "mitienda"
host = "embajadoras.cliente.com"  →  custom_domain match     →  tenantSlug = "cliente"
host = "nexusstore.com" / "www.nexusstore.com"  →  landing público de NexusStore
host = "admin.nexusstore.com"     →  panel super-admin (gestión de tiendas)
```

El middleware inyecta el `tenant_id` resuelto en headers o cookies para que el resto de la app lo use al construir queries.

### Tres niveles de acceso

| Nivel | Quién | Dónde | Permisos |
|---|---|---|---|
| **Super-admin** (NexusStore) | Nosotros | `admin.nexusstore.com` | Crear/aprobar/suspender tiendas, ver métricas globales, gestionar billing |
| **Tenant-admin** (dueño de tienda) | El cliente Shopify | `mitienda.nexusstore.com/admin` | Configurar tienda (branding, Shopify API), gestionar sus embajadoras, ver ventas/pagos de su tienda |
| **Embajadora** | Vendedora del cliente | `mitienda.nexusstore.com` | Misma UX que en NINA-Embajadoras (revista, ficha ID, ventas, ranking, etc.) |

---

## Estructura de carpetas (Next.js App Router)

```
src/app/
├── (marketing)/                       # Landing público de NexusStore (host: nexusstore.com)
│   ├── page.tsx                       # Landing con planes y CTA "Registra tu tienda"
│   ├── precios/page.tsx
│   ├── caracteristicas/page.tsx
│   └── (auth)/
│       ├── register/page.tsx          # Registro de NUEVA TIENDA (tenant)
│       └── login/page.tsx             # Login de tenant-admin
│
├── (tenant)/                          # Dashboard por tienda (host: {slug}.nexusstore.com)
│   ├── layout.tsx                     # Layout que aplica branding del tenant
│   ├── page.tsx                       # Dashboard embajadora
│   ├── revista/page.tsx
│   ├── mis-revistas/page.tsx
│   ├── tus-portadas/page.tsx
│   ├── perfil/page.tsx
│   ├── mis-ventas/page.tsx
│   ├── ranking/page.tsx
│   ├── soporte/page.tsx
│   │
│   └── admin/                         # Tenant-admin (dueño de la tienda)
│       ├── page.tsx                   # Métricas de SU tienda
│       ├── configuracion/page.tsx     # Branding, Shopify API, custom domain
│       ├── ventas/page.tsx
│       ├── embajadoras/page.tsx       # SUS embajadoras
│       ├── pagos/page.tsx
│       ├── ranking/page.tsx
│       └── portadas/page.tsx
│
├── (super-admin)/                     # Panel global (host: admin.nexusstore.com)
│   ├── layout.tsx
│   ├── page.tsx                       # Lista de tiendas + métricas globales
│   ├── tiendas/[id]/page.tsx          # Detalle/gestión de una tienda
│   ├── billing/page.tsx               # (futuro) Suscripciones
│   └── login/page.tsx
│
├── card/[code]/page.tsx               # Ficha ID pública (con branding del tenant)
├── ver/page.tsx                       # Revista pública
├── r/[code]/route.ts                  # Redirect tracking
│
├── api/                               # API routes
│   ├── tenant/                        # Endpoints específicos del tenant
│   │   ├── ensure-profile/
│   │   ├── my-profile/
│   │   ├── save-card-style/
│   │   ├── public-card/[code]/
│   │   ├── chat/                      # Chatbot (Groq)
│   │   ├── shopify-webhook/
│   │   ├── sales/
│   │   ├── seller-by-ref/[code]/
│   │   └── portadas/
│   ├── tenant-admin/                  # Endpoints del tenant-admin
│   │   ├── settings/                  # Branding, Shopify config
│   │   ├── verify-shopify/            # Test de la API key del tenant
│   │   └── invite-ambassador/
│   ├── super-admin/
│   │   ├── tenants/                   # CRUD de tiendas
│   │   ├── suspend-tenant/[id]/
│   │   └── stats/
│   ├── auth/
│   │   ├── callback/
│   │   └── tenant-register/
│   └── billing/                       # (comentado por ahora)
│       ├── checkout/                  # Stripe o Wompi
│       └── webhook/
│
└── middleware.ts                      # Resolución de tenant por host
```

---

## Schema de base de datos

```sql
-- ────────────────────────────────────────────────────────────
-- TIENDAS (TENANTS)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,           -- "mitienda" → mitienda.nexusstore.com
  custom_domain         TEXT UNIQUE,                    -- "embajadoras.mitienda.com" (opcional)
  store_name            TEXT NOT NULL,
  owner_user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','suspended','cancelled')),
  -- Branding
  logo_url              TEXT,
  primary_color         TEXT DEFAULT '#EC4899',         -- hex
  accent_color          TEXT DEFAULT '#A855F7',
  -- Shopify
  shopify_store_domain  TEXT,                           -- "mitienda.myshopify.com"
  shopify_access_token  TEXT,                           -- ENCRIPTADO via pgsodium
  shopify_verified      BOOLEAN DEFAULT false,
  -- WhatsApp / contacto
  contact_whatsapp      TEXT,
  contact_email         TEXT,
  -- Comisiones
  commission_rate       NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  -- Billing (comentado por ahora pero estructura lista)
  plan                  TEXT DEFAULT 'free'
                        CHECK (plan IN ('free','starter','pro','enterprise')),
  billing_provider      TEXT,                           -- 'stripe' | 'wompi'
  billing_customer_id   TEXT,
  trial_ends_at         TIMESTAMPTZ,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- USUARIOS DE LA PLATAFORMA
-- ────────────────────────────────────────────────────────────
-- Cada usuario en auth.users puede ser:
--   - super-admin (NexusStore) → en public.platform_admins
--   - tenant-admin (dueño)     → en public.tenants.owner_user_id
--   - embajadora               → en public.profiles con tenant_id

CREATE TABLE public.platform_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- PERFILES (EMBAJADORAS) — siempre con tenant_id
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name       TEXT,
  phone           TEXT,
  city            TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  referral_code   TEXT NOT NULL,
  bank_name       TEXT,
  account_type    TEXT,
  account_number  TEXT,
  document_type   TEXT,
  document_number TEXT,
  card_style      JSONB,
  card_catalog_id UUID,
  whatsapp_url    TEXT,
  show_whatsapp   BOOLEAN DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, referral_code)
);

CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_referral ON public.profiles(tenant_id, referral_code);

-- ────────────────────────────────────────────────────────────
-- VENTAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL,
  commission_amt  NUMERIC(12,2) GENERATED ALWAYS AS (amount * commission_rate) STORED,
  customer_name   TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','paid')),
  referral_code   TEXT,
  shopify_order_id TEXT,
  sale_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sales_seller ON public.sales(seller_id);

-- ────────────────────────────────────────────────────────────
-- REVISTAS PERSONALIZADAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.custom_catalogs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  product_ids JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogs_tenant ON public.custom_catalogs(tenant_id);

-- ────────────────────────────────────────────────────────────
-- COMISIONES
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.commission_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period      TEXT NOT NULL,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_comm  NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_count  INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, seller_id, period)
);

-- ────────────────────────────────────────────────────────────
-- TICKETS DE SOPORTE (cada tienda puede contactar a NexusStore)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- RLS — todas las tablas filtran por tenant_id derivado del JWT
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Las API routes críticas usarán SERVICE_ROLE para bypassear RLS
-- (igual que en nina-referidos), validando tenant_id manualmente.
```

### Storage (buckets)

| Bucket | Carpeta | Uso |
|---|---|---|
| `tenant-assets` | `{tenant_id}/logo.png` | Logo de la tienda |
| `avatars` | `{tenant_id}/{user_id}/avatar.jpg` | Fotos de embajadoras |
| `portadas` | `{tenant_id}/oficial/*.png` | Portadas oficiales por tienda |

---

## Stack

- **Next.js 16** (Turbopack, App Router) + TypeScript
- **Tailwind CSS 4** con CSS variables dinámicas para branding (`--primary`, `--accent`)
- **Shadcn/ui** para componentes
- **Supabase** auth + DB + storage
- **Shopify Admin API** (per-tenant, token guardado encriptado)
- **Groq SDK** chatbot
- **Resend** emails
- **Stripe / Wompi** billing (estructura lista, integración comentada)

---

## Branding dinámico

Cada tenant tiene `primary_color`, `accent_color` y `logo_url`. El layout del tenant inyecta CSS vars en runtime:

```tsx
<html style={{ "--primary": tenant.primary_color, "--accent": tenant.accent_color }}>
```

Tailwind se configura para usar estas vars: `bg-primary` → `background: var(--primary)`. Esto reemplaza el rosa de NINA por el color que cada tienda elija sin recompilar.

---

## Variables de entorno

```env
# Supabase (proyecto único compartido)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# NexusStore branding (no de tiendas, de la plataforma)
NEXT_PUBLIC_APP_URL=https://nexusstore.com
NEXT_PUBLIC_ROOT_DOMAIN=nexusstore.com

# Chatbot
GROQ_API_KEY=...

# Emails
RESEND_API_KEY=...

# Encriptación de Shopify tokens
ENCRYPTION_KEY=...

# Billing (comentado por ahora)
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
# WOMPI_PUBLIC_KEY=...
# WOMPI_PRIVATE_KEY=...
```

---

## Roadmap por fases

### Fase 1 — Fundación (semanas 1-2)
- [ ] Setup Next.js 16 + Tailwind 4 + Shadcn
- [ ] Schema de DB con `tenants` + `tenant_id` en todas las tablas
- [ ] Middleware de resolución de tenant por subdomain
- [ ] Landing público de NexusStore (`nexusstore.com`)
- [ ] Registro/login de tenant-admin

### Fase 2 — Tenant-admin (semanas 3-4)
- [ ] Dashboard del tenant-admin
- [ ] Configuración de tienda: logo, colores, Shopify API
- [ ] Verificación de Shopify API (test endpoint)
- [ ] Tutoriales embebidos (videos guía)

### Fase 3 — Portar funcionalidad NINA (semanas 5-7)
- [ ] Migrar todas las páginas de embajadora con branding dinámico
- [ ] Ficha ID pública con tenant branding
- [ ] Revista pública con tenant branding
- [ ] Webhook Shopify per-tenant

### Fase 4 — Super-admin (semana 8)
- [ ] Panel `admin.nexusstore.com`
- [ ] Lista de tiendas, suspender/activar
- [ ] Métricas globales

### Fase 5 — Custom domains (semana 9)
- [ ] Vercel domains API integration
- [ ] Validación de CNAME
- [ ] SSL automático

### Fase 6 — Billing (cuando se decida proveedor)
- [ ] Integración Stripe o Wompi
- [ ] Planes y suscripciones
- [ ] Trial de 14 días

---

## Decisiones pendientes

1. **Proveedor de billing**: Stripe (global, tarjeta) vs Wompi (Colombia, PSE/tarjeta).
2. **Custom domain UX**: cómo guiamos al usuario a configurar su CNAME.
3. **Onboarding wizard**: pasos exactos del wizard inicial al crear tienda.
4. **Limitaciones por plan**: qué funcionalidades reservamos para planes pagos (¿límite de embajadoras? ¿límite de revistas? ¿branding avanzado?).
