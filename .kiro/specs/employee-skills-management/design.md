# Design Document: Employee Skills Management

## Overview

The Employee Skills Management feature extends the WFM system to track and manage employee competencies through a comprehensive skills catalog. This design follows the existing architectural patterns in the WFM codebase, including:

- Service layer pattern for data access (similar to `headcountService`, `leaveTypesService`)
- React hooks for state management (following `useHeadcount`, `useLeaveTypes` patterns)
- TypeScript interfaces for type safety
- Supabase for database operations with proper foreign key relationships
- Tab-based Settings UI (consistent with existing Leave Types, Break Schedule tabs)
- Multi-select filtering pattern (similar to existing agent filters in Schedule page)

The feature enables WFM users to define skills, assign them to employees, and filter schedules based on required competencies.

## Architecture

### Component Hierarchy

```
Settings Page
└── Skills Tab (new)
    └── SkillsManager Component
        ├── SkillsList
        ├── CreateSkillModal
        └── EditSkillModal

Headcount Management
└── EditEmployeeModal (enhanced)
    └── SkillsMultiSelect Component (new)

Employee Card (enhanced)
└── SkillsBadges Component (new)

Schedule Page (enhanced)
└── SkillsFilter Component (new)
```

### Data Flow

1. **Skills Management**: WFM users interact with SkillsManager → skillsService → Supabase `skills` table
2. **Skills Assignment**: WFM users select skills in EditEmployeeModal → headcountService → Supabase `user_skills` junction table
3. **Skills Display**: All users view EmployeeCard → data fetched via enhanced `v_headcount_active` view with joined skills
4. **Skills Filtering**: TL/WFM users select skills in SkillsFilter → filters applied to user list → Schedule page re-renders

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React hooks, React Query for caching
- **Backend**: Supabase (PostgreSQL)
- **Validation**: Zod schemas (following existing validation patterns)
- **Testing**: Vitest, React Testing Library, fast-check for property-based testing

## Components and Interfaces

### Type Definitions

```typescript
// Add to src/types/index.ts

export interface Skill {
  id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSkill {
  user_id: string
  skill_id: string
  created_at: string
}

// Extend HeadcountUser interface
export interface HeadcountUser extends User {
  // ... existing fields ...
  assigned_skills?: Skill[] // Joined from user_skills + skills tables
}
```

### Service Layer

**skillsService.ts** (new file: `src/services/skillsService.ts`)

```typescript
import { supabase } from '../lib/supabase'
import type { Skill } from '../types'

export const skillsService = {
  // Get all skills (optionally filter by active status)
  async getSkills(activeOnly: boolean = false): Promise<Skill[]>
  
  // Get skill by ID
  async getSkillById(id: string): Promise<Skill>
  
  // Create new skill
  async createSkill(skill: Omit<Skill, 'id' | 'created_at' | 'updated_at'>): Promise<Skill>
  
  // Update existing skill
  async updateSkill(id: string, updates: Partial<Skill>): Promise<void>
  
  // Delete skill (cascades to user_skills)
  async deleteSkill(id: string): Promise<void>
  
  // Get skills for a specific user
  async getUserSkills(userId: string): Promise<Skill[]>
  
  // Assign skills to user (replaces existing assignments)
  async assignSkillsToUser(userId: string, skillIds: string[]): Promise<void>
  
  // Check if skill name is unique
  async isSkillNameUnique(name: string, excludeId?: string): Promise<boolean>
}
```

**Enhanced headcountService.ts**

```typescript
// Modify getEmployees() and getEmployeeById() to join skills data
// Update query to include:
// .select('*, user_skills(skill_id, skills(*))')
```

### React Hooks

