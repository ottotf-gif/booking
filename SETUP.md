# Hair Salon Booking System - Setup Guide

## Initial Setup Complete

The hair salon booking system has been successfully set up with:

1. **Database Schema**: All tables created with Row Level Security policies
2. **Authentication**: Email/password authentication with role-based access
3. **Core Features**:
   - Customer booking interface
   - Service catalog management
   - Appointment management
   - Profile management
   - Stylist scheduling (data structure ready)

## Database Schema

The following tables have been created:
- `profiles` - User profiles with roles (customer, stylist, admin)
- `services` - Service catalog with pricing and duration
- `service_categories` - Service categorization
- `stylists` - Stylist profiles and specializations
- `stylist_services` - Stylist-service relationships
- `stylist_availability` - Weekly availability schedules
- `stylist_time_off` - Time off requests
- `appointments` - Appointment records
- `appointment_services` - Multiple services per appointment
- `customer_notes` - Stylist notes about customers
- `waitlist` - Customer waitlist
- `notifications` - Notification queue
- `business_settings` - System configuration

## Sample Data

Sample service categories and services have been pre-populated:
- **Haircuts**: Men's, Women's, Children's
- **Styling**: Blow Dry, Updo
- **Coloring**: Full Color, Highlights, Root Touch-up
- **Treatments**: Deep Conditioning, Keratin Treatment

## Getting Started

### 1. Create Your First User

Sign up at the login screen. The first user will be created as a customer.

### 2. Create Admin User (Manual Database Update)

To create an admin user, you'll need to update a user's role in the database:

```sql
-- Update a user to admin role
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 3. Create Stylist Accounts

As an admin, you can:
1. Sign up new users (they'll be customers by default)
2. Update their role to 'stylist' in the database
3. Add stylist profile information

To convert a user to a stylist:

```sql
-- Update user role to stylist
UPDATE profiles
SET role = 'stylist'
WHERE email = 'stylist-email@example.com';

-- Create stylist profile
INSERT INTO stylists (id, bio, specializations, active)
VALUES (
  (SELECT id FROM profiles WHERE email = 'stylist-email@example.com'),
  'Experienced hair stylist specializing in modern cuts',
  ARRAY['Haircuts', 'Coloring', 'Styling'],
  true
);

-- Assign services to stylist (example)
INSERT INTO stylist_services (stylist_id, service_id)
SELECT
  (SELECT id FROM profiles WHERE email = 'stylist-email@example.com'),
  id
FROM services;

-- Set stylist availability (example: Monday to Friday, 9 AM to 6 PM)
INSERT INTO stylist_availability (stylist_id, day_of_week, start_time, end_time)
SELECT
  (SELECT id FROM profiles WHERE email = 'stylist-email@example.com'),
  day,
  '09:00',
  '18:00'
FROM generate_series(1, 5) AS day;
```

## User Roles

### Customer
- Book appointments
- View their own appointments
- Manage their profile
- Cancel their appointments

### Stylist
- View their schedule
- See assigned appointments
- View customer information
- Cancel appointments

### Admin
- Manage services and pricing
- View all appointments
- Access business settings
- Manage stylists

## Features Implemented

### Phase 1 (Complete)
- Database schema with RLS
- User authentication
- Service catalog CRUD
- Customer booking flow
- Appointment management
- Profile management

### Next Steps (Future Enhancements)
- Payment integration (Stripe)
- Email/SMS notifications
- Advanced stylist management UI
- Business analytics dashboard
- Waitlist functionality
- Calendar export
- Customer loyalty tracking

## Testing the Application

1. **Sign up as a customer**
2. **Book an appointment**:
   - Select a service
   - Choose a stylist (make sure you've created at least one stylist first)
   - Pick a date and time
   - Confirm booking
3. **View appointments** in the "My Appointments" section
4. **Update profile** in the Profile section

## Important Notes

- The booking system prevents double-booking automatically
- Appointments require a 2-hour minimum notice
- Booking window is 8 weeks in advance
- Time slots are in 30-minute intervals
- Default business hours: 9 AM - 7 PM

## Admin Quick Setup

To quickly get started with testing, create at least one stylist:

1. Sign up a new account (e.g., stylist1@salon.com)
2. Run the SQL commands above to convert them to a stylist
3. Assign services and set availability
4. Now customers can book with that stylist

Enjoy your new salon booking system!
