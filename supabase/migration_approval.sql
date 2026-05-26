-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: aprobación de embajadoras
-- Ejecutar en Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columna en tenants: ¿requiere aprobación manual?
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT false;

-- 2. Columna en tenant_users: estado de la solicitud
ALTER TABLE public.tenant_users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3. Índice para buscar rápido los pendientes por tenant
CREATE INDEX IF NOT EXISTS idx_tenant_users_status
  ON public.tenant_users(tenant_id, status);