**useSkills.ts** (new file: `src/hooks/useSkills.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsService } from '../services/skillsService'
import type { Skill } from '../types'

export function useSkills(activeOnly: boolean = false) {
  const queryClient = useQueryClient()
  
  // Query for fetching skills
  const { data: skills, isLoading, error } = useQuery({
    queryKey: ['skills', activeOnly],
    queryFn: () => skillsService.getSkills(activeOnly)
  })
  
  // Mutation for creating skill
  const createSkill = useMutation({
    mutationFn: (skill: Omit<Skill, 'id' | 'created_at' | 'updated_at'>) => 
      skillsService.createSkill(skill),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] })
  })
  
  // Mutation for updating skill
  const updateSkill = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Skill> }) => 
      skillsService.updateSkill(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] })
  })
  
  // Mutation for deleting skill
  const deleteSkill = useMutation({
    mutationFn: (id: string) => skillsService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })
  
  return {
    skills: skills || [],
    isLoading,
    error,
    createSkill,
    updateSkill,
    deleteSkill
  }
}
```

### UI Components

**SkillsManager Component** (new file: `src/pages/Settings/SkillsManager.tsx`)

- Displays list of all skills in a table format
- Shows skill name, description, color badge, active status
- Provides "Create Skill" button (opens CreateSkillModal)
- Each row has Edit and Delete action buttons
- Delete shows confirmation dialog
- Follows existing Settings tab patterns (similar to LeaveTypeManager)

**CreateSkillModal Component** (new file: `src/components/Skills/CreateSkillModal.tsx`)

- Form fields: Name (required), Description (optional), Color (color picker), Active status (checkbox, default true)
- Validates name uniqueness before submission
- Uses Tailwind color palette for color selection
- Follows existing modal patterns (similar to EditEmployeeModal)

**EditSkillModal Component** (new file: `src/components/Skills/EditSkillModal.tsx`)

- Same fields as CreateSkillModal, pre-populated with existing data
- Validates name uniqueness (excluding current skill)
- Allows toggling active/inactive status

**SkillsMultiSelect Component** (new file: `src/components/Skills/SkillsMultiSelect.tsx`)

- Multi-select dropdown showing active skills
- Displays selected skills as colored badges
- Used in EditEmployeeModal
- Implements accessible keyboard navigation
- Similar pattern to existing multi-select components

**SkillsBadges Component** (new file: `src/components/Skills/SkillsBadges.tsx`)

- Displays skills as colored badges
- Shows skill name with background color
- Used in EmployeeCard
- Responsive layout (wraps on small screens)

**SkillsFilter Component** (new file: `src/components/Schedule/SkillsFilter.tsx`)

- Multi-select dropdown for skills filtering
- Positioned above Agent filter in Schedule page
- Shows count of selected skills
- Implements "OR" logic (show users with ANY selected skill)
- Follows existing filter patterns in Schedule page

### Enhanced Components

**EditEmployeeModal.tsx** (modified)

- Add SkillsMultiSelect field after Phone field
- Load user's current skills on modal open
- Save selected skills when form is submitted
- Update form data state to include `skill_ids: string[]`

**EmployeeCard.tsx** (modified)

- Add SkillsBadges component below existing employee info
- Display "No skills assigned" message if skills array is empty
- Ensure skills data is loaded from enhanced HeadcountUser type

**Schedule.tsx** (modified)

- Add SkillsFilter component above existing Agent filter
- Add `selectedSkillIds` state variable
- Filter `filteredUsers` to include only users with at least one selected skill
- Combine with existing Team and Agent filters using AND logic

## Data Models

### Database Schema

**skills table**

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) NOT NULL, -- Hex color code
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skills_active ON skills(is_active);
CREATE INDEX idx_skills_name ON skills(name);
```

**user_skills junction table**

```sql
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
```

**Enhanced v_headcount_active view**

```sql
-- Modify existing view to include skills as JSON array
CREATE OR REPLACE VIEW v_headcount_active AS
SELECT 
  u.*,
  hp.*,
  m.name as manager_name,
  m.email as manager_email,
  COALESCE(
    json_agg(
      json_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'color', s.color,
        'is_active', s.is_active
      )
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'
  ) as assigned_skills
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
WHERE u.status IN ('active', 'on_leave')
GROUP BY u.id, hp.user_id, m.id;
```

### Data Validation

**Skill Validation Schema** (new file: `src/validation/schemas/skillSchema.ts`)

```typescript
import { z } from 'zod'

