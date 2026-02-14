# Design Document: UI Modernization

## Overview

This design document outlines the technical approach for modernizing the WFM application's user interface. The modernization is purely visual - updating CSS classes, colors, transitions, and styling patterns to match the polished design demonstrated in the WFM v2 prototype. No functionality, business logic, or data structures will be modified.

The approach is systematic: update each component file by replacing old CSS classes with modern equivalents, following consistent patterns throughout the application. All changes are localized to className attributes and style properties.

## Architecture

### Design Principles

1. **Visual-Only Updates**: All changes are limited to CSS classes, inline styles, and visual presentation
2. **Component-by-Component**: Update each component file independently to minimize risk
3. **Pattern Consistency**: Apply the same styling patterns across similar UI elements
4. **Dark Mode First**: Ensure all updates include proper dark mode variants
5. **Accessibility Preservation**: Maintain all existing ARIA labels, semantic HTML, and keyboard navigation
6. **Unified Design System**: Every component must follow the exact same patterns defined in the Design System section below

## Design System (Single Source of Truth)

**CRITICAL**: This section defines the EXACT CSS classes to use for every UI element type. All components MUST use these patterns consistently. No variations allowed.

### Color Palette

**Brand Colors**:
- Primary: `indigo-600`, `indigo-700`, `indigo-500`, `indigo-50`, `indigo-100`
- Never use: `primary-*` (deprecated)

**Neutral Colors**:
- Backgrounds: `slate-50`, `slate-100`, `slate-800`, `slate-900`, `slate-950`
- Text: `slate-900`, `slate-700`, `slate-600`, `slate-500`, `slate-400`, `slate-300`, `slate-100`, `white`
- Borders: `slate-200`, `slate-300`, `slate-600`, `slate-700`, `slate-800`
- Never use: `gray-*` (deprecated, replace with `slate-*`)

**Semantic Colors**:
- Success: `green-100`, `green-700`, `green-900/30`, `green-400`, `green-600`, `green-50`, `green-900/20`
- Error: `red-100`, `red-700`, `red-900/30`, `red-400`, `red-600`, `red-50`, `red-900/20`
- Warning: `yellow-100`, `yellow-700`, `yellow-900/30`, `yellow-400`, `amber-600`, `amber-50`, `amber-900/20`
- Info: `blue-100`, `blue-700`, `blue-900/30`, `blue-400`, `blue-600`, `blue-50`, `blue-900/20`

### Universal Patterns

**Every Component Must Use These Exact Patterns**:

#### 1. Containers & Cards
```tsx
// Standard card
className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"

// Card with padding
className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"

// Interactive card (clickable/hoverable)
className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"

// Card header
className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"

// Card footer
className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
```

#### 2. Buttons
```tsx
// Primary button
className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors font-medium"

// Secondary button
className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-4 py-2 transition-colors font-medium"

// Danger button
className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors font-medium"

// Icon button
className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"

// Disabled state (add to any button)
className="... disabled:opacity-50 disabled:cursor-not-allowed"

// Button with icon
className="flex items-center gap-2 ..."
```

#### 3. Tables
```tsx
// Table container
className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"

// Table element
className="w-full text-sm text-left"

// Table header
className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800"

// Table header cell
className="px-6 py-3 font-medium"

// Table body
className="divide-y divide-slate-100 dark:divide-slate-800"

// Table row
className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"

// Table cell
className="px-6 py-4 text-slate-900 dark:text-slate-100"

// Table cell (secondary text)
className="px-6 py-4 text-slate-600 dark:text-slate-300"
```

#### 4. Modals
```tsx
// Modal overlay
className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"

// Modal container
className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800"

// Modal header
className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"

// Modal title
className="text-xl font-bold text-slate-900 dark:text-white"

// Modal body
className="p-6"

// Modal footer
className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3"
```

#### 5. Form Inputs
```tsx
// Text input
className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"

// Select input
className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"

// Textarea
className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"

// Input label
className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"

// Input helper text
className="text-xs text-slate-500 dark:text-slate-400 mt-1"

// Input error text
className="text-xs text-red-600 dark:text-red-400 mt-1"
```

#### 6. Status Badges
```tsx
// Badge base (always include)
className="px-2 py-1 text-xs font-medium rounded-full"

// Success/Approved
className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"

// Error/Rejected
className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"

// Warning/Pending
className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"

// Info
className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"

// Neutral
className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
```

