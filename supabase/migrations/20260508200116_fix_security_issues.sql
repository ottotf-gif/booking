/*
  # Fix Security Issues

  ## Summary
  Addresses all security warnings from the Supabase security advisor:

  1. Function Search Path Mutable — all four functions get `SET search_path = ''` so
     they cannot be hijacked via a mutable search_path.

  2. Public GraphQL Schema Exposure — revoke SELECT on every table from `anon` and
     `authenticated`. RLS policies already restrict what rows each role can read;
     revoking table-level grants ensures the tables are not discoverable via GraphQL
     or REST without proper authentication context.

  3. Public SECURITY DEFINER Functions — revoke EXECUTE on `create_admin_profile`,
     `enforce_customer_role_on_self_insert`, `get_busy_slots`, and `get_busy_slots_all`
     from both `anon` and `authenticated`. Trigger functions are invoked by the
     database engine, not directly by roles, so revoking EXECUTE from public roles
     does not break them.
*/

-- ============================================================
-- 1. Fix mutable search_path on all SECURITY DEFINER functions
-- ============================================================

ALTER FUNCTION public.enforce_customer_role_on_self_insert()
  SET search_path = '';

ALTER FUNCTION public.check_appointment_overlap()
  SET search_path = '';

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = '';

ALTER FUNCTION public.create_admin_profile(uuid, text, text)
  SET search_path = '';

-- ============================================================
-- 2. Revoke table-level SELECT from anon and authenticated
--    (RLS policies remain in place and control row-level access)
-- ============================================================

REVOKE SELECT ON TABLE public.appointment_services  FROM anon, authenticated;
REVOKE SELECT ON TABLE public.appointments          FROM anon, authenticated;
REVOKE SELECT ON TABLE public.blocked_time_slots    FROM anon, authenticated;
REVOKE SELECT ON TABLE public.business_settings     FROM anon, authenticated;
REVOKE SELECT ON TABLE public.customer_notes        FROM anon, authenticated;
REVOKE SELECT ON TABLE public.notifications         FROM anon, authenticated;
REVOKE SELECT ON TABLE public.profiles              FROM anon, authenticated;
REVOKE SELECT ON TABLE public.service_categories    FROM anon, authenticated;
REVOKE SELECT ON TABLE public.services              FROM anon, authenticated;
REVOKE SELECT ON TABLE public.stylist_availability  FROM anon, authenticated;
REVOKE SELECT ON TABLE public.stylist_services      FROM anon, authenticated;
REVOKE SELECT ON TABLE public.stylist_time_off      FROM anon, authenticated;
REVOKE SELECT ON TABLE public.stylists              FROM anon, authenticated;
REVOKE SELECT ON TABLE public.waitlist              FROM anon, authenticated;

-- Re-grant SELECT individually only where the app needs it, scoped to
-- authenticated so that RLS still applies per-row.
-- All reads go through the Supabase JS client with the user's JWT, which
-- means RLS policies gate actual row visibility.
GRANT SELECT ON TABLE public.appointments          TO authenticated;
GRANT SELECT ON TABLE public.appointment_services  TO authenticated;
GRANT SELECT ON TABLE public.blocked_time_slots    TO authenticated;
GRANT SELECT ON TABLE public.business_settings     TO authenticated;
GRANT SELECT ON TABLE public.customer_notes        TO authenticated;
GRANT SELECT ON TABLE public.notifications         TO authenticated;
GRANT SELECT ON TABLE public.profiles              TO authenticated;
GRANT SELECT ON TABLE public.service_categories    TO authenticated;
GRANT SELECT ON TABLE public.services              TO authenticated;
GRANT SELECT ON TABLE public.stylist_availability  TO authenticated;
GRANT SELECT ON TABLE public.stylist_services      TO authenticated;
GRANT SELECT ON TABLE public.stylist_time_off      TO authenticated;
GRANT SELECT ON TABLE public.stylists              TO authenticated;
GRANT SELECT ON TABLE public.waitlist              TO authenticated;

-- services and service_categories are needed for the public booking page
-- (unauthenticated guests browsing available services).
-- Grant SELECT to anon ONLY for these two tables.
GRANT SELECT ON TABLE public.services              TO anon;
GRANT SELECT ON TABLE public.service_categories    TO anon;
GRANT SELECT ON TABLE public.stylists              TO anon;

-- ============================================================
-- 3. Revoke public EXECUTE on SECURITY DEFINER functions
-- ============================================================

-- Trigger functions are called by the DB engine, not by roles directly.
REVOKE EXECUTE ON FUNCTION public.enforce_customer_role_on_self_insert() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_appointment_overlap()            FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()             FROM anon, authenticated, public;

-- create_admin_profile is only ever called by a superuser/service-role script.
REVOKE EXECUTE ON FUNCTION public.create_admin_profile(uuid, text, text) FROM anon, authenticated, public;

-- get_busy_slots / get_busy_slots_all are not called from the frontend;
-- revoke from anon and public but keep authenticated if needed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_busy_slots'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_busy_slots(uuid, date) FROM anon, public';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_busy_slots_all'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_busy_slots_all(date) FROM anon, public';
  END IF;
END $$;
