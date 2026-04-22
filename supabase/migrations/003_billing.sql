-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003 — Billing (Fase 6)
-- Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN stripe_customer_id     TEXT,
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN subscription_status    TEXT NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing','active','past_due','canceled','incomplete','unpaid','paused')),
  ADD COLUMN trial_ends_at          TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  ADD COLUMN current_period_end     TIMESTAMPTZ,
  ADD COLUMN cancel_at_period_end   BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_tenants_stripe_customer ON public.tenants(stripe_customer_id);
CREATE INDEX idx_tenants_stripe_subscription ON public.tenants(stripe_subscription_id);

-- Tabla de eventos de billing (auditoría / debug)
CREATE TABLE public.billing_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
-- Solo via service_role
