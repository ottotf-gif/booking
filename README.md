# Hair Salon Booking System

A comprehensive, production-ready booking management system designed for hair salons and barbershops. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Customer Portal
- Browse service catalog with pricing and duration
- Book appointments with preferred stylists
- View upcoming and past appointments
- Manage personal profile
- Real-time availability checking
- Appointment cancellation

### Stylist Portal
- View daily schedule
- See assigned appointments
- View customer information
- Manage appointments

### Admin Portal
- Manage service catalog
- Configure pricing and durations
- View all appointments across stylists
- System configuration

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React

## Database Schema

### Core Tables
- **profiles** - Extended user information with role-based access
- **services** - Service catalog with pricing and duration
- **service_categories** - Service categorization
- **stylists** - Stylist profiles and specializations
- **appointments** - Core appointment records
- **stylist_availability** - Weekly availability schedules
- **business_settings** - System configuration

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control (customer, stylist, admin)
- Secure authentication flow

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Environment variables are already configured in `.env`

4. Start the development server:
```bash
npm run dev
```

### Initial Setup

See `SETUP.md` for detailed setup instructions including:
- Creating admin users
- Setting up stylists
- Configuring business hours
- Sample data

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking flow components
│   ├── appointments/   # Appointment management
│   ├── services/       # Service catalog management
│   ├── profile/        # User profile components
│   └── layout/         # Layout components
├── contexts/
│   └── AuthContext.tsx # Authentication context
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── database.types.ts # TypeScript types
└── App.tsx             # Main application component
```

## Key Features Implemented

### Booking Engine
- Multi-step booking process (Service → Stylist → Date/Time → Confirm)
- Real-time availability checking
- Conflict prevention (no double-booking)
- 30-minute time slot intervals
- 8-week advance booking window
- 2-hour minimum notice requirement

### Appointment Management
- View upcoming/past appointments
- Filter by status
- Cancellation capability
- Special request notes
- Payment tracking

### Service Management
- CRUD operations for services
- Category organization
- Active/inactive status
- Pricing and duration configuration

### User Management
- Role-based access (customer, stylist, admin)
- Profile customization
- Secure authentication

## Business Rules

### Booking Policies
- **Advance Booking**: 8 weeks maximum
- **Minimum Notice**: 2 hours
- **Time Slots**: 30-minute intervals
- **Cancellation Deadline**: 24 hours before appointment
- **Deposit**: 20% of service price

### Business Hours
- **Monday-Friday**: 9 AM - 7 PM
- **Saturday**: 9 AM - 6 PM
- **Sunday**: 10 AM - 5 PM

## Roadmap

### Phase 2 (Planned)
- Stripe payment integration
- Email notifications (confirmation, reminders)
- SMS notifications
- Advanced stylist management UI

### Phase 3 (Planned)
- Business analytics dashboard
- Revenue reports
- Customer retention metrics
- Popular services tracking

### Phase 4 (Planned)
- Waitlist functionality
- Customer loyalty program
- Calendar export (iCal, Google Calendar)
- Mobile app optimization

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Contributing

This is a production-ready template for hair salon booking systems. Feel free to customize it for your specific needs.

## License

MIT License - feel free to use this for your salon business!

## Support

For setup assistance, see `SETUP.md` or check the database documentation in the migration files.
