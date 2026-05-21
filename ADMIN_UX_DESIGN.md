# Administrative UX Design Specification

## Design Philosophy

The administrative management system follows these core principles:

1. **Safety First**: Prevent accidental data loss through clear visual hierarchy
2. **Clear Intent**: Use color and iconography to communicate action consequences
3. **Informed Decisions**: Provide complete context before any action
4. **Reversibility**: Make temporary actions more prominent than permanent ones
5. **Consistency**: Apply the same patterns across all management interfaces

## Color System

### Action Color Mapping

The system uses a three-color semantic system:

#### Red (#DC2626 family)
- **Meaning**: Destructive, permanent, irreversible
- **Use**: Delete actions only
- **Psychology**: Stop, danger, caution required
- **Shades**:
  - Background: `bg-red-50` (#FEF2F2)
  - Border: `border-red-300` (#FCA5A5)
  - Text: `text-red-700` (#B91C1C)
  - Icon: `text-red-600` (#DC2626)
  - Hover: `hover:bg-red-100` (#FEE2E2)

#### Orange (#EA580C family)
- **Meaning**: Cautionary, reversible, temporary
- **Use**: Deactivate actions
- **Psychology**: Pause, warning, think twice
- **Shades**:
  - Background: `bg-orange-50` (#FFF7ED)
  - Border: `border-orange-300` (#FDBA74)
  - Text: `text-orange-700` (#C2410C)
  - Icon: `text-orange-600` (#EA580C)
  - Hover: `hover:bg-orange-100` (#FFEDD5)

#### Green (#16A34A family)
- **Meaning**: Safe, positive, restoration
- **Use**: Reactivate actions
- **Psychology**: Go, proceed, restore
- **Shades**:
  - Background: `bg-green-50` (#F0FDF4)
  - Border: `border-green-300` (#86EFAC)
  - Text: `text-green-700` (#15803D)
  - Icon: `text-green-600` (#16A34A)
  - Hover: `hover:bg-green-100` (#DCFCE7)

### Filter Colors

#### Active Filter (Selected)
- Background: `bg-green-600` (#16A34A)
- Text: `text-white`

#### Inactive Filter (Selected)
- Background: `bg-orange-600` (#EA580C)
- Text: `text-white`

#### All Filter (Selected)
- Background: `bg-slate-900` (#0F172A)
- Text: `text-white`

#### Unselected Filters
- Background: `bg-slate-100` (#F1F5F9)
- Text: `text-slate-700` (#334155)
- Hover: `hover:bg-slate-200` (#E2E8F0)

## Typography

### Hierarchy
- **Page Title**: 3xl (30px), bold, slate-900
- **Section Title**: xl (20px), semibold, slate-900
- **Card Title**: lg (18px), semibold, slate-900
- **Body Text**: base (16px), normal, slate-600
- **Button Text**: sm (14px), medium
- **Badge Text**: xs (12px), medium

### Font Weights
- Bold: 700 (headlines only)
- Semibold: 600 (card titles, section headers)
- Medium: 500 (buttons, labels, badges)
- Normal: 400 (body text)

## Iconography

### Icon-Action Mapping

| Action | Icon | Lucide Component | Size |
|--------|------|------------------|------|
| Delete | Trash Can | `Trash2` | 16px (w-4 h-4) |
| Deactivate | X Circle | `XCircle` | 16px (w-4 h-4) |
| Reactivate | Check Circle | `CheckCircle` | 16px (w-4 h-4) |
| Edit | Pencil | `Edit2` | 16px (w-4 h-4) |
| Add | Plus | `Plus` | 20px (w-5 h-5) |
| Filter | Filter | `Filter` | 20px (w-5 h-5) |
| Warning | Alert Triangle | `AlertTriangle` | 20px (w-5 h-5) |

### Icon Usage Rules
1. Always pair icons with text labels on action buttons
2. Use consistent sizes within the same context
3. Maintain proper spacing (gap-2 for icon-text pairs)
4. Match icon color to button color scheme

## Button Design

### Primary Action Buttons

#### Structure
```
┌────────────────────┐
│ [Icon] Label Text │
└────────────────────┘
```

#### Specifications
- Padding: `px-3 py-2` (12px horizontal, 8px vertical)
- Border Radius: `rounded-lg` (8px)
- Border Width: `border` (1px)
- Font: `text-sm font-medium` (14px, medium weight)
- Gap: `gap-2` (8px between icon and text)
- Transition: `transition-colors`

### Delete Button
```css
Classes:
- flex items-center justify-center gap-2
- px-3 py-2
- text-sm font-medium
- text-red-700 bg-red-50 border border-red-300
- rounded-lg
- hover:bg-red-100 transition-colors
```

### Deactivate Button
```css
Classes:
- flex-1 flex items-center justify-center gap-2
- px-3 py-2
- text-sm font-medium
- text-orange-700 bg-orange-50 border border-orange-300
- rounded-lg
- hover:bg-orange-100 transition-colors
```

### Reactivate Button
```css
Classes:
- flex-1 flex items-center justify-center gap-2
- px-3 py-2
- text-sm font-medium
- text-green-700 bg-green-50 border border-green-300
- rounded-lg
- hover:bg-green-100 transition-colors
```

## Confirmation Modal Design

### Layout Structure
```
┌─────────────────────────────────────┐
│                                     │
│         [Colored Icon Circle]       │
│                                     │
│            Modal Title              │
│                                     │
│         Descriptive Message         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⚠️ Warning Box                │ │
│  │                               │ │
│  │ Bold warning statement        │ │
│  │ Detailed explanation text     │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Item Display Box              │ │
│  │                               │ │
│  │ Item to [action]:             │ │
│  │ [Item Name]                   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌─────────┐  ┌──────────────────┐ │
│  │ Cancel  │  │ [Action Button]  │ │
│  └─────────┘  └──────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Modal Specifications

#### Container
- Max Width: `max-w-md` (448px)
- Padding: `p-6` (24px)
- Background: White
- Border Radius: `rounded-xl` (12px)
- Shadow: Default
- Z-Index: 50

#### Icon Circle
- Size: `w-12 h-12` (48px)
- Border: `border-2`
- Border Radius: `rounded-full`
- Padding: `p-3` (12px)
- Margin Bottom: `mb-4` (16px)

#### Title
- Size: `text-2xl` (24px)
- Weight: `font-bold`
- Color: `text-slate-900`
- Margin Bottom: `mb-2` (8px)

#### Warning Box
- Background: Matches action color (50 shade)
- Border: Matches action color (200 shade)
- Border Width: `border` (1px)
- Border Radius: `rounded-lg` (8px)
- Padding: `p-4` (16px)
- Margin Bottom: `mb-6` (24px)

#### Item Display Box
- Background: `bg-slate-50`
- Border: `border border-slate-200`
- Border Radius: `rounded-lg` (8px)
- Padding: `p-3` (12px)
- Margin Bottom: `mb-6` (24px)

#### Button Container
- Display: `flex`
- Gap: `gap-3` (12px)
- Padding Top: `pt-4` (16px, not always used)

#### Cancel Button
- Flex: `flex-1` (equal width)
- Padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Border: `border-2 border-slate-300`
- Text: `text-slate-700 font-medium`
- Hover: `hover:bg-slate-50`

#### Confirm Button
- Flex: `flex-1` (equal width)
- Padding: `px-4 py-2`
- Background: Action color (600 shade)
- Text: `text-white font-medium`
- Hover: Action color (700 shade)

## Status Badges

### Active Badge
```css
Classes:
- px-2 py-1
- text-xs font-medium
- rounded-full
- bg-green-100 text-green-800
```

### Inactive Badge
```css
Classes:
- px-2 py-1
- text-xs font-medium
- rounded-full
- bg-orange-100 text-orange-700
```

## Filter Tabs

### Layout
```
┌────────────────────────────────────────┐
│ 🔍 Filter:  [Active] [Inactive] [All] │
└────────────────────────────────────────┘
```

### Specifications
- Container: `flex items-center gap-4`
- Label: `text-sm font-medium text-slate-700`
- Button Group: `flex gap-2`
- Individual Buttons:
  - Padding: `px-4 py-2`
  - Border Radius: `rounded-lg`
  - Font: `font-medium text-sm`
  - Transition: `transition-colors`

## Spacing System

### Card Layout
- Card Padding: `p-6` (24px)
- Section Spacing: `space-y-8` (32px between sections)
- Card Grid Gap: `gap-6` (24px)
- Internal Element Gap: `gap-2` (8px) or `gap-4` (16px)

### Page Layout
- Page Padding: Default container padding
- Header Margin Bottom: `mb-6` (24px) or `mb-8` (32px)
- Section Margin Bottom: `mb-6` (24px)

## Responsive Breakpoints

### Grid Systems

#### Staff Cards
- Mobile: `grid-cols-1` (1 column)
- Tablet: `md:grid-cols-2` (2 columns at 768px+)
- Desktop: `lg:grid-cols-3` (3 columns at 1024px+)

#### Service Cards
- Mobile: `grid-cols-1` (1 column)
- Tablet: `md:grid-cols-2` (2 columns at 768px+)
- Desktop: `lg:grid-cols-3` (3 columns at 1024px+)

## Interactive States

### Button States
1. **Default**: Base styling
2. **Hover**: Darker background shade
3. **Focus**: Ring outline (not always visible)
4. **Active/Pressed**: Same as hover
5. **Disabled**: 50% opacity, no hover, cursor not-allowed

### Processing State
- Button Text: "Processing..." or action-specific text
- Button: Disabled state
- Cursor: `cursor-not-allowed`

## Accessibility Considerations

### Color Contrast
- All text meets WCAG AA standards
- Red text on red background: 4.5:1+ ratio
- Orange text on orange background: 4.5:1+ ratio
- Green text on green background: 4.5:1+ ratio

### Focus Indicators
- All interactive elements have focus states
- Keyboard navigation supported
- Tab order follows logical flow

### Screen Reader Support
- Icons paired with text labels
- Modal announcements
- Status badges with clear text
- Loading states announced

## Animation & Transitions

### Standard Transitions
- Duration: 150ms (Tailwind default)
- Property: `transition-colors`
- Timing: ease-in-out

### Modal Animations
- Backdrop: Fade in
- Modal: Slide in from center with fade

### No Animations For
- Layout shifts
- Content reflows
- Filter changes (instant)

## Mobile Considerations

### Touch Targets
- Minimum size: 44x44px (iOS guidelines)
- All buttons exceed minimum
- Adequate spacing between tappable elements

### Modal on Mobile
- Full width minus padding
- Scrollable content area
- Fixed button footer

### Filter Tabs on Mobile
- Horizontal scroll if needed
- Maintain visibility of active state
- Touch-friendly spacing

## Implementation Notes

### Component Structure
```
ConfirmationModal/
├── Backdrop (fixed overlay)
└── Content Container
    ├── Icon Circle
    ├── Title
    ├── Description
    ├── Warning Box
    ├── Item Display
    └── Button Group
        ├── Cancel Button
        └── Confirm Button
```

### State Management
- Modal open/closed state
- Action type (delete/deactivate/reactivate)
- Target item information
- Processing state

### Error Handling
- Failed operations show alert
- Modal remains open on error
- Clear error messaging
- Opportunity to retry

## Future Enhancements

Potential UX improvements:

1. **Toast Notifications**: Success messages after actions
2. **Undo Capability**: Time-limited undo for deactivation
3. **Bulk Actions**: Select multiple items with checkboxes
4. **Keyboard Shortcuts**: Quick access to common actions
5. **Search/Filter**: Find specific items quickly
6. **Sort Options**: Customize item ordering
7. **Animation Polish**: Smooth transitions between states
8. **Loading Skeletons**: Better loading states
9. **Empty State Illustrations**: More engaging empty states
10. **Contextual Help**: Tooltips and help text
