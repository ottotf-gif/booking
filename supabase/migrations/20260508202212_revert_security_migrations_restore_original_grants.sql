/*
  # Återställ ursprungliga databasbehörigheter

  ## Sammanfattning
  Återställer alla tabell- och funktionsbehörigheter till det ursprungliga tillståndet
  från innan säkerhetsmigrationerna (fix_security_issues och fix_anon_grants_for_booking)
  kördes. Dessa migrationer bröt bokningsflödet för gäster och inloggade användare.

  ## Ändringar
  1. Återger SELECT till `anon` och `authenticated` på alla tabeller
  2. Återger EXECUTE på alla SECURITY DEFINER-funktioner
  3. Tar bort den tvingade `search_path = ''` på funktionerna (återställer original-beteende)
*/

-- ============================================================
-- 1. Återställ SELECT-behörigheter på alla tabeller
--    (PostgREST kräver table-level SELECT för att exponera tabellen)
-- ============================================================

GRANT SELECT ON TABLE public.appointment_services  TO anon, authenticated;
GRANT SELECT ON TABLE public.appointments          TO anon, authenticated;
GRANT SELECT ON TABLE public.blocked_time_slots    TO anon, authenticated;
GRANT SELECT ON TABLE public.business_settings     TO anon, authenticated;
GRANT SELECT ON TABLE public.customer_notes        TO anon, authenticated;
GRANT SELECT ON TABLE public.notifications         TO anon, authenticated;
GRANT SELECT ON TABLE public.profiles              TO anon, authenticated;
GRANT SELECT ON TABLE public.service_categories    TO anon, authenticated;
GRANT SELECT ON TABLE public.services              TO anon, authenticated;
GRANT SELECT ON TABLE public.stylist_availability  TO anon, authenticated;
GRANT SELECT ON TABLE public.stylist_services      TO anon, authenticated;
GRANT SELECT ON TABLE public.stylist_time_off      TO anon, authenticated;
GRANT SELECT ON TABLE public.stylists              TO anon, authenticated;
GRANT SELECT ON TABLE public.waitlist              TO anon, authenticated;

-- ============================================================
-- 2. Återställ EXECUTE på funktioner
-- ============================================================

GRANT EXECUTE ON FUNCTION public.update_updated_at_column()             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_profile(uuid, text, text) TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'enforce_customer_role_on_self_insert'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.enforce_customer_role_on_self_insert() TO anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_appointment_overlap'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_appointment_overlap() TO anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_busy_slots'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date) TO anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_busy_slots_all'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_busy_slots_all(date) TO anon, authenticated';
  END IF;
END $$;

-- ============================================================
-- 3. Återställ funktionernas search_path till standard
--    (tar bort den tomma search_path som orsakade problem)
-- ============================================================

ALTER FUNCTION public.update_updated_at_column()
  RESET search_path;

ALTER FUNCTION public.create_admin_profile(uuid, text, text)
  RESET search_path;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'enforce_customer_role_on_self_insert'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.enforce_customer_role_on_self_insert() RESET search_path';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_appointment_overlap'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.check_appointment_overlap() RESET search_path';
  END IF;
END $$;
