-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: comisión individual por embajadora + borrado lógico
-- Ejecutar en Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- commission_rate en tenant_users: NULL = usa el default del tenant
ALTER TABLE public.tenant_users
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2);