#### 7. Typography
```tsx
// Page heading (h1)
className="text-2xl font-bold text-slate-900 dark:text-white"

// Section heading (h2)
className="text-xl font-bold text-slate-900 dark:text-white"

// Subsection heading (h3)
className="text-lg font-semibold text-slate-900 dark:text-white"

// Body text
className="text-sm text-slate-600 dark:text-slate-300"

// Secondary text
className="text-sm text-slate-500 dark:text-slate-400"

// Muted text
className="text-xs text-slate-400 dark:text-slate-500"

// Description text (under headings)
className="text-slate-500 dark:text-slate-400"
```

#### 8. Navigation
```tsx
// Sidebar container
className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"

// Navigation item (active)
className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-lg transition-colors"

// Navigation item (inactive)
className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors"

// Mobile menu overlay
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"

// Mobile menu container
className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out"
```

#### 9. Icons
```tsx
// Icon container (with background)
className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20"

// Icon color (primary)
className="text-indigo-600 dark:text-indigo-400"

// Icon color (secondary)
className="text-slate-400 dark:text-slate-500"

// Icon color (success)
className="text-green-600 dark:text-green-400"

// Icon color (error)
className="text-red-600 dark:text-red-400"

// Icon with text
className="flex items-center gap-2"
```

#### 10. Loading States
```tsx
// Spinner
className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"

// Loading container
className="flex items-center justify-center h-64"

// Skeleton (shimmer effect)
className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded"
```

#### 11. Dividers
```tsx
// Horizontal divider
className="border-t border-slate-200 dark:border-slate-800"

// Vertical divider
className="border-l border-slate-200 dark:border-slate-800"
```

#### 12. Spacing
```tsx
// Section spacing (vertical)
className="space-y-6"

// Grid gaps
className="gap-4"  // for cards
className="gap-6"  // for major sections

// Padding
className="p-4"   // small
className="p-6"   // standard
className="p-8"   // large
```

### Verification Checklist

Before marking any task complete, verify:
- [ ] All colors use indigo/slate palette (no primary-*, no gray-*)
- [ ] Every element has dark mode variants
- [ ] All interactive elements have transition classes
- [ ] All patterns match the Design System exactly
- [ ] No custom variations or "close enough" implementations
- [ ] Consistent spacing and sizing across similar elements

### Technology Stack

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS utility classes
- **Icons**: Existing icon library (no changes)
- **Components**: Existing component structure (no refactoring)

### File Organization

The WFM application follows this structure:
```
WFM/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout and sidebar
│   ├── pages/
│   │   ├── Dashboard.tsx       # Dashboard page
│   │   ├── Schedule/
│   │   │   └── Schedule.tsx    # Schedule management
│   │   ├── LeaveRequests/      # Leave request pages
│   │   ├── SwapRequests/       # Swap request pages
│   │   ├── Settings.tsx        # Settings page
│   │   ├── BreakSchedule.tsx   # Break schedule page
│   │   └── Headcount/
│   │       └── EmployeeDirectory.tsx
│   └── index.css               # Global styles
```

## Components and Interfaces

### 1. Color Scheme Updates

**Current State**: Uses generic `primary-*` color classes
**Target State**: Uses `indigo-*` and `slate-*` color palette

**Pattern Mapping**:
```
primary-600 → indigo-600
primary-700 → indigo-700
primary-50 → indigo-50
primary-100 → indigo-100
primary-500 → indigo-500

gray-* → slate-* (for most neutral colors)
```

**Application Strategy**:
- Search and replace `primary-` with `indigo-` in all component files
- Update `gray-` to `slate-` for backgrounds, borders, and text colors
- Maintain semantic colors (green, red, amber, blue) for status indicators

### 2. Layout Component Modernization

**File**: `src/components/Layout.tsx`

**Current Issues**:
- Basic sidebar styling
- Limited dark mode support
- No smooth transitions
- Generic color scheme

**Design Updates**:

**Sidebar Container**:
```tsx
// Current
className="hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200"

// Updated
className="hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out"
```

**Navigation Items**:
```tsx
// Current (active)
className="bg-primary-50 text-primary-700 shadow-sm"

// Updated (active)
className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-lg transition-colors"

// Current (inactive)
className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"

// Updated (inactive)
className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors"
```

**Mobile Menu**:
```tsx
// Current overlay
className="fixed inset-0 bg-gray-900/50 z-40"

// Updated overlay
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"

// Current menu
className="fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform"

// Updated menu
className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 transform transition-transform duration-200 ease-in-out"
```

