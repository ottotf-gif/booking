# Barber Quick Reference Guide

## Quick Start

### For Barbers

1. **Login** with your stylist account
2. **Navigate** to "Mina Bokningar" (My Schedule)
3. **View** your appointments with filter options
4. **Complete Service**: Click "Utförd & Betald" button after service and payment
   - This marks the appointment as both completed AND paid in one click

### For Admins

1. **Login** with admin account
2. **Dashboard** shows revenue automatically
3. **Revenue** = Last 30 days, completed & paid only

## Button Quick Reference

### Barber Appointment Actions

| Button | Color | Icon | Action |
|--------|-------|------|--------|
| Utförd & Betald | Green-Blue Gradient | ✓ | Mark appointment as completed AND paid (atomic) |
| Ångra | Gray | ✗ | Revert both status and payment to pending |

### Status Badges

**Appointment Status:**
- 🟡 Väntande (Pending) - New appointment
- 🔵 Bekräftad (Confirmed) - Confirmed by system
- 🟢 Utförd (Completed) - Service completed
- 🔴 Inställd (Cancelled) - Cancelled
- ⚫ Utebliven (No Show) - Customer didn't show

**Payment Status:**
- 🟠 Obetald (Pending) - Not yet paid
- 🟢 Betald (Paid) - Payment received
- 🟣 Återbetald (Refunded) - Refunded
- 🔴 Misslyckad (Failed) - Payment failed

## Filter Options

| Filter | Shows |
|--------|-------|
| Kommande (Upcoming) | Future appointments not completed |
| Utförda (Completed) | All completed appointments |
| Alla (All) | All appointments |

## Revenue Calculation

Admin dashboard revenue includes ONLY appointments that meet ALL criteria:
- ✅ Status = Completed (marked by barber)
- ✅ Payment Status = Paid (marked by barber)
- ✅ Date = Within last 30 days

## Common Workflows

### Complete Appointment Workflow
```
1. Provide service to customer
2. Receive payment from customer
3. Click "Utförd & Betald" button
4. Done! Both status and payment updated, revenue is counted
```

### Fix Mistake Workflow
```
1. Find the appointment
2. Click "Ångra" button to revert
3. Both status and payment return to previous state
4. Make corrections as needed
```

## Keyboard Shortcuts

Currently none - all actions via button clicks.

## Mobile Usage

- Fully responsive design
- All features work on mobile
- Touch-friendly button sizes
- Swipe-friendly cards

## Troubleshooting

**Can't see appointments?**
→ Check you're logged in as a barber and have assigned appointments

**Button not working?**
→ Wait for any loading states, or refresh the page

**Revenue not updating?**
→ Both status AND payment must be marked, and within 30 days

**Wrong appointment status?**
→ Click the "Ångra" button to undo both changes

## Important Notes

⚠️ **Cannot edit cancelled appointments** - Buttons are disabled

⚠️ **Changes are immediate** - No undo except using revert buttons

⚠️ **Revenue is rolling** - Always last 30 days, not calendar month

✅ **Real-time updates** - Dashboard updates when you mark appointments

✅ **Secure** - Can only update your own appointments

## Technical Info

**Files Modified:**
- `src/components/barber/BarberAppointmentsView.tsx` (NEW)
- `src/components/admin/AdminDashboard.tsx` (UPDATED)
- `src/App.tsx` (UPDATED)

**Database Fields Used:**
- `appointments.status` - For completion tracking
- `appointments.payment_status` - For payment tracking
- `appointments.appointment_date` - For date filtering

**Security:**
- Row Level Security (RLS) active
- Barbers can only update their own appointments
- Admins can see all data

## Support

Need help? Check:
1. Full documentation: `BARBER_APPOINTMENT_MANAGEMENT.md`
2. Admin guide: `ADMIN_MANAGEMENT_GUIDE.md`
3. Main readme: `README.md`
