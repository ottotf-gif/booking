/*
  # Reset services and availability - City Barbershop
  
  Drops the overlap-check trigger temporarily since the ON DELETE SET NULL cascade
  on appointments.service_id incorrectly fires it during service cleanup.
  Trigger is recreated at the end.
*/

-- Droppa konflikttrigger (återskapas nedan)
DROP TRIGGER IF EXISTS prevent_appointment_overlap ON public.appointments;

-- Rensa gamla tjänster
DELETE FROM appointment_services WHERE service_id IN (SELECT id FROM services);
DELETE FROM stylist_services;
DELETE FROM services;

-- Lägg in de 4 nya frisörtjänsterna
DO $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT id INTO cat_id FROM service_categories LIMIT 1;
  INSERT INTO services (name, description, duration_minutes, base_price, category_id, active)
  VALUES
    ('Klippning',            'Klassisk herrklippning',                  30,  350, cat_id, true),
    ('Skäggtrim',            'Trimning och formning av skägg',          15,  200, cat_id, true),
    ('Klippning + skägg',    'Klippning och skäggtrim i ett besök',     45,  500, cat_id, true),
    ('Rakning',              'Klassisk våtrakning med varma handdukar', 30,  400, cat_id, true);
END $$;

-- Koppla alla aktiva frisörer till alla tjänster
INSERT INTO stylist_services (stylist_id, service_id)
SELECT s.id, sv.id
FROM stylists s
CROSS JOIN services sv
WHERE s.active = true;

-- Lägg till tid-på-dagen-stöd på ledigheter
ALTER TABLE stylist_time_off
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time;

-- Återställ tillgänglighet för alla aktiva frisörer
DELETE FROM stylist_availability
WHERE stylist_id IN (SELECT id FROM stylists WHERE active = true);

INSERT INTO stylist_availability (stylist_id, day_of_week, start_time, end_time, is_available)
SELECT s.id, dow.day_of_week, dow.start_time, dow.end_time, true
FROM stylists s
CROSS JOIN (VALUES
  (0, '11:00'::time, '16:00'::time),
  (1, '10:00'::time, '19:00'::time),
  (2, '10:00'::time, '19:00'::time),
  (3, '10:00'::time, '19:00'::time),
  (4, '10:00'::time, '19:00'::time),
  (5, '10:00'::time, '19:00'::time),
  (6, '10:00'::time, '16:00'::time)
) AS dow(day_of_week, start_time, end_time)
WHERE s.active = true;

-- Återskapa konflikttriggern
CREATE TRIGGER prevent_appointment_overlap
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION check_appointment_overlap();
