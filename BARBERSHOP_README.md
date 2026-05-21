# Barbershop Booking System

A comprehensive, production-ready booking management system designed specifically for barbershops. Built with React, TypeScript, Tailwind CSS, and Supabase.

## System Overview

This booking system provides complete barbershop management with three distinct user roles:

### 1. Admin Portal (otto.tf@hotmail.com)
**Full system control and oversight**
- **Dashboard**: Real-time overview of all bookings, revenue, and staff metrics
- **Calendar View**: See all appointments across all barbers in a daily schedule
- **Staff Management**: Add new barbers with email/password credentials
- **Service Management**: Configure services, pricing, and durations
- **All Appointments**: View, manage, and cancel any booking in the system

### 2. Staff Portal (Barbers)
**Individual barber schedule management**
- **My Schedule**: View only their own assigned appointments
- **Daily Calendar**: Personal schedule with customer details
- **Profile Management**: Update personal information
- **Privacy**: Cannot see other barbers' appointments

### 3. Customer Portal
**Self-service booking**
- **Book Appointments**: Choose service, barber, date, and time
- **My Appointments**: View upcoming and past bookings
- **Manage Bookings**: Cancel appointments
- **Profile**: Update contact information

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Create Admin Account

**Option A: Sign Up + Database Update (Recommended)**

1. Visit the application
2. Click "Sign Up" and create account with:
   - Email: `otto.tf@hotmail.com`
   - Password: `Probarber`
   - Full Name: Otto

3. Update role to admin in Supabase:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'otto.tf@hotmail.com';
   ```

4. Log out and log back in

**See ADMIN_SETUP.md for more detailed setup options**

### 3. Add Your First Barber

1. Log in as admin
2. Navigate to **Staff Management**
3. Click **Add Barber**
4. Enter barber details:
   - Full Name
   - Email (this will be their login)
   - Password (they'll use this to log in)
   - Phone (optional)
   - Bio (optional)
   - Specializations (optional)
5. Click **Add Barber**

The system automatically:
- Creates a login account for the barber
- Assigns all active services
- Sets Mon-Fri availability (9 AM - 6 PM)
- Activates the account

### 4. Test the System

**As Admin:**
- View the dashboard
- Check the calendar view
- Add a test service
- View all appointments

**As Barber:**
- Log out from admin
- Log in with barber credentials
- View empty schedule
- Update profile

**As Customer:**
- Sign up a new account
- Book an appointment
- View in "My Appointments"

## User Credentials

### Admin Account
- **Email**: otto.tf@hotmail.com
- **Password**: Probarber
- **Access**: Full system control

### Barber Accounts
Created by admin through Staff Management interface. Each barber receives:
- Unique email/password
- Access to their own schedule only
- Profile management

### Customer Accounts
Self-registration through sign-up form. Customers can:
- Book appointments
- View their own bookings
- Manage profile

## Key Features

### Admin Dashboard
- **Today's Bookings**: Quick count of today's appointments
- **Upcoming Count**: Total upcoming appointments
- **Active Staff**: Number of active barbers
- **Total Revenue**: Sum of all paid appointments
- **Daily Schedule**: Hour-by-hour view of all bookings
- **Date Picker**: View any date's schedule

### Staff Management
- Add new barbers with full credentials
- View all staff members
- Activate/deactivate accounts
- See barber specializations
- Automatic service assignment
- Default availability setup

### Booking System
- Multi-step booking flow
- Real-time availability checking
- Prevents double-booking
- 30-minute time slots
- Service duration respected
- Customer special requests
- Automatic conflict detection

### Appointment Management
- Filter by upcoming/past/all
- View customer details (for staff/admin)
- View barber details (for customers)
- Cancel appointments
- Special request notes
- Payment status tracking

## Security & Privacy

### Role-Based Access Control
- **Customers**: See only their own bookings
- **Barbers**: See only their assigned appointments
- **Admin**: Full system access

### Database Security
- Row Level Security (RLS) enabled on all tables
- Secure authentication via Supabase Auth
- Password hashing and encryption
- Protected API endpoints

### Data Privacy
- Barbers cannot see other barbers' schedules
- Customers cannot see other customers' data
- Email addresses protected
- Phone numbers private

## Business Rules

### Booking Policies
- **Advance Booking**: 8 weeks maximum
- **Minimum Notice**: 2 hours before appointment
- **Time Slots**: 30-minute intervals
- **Cancellation Window**: 24 hours before appointment
- **Deposit**: 20% of service price (configured)

### Default Hours
- **Monday-Friday**: 9 AM - 6 PM
- **Saturday**: 9 AM - 6 PM
- **Sunday**: Closed

(Configurable per barber through stylist_availability table)

## Database Schema

### Core Tables
- **profiles**: User accounts with role-based access
- **stylists**: Barber profiles and information
- **services**: Service catalog (haircuts, beard trims, etc.)
- **service_categories**: Service organization
- **appointments**: All bookings
- **stylist_availability**: Weekly schedules
- **stylist_time_off**: Vacation/time off tracking
- **business_settings**: System configuration

### Sample Services (Pre-populated)
**Haircuts**
- Men's Haircut: $35 (30 min)
- Women's Haircut: $55 (45 min)
- Children's Haircut: $25 (30 min)

**Styling**
- Blow Dry: $40 (30 min)
- Updo: $80 (60 min)

**Coloring**
- Full Color: $120 (120 min)
- Highlights: $100 (90 min)
- Root Touch-up: $65 (60 min)

**Treatments**
- Deep Conditioning: $35 (30 min)
- Keratin Treatment: $200 (120 min)

## Admin Operations

### Adding a Barber
1. **Staff Management** → **Add Barber**
2. Fill in required information
3. System creates:
   - Auth account
   - Profile with 'stylist' role
   - Stylist record
   - Service assignments
   - Default availability

### Managing Services
1. **Services** → **Add Service**
2. Select category
3. Set name, description, duration, price
4. Activate/deactivate as needed

### Viewing All Bookings
1. **Dashboard** for daily overview
2. **All Appointments** for filtered lists
3. Select date to view specific day
4. See all barbers' appointments together

### Managing Staff
1. View all barbers
2. Activate/deactivate accounts
3. See specializations and bio
4. Monitor barber assignments

## Barber Operations

### Viewing Schedule
- See only assigned appointments
- Filter upcoming/past
- View customer details
- See special requests

### Managing Appointments
- View booking details
- Cancel if necessary
- See payment status

## Customer Operations

### Booking Process
1. Select service from catalog
2. Choose preferred barber
3. Pick available date
4. Select time slot
5. Add special requests (optional)
6. Confirm booking

### Managing Bookings
- View all appointments
- Filter upcoming/past
- Cancel bookings
- Update profile

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Icons**: Lucide React
- **Deployment Ready**: Vercel, Netlify compatible

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.tsx    # Calendar view & stats
│   │   ├── StaffManagement.tsx   # Add/manage barbers
│   │   └── AdminSetup.tsx        # Admin account creation
│   ├── appointments/
│   │   └── AppointmentsView.tsx  # View/manage bookings
│   ├── auth/
│   │   └── AuthForm.tsx          # Login/signup
│   ├── booking/
│   │   └── BookingView.tsx       # Customer booking flow
│   ├── layout/
│   │   └── Layout.tsx            # Role-based navigation
│   ├── profile/
│   │   └── ProfileView.tsx       # User profile
│   └── services/
│       └── ServicesView.tsx      # Service management
├── contexts/
│   └── AuthContext.tsx           # Authentication state
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── database.types.ts        # TypeScript types
│   └── utils.ts                 # Helper functions
└── App.tsx                       # Main app component
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run typecheck # Type checking
```

