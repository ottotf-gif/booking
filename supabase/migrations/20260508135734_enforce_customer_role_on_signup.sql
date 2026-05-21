/*
  # Enforce Customer Role on New Sign-ups

  ## Problem
  Self-service registration must never produce an admin or stylist account.
  An ordinary authenticated user inserting their own profile row could in
  principle send any value for `role`, including 'admin'.

  ## Changes
  1. Trigger `enforce_customer_role_on_insert` runs BEFORE INSERT on profiles.
  2. Whenever the inserted profile id matches the current `auth.uid()`
     (i.e. the user is creating their own profile via self-signup), the
     role is forcibly set to 'customer'.
  3. Service-role inserts (e.g. through the create-customer edge function
     where auth.uid() is null) are NOT affected, so admins can still
     promote staff via privileged paths.

  ## Notes
  - DEFAULT 'customer' on the column already exists, but a trigger
    is required to override an explicit value sent by an authenticated user.
*/

CREATE OR REPLACE FUNCTION enforce_customer_role_on_self_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.id = auth.uid() THEN
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_customer_role_on_insert ON profiles;
CREATE TRIGGER enforce_customer_role_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_customer_role_on_self_insert();
