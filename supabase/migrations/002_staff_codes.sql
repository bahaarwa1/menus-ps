-- =============================================
-- Migration 002: Staff Access Codes (6-digit)
-- =============================================
-- Generates time-limited 6-digit access codes
-- for staff/kitchen workers without email accounts.

CREATE TABLE IF NOT EXISTS public.staff_access_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  code          CHAR(6) NOT NULL,
  employee_name TEXT NOT NULL DEFAULT 'موظف',
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'kitchen', 'branch_manager')),
  created_by    UUID REFERENCES public.staff_users(id) ON DELETE SET NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  is_used       BOOLEAN NOT NULL DEFAULT FALSE,
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: code must be unique per branch at any point in time
CREATE UNIQUE INDEX IF NOT EXISTS staff_access_codes_branch_code_active_idx
  ON public.staff_access_codes (branch_id, code)
  WHERE is_used = FALSE AND expires_at > NOW();

-- Index for quick lookup by code
CREATE INDEX IF NOT EXISTS staff_access_codes_code_idx ON public.staff_access_codes (code);
CREATE INDEX IF NOT EXISTS staff_access_codes_branch_idx ON public.staff_access_codes (branch_id);
CREATE INDEX IF NOT EXISTS staff_access_codes_expires_idx ON public.staff_access_codes (expires_at);

-- RLS
ALTER TABLE public.staff_access_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes using service key)
CREATE POLICY "service_role_all" ON public.staff_access_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Cleanup old expired codes automatically (called via cron or on insert)
CREATE OR REPLACE FUNCTION public.cleanup_expired_staff_codes()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.staff_access_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;
