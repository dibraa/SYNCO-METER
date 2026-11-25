-- =========================================================================
-- Migration 002: Registered Email Check RPC for Forgot Password Validation
-- =========================================================================
-- Note: auth.users is not exposed to the Supabase Data API. This minimal
-- SECURITY DEFINER RPC returns ONLY a boolean (never user IDs or PII) so
-- the Forgot Password screen can tell the user when an email is not
-- registered before requesting a password reset email.

CREATE OR REPLACE FUNCTION public.check_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
      AND deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.check_email_registered(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_registered(TEXT) TO anon, authenticated;
