/*
  # Enforce service duration as multiples of 15 minutes

  ## Summary
  Adds a CHECK constraint to the services table so duration_minutes must be
  a multiple of 15 (e.g. 15, 30, 45, 60 ... 120). This guarantees appointment
  end-times always land on a 15-minute grid boundary, which is required for
  the time-slot overlap detection to work correctly.

  ## Changes
  - services: new CHECK constraint `duration_minutes_multiple_of_15`
*/

ALTER TABLE services
  ADD CONSTRAINT duration_minutes_multiple_of_15
  CHECK (duration_minutes > 0 AND duration_minutes % 15 = 0);
