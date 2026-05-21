# Admin Account Setup - Barbershop Booking System

## Quick Admin Account Creation

To create the admin account with your specified credentials, follow these steps:

### Option 1: Using the Sign-Up Form (Recommended)

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Sign up with admin credentials:**
   - Email: `otto.tf@hotmail.com`
   - Password: `Probarber`
   - Full Name: `Otto` (or your preferred name)

3. **Update the account to admin role:**

   After signing up, you need to change the role to admin using the Supabase dashboard or by running this SQL query:

   ```sql
   -- Update the user role to admin
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'otto.tf@hotmail.com';
   ```

### Option 2: Using Supabase Auth API

If you prefer to create the account programmatically:

1. Open your browser's developer console on the login page
2. Paste and run this code:

```javascript
// Sign up the admin user
const { data, error } = await supabase.auth.signUp({
  email: 'otto.tf@hotmail.com',
  password: 'Probarber',
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('User created:', data);

  // Create admin profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: 'otto.tf@hotmail.com',
      full_name: 'Otto',
      role: 'admin',
    });

  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('Admin account created successfully!');
  }
}
```

### Option 3: Using SQL (Direct Database)

Execute these SQL commands in your Supabase SQL editor:

```sql
-- Note: First create the user through Supabase Auth UI or API
-- Then run this to update the profile:

UPDATE profiles
SET role = 'admin'
WHERE email = 'otto.tf@hotmail.com';
```

## Verifying Admin Access

Once the admin account is created:

1. **Sign in** with:
   - Email: `otto.tf@hotmail.com`
   - Password: `Probarber`

2. **You should see the Admin Dashboard** with:
   - Dashboard with calendar view
   - Staff Management
   - Services Management
   - All Appointments view
   - Profile settings

## Admin Capabilities

As an admin, you can:

### 1. View Dashboard
- See today's bookings count
- View upcoming appointments
- Track active staff
- Monitor total revenue
- View daily schedule with all bookings

### 2. Manage Staff (Barbers)
- Add new barbers by entering:
  - Email address
  - Password
  - Full name
  - Phone number
  - Bio
  - Specializations
- View all staff members
- Activate/deactivate staff accounts
- Automatically assign services to new barbers
- Set default availability (Mon-Fri, 9 AM - 6 PM)

### 3. Manage Services
- Add/edit/delete services
- Set pricing and duration
- Organize by categories
- Activate/deactivate services

### 4. View All Appointments
- See all bookings across all staff
- Filter by upcoming/past/all
- View customer and barber details
- Cancel appointments if needed

## Adding Your First Barber

After logging in as admin:

1. Navigate to **Staff Management**
2. Click **Add Barber**
3. Fill in the form:
   - Full Name: (e.g., "John Smith")
   - Email: (e.g., "john@barbershop.com")
   - Password: (create a secure password for the barber)
   - Phone: (optional)
   - Bio: (e.g., "Experienced barber with 10 years...")
   - Specializations: (e.g., "Haircuts, Beard Trimming, Coloring")
4. Click **Add Barber**

The barber will:
- Receive an account with login credentials
- Be assigned all active services
- Have Mon-Fri availability (9 AM - 6 PM) by default
- Be able to log in and view their own schedule

## Barber Login Experience

When a barber logs in, they will see:
- **My Schedule** - Only their assigned appointments
- **Profile** - Their personal profile settings

They will NOT see:
- Other barbers' appointments
- Admin dashboard
- Staff management
- Services management

## Security Notes

- Passwords must be at least 6 characters
- Each user role has specific permissions (RLS enforced)
- Staff can only view their own appointments
- Customers can only view their own bookings
- Only admins have full system access

## Troubleshooting

### "Invalid login credentials"
- Make sure you've updated the role to 'admin' in the database
- Check that email confirmation is disabled in Supabase (it is by default)

### "No navigation items showing"
- Verify the profile role is set to 'admin'
- Try logging out and back in
- Check browser console for errors

### "Can't add barbers"
- Ensure you're logged in as admin
- Check that Supabase Auth is properly configured
- Verify email doesn't already exist

## Support

For any issues:
1. Check the browser console for errors
2. Verify Supabase connection in .env file
3. Ensure database migrations have run successfully
4. Check that RLS policies are in place

## Next Steps

Once your admin account is set up:
1. Add a few services (or use the pre-populated ones)
2. Create barber accounts for your staff
3. Have barbers log in to verify they can see their schedules
4. Test the booking flow as a customer
5. Monitor the dashboard to see all bookings

Your barbershop booking system is ready to use!
