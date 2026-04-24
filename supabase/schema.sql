-- ─────────────────────────────────────────────────────────────────────────────
-- OpenMag — Schema v1 (Fase 1)
-- Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Tenants (tiendas)
CREATE TABLE public.tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  primary_color  TEXT NOT NULL DEFAULT '#6366f1',
  accent_color   TEXT NOT NULL DEFAULT '#a5b4fc',
  logo_url       TEXT,
  shopify_domain TEXT,
  shopify_token  TEXT,  -- encriptado con ENCRYPTION_KEY
  custom_domain  TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuarios por tenant (admins y embajadoras)
CREATE TABLE public.tenant_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'ambassador' CHECK (role IN ('admin', 'ambassador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Perfiles de embajadoras (por tenant)
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name       TEXT,
  phone           TEXT,
  city            TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  referral_code   TEXT,
  bank_name       TEXT,
  account_type    TEXT,
  account_number  TEXT,
  document_type   TEXT,
  document_number TEXT,
  card_style      JSONB,
  whatsapp_url    TEXT,
  show_whatsapp   BOOLEAN DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, referral_code)
);

-- Ventas
CREATE TABLE public.sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  commission_amt  NUMERIC(12,2) GENERATED ALWAYS AS (amount * commission_rate) STORED,
  customer_name   TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid')),
  referral_code   TEXT,
  sale_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catálogos personalizados (revistas)
CREATE TABLE public.custom_catalogs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  product_ids JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resumen de comisiones por período
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

-- Portadas oficiales por tenant
CREATE TABLE public.covers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  label      TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covers ENABLE ROW LEVEL SECURITY;

-- tenant_users: cada usuario ve sus propios registros
CREATE POLICY "own_tenant_memberships" ON public.tenant_users
  USING (auth.uid() = user_id);

-- tenants: el owner ve su tenant
CREATE POLICY "owner_sees_tenant" ON public.tenants
  USING (auth.uid() = owner_id);

-- profiles: cada embajadora ve y edita su propio perfil
CREATE POLICY "own_profile" ON public.profiles
  USING (auth.uid() = id);

-- sales: cada embajadora ve sus ventas
CREATE POLICY "own_sales" ON public.sales
  USING (auth.uid() = seller_id);

-- custom_catalogs: cada embajadora ve sus catálogos
CREATE POLICY "own_catalogs" ON public.custom_catalogs
  USING (auth.uid() = seller_id);

-- commission_summaries: lectura pública (ranking)
CREATE POLICY "public_read_summaries" ON public.commission_summaries
  FOR SELECT USING (true);

-- covers: lectura pública
CREATE POLICY "public_read_covers" ON public.covers
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Índices
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_referral ON public.profiles(tenant_id, referral_code);
CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sales_seller ON public.sales(seller_id);
CREATE INDEX idx_covers_tenant ON public.covers(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage buckets (ejecutar en Supabase Dashboard → Storage)
-- ─────────────────────────────────────────────────────────────────────────────
-- Crear bucket: "tenant-assets" (público)
--   Estructura: {tenant_id}/logos/, {tenant_id}/avatars/, {tenant_id}/portadas/
