# Guest Booking Implementation - No Account Creation

## Overview

This document describes the implementation of guest bookings that **does NOT create permanent user accounts**. Guest users can book appointments by providing their contact information, which is stored only with the appointment record and never creates a Supabase auth account or permanent user profile.

## Problem Statement

**Requirement**: When a guest account is created in the application, the email address associated with that guest should NOT be saved or stored as a new permanent user account in the database.

**Previous Behavior** (INCORRECT):
- Guest bookings created temporary Supabase auth accounts
- Email addresses were stored in the `auth.users` table
- Profiles were created in the `profiles` table
- Guest emails became permanent accounts unintentionally

**New Behavior** (CORRECT):
- Guest bookings collect contact information only
- NO Supabase auth account is created
- NO profile record is created
- Guest information is stored ONLY in the appointment record
- Guest emails are used solely for booking confirmation and reminders

## Implementation Details

### 1. Database Schema Changes

**Migration**: `add_guest_booking_support.sql`

Added new columns to the `appointments` table to support guest bookings:

```sql
-- Guest contact information fields
ALTER TABLE appointments ADD COLUMN guest_name text;
ALTER TABLE appointments ADD COLUMN guest_email text;
ALTER TABLE appointments ADD COLUMN guest_phone text;
ALTER TABLE appointments ADD COLUMN is_guest_booking boolean DEFAULT false;

-- Allow NULL customer_id for guest bookings
ALTER TABLE appointments ALTER COLUMN customer_id DROP NOT NULL;

-- Constraint: Either customer_id OR guest info must exist
ALTER TABLE appointments ADD CONSTRAINT appointments_customer_or_guest_check
  CHECK (
    (customer_id IS NOT NULL AND is_guest_booking = false) OR
    (customer_id IS NULL AND is_guest_booking = true AND
     guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
  );
```

**Key Points**:
- `guest_email` is used ONLY for appointment confirmation emails
- `guest_email` is NOT stored in `auth.users` or `profiles` tables
- Check constraint ensures data integrity

### 2. Row Level Security (RLS) Updates

**Anonymous User Insert Policy**:
```sql
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
```

**Authenticated User Insert Policy**:
```sql
CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = customer_id AND is_guest_booking = false) OR
    (is_guest_booking = true AND customer_id IS NULL)
  );
```

**Security Features**:
- Anonymous users can ONLY create guest bookings
- Guest bookings require all contact fields
- Authenticated users can create both types of bookings
- Guests cannot view other bookings (no SELECT policy for anon)

### 3. Frontend Changes

#### A. GuestBookingFlow Component

**File**: `src/components/booking/GuestBookingFlow.tsx`

**Old Implementation** (REMOVED):
```typescript
// Created Supabase auth account
const { data: signUpData } = await supabase.auth.signUp({
  email,
  password: tempPassword,
});

// Created profile record
await supabase.from('profiles').upsert({
  id: signUpData.user.id,
  full_name: fullName,
  email,
  phone,
  role: 'customer',
});

onGuestCreated(signUpData.user.id);
```

**New Implementation**:
```typescript
// NO account creation - just pass data to parent
const handleGuestSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // CRITICAL: No user account creation happens here
  // Guest email is NOT stored as a permanent user account
  onGuestInfoSubmit({
    fullName,
    email,
    phone,
  });
};
```

**Interface**:
```typescript
export interface GuestInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface GuestBookingFlowProps {
  onGuestInfoSubmit: (guestInfo: GuestInfo) => void;
  onCancel: () => void;
}
```

#### B. BookingView Component

**File**: `src/components/booking/BookingView.tsx`

**State Management**:
```typescript
// Changed from storing userId to storing guest info
const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);

const handleGuestInfoSubmit = (info: GuestInfo) => {
  // Store guest information but DO NOT create a user account
  setGuestInfo(info);
  setShowGuestFlow(false);
};
```

**Booking Creation**:
```typescript
const appointmentData: any = {
  stylist_id: selectedStylist.id,
  service_id: selectedService.id,
  appointment_date: selectedDate,
  start_time: selectedTime,
  end_time: endTimeStr,
  status: 'confirmed',
  total_amount: selectedService.base_price,
  deposit_amount: selectedService.base_price * 0.2,
  payment_status: 'pending',
};

if (customerId) {
  // Authenticated user booking
  appointmentData.customer_id = customerId;
  appointmentData.is_guest_booking = false;
} else if (guestInfo) {
  // Guest booking - NO user account created
  appointmentData.customer_id = null;
  appointmentData.is_guest_booking = true;
  appointmentData.guest_name = guestInfo.fullName;
  appointmentData.guest_email = guestInfo.email;
  appointmentData.guest_phone = guestInfo.phone;
}
```

