/*
  # Add Appointment Conflict Prevention

  ## Overview
  This migration adds database-level protection against double-booking stylists
  by implementing overlap detection for appointments.

  ## Changes Made
  1. Database Function
    - `check_appointment_overlap()` - Validates that new appointments don't overlap with existing ones
    
  2. Trigger
    - Automatically runs before INSERT or UPDATE on appointments table
    - Prevents overlapping appointments for the same stylist on the same date
    - Excludes cancelled appointments from conflict checking
    
  3. Index
    - Composite index on (stylist_id, appointment_date, status) for efficient conflict queries
    
  ## Important Notes
  - The function checks for time overlaps using the formula: (start1 < end2 AND start2 < end1)
  - This ensures no two appointments can occupy the same time slot for the same stylist
  - Cancelled appointments are excluded from conflict checking
  - The trigger will raise an exception if a conflict is detected, preventing the insert/update
*/

-- Create index for efficient conflict checking
CREATE INDEX IF NOT EXISTS idx_appointments_stylist_date_status 
ON appointments(stylist_id, appointment_date, status) 
WHERE status != 'cancelled';

-- Function to check for appointment time conflicts
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for conflicts if the appointment is not cancelled
  IF NEW.status != 'cancelled' THEN
    -- Check if there are any overlapping appointments for the same stylist on the same date
    IF EXISTS (
      SELECT 1 
      FROM appointments 
      WHERE 
        id != NEW.id  -- Exclude the current appointment (for updates)
        AND stylist_id = NEW.stylist_id 
        AND appointment_date = NEW.appointment_date 
        AND status != 'cancelled'
        -- Check for time overlap: appointments overlap if one starts before the other ends
        AND (
          (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
      RAISE EXCEPTION 'Appointment conflict: This stylist already has an appointment during this time slot';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for conflicts before insert or update
DROP TRIGGER IF EXISTS prevent_appointment_overlap ON appointments;
CREATE TRIGGER prevent_appointment_overlap
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_overlap();