**Header**:
```tsx
// Current
className="bg-white/80 backdrop-blur-md border-b border-gray-200"

// Updated
className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
```

### 3. Card and Container Styling

**Pattern for All Cards**:
```tsx
// Current
className="bg-white shadow rounded-lg"

// Updated
className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
```

**Interactive Cards** (Dashboard action cards):
```tsx
// Current
className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"

// Updated
className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
```

**Card Headers**:
```tsx
// Current
className="px-4 py-3 border-b border-gray-200"

// Updated
className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
```

### 4. Button Styling

**Primary Buttons**:
```tsx
// Current
className="bg-primary-600 hover:bg-primary-700 text-white"

// Updated
className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors"
```

**Secondary Buttons**:
```tsx
// Current
className="text-gray-700 hover:text-gray-900"

// Updated
className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-4 py-2 transition-colors"
```

**Icon Buttons**:
```tsx
// Current
className="p-2 hover:bg-gray-100 rounded-md"

// Updated
className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
```

**Disabled State**:
```tsx
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### 5. Table Styling

**Table Container**:
```tsx
// Current
className="bg-white shadow rounded-lg overflow-hidden"

// Updated
className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
```

**Table Header**:
```tsx
// Current
className="bg-gray-50 sticky top-0"

// Updated
className="bg-slate-50 dark:bg-slate-800 sticky top-0 backdrop-blur-sm"
```

**Table Header Cells**:
```tsx
// Current
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"

// Updated
className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"
```

**Table Rows**:
```tsx
// Current
className="hover:bg-gray-50"

// Updated
className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
```

**Table Dividers**:
```tsx
// Current
className="divide-y divide-gray-200"

// Updated
className="divide-y divide-slate-100 dark:divide-slate-800"
```

**Table Borders**:
```tsx
// Current
className="border-b border-gray-200"

// Updated
className="border-b border-slate-200 dark:border-slate-800"
```

### 6. Modal Styling

**Modal Overlay**:
```tsx
// Current
className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"

// Updated
className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
```

**Modal Container**:
```tsx
// Current
className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"

// Updated
className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
```

**Modal Header**:
```tsx
// Current
className="text-lg font-medium text-gray-900 mb-4"

// Updated
className="text-xl font-bold text-slate-900 dark:text-white mb-4"
```

**Modal Footer**:
```tsx
// Current
className="mt-6 flex justify-end gap-3"

// Updated
className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800"
```

### 7. Form Input Styling

**Text Inputs**:
```tsx
// Current
className="w-full px-3 py-2 border border-gray-300 rounded-md"

// Updated
className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
```

**Select Inputs**:
```tsx
// Current
className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"

// Updated
className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
```

**Input Labels**:
```tsx
// Current
className="block text-sm font-medium text-gray-700 mb-1"

// Updated
className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
```

### 8. Status Badge Styling

**Badge Base**:
```tsx
className="px-2 py-1 text-xs font-medium rounded-full"
```

**Status-Specific Colors**:
```tsx
// Approved/Success
className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"

// Rejected/Error
className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"

// Pending/Warning
className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"

// Info
className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
```

### 9. Typography Updates

**Page Headings**:
```tsx
// Current
className="text-2xl font-bold text-gray-900"

// Updated
className="text-2xl font-bold text-slate-900 dark:text-white"
```

**Subheadings**:
```tsx
// Current
className="text-lg font-medium text-gray-900"

// Updated
className="text-lg font-semibold text-slate-900 dark:text-white"
```

**Body Text**:
```tsx
// Current
className="text-sm text-gray-600"

// Updated
className="text-sm text-slate-600 dark:text-slate-300"
```

**Secondary Text**:
```tsx
// Current
className="text-sm text-gray-500"

// Updated
className="text-sm text-slate-500 dark:text-slate-400"
```

**Muted Text**:
```tsx
// Current
className="text-xs text-gray-400"

// Updated
className="text-xs text-slate-400 dark:text-slate-500"
```

### 10. Schedule Table Specific Updates

**Remove Sticky Column Positioning**:
```tsx
// Current (Name column header)
className="sticky left-0 z-30 bg-gray-50 px-4 py-3 ... shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"

// Updated (Name column header)
className="bg-slate-50 dark:bg-slate-800 px-4 py-3 ..."
// Remove: sticky, left-0, z-30, shadow