## Deployment

### Environment Variables Required
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

## Future Enhancements

### Phase 2 (Planned)
- [ ] Stripe payment integration
- [ ] Email notifications (confirmations, reminders)
- [ ] SMS notifications via Twilio
- [ ] Barber availability management UI
- [ ] Walk-in appointment tracking

### Phase 3 (Planned)
- [ ] Business analytics dashboard
- [ ] Revenue reports
- [ ] Customer retention metrics
- [ ] Popular services tracking
- [ ] Peak hours analysis

### Phase 4 (Planned)
- [ ] Waitlist functionality
- [ ] Customer loyalty program
- [ ] Calendar export (iCal, Google Calendar)
- [ ] Mobile app (React Native)
- [ ] Review/rating system

## Troubleshooting

### Can't log in as admin
1. Verify role is set to 'admin' in profiles table
2. Check email/password are correct
3. Try logging out completely and back in
4. Clear browser cache

### Navigation not showing
1. Check user role in database
2. Verify profile exists in profiles table
3. Check browser console for errors
4. Ensure auth session is active

### Can't add barbers
1. Verify you're logged in as admin
2. Check Supabase Auth is enabled
3. Ensure email doesn't already exist
4. Check browser console for errors

### Bookings not appearing
1. Verify RLS policies are active
2. Check appointment date is correct
3. Ensure barber has availability
4. Check user role and permissions

## Support

For setup assistance:
- See **ADMIN_SETUP.md** for admin account creation
- Check **SETUP.md** for general setup guide
- Review database migrations in `supabase/migrations/`
- Check Supabase dashboard for database issues

## License

MIT License - Free to use for your barbershop business

## Credits

Built with modern web technologies for professional barbershop management.

---

**Ready to get started?** Follow the Quick Start guide above and you'll have a fully functional barbershop booking system in minutes!