## Data Flow Comparison

### Old Flow (INCORRECT - Created Accounts)

```
User clicks "Book as Guest"
    ↓
Enters email, name, phone
    ↓
System calls supabase.auth.signUp()
    ↓
Auth account created in auth.users ❌
    ↓
Profile created in profiles table ❌
    ↓
User ID returned
    ↓
Appointment created with customer_id
```

### New Flow (CORRECT - No Accounts)

```
User clicks "Book as Guest"
    ↓
Enters email, name, phone
    ↓
Information passed to parent component
    ↓
NO auth account created ✓
    ↓
NO profile created ✓
    ↓
Appointment created with:
  - customer_id = NULL
  - is_guest_booking = true
  - guest_name, guest_email, guest_phone populated ✓
```

## Key Differences

| Aspect | Old Implementation | New Implementation |
|--------|-------------------|-------------------|
| **Auth Account** | Created | NOT created ✓ |
| **Profile Record** | Created | NOT created ✓ |
| **Email Storage** | auth.users + profiles | appointments only ✓ |
| **customer_id** | User UUID | NULL ✓ |
| **Guest Info** | Not stored | Stored in appointment ✓ |
| **Account Permanence** | Permanent | Temporary/per-booking ✓ |

## User Experience

### Guest Booking Message

**Updated UI Text**:
```
"Guest Booking: No account required! Your email will only be used for
this booking confirmation and appointment reminders. Create an account
later if you'd like to manage appointments online."
```

This clearly communicates:
- No account is created
- Email is for this booking only
- Optional account creation later

### Booking Confirmation

After successful guest booking:
```
"Appointment booked successfully! Check your email for confirmation."
```

Guest receives confirmation at the provided email without account creation.

## Database Queries

### Insert Guest Booking

```typescript
await supabase.from('appointments').insert({
  customer_id: null,               // No user account
  is_guest_booking: true,          // Flag as guest
  guest_name: 'John Smith',        // Guest info
  guest_email: 'john@example.com', // For confirmation only
  guest_phone: '555-1234',         // For reminders
  stylist_id: '...',
  service_id: '...',
  appointment_date: '2026-02-15',
  start_time: '14:00',
  end_time: '14:30',
  status: 'confirmed',
  total_amount: 50.00,
  payment_status: 'pending'
});
```

### Query Guest Bookings

```sql
-- Find all guest bookings
SELECT * FROM appointments
WHERE is_guest_booking = true;

-- Find guest bookings by email
SELECT * FROM appointments
WHERE is_guest_booking = true
AND guest_email = 'john@example.com';

-- Count guest vs registered bookings
SELECT
  is_guest_booking,
  COUNT(*) as booking_count
FROM appointments
GROUP BY is_guest_booking;
```

## Admin Dashboard Display

Appointments should display guest information appropriately:

```typescript
// In admin or barber appointment views
const customerName = appointment.is_guest_booking
  ? appointment.guest_name
  : appointment.customer?.full_name;

const customerEmail = appointment.is_guest_booking
  ? appointment.guest_email
  : appointment.customer?.email;
```

## Security Considerations

### What Guest Users CAN Do
✅ Create appointments by providing contact info
✅ Receive confirmation emails
✅ Receive appointment reminders

### What Guest Users CANNOT Do
❌ Create permanent user accounts automatically
❌ View past bookings (no auth session)
❌ Modify bookings (no auth session)
❌ Access user portal features

### Data Protection
- Guest emails are indexed for performance but not exposed publicly
- RLS policies prevent unauthorized access to guest data
- Guest information is isolated to appointment records
- No guest data stored in auth system

## Migration from Old System

If you have existing guest accounts that were created incorrectly:

### Identifying Legacy Guest Accounts

```sql
-- Find users who may have been created as "guests"
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%+guest%'
OR metadata->>'is_guest' = 'true';
```

### Data Cleanup (Optional)

If you need to clean up old guest accounts:

