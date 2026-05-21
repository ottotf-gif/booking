/*
  # Hair Salon Booking System - Complete Database Schema

  ## Overview
  This migration creates the complete database schema for a comprehensive hair salon
  booking system including customer management, stylist scheduling, appointments,
  payments, notifications, and business analytics.

  ## Tables Created
  
  ### User Management
  - `profiles` - Extended user profiles with role-based access (customer, stylist, admin)
  
  ### Service Management
  - `services` - Service catalog with pricing and duration
  - `service_categories` - Service categorization
  
  ### Stylist Management
  - `stylists` - Stylist profiles and specializations
  - `stylist_services` - Junction table for stylist-service relationships
  - `stylist_availability` - Regular weekly availability schedules
  - `stylist_time_off` - Time off requests and blackout dates
  
  ### Appointment Management
  - `appointments` - Core appointment records
  - `appointment_services` - Multiple services per appointment support
  - `customer_notes` - Stylist notes about customer preferences
  
  ### Waitlist & Notifications
  - `waitlist` - Customer waitlist for preferred time slots
  - `notifications` - Notification queue and history
  
  ### Business Configuration
  - `business_settings` - System-wide configuration (hours, policies, etc.)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Role-based access policies for customers, stylists, and admins
  - Customers can only access their own data
  - Stylists can view their schedules and assigned customers
  - Admins have full system access
*/

-- Create enum types for better data validation
CREATE TYPE user_role AS ENUM ('customer', 'stylist', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE note_type AS ENUM ('preference', 'formula', 'allergy', 'other');

-- ============================================================================
-- PROFILES TABLE - Extended user information
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name text NOT NULL,
  phone text,
  email text NOT NULL,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICES TABLE - Service catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  duration_minutes int NOT NULL,
  base_price decimal(10,2) NOT NULL,
  active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STYLISTS TABLE - Stylist profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS stylists (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  specializations text[] DEFAULT ARRAY[]::text[],
  hourly_rate decimal(10,2),
  commission_rate decimal(5,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STYLIST_SERVICES - Junction table for stylist-service relationships
-- ============================================================================
CREATE TABLE IF NOT EXISTS stylist_services (
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  custom_price decimal(10,2),
  PRIMARY KEY (stylist_id, service_id)
);

-- ============================================================================
-- STYLIST_AVAILABILITY - Regular weekly schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS stylist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STYLIST_TIME_OFF - Time off requests and blackout dates
-- ============================================================================
CREATE TABLE IF NOT EXISTS stylist_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid REFERENCES stylists(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- APPOINTMENTS - Core appointment records
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stylist_id uuid REFERENCES stylists(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status appointment_status DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL,
  deposit_amount decimal(10,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  payment_intent_id text,
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- APPOINTMENT_SERVICES - Support for multiple services per appointment
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointment_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  price_at_booking decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CUSTOMER_NOTES - Stylist notes about customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stylist_id uuid REFERENCES stylists(id) ON DELETE SET NULL,
  note_type note_type DEFAULT 'other',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- WAITLIST - Customer waitlist for preferred slots
-- ============================================================================
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  preferred_date date NOT NULL,
  preferred_time_range text,
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- NOTIFICATIONS - Notification queue and history
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  template text NOT NULL,
  status notification_status DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- BUSINESS_SETTINGS - System configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES for performance optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_stylists_active ON stylists(active);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_stylist ON appointments(stylist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- SERVICE CATEGORIES
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service categories viewable by everyone"
  ON service_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage service categories"
  ON service_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- SERVICES
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active services viewable by everyone"
  ON services FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'stylist')
  ));

CREATE POLICY "Only admins can manage services"
  ON services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- STYLISTS
ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active stylists viewable by everyone"
  ON stylists FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'stylist')
  ));

CREATE POLICY "Stylists can update own profile"
  ON stylists FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all stylists"
  ON stylists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- STYLIST_SERVICES
ALTER TABLE stylist_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylist services viewable by everyone"
  ON stylist_services FOR SELECT
  USING (true);

CREATE POLICY "Stylists can manage own services"
  ON stylist_services FOR ALL
  TO authenticated
  USING (
    auth.uid() = stylist_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- STYLIST_AVAILABILITY
ALTER TABLE stylist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylist availability viewable by everyone"
  ON stylist_availability FOR SELECT
  USING (true);

CREATE POLICY "Stylists can manage own availability"
  ON stylist_availability FOR ALL
  TO authenticated
  USING (
    auth.uid() = stylist_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- STYLIST_TIME_OFF
ALTER TABLE stylist_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylists can view own time off"
  ON stylist_time_off FOR SELECT
  TO authenticated
  USING (
    auth.uid() = stylist_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Stylists can manage own time off"
  ON stylist_time_off FOR ALL
  TO authenticated
  USING (
    auth.uid() = stylist_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APPOINTMENTS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own appointments"
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

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own appointments"
  ON appointments FOR UPDATE
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

CREATE POLICY "Customers can cancel own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APPOINTMENT_SERVICES
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointment services viewable by appointment participants"
  ON appointment_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND (
        appointments.customer_id = auth.uid() OR
        appointments.stylist_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Appointment services manageable by appointment owner"
  ON appointment_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.customer_id = auth.uid()
    )
  );

-- CUSTOMER_NOTES
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylists can view notes about their customers"
  ON customer_notes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = stylist_id OR
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Stylists can create notes about customers"
  ON customer_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = stylist_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Stylists can update own notes"
  ON customer_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = stylist_id);

CREATE POLICY "Stylists can delete own notes"
  ON customer_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = stylist_id);

-- WAITLIST
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own waitlist entries"
  ON waitlist FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'stylist')
    )
  );

