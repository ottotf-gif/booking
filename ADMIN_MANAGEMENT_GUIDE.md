# Administrative Management System Guide

This guide explains the comprehensive administrative system for managing services and barbers with both permanent deletion and temporary deactivation capabilities.

## Overview

The system provides administrators with two distinct management capabilities:

1. **Temporary Deactivation**: Hide items from customers without permanently deleting them
2. **Permanent Deletion**: Completely remove items from the system

## Features

### Staff Management

Located in the admin panel under "Staff Management", this section allows you to:

#### Filter Staff Members
- **Active**: View only currently active barbers
- **Inactive**: View only deactivated barbers
- **All**: View all barbers regardless of status

#### Manage Individual Barbers
Each barber card displays:
- Name, email, and profile information
- Active/Inactive status badge
- Specializations
- Bio

#### Available Actions

**For Active Barbers:**
- **Deactivate** (Orange button with pause icon)
  - Temporarily disables the barber
  - They remain in the database
  - They will not appear in booking flows
  - Can be reactivated later
  - Shows moderate warning confirmation

- **Delete** (Red button with trash icon)
  - Permanently removes the barber from the system
  - Deletes their profile and all associated data
  - Cannot be undone
  - Shows strong warning confirmation

**For Inactive Barbers:**
- **Reactivate** (Green button with check icon)
  - Makes the barber available for bookings again
  - Shows confirmation dialog

- **Delete** (Red button with trash icon)
  - Same permanent deletion as above

### Services Management

Located in the admin panel under "Services", this section allows you to:

#### Filter Services
- **Active**: View only services available for booking
- **Inactive**: View only deactivated services
- **All**: View all services regardless of status

#### Manage Individual Services
Each service card displays:
- Service name with Active/Inactive badge
- Description
- Duration and price
- Category

#### Available Actions

**For Active Services:**
- **Edit** (Pencil icon in top right)
  - Modify service details
  - Change active status via checkbox

- **Deactivate** (Orange button)
  - Temporarily hides service from customers
  - Service remains in database
  - Not available for new bookings
  - Can be reactivated later
  - Shows moderate warning confirmation

- **Delete** (Red button)
  - Permanently removes service
  - Deletes all service data
  - Cannot be undone
  - Shows strong warning confirmation

**For Inactive Services:**
- **Edit** (Pencil icon)
  - Modify service details

- **Reactivate** (Green button)
  - Makes service available for bookings
  - Shows confirmation dialog

- **Delete** (Red button)
  - Same permanent deletion as above

## User Experience Design

### Visual Distinction

The system uses clear visual cues to distinguish between different actions:

- **Delete Actions** (Red)
  - Red background and borders
  - Red trash icon
  - Strong warning language
  - Emphasis on permanence

- **Deactivate Actions** (Orange)
  - Orange background and borders
  - Pause/stop icon
  - Moderate warning language
  - Emphasis on reversibility

- **Reactivate Actions** (Green)
  - Green background and borders
  - Check/play icon
  - Positive confirmation language
  - Emphasis on restoration

### Confirmation Modals

All actions require confirmation through dedicated modal dialogs:

#### Delete Confirmation
- Large red warning icon
- Bold "This action cannot be undone!" message
- Details about data loss and system impact
- Clear display of item being deleted
- Two-button interface: Cancel and "Delete Permanently"

#### Deactivate Confirmation
- Orange warning icon
- Explanation that item will be hidden from customers
- Note that item can be reactivated later
- Clear display of item being deactivated
- Two-button interface: Cancel and "Deactivate"

#### Reactivate Confirmation
- Green check icon
- Confirmation that item will be visible again
- Immediate availability notice
- Clear display of item being reactivated
- Two-button interface: Cancel and "Reactivate"

## Safety Features

### Preventing Accidental Deletions

1. **Separate Actions**: Delete and deactivate are completely separate buttons
2. **Color Coding**: Red exclusively for destructive actions
3. **Double Confirmation**: All actions require modal confirmation
4. **Clear Warnings**: Explicit language about consequences
5. **Item Display**: Shows exact item being affected
6. **Processing States**: Buttons disabled during processing

### Data Integrity

- **Deactivation**: Items marked `active = false` in database
- **Deletion**: Items completely removed via CASCADE constraints
- **RLS Policies**: Only active items shown to non-admin users
- **Existing Appointments**: Referenced via foreign key constraints

## Database Schema

The system uses the existing `active` boolean field in both tables:

### Services Table
- `active` (boolean): Controls visibility and availability
- Default: `true` for new services

### Stylists Table
- `active` (boolean): Controls visibility and availability
- Default: `true` for new barbers

## Best Practices

### When to Deactivate
- Seasonal services (e.g., holiday specials)
- Temporarily unavailable barbers (e.g., on leave)
- Testing new services before full launch
- Services pending price changes
- Staff on temporary leave

### When to Delete
- Permanently discontinued services
- Staff who have permanently left
- Duplicate entries
- Data cleanup operations
- Services that were created in error

### Workflow Recommendations

1. **Default to Deactivation**: When in doubt, deactivate rather than delete
2. **Archive Before Delete**: Consider exporting data before permanent deletion
3. **Check Dependencies**: Review existing appointments before deleting
4. **Communicate Changes**: Inform team before deactivating or deleting items
5. **Regular Reviews**: Periodically review inactive items for potential deletion

## Technical Implementation

### Components

- **ConfirmationModal** (`src/components/common/ConfirmationModal.tsx`)
  - Reusable confirmation dialog
  - Supports delete, deactivate, and reactivate types
  - Configurable messages and styling
  - Processing state management

- **StaffManagement** (`src/components/admin/StaffManagement.tsx`)
  - Enhanced with filtering
  - Delete and deactivate actions
  - Confirmation modal integration

- **ServicesView** (`src/components/services/ServicesView.tsx`)
  - Enhanced with filtering
  - Delete and deactivate actions
  - Confirmation modal integration

### State Management

Each component maintains:
- Filter state (all/active/inactive)
- Confirmation state (modal visibility, action type, target item)
- Processing state (loading indicators during operations)

### API Operations

#### Deactivate/Reactivate
```typescript
await supabase
  .from('table_name')
  .update({ active: !currentStatus })
  .eq('id', itemId);
```

#### Delete
```typescript
await supabase
  .from('table_name')
  .delete()
  .eq('id', itemId);
```

## Future Enhancements

Potential improvements for future versions:

1. **Audit Trail**: Log all deactivation and deletion actions
2. **Bulk Operations**: Select and manage multiple items at once
3. **Soft Delete**: Add `deleted_at` timestamp field for better audit trail
4. **Restore Capability**: Undelete recently deleted items
5. **Export Data**: Download item data before deletion
6. **Impact Analysis**: Show number of affected appointments before deletion
7. **Scheduled Actions**: Schedule deactivation/reactivation for future dates

## Support

For questions or issues with the administrative system, refer to:
- Database schema: `supabase/migrations/20260118174703_create_salon_booking_schema.sql`
- Admin setup guide: `ADMIN_SETUP.md`
- Main documentation: `README.md`