```sql
-- WARNING: Only run if you want to remove old guest accounts
-- This is irreversible!

-- 1. Convert appointments to new guest format
UPDATE appointments
SET
  is_guest_booking = true,
  guest_name = p.full_name,
  guest_email = p.email,
  guest_phone = p.phone,
  customer_id = NULL
FROM profiles p
WHERE appointments.customer_id = p.id
AND p.email LIKE '%+guest%'; -- Adjust condition as needed

-- 2. Delete old guest profiles
DELETE FROM profiles
WHERE email LIKE '%+guest%';

-- 3. Delete old guest auth accounts
-- (This must be done via Supabase Admin API, not SQL)
```

## Testing

### Manual Test Cases

#### Test 1: Guest Booking Creation
1. Navigate to booking page (not logged in)
2. Select service, barber, date, time
3. Click "Confirm Booking"
4. Click "Continue as Guest"
5. Fill in name, email, phone
6. Click "Continue to Booking"

**Expected Result**:
- ✅ Booking created successfully
- ✅ No auth account in auth.users
- ✅ No profile in profiles table
- ✅ Appointment has is_guest_booking = true
- ✅ Guest info populated in appointment
- ✅ Confirmation alert shown

#### Test 2: Verify No Account Created
1. Complete Test 1
2. Try to sign in with guest email
3. Should receive "Invalid credentials" error

**Expected Result**:
- ✅ Cannot sign in with guest email
- ✅ Email not in auth system

#### Test 3: Multiple Guest Bookings Same Email
1. Create guest booking with email A
2. Create another guest booking with email A
3. Both should succeed

**Expected Result**:
- ✅ Both bookings created
- ✅ No email conflict errors
- ✅ Still no auth account

### Database Verification

```sql
-- After creating guest booking, verify:

-- 1. Appointment exists with guest flag
SELECT * FROM appointments
WHERE guest_email = 'test@example.com'
AND is_guest_booking = true;

-- 2. No auth user created
SELECT * FROM auth.users
WHERE email = 'test@example.com';
-- Should return 0 rows

-- 3. No profile created
SELECT * FROM profiles
WHERE email = 'test@example.com';
-- Should return 0 rows
```

## Advantages of This Approach

### 1. Data Privacy
- Guest emails not permanently stored in user database
- Reduces PII (Personally Identifiable Information) storage
- Easier GDPR/privacy compliance

### 2. System Simplicity
- No orphaned user accounts
- Cleaner auth.users table
- No confusion between guest and real accounts

### 3. User Experience
- Faster checkout process
- No password requirements
- Clear expectations (no account created)
- Can upgrade to full account later if desired

### 4. Data Integrity
- Clear separation between guest and authenticated users
- Check constraints prevent invalid states
- Easier to query and report on guest bookings

### 5. Cost Efficiency
- Fewer auth users (some platforms charge per user)
- Less database storage for user records
- Reduced email verification overhead

## Future Enhancements

### Account Conversion
Allow guests to claim their bookings by creating an account:

```typescript
// Find guest bookings by email
const guestBookings = await supabase
  .from('appointments')
  .select('*')
  .eq('guest_email', email)
  .eq('is_guest_booking', true);

// After user creates account, convert bookings
await supabase
  .from('appointments')
  .update({
    customer_id: newUserId,
    is_guest_booking: false,
    guest_name: null,
    guest_email: null,
    guest_phone: null
  })
  .eq('guest_email', email)
  .eq('is_guest_booking', true);
```

### Guest Booking Lookup
Provide a "Check Your Booking" feature:

```typescript
// Allow guests to view their booking with email + booking ID
const booking = await supabase
  .from('appointments')
  .select('*')
  .eq('id', bookingId)
  .eq('guest_email', email)
  .eq('is_guest_booking', true)
  .maybeSingle();
```

## Summary

This implementation successfully ensures that:

✅ **Guest emails are NOT stored as permanent user accounts**
✅ **No Supabase auth accounts are created for guests**
✅ **No profile records are created for guests**
✅ **Guest information is stored only with appointments**
✅ **Clear distinction between guest and registered bookings**
✅ **Secure RLS policies prevent unauthorized access**
✅ **Database constraints ensure data integrity**
✅ **User experience clearly communicates no account creation**

The system now properly treats guest bookings as temporary sessions, with contact information used solely for booking confirmation and communication, never creating permanent accounts in the database.