CREATE POLICY "Customers can manage own waitlist entries"
  ON waitlist FOR ALL
  TO authenticated
  USING (auth.uid() = customer_id);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can manage all notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- BUSINESS_SETTINGS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business settings viewable by everyone"
  ON business_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage business settings"
  ON business_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stylists_updated_at BEFORE UPDATE ON stylists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA - Initial configuration and sample data
-- ============================================================================

-- Insert default business settings
INSERT INTO business_settings (key, value) VALUES
  ('business_hours', '{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "19:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "17:00"}}'::jsonb),
  ('booking_rules', '{"advance_booking_weeks": 8, "minimum_notice_hours": 2, "cancellation_deadline_hours": 24, "time_slot_interval_minutes": 30, "buffer_between_appointments_minutes": 10}'::jsonb),
  ('cancellation_policy', '{"late_cancellation_fee_percent": 50, "no_show_fee_percent": 100, "deposit_required": true, "deposit_percent": 20}'::jsonb),
  ('notification_settings', '{"send_confirmation": true, "send_24h_reminder": true, "send_2h_reminder": true, "default_channel": "email"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert service categories
INSERT INTO service_categories (name, description, display_order) VALUES
  ('Haircuts', 'Professional haircuts for all styles', 1),
  ('Styling', 'Hair styling services for any occasion', 2),
  ('Coloring', 'Hair coloring and highlighting services', 3),
  ('Treatments', 'Restorative and conditioning treatments', 4),
  ('Specialty', 'Specialized hair services', 5)
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO services (category_id, name, description, duration_minutes, base_price, active) VALUES
  ((SELECT id FROM service_categories WHERE name = 'Haircuts'), 'Men''s Haircut', 'Classic men''s haircut with styling', 30, 35.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Haircuts'), 'Women''s Haircut', 'Women''s precision haircut', 45, 55.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Haircuts'), 'Children''s Haircut', 'Haircut for children under 12', 30, 25.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Styling'), 'Blow Dry', 'Professional blow dry and styling', 30, 40.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Styling'), 'Updo', 'Elegant updo for special occasions', 60, 80.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Coloring'), 'Full Color', 'Complete hair color transformation', 120, 120.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Coloring'), 'Highlights', 'Partial or full highlights', 90, 100.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Coloring'), 'Root Touch-up', 'Root color touch-up', 60, 65.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Treatments'), 'Deep Conditioning', 'Intensive conditioning treatment', 30, 35.00, true),
  ((SELECT id FROM service_categories WHERE name = 'Treatments'), 'Keratin Treatment', 'Smoothing keratin treatment', 120, 200.00, true)
ON CONFLICT DO NOTHING;
