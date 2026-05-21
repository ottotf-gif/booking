/*
  # Create Admin Account

  ## Overview
  Creates the admin account for the barbershop system with specified credentials.

  ## Details
  - Email: otto.tf@hotmail.com
  - Password: Probarber (set via Supabase Auth)
  - Role: admin

  ## Notes
  This migration creates a function that will be called to set up the admin account.
  The actual user creation needs to happen through Supabase Auth API.
*/

-- Create a function to help set up the admin account
CREATE OR REPLACE FUNCTION create_admin_profile(
  admin_user_id uuid,
  admin_email text,
  admin_full_name text
)
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (admin_user_id, admin_email, admin_full_name, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_admin_profile TO authenticated;
