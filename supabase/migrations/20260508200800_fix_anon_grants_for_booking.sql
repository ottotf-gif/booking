/*
  # Fix anon role grants broken by security migration

  ## Summary
  The previous security migration revoked SELECT from `anon` on all tables, which
  broke the guest booking flow. PostgREST removes a table from its schema cache
  entirely when a role has no SELECT grant, producing "relation does not exist".

  ## Changes
  - Re-grant SELECT on tables the unauthenticated booking flow must read:
    appointments, blocked_time_slots, profiles, stylist_services, stylist_availability
  - These tables still have RLS enabled so policies control which rows are visible;
    the table-level SELECT grant is only needed so PostgREST exposes the endpoint.
*/

-- appointments: anon needs SELECT to check overlap before inserting, and so
-- PostgREST exposes the table (otherwise "relation does not exist" error).
GRANT SELECT ON TABLE public.appointments TO anon;

-- blocked_time_slots: needed to build the available-slot grid for guests.
GRANT SELECT ON TABLE public.blocked_time_slots TO anon;

-- profiles: needed for the stylists join (stylists.profile:profiles(*)).
GRANT SELECT ON TABLE public.profiles TO anon;

-- stylist_services: needed to check which services a barber offers.
GRANT SELECT ON TABLE public.stylist_services TO anon;

-- stylist_availability: needed for barber working-hours check.
GRANT SELECT ON TABLE public.stylist_availability TO anon;
