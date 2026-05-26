-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: porcentaje de comisión configurable por tenant
-- Ejecutar en Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Columna en tenants: porcentaje de comisión (ej. 15.00 = 15%)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00;
