/*
  # Add Guest Booking Support

  ## Overview
  This migration adds support for guest bookings without creating permanent user accounts.
  Guest users can book appointments by providing their contact information directly,
  which is stored in the appointments table rather than creating Supabase auth accounts.

  ## Changes

  1. Add guest contact fields to appointments table:
     - `guest_name` - Full name of guest customer
     - `guest_email` - Email address for confirmation
     - `guest_phone` - Phone number for contact
     - `is_guest_booking` - Flag to indicate guest vs registered user

  2. Modify customer_id constraint to allow NULL for guest bookings

  3. Update RLS policies to allow anonymous users to create guest bookings

  4. Add check constraint to ensure either customer_id OR guest contact info exists

  ## Security
  - Guest bookings are restricted to insert-only for anonymous users
  - Guests cannot view or modify other bookings
  - All bookings still visible to admins and assigned stylists
*/

-- Add guest booking fields to appointments table
DO $$
BEGIN
  -- Add guest_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE appointments ADD COLUMN guest_name text;
  END IF;

  -- Add guest_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'guest_email'
  ) THEN
    ALTER TABLE appointments ADD COLUMN guest_email text;
  END IF;

  -- Add guest_phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'guest_phone'
  ) THEN
    ALTER TABLE appointments ADD COLUMN guest_phone text;
  END IF;

  -- Add is_guest_booking flag if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'is_guest_booking'
  ) THEN
    ALTER TABLE appointments ADD COLUMN is_guest_booking boolean DEFAULT false;
  END IF;
END $$;

-- Modify customer_id to allow NULL (for guest bookings)
ALTER TABLE appointments ALTER COLUMN customer_id DROP NOT NULL;

-- Add check constraint to ensure either customer_id OR guest info exists
DO $$
BEGIN
  -- Drop constraint if it already exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_customer_or_guest_check'
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_customer_or_guest_check;
  END IF;

  -- Add the constraint
  ALTER TABLE appointments ADD CONSTRAINT appointments_customer_or_guest_check
    CHECK (
      (customer_id IS NOT NULL AND is_guest_booking = false) OR
      (customer_id IS NULL AND is_guest_booking = true AND
       guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
    );
END $$;

-- Update RLS policy to allow anonymous users to create guest bookings
DROP POLICY IF EXISTS "Anonymous users can create guest bookings" ON appointments;

CREATE POLICY "Anonymous users can create guest bookings"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (
    is_guest_booking = true AND
    customer_id IS NULL AND
    guest_name IS NOT NULL AND
    guest_email IS NOT NULL AND
    guest_phone IS NOT NULL
  );

-- Update existing policy to allow authenticated users to create their own bookings
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON appointments;

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = customer_id AND is_guest_booking = false) OR
    (is_guest_booking = true AND customer_id IS NULL)
  );

-- Update SELECT policy to include guest bookings viewable by their associated stylist
DROP POLICY IF EXISTS "Customers can view own appointments" ON appointments;

CREATE POLICY "Users can view relevant appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id OR
    auth.uid() = stylist_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index on guest_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_guest_email ON appointments(guest_email) WHERE is_guest_booking = true;

-- Create index on is_guest_booking for filtering
CREATE INDEX IF NOT EXISTS idx_appointments_is_guest ON appointments(is_guest_booking);

-- Add comment explaining the schema change
COMMENT ON COLUMN appointments.guest_name IS 'Full name for guest bookings (non-registered users)';
COMMENT ON COLUMN appointments.guest_email IS 'Email address for guest bookings - used for confirmations but NOT stored as a permanent user account';
COMMENT ON COLUMN appointments.guest_phone IS 'Phone number for guest bookings';
COMMENT ON COLUMN appointments.is_guest_booking IS 'True if booking was made without creating a user account';
