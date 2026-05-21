# Booking System Guide

This comprehensive guide explains how the barbershop booking system handles both guest bookings and manual admin bookings.

## Overview

The system supports three booking scenarios:

1. **Guest Bookings** - Customers can book without creating an account
2. **Registered User Bookings** - Customers with accounts can book online
3. **Manual Admin Bookings** - Admins can create bookings for phone-in customers

---

## Guest Booking Process

### For Customers

Customers can book appointments without creating a full account upfront. Here's how:

#### Step 1: Access the Booking System
- Visit the booking website
- No sign-in required to start browsing

#### Step 2: Select Service
- Choose from available services (haircuts, styling, treatments, etc.)
- View service duration and pricing

#### Step 3: Choose Your Barber
- Browse available barbers
- View their specializations and experience

#### Step 4: Pick Date & Time
- Select your preferred date (up to 8 weeks in advance)
- Choose from available 15-minute time slots
- Real-time availability checking prevents conflicts

#### Step 5: Guest Checkout
When you reach the confirmation step:
- Click "Continue to Complete Booking"
- Provide minimal required information:
  - **Full Name** - For appointment identification
  - **Email Address** - For booking confirmation and reminders
  - **Phone Number** - For appointment updates

#### Step 6: Confirmation
- Appointment is instantly confirmed
- Confirmation email sent to provided address
- Booking reference number generated

### Guest Account Benefits

✅ **Quick Checkout** - Book in minutes without password setup
✅ **Instant Confirmation** - Immediate booking confirmation
✅ **Email Notifications** - Receive reminders and updates
✅ **Future Account Option** - Can create full account later

### Converting Guest to Full Account

Guests can later create a full account by:
1. Using "Forgot Password" feature with their email
2. Setting a password to unlock full features:
   - View appointment history
   - Manage upcoming bookings
   - Save preferences
   - Faster future bookings

---

## Manual Admin Booking Process

### For Administrators

Admins can create bookings on behalf of customers who call in. This process maintains the same data quality as online bookings.

#### Step 1: Access Manual Booking
- Sign in as admin
- Navigate to "Manual Booking" from dashboard

#### Step 2: Select Date
- Choose the appointment date
- System shows availability up to 8 weeks ahead

#### Step 3: Select Time Slot
- View real-time availability grid
- Color-coded indicators:
  - 🟢 **Green** - Fully available
  - 🟡 **Amber** - Partially booked
  - ⚪ **Gray** - Fully booked/blocked
- Shows available barber count for each slot

#### Step 4: Choose Service
- Select from active services
- Duration and pricing displayed

#### Step 5: Select Barber
- System shows only available barbers for selected time
- Automatically checks for conflicts
- Displays barber availability status

#### Step 6: Select or Create Customer

**Existing Customer:**
- Search by name, email, or phone
- Select from customer list

**New Customer:**
- Click "New Customer" button
- Enter required information:
  - Full Name
  - Email Address
  - Phone Number
- Temporary account created automatically
- Customer can set password later

#### Step 7: Confirm Booking
Review all details:
- Customer information
- Service details
- Barber assignment
- Date and time
- Total price and deposit amount

Click "Create Appointment" to finalize.

#### Step 8: Post-Booking
- Appointment created with "confirmed" status
- Confirmation details available immediately
- Customer receives email notification
- Appointment appears in admin dashboard

### Admin Booking Features

✅ **Search Existing Customers** - Quick customer lookup
✅ **Create New Customers** - Add customers on the fly
✅ **Real-Time Availability** - Prevents double-booking
✅ **Conflict Prevention** - Automatic scheduling validation
✅ **Complete Control** - Full access to all time slots
✅ **Instant Confirmation** - No approval needed

---

## Booking Business Rules

### Timing Requirements
- **Advance Booking**: Up to 8 weeks ahead
- **Minimum Notice**: 2 hours (guest bookings start next day)
- **Time Slots**: 15-minute intervals
- **Operating Hours**: 9:00 AM - 6:00 PM (adjustable)

### Payment Requirements
- **Deposit**: 20% of total service price
- **Payment Status**: Tracked separately from booking
- **Cancellation Policy**: 24-hour notice required

### Booking Status Flow
1. **Confirmed** - Booking created (default for all bookings)
2. **Completed** - Service rendered
3. **Cancelled** - Customer or admin cancelled
4. **No Show** - Customer didn't appear

---

## Data Accuracy & Privacy

### Customer Information Security
- All customer data encrypted at rest
- Role-based access control (RLS) enforced
- Customers can only access their own bookings
- Admins have full system access for support

### Data Quality Standards
Both booking methods maintain:
- **Complete customer profiles** with contact info
- **Accurate scheduling** with conflict prevention
- **Service tracking** for business analytics
- **Payment status** for financial records
- **Audit trails** for all booking activities

### Compliance
- GDPR-compliant data handling
- Customer data privacy maintained
- Secure authentication for all accounts
- Regular data backups

---

## Troubleshooting

### Guest Booking Issues

**"Email already registered"**
- This email has an existing account
- Option 1: Sign in with existing account
- Option 2: Use different email for guest booking

**Time slot no longer available**
- Someone else booked simultaneously
- System automatically refreshes availability
- Select a different time slot

### Admin Booking Issues

**No customers found**
- Customer doesn't exist in system
- Use "New Customer" button to create profile

**Barber unavailable**
- Barber already has conflicting appointment
- Barber has blocked time on calendar
- Choose different barber or time slot

**Cannot create booking**
- Check all required fields completed
- Verify no scheduling conflicts exist
- Ensure customer profile is valid

---

## Best Practices

### For Customers (Guest Booking)
- ✅ Provide accurate contact information
- ✅ Check email for confirmation
- ✅ Note your booking reference number
- ✅ Arrive 5-10 minutes early
- ✅ Contact shop if you need to cancel

### For Administrators (Manual Booking)
- ✅ Verify customer information carefully
- ✅ Double-check appointment details before confirming
- ✅ Communicate deposit requirements clearly
- ✅ Provide customer with confirmation details
- ✅ Note any special requests in booking
- ✅ Create customer profiles for repeat callers

---

## Contact & Support

For booking assistance:
- **Customers**: Contact the barbershop directly
- **Admins**: Access admin help documentation
- **Technical Issues**: Contact system administrator

---

## System Features Summary

| Feature | Guest Booking | Admin Manual Booking |
|---------|---------------|---------------------|
| Account Required | No (optional later) | Admin account required |
| Customer Info Collection | Minimal (name, email, phone) | Full profile creation |
| Real-Time Availability | ✅ Yes | ✅ Yes |
| Conflict Prevention | ✅ Automatic | ✅ Automatic |
| Confirmation Email | ✅ Sent automatically | ✅ Sent automatically |
| Create New Customers | N/A | ✅ Yes |
| Deposit Tracking | ✅ Yes | ✅ Yes |
| Booking Modifications | Limited | Full access |
| View History | After account creation | All bookings visible |

---

*Last Updated: January 2026*