export const skillSchema = z.object({
  name: z.string()
    .min(1, 'Skill name is required')
    .max(100, 'Skill name must be 100 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'),
  is_active: z.boolean().default(true)
})

export const assignSkillsSchema = z.object({
  user_id: z.string().uuid(),
  skill_ids: z.array(z.string().uuid())
})
```

### Constraints and Invariants

1. **Skill Name Uniqueness**: No two skills can have the same name (case-insensitive)
2. **Color Format**: All colors must be valid 6-digit hex codes (e.g., #FF5733)
3. **Cascade Deletion**: Deleting a skill removes all user_skills associations
4. **Active Skills Only**: Only active skills appear in assignment and filter dropdowns
5. **User-Skill Relationship**: A user can have 0 to N skills; a skill can be assigned to 0 to N users


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Skill Name Uniqueness

For any two skills in the system, their names must be unique (case-insensitive). Attempting to create a skill with a name that already exists should be rejected with a validation error.

**Validates: Requirements 1.2, 1.6**

### Property 2: Optional Description Acceptance

For any skill, the system should accept both null/empty descriptions and valid non-empty descriptions. Creating skills with and without descriptions should both succeed.

**Validates: Requirements 1.3**

### Property 3: Required Color Validation

For any skill creation attempt, if the color field is missing or invalid (not a 6-digit hex code), the system should reject the creation with a validation error.

**Validates: Requirements 1.4, 7.2**

### Property 4: Default Active Status

For any skill created without explicitly setting the is_active field, the system should set is_active to true by default.

**Validates: Requirements 1.5**

### Property 5: Skill Update Persistence

For any existing skill and any valid set of updates (name, description, color, is_active), applying those updates should result in the skill having the new values when subsequently retrieved.

**Validates: Requirements 1.7**

### Property 6: Cascade Deletion

For any skill that has been assigned to one or more employees, deleting the skill should remove both the skill from the skills table and all corresponding records from the user_skills junction table.

**Validates: Requirements 1.8, 5.6, 7.6**

### Property 7: Inactive Skills Filtering

For any query requesting active skills only, the results should exclude all skills where is_active is false. This applies to both assignment dropdowns and filter dropdowns.

**Validates: Requirements 1.9, 2.2, 4.7**

### Property 8: Skills Assignment Persistence

For any employee and any set of selected skill IDs, saving the assignment should create user_skills records with the correct user_id, skill_id, and created_at timestamp for each selected skill.

**Validates: Requirements 2.3, 2.4**

### Property 9: Skills Removal

For any employee with assigned skills, removing a specific skill should delete only that user_skills association while preserving all other skill assignments for that employee.

**Validates: Requirements 2.5**

### Property 10: Zero or Multiple Skills Assignment

For any employee, the system should allow having zero assigned skills (no user_skills records) or multiple assigned skills (multiple user_skills records).

**Validates: Requirements 2.6**

### Property 11: Complete Skills Display

For any employee with assigned skills, displaying the Employee_Card should show all assigned skills with their names and colors.

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 12: Skills Filter OR Logic

For any set of selected skills in the Skills_Filter, the displayed employees should include all employees who have at least one of the selected skills (OR logic).

**Validates: Requirements 4.3**

### Property 13: Combined Filter AND Logic

For any combination of Team, Agent, and Skills filters, the displayed employees should satisfy all active filter conditions simultaneously (AND logic between filter types).

**Validates: Requirements 4.4**

### Property 14: Composite Primary Key Enforcement

For any user-skill pair (user_id, skill_id), attempting to create a duplicate user_skills record should be rejected by the database constraint.

**Validates: Requirements 5.3**

### Property 15: Foreign Key Constraint - User ID

For any user_skills creation attempt with a user_id that does not exist in the users table, the operation should be rejected by the database constraint.

**Validates: Requirements 5.4**

### Property 16: Foreign Key Constraint - Skill ID

For any user_skills creation attempt with a skill_id that does not exist in the skills table, the operation should be rejected by the database constraint.

**Validates: Requirements 5.5**

### Property 17: Non-WFM Access Denial

For any user with role 'agent' or 'tl', attempting to access the Skills management tab or perform skill CRUD operations should be denied with an appropriate error message.

**Validates: Requirements 6.1, 6.2, 6.5**

### Property 18: Authorized Skills Filter Access

For any user with role 'tl' or 'wfm', accessing the Schedule page should display the Skills_Filter component and allow its use.

**Validates: Requirements 6.3**

### Property 19: Universal Skills Visibility

For any user regardless of role, viewing an Employee_Card or Employee_Profile should display the assigned skills for that employee.

**Validates: Requirements 6.4**

### Property 20: Required Name Validation

For any skill creation attempt with an empty or missing name field, the system should reject the creation with a validation error.

**Validates: Requirements 7.1**

### Property 21: Name Length Validation

For any skill creation or update attempt with a name exceeding 100 characters, the system should reject the operation with a validation error.

**Validates: Requirements 7.3**

## Error Handling

### Validation Errors

- **Duplicate Skill Name**: Return 409 Conflict with message "A skill with this name already exists"
- **Missing Required Fields**: Return 400 Bad Request with specific field errors
- **Invalid Color Format**: Return 400 Bad Request with message "Color must be a valid hex code (e.g., #FF5733)"
- **Name Too Long**: Return 400 Bad Request with message "Skill name must be 100 characters or less"

### Database Errors

- **Foreign Key Violation**: Return 400 Bad Request with message "Invalid user or skill reference"
- **Unique Constraint Violation**: Return 409 Conflict with message "This assignment already exists"
- **Cascade Deletion**: Automatically handled by database ON DELETE CASCADE

### Access Control Errors

- **Unauthorized Access**: Return 403 Forbidden with message "You do not have permission to manage skills"
- **Role-Based Restrictions**: Redirect non-WFM users away from Skills tab with toast notification

### Network Errors

- **Connection Timeout**: Display toast with retry option
- **Server Error**: Display generic error message and log details for debugging
- **Optimistic Update Failure**: Rollback UI state and show error toast

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized test data

### Property-Based Testing Configuration

- **Library**: fast-check (already in use in the WFM codebase)
- **Iterations**: Minimum 100 iterations per property test
- **Test Organization**: Property tests located in `src/test/properties/skills/`
- **Tagging**: Each property test tagged with format: `Feature: employee-skills-management, Property {number}: {property_text}`

### Unit Testing Focus

Unit tests should focus on:
- Specific examples demonstrating correct behavior (e.g., creating a skill with valid data)
- Edge cases (e.g., empty skills list, employee with no skills)
- Error conditions (e.g., network failures, validation errors)
- Integration points between components (e.g., SkillsMultiSelect updating form state)
- UI interactions (e.g., modal open/close, filter selection)

### Property Testing Focus

Property tests should focus on:
- Universal properties that hold for all inputs (e.g., skill name uniqueness)
- Comprehensive input coverage through randomization
- Invariants that must be maintained (e.g., cascade deletion)
- Data integrity constraints (e.g., foreign key relationships)

### Test Generators

Create fast-check generators for:
- **Skill objects**: Random name, description, color, is_active
- **User IDs**: Valid UUIDs from test database
- **Skill IDs**: Valid UUIDs from test database
- **Color codes**: Valid 6-digit hex codes
- **Skill names**: Strings of varying lengths (including edge cases like 100 chars, 101 chars)

### Integration Testing

- Test complete workflows: Create skill → Assign to employee → Display on card → Filter by skill
- Test access control across different user roles
- Test database constraints and cascade behaviors
- Test filter combinations (Team + Agent + Skills)

### Accessibility Testing

- Verify keyboard navigation in multi-select components
- Test screen reader announcements for skill badges
- Ensure color contrast meets WCAG AA standards
- Test focus management in modals

### Performance Testing

- Test rendering performance with employees having many skills (e.g., 20+ skills)
- Test filter performance with large datasets (e.g., 1000+ employees)
- Test database query performance for skills joins
- Monitor bundle size impact of new components