// Current (Name column cells)
className="sticky left-0 z-10 bg-white px-4 py-3 ... shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"

// Updated (Name column cells)
className="bg-white dark:bg-slate-900 px-4 py-3 ..."
// Remove: sticky, left-0, z-10, shadow
```

**Shift Type Colors**:
```tsx
// Morning shift
className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800"

// Day shift
className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"

// Evening shift
className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"

// Night shift
className="bg-slate-800 text-slate-100 border-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600"
```

### 11. Loading States

**Spinner**:
```tsx
// Current
className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"

// Updated
className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"
```

**Loading Container**:
```tsx
className="flex items-center justify-center h-64"
```

### 12. Icon Styling

**Icon Containers**:
```tsx
// Current
className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center"

// Updated
className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center"
```

**Icon Colors**:
```tsx
// Primary icons
className="text-indigo-600 dark:text-indigo-400"

// Secondary icons
className="text-slate-400 dark:text-slate-500"

// Success icons
className="text-green-600 dark:text-green-400"

// Error icons
className="text-red-600 dark:text-red-400"
```

## Data Models

No data model changes are required. All existing TypeScript interfaces, types, and data structures remain unchanged.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Since this is a pure UI/styling update with no functionality changes, traditional correctness properties don't apply. Instead, we define visual consistency properties:

**Property 1: Color Scheme Consistency**
*For any* UI component in the application, all primary brand colors should use the indigo-* palette and all neutral colors should use the slate-* palette

**Validates: Requirements 1.1, 1.2, 1.4**

**Property 2: Dark Mode Completeness**
*For any* UI component with styling, there should exist a corresponding dark: variant class for dark mode support

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

**Property 3: Transition Consistency**
*For any* interactive element (buttons, links, cards, navigation items), there should be a transition class applied (transition-colors, transition-all, or transition-transform)

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 4: Border Radius Consistency**
*For any* card or modal container, the border radius should be rounded-xl

**Validates: Requirements 4.1, 5.2**

**Property 5: Border Color Consistency**
*For any* element with a border, the border color should use border-slate-200 dark:border-slate-800

**Validates: Requirements 4.2, 5.3, 6.6**

**Property 6: Button Styling Consistency**
*For any* primary action button, it should use bg-indigo-600 hover:bg-indigo-700 with rounded-lg and transition-colors

**Validates: Requirements 7.1, 7.2, 7.4**

**Property 7: Table Row Hover Consistency**
*For any* table row, it should have hover:bg-slate-50 dark:hover:bg-slate-800/50 with transition-colors

**Validates: Requirements 6.1, 6.2**

**Property 8: Modal Backdrop Consistency**
*For any* modal overlay, it should use bg-black/50 backdrop-blur-sm

**Validates: Requirements 5.1, 7.7**

**Property 9: Focus Indicator Consistency**
*For any* focusable input element, it should have focus:outline-none focus:ring-2 focus:ring-indigo-500

**Validates: Requirements 8.4, 13.5, 15.3**

**Property 10: Typography Hierarchy Consistency**
*For any* page heading, it should use text-2xl font-bold text-slate-900 dark:text-white

**Validates: Requirements 9.1, 9.2**

**Property 11: Status Badge Color Consistency**
*For any* status badge, the color scheme should match the semantic meaning (green for approved, red for rejected, yellow for pending, blue for info) with proper dark mode variants

**Validates: Requirements 12.3, 12.4, 12.5, 12.6**

**Property 12: Sticky Positioning Removal**
*For any* table column in Schedule or Break Schedule pages, the agent name column should not have sticky positioning classes (sticky, left-0, z-10/z-30)

**Validates: Requirements 16.1, 16.2, 16.3**

**Property 13: Functionality Preservation**
*For any* component update, all event handlers, state management, props, and business logic should remain byte-for-byte identical

**Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6**

## Error Handling

No error handling changes are required. All existing error handling logic remains unchanged.

## Testing Strategy

### Visual Regression Testing

Since this is a pure UI update, testing focuses on visual verification:

1. **Manual Visual Testing**:
   - Test each page in light mode
   - Test each page in dark mode
   - Verify all interactive states (hover, active, focus)
   - Test responsive behavior on mobile, tablet, and desktop
   - Verify color contrast ratios meet WCAG AA standards

2. **Functional Verification**:
   - Verify all existing features work identically
   - Test all user interactions (clicks, form submissions, navigation)
   - Verify keyboard navigation still works
   - Test screen reader compatibility

3. **Cross-Browser Testing**:
   - Chrome
   - Firefox
   - Safari
   - Edge

### Testing Checklist

For each component file updated:
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] Hover states work on all interactive elements
- [ ] Focus indicators are visible
- [ ] Transitions are smooth
- [ ] Colors match the design system
- [ ] All functionality works identically to before
- [ ] No console errors
- [ ] Responsive layout works on mobile

### Property-Based Testing

While traditional property-based testing doesn't apply to CSS updates, we can verify properties through automated visual testing:

**Test 1: Color Palette Verification**
- Scan all component files for color class usage
- Verify no `primary-*` classes remain
- Verify all `gray-*` classes are replaced with `slate-*` (except semantic colors)
- **Feature: ui-modernization, Property 1: Color Scheme Consistency**

**Test 2: Dark Mode Coverage**
- Scan all component files for styling classes
- Verify each background color has a dark: variant
- Verify each text color has a dark: variant
- Verify each border color has a dark: variant
- **Feature: ui-modernization, Property 2: Dark Mode Completeness**

**Test 3: Transition Coverage**
- Scan all interactive elements
- Verify each has a transition class
- **Feature: ui-modernization, Property 3: Transition Consistency**

### Unit Testing

No new unit tests are required. All existing unit tests should continue to pass without modification, verifying that functionality is preserved.

### Integration Testing

Run all existing integration tests to verify:
- User flows work identically
- API calls are unchanged
- State management works correctly
- Navigation functions properly

## Implementation Notes

### Update Order

1. **Global Styles** (`index.css`): Update any global color variables or utilities
2. **Layout Component**: Update sidebar, header, and navigation
3. **Dashboard**: Update cards, buttons, and layout
4. **Schedule Pages**: Update tables, modals, and remove sticky positioning
5. **Request Pages**: Update tables and status badges
6. **Settings**: Update forms and inputs
7. **Break Schedule**: Update tables and remove sticky positioning
8. **Employee Directory**: Update cards and filters

### Search and Replace Patterns

Use these patterns for bulk updates (with caution):

```
primary-600 → indigo-600
primary-700 → indigo-700
primary-50 → indigo-50
primary-100 → indigo-100
primary-500 → indigo-500

