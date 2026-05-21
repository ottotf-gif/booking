# Admin Quick Reference: Delete vs Deactivate

## At a Glance

| Action | Color | Icon | Reversible | Data Kept | Use When |
|--------|-------|------|------------|-----------|----------|
| **Deactivate** | Orange | Pause/Stop | Yes | Yes | Temporary removal, might return |
| **Reactivate** | Green | Check/Play | N/A | Yes | Restoring a deactivated item |
| **Delete** | Red | Trash | No | No | Permanent removal, never returning |

## Quick Decision Guide

### Choose DEACTIVATE if:
- Staff member is on vacation or leave
- Service is temporarily unavailable
- Testing or preparing for changes
- Might want to restore later
- Need to keep historical data

### Choose DELETE if:
- Staff member has permanently left
- Service is discontinued forever
- Cleaning up duplicate entries
- Removing test data
- Certain you'll never need it again

## Action Buttons

### Staff Management
```
[Active Barber]
┌─────────────────────────────────┐
│ ⏸ Deactivate │ 🗑 Delete      │
└─────────────────────────────────┘
   Orange          Red

[Inactive Barber]
┌─────────────────────────────────┐
│ ✓ Reactivate  │ 🗑 Delete      │
└─────────────────────────────────┘
   Green           Red
```

### Services Management
```
[Active Service]
┌─────────────────────────────────┐
│ ⏸ Deactivate │ 🗑 Delete      │
└─────────────────────────────────┘
   Orange          Red

[Inactive Service]
┌─────────────────────────────────┐
│ ✓ Reactivate  │ 🗑 Delete      │
└─────────────────────────────────┘
   Green           Red
```

## Filters

Use the filter buttons at the top of each page:

- **Active**: See what customers can book (default view)
- **Inactive**: See what's temporarily hidden
- **All**: See everything in the system

## Confirmation Messages

### Delete Confirmation
```
⚠️ This action cannot be undone!
All data will be permanently removed from the system.
Existing appointments may be affected.
```

### Deactivate Confirmation
```
⚠️ This item will be hidden from customers
The item remains in the database but won't be available
for new bookings. You can reactivate it later.
```

### Reactivate Confirmation
```
✓ This item will be visible to customers again
The item will be available for new bookings immediately.
```

## Safety Checklist

Before **deleting** anything, ask yourself:

- [ ] Is this item really never coming back?
- [ ] Have I checked for existing appointments?
- [ ] Have I communicated this change to the team?
- [ ] Do I need to export any data first?
- [ ] Would deactivation be better?

## Common Workflows

### Seasonal Service
1. Create service → Use normally
2. Season ends → **Deactivate** (not delete)
3. Next season → **Reactivate**

### Staff Leave
1. Staff going on leave → **Deactivate**
2. Staff returns → **Reactivate**

### Staff Termination
1. Staff permanently leaves → **Delete**
2. Note: Consider keeping inactive for historical records

### Discontinued Service
1. Service no longer offered → **Deactivate** first
2. After confirming no issues → **Delete** if needed
3. Or keep inactive for records

## Tips

1. **Start Safe**: When unsure, choose deactivate
2. **Review Regularly**: Check inactive items monthly
3. **Clean Up Carefully**: Only delete after thorough review
4. **Communicate**: Inform team before major changes
5. **Use Filters**: Regularly check what's active/inactive

## Keyboard-Free Flow

1. Click filter button to view desired items
2. Find the item in the list
3. Click the appropriate action button
4. Read the confirmation dialog
5. Click "Cancel" to abort or action button to proceed

## Remember

- **Orange = Temporary** (can undo)
- **Red = Forever** (cannot undo)
- **Green = Restore** (making active again)

When in doubt, deactivate. You can always delete later if needed!
