/*
  # Add Blocked Time Slots System

  ## Overview
  Creates a system to block specific time slots globally or per-stylist, 
  primarily for lunch breaks and other recurring blocked periods.

  ## New Tables
    - `blocked_time_slots`
      - `id` (uuid, primary key)
      - `stylist_id` (uuid, nullable) - If null, applies to all stylists
      - `time_slot` (time) - The blocked time (e.g., 13:00, 13:15, 13:30)
      - `day_of_week` (int, nullable) - If null, applies to all days (0=Sunday, 6=Saturday)
      - `reason` (text) - Why this slot is blocked
      - `active` (boolean) - Whether this block is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  ## Security
    - Enable RLS on `blocked_time_slots` table
    - Everyone can view blocked slots (needed for booking system)
    - Only admins can create/update/delete blocked slots

  ## Initial Data
    - Adds lunch break blocks for 13:00, 13:15, and 13:30 for all stylists
*/

-- ============================================================================
-- BLOCKED_TIME_SLOTS TABLE - System-wide or per-stylist blocked time slots
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocked_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  time_slot time NOT NULL,
  day_of_week int CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  reason text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_active ON blocked_time_slots(active);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_stylist ON blocked_time_slots(stylist_id);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_time ON blocked_time_slots(time_slot);

-- Add trigger for updated_at
CREATE TRIGGER update_blocked_time_slots_updated_at BEFORE UPDATE ON blocked_time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE blocked_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocked time slots viewable by everyone"
  ON blocked_time_slots FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage blocked time slots"
  ON blocked_time_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- SEED DATA - Add lunch break blocks
-- ============================================================================

-- Add global lunch break blocks (applies to all stylists, all days)
INSERT INTO blocked_time_slots (stylist_id, time_slot, day_of_week, reason, active) VALUES
  (NULL, '13:00:00', NULL, 'Lunch Break', true),
  (NULL, '13:15:00', NULL, 'Lunch Break', true),
  (NULL, '13:30:00', NULL, 'Lunch Break', true);