bg-gray-50 → bg-slate-50 dark:bg-slate-800
bg-gray-100 → bg-slate-100 dark:bg-slate-800
bg-white → bg-white dark:bg-slate-900
text-gray-900 → text-slate-900 dark:text-white
text-gray-700 → text-slate-700 dark:text-slate-300
text-gray-600 → text-slate-600 dark:text-slate-300
text-gray-500 → text-slate-500 dark:text-slate-400
text-gray-400 → text-slate-400 dark:text-slate-500
border-gray-200 → border-slate-200 dark:border-slate-800
border-gray-300 → border-slate-300 dark:border-slate-600

rounded-lg → rounded-xl (for cards and modals)
shadow → shadow-sm (for cards)
```

### Verification Steps

After each component update:
1. Save the file
2. Check for TypeScript errors
3. View the component in the browser
4. Toggle dark mode
5. Test all interactive elements
6. Verify functionality is unchanged

### Rollback Strategy

Since changes are purely CSS:
- Git commit after each component file update
- Easy to revert individual files if issues arise
- No database migrations or API changes to roll back

## Accessibility Considerations

All accessibility features must be preserved:

1. **Color Contrast**: Verify all text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
2. **Focus Indicators**: Ensure focus:ring-2 focus:ring-indigo-500 is applied to all focusable elements
3. **Keyboard Navigation**: Verify tab order and keyboard shortcuts work identically
4. **Screen Readers**: Maintain all ARIA labels, roles, and semantic HTML
5. **Touch Targets**: Ensure all interactive elements are at least 44x44 pixels

## Performance Considerations

CSS-only updates have minimal performance impact:

1. **Tailwind Purging**: Ensure unused classes are purged in production build
2. **Transition Performance**: Use transform and opacity for animations (GPU-accelerated)
3. **Backdrop Blur**: May impact performance on older devices - test on target hardware
4. **Dark Mode**: CSS variables or class-based dark mode has negligible performance impact

## Browser Compatibility

Target browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All Tailwind classes used are well-supported in these browsers. Backdrop blur has good support but may degrade gracefully on older browsers.
