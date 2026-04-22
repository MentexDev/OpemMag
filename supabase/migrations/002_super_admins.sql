-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002 — Super admins (Fase 4)
-- Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.super_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Cada super-admin se ve a sí mismo (resto via service_role)
CREATE POLICY "self_select_super_admins" ON public.super_admins
  FOR SELECT USING (auth.uid() = user_id);
