-- Migration: add nullable `mode` + `company_id` columns to scores and losses.
-- Idempotent: re-runnable safely. Existing rows stay NULL (legacy = treated as QUICK / no company).
-- Run via Supabase SQL editor (project djpliigclofvtfbzhkge).

ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS mode       text,
  ADD COLUMN IF NOT EXISTS company_id text;

ALTER TABLE public.losses
  ADD COLUMN IF NOT EXISTS mode       text,
  ADD COLUMN IF NOT EXISTS company_id text;

-- Constrain mode values. Drop + re-add so re-runs don't error.
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_mode_check;
ALTER TABLE public.losses DROP CONSTRAINT IF EXISTS losses_mode_check;

ALTER TABLE public.scores
  ADD CONSTRAINT scores_mode_check CHECK (mode IS NULL OR mode IN ('QUICK','CAMPAIGN'));
ALTER TABLE public.losses
  ADD CONSTRAINT losses_mode_check CHECK (mode IS NULL OR mode IN ('QUICK','CAMPAIGN'));

-- Constrain company_id values.
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_company_id_check;
ALTER TABLE public.losses DROP CONSTRAINT IF EXISTS losses_company_id_check;

ALTER TABLE public.scores
  ADD CONSTRAINT scores_company_id_check
  CHECK (company_id IS NULL OR company_id IN ('DEEPCORE','RECLAIM','IRONVEIL','FREEPORT'));
ALTER TABLE public.losses
  ADD CONSTRAINT losses_company_id_check
  CHECK (company_id IS NULL OR company_id IN ('DEEPCORE','RECLAIM','IRONVEIL','FREEPORT'));

-- Indexes for the leaderboard filters that already exist in client code.
CREATE INDEX IF NOT EXISTS scores_mode_created_at_idx ON public.scores (mode, created_at DESC);
CREATE INDEX IF NOT EXISTS losses_mode_created_at_idx ON public.losses (mode, created_at DESC);
CREATE INDEX IF NOT EXISTS scores_company_id_idx      ON public.scores (company_id);
CREATE INDEX IF NOT EXISTS losses_company_id_idx      ON public.losses (company_id);

-- Verification queries (run after migration; expect both columns + 4 indexes per table).
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema='public' AND table_name IN ('scores','losses')
--     AND column_name IN ('mode','company_id');
--
--   SELECT indexname FROM pg_indexes
--   WHERE schemaname='public' AND tablename IN ('scores','losses');
