/*
  # Fix Appointment INSERT Policy for Admins

  ## Problem
  The current INSERT policy only allows:
  1. Authenticated users to book for themselves (customer_id = auth.uid())
  2. Authenticated users to create guest bookings (is_guest_booking = true)

  Admins need unrestricted INSERT access to create bookings for any customer
  or to create guest bookings through the Manual Booking interface.

  ## Changes
  - Drop and replace the authenticated INSERT policy
  - New policy adds a third condition: admin users can insert any appointment
*/

DROP POLICY IF EXISTS "Authenticated users can create appointments" ON appointments;

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Customer books their own appointment
    (auth.uid() = customer_id AND is_guest_booking = false)
    OR
    -- Any authenticated user creates a guest booking
    (is_guest_booking = true AND customer_id IS NULL)
    OR
    -- Admin creates any booking (including for other customers)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
