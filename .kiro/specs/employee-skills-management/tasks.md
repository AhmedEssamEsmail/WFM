# Implementation Plan: Employee Skills Management

## Overview

This implementation plan breaks down the Employee Skills Management feature into discrete, incremental tasks. Each task builds on previous work, with property-based tests integrated throughout to catch errors early. The plan follows the existing WFM codebase patterns and ensures all components are properly wired together.

## Tasks

- [ ] 1. Set up database schema and migrations
  - Create `skills` table with all required columns and constraints
  - Create `user_skills` junction table with composite primary key and foreign keys
  - Create indexes on `user_skills` for performance
  - Update `v_headcount_active` view to include skills as JSON array
  - Add migration scripts to Supabase
  - _Requirements: 1.10, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_

- [ ]* 1.1 Write property test for database constraints
  - **Property 14: Composite Primary Key Enforcement**
  - **Validates: Requirements 5.3**
  - **Property 15: Foreign Key Constraint - User ID**
  - **Validates: Requirements 5.4**
  - **Property 16: Foreign Key Constraint - Skill ID**
  - **Validates: Requirements 5.5**

- [ ] 2. Create TypeScript types and validation schemas
  - Add `Skill` interface to `src/types/index.ts`
  - Add `UserSkill` interface to `src/types/index.ts`
  - Extend `HeadcountUser` interface with `assigned_skills` field
  - Create `src/validation/schemas/skillSchema.ts` with Zod schemas
  - Export schemas from `src/validation/index.ts`
  - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2, 7.3_

- [ ]* 2.1 Write property tests for validation schemas
  - **Property 1: Skill Name Uniqueness**
  - **Validates: Requirements 1.2, 1.6**
  - **Property 2: Optional Description Acceptance**
  - **Validates: Requirements 1.3**
  - **Property 3: Required Color Validation**
  - **Validates: Requirements 1.4, 7.2**
  - **Property 20: Required Name Validation**
  - **Validates: Requirements 7.1**
  - **Property 21: Name Length Validation**
  - **Validates: Requirements 7.3**

- [ ] 3. Implement skills service layer
  - Create `src/services/skillsService.ts`
  - Implement `getSkills()` with optional active filter
  - Implement `getSkillById()`
  - Implement `createSkill()` with uniqueness check
  - Implement `updateSkill()`
  - Implement `deleteSkill()` with cascade behavior
  - Implement `getUserSkills()`
  - Implement `assignSkillsToUser()` with transaction handling
  - Implement `isSkillNameUnique()`
  - Export from `src/services/index.ts`
  - _Requirements: 1.2, 1.7, 1.8, 2.3, 2.4, 2.5_

- [ ]* 3.1 Write property tests for skills service
  - **Property 4: Default Active Status**
  - **Validates: Requirements 1.5**
  - **Property 5: Skill Update Persistence**
  - **Validates: Requirements 1.7**
  - **Property 6: Cascade Deletion**
  - **Validates: Requirements 1.8, 5.6, 7.6**
  - **Property 8: Skills Assignment Persistence**
  - **Validates: Requirements 2.3, 2.4**
  - **Property 9: Skills Removal**
  - **Validates: Requirements 2.5**
  - **Property 10: Zero or Multiple Skills Assignment**
  - **Validates: Requirements 2.6**

- [ ] 4. Create useSkills React hook
  - Create `src/hooks/useSkills.ts`
  - Implement query for fetching skills with React Query
  - Implement mutations for create, update, delete operations
  - Configure cache invalidation on mutations
  - Add error handling and loading states
  - _Requirements: 1.2, 1.7, 1.8_

- [ ]* 4.1 Write unit tests for useSkills hook
  - Test successful skill fetching
  - Test create mutation with cache invalidation
  - Test update mutation with cache invalidation
  - Test delete mutation with cache invalidation
  - Test error handling
  - _Requirements: 1.2, 1.7, 1.8_

- [ ] 5. Enhance headcount service to include skills
  - Modify `headcountService.getEmployees()` to join skills data
  - Modify `headcountService.getEmployeeById()` to join skills data
  - Update queries to use enhanced `v_headcount_active` view
  - Parse `assigned_skills` JSON array into Skill objects
  - _Requirements: 3.1, 3.2_

- [ ]* 5.1 Write property test for skills display
  - **Property 11: Complete Skills Display**
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create SkillsManager component for Settings
  - Create `src/pages/Settings/SkillsManager.tsx`
  - Implement skills list table with columns: name, description, color badge, active status
  - Add "Create Skill" button
  - Add Edit and Delete action buttons for each row
  - Implement delete confirmation dialog
  - Use `useSkills` hook for data and mutations
  - Follow existing Settings tab patterns (similar to LeaveTypeManager)
  - _Requirements: 1.1, 1.2, 1.7, 1.8_

- [ ]* 7.1 Write unit tests for SkillsManager component
  - Test skills list rendering
  - Test create button click
  - Test edit button click
  - Test delete with confirmation
  - Test empty state
  - _Requirements: 1.1, 1.2, 1.7, 1.8_

- [ ] 8. Create CreateSkillModal component
  - Create `src/components/Skills/CreateSkillModal.tsx`
  - Implement form with fields: name (required), description (optional), color (color picker), active status (checkbox)
  - Add color picker using Tailwind color palette
  - Implement client-side validation using skillSchema
  - Call `createSkill` mutation on submit
  - Display validation errors
  - Follow existing modal patterns (similar to EditEmployeeModal)
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3_

- [ ]* 8.1 Write unit tests for CreateSkillModal
  - Test form rendering
  - Test validation errors display
  - Test successful submission
  - Test modal close
  - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2, 7.3_

- [ ] 9. Create EditSkillModal component
  - Create `src/components/Skills/EditSkillModal.tsx`
  - Implement same form as CreateSkillModal, pre-populated with existing data
  - Validate name uniqueness excluding current skill
  - Allow toggling active/inactive status
  - Call `updateSkill` mutation on submit
  - _Requirements: 1.7, 1.9_

- [ ]* 9.1 Write unit tests for EditSkillModal
  - Test form pre-population
  - Test validation
  - Test successful update
  - Test active status toggle
  - _Requirements: 1.7, 1.9_

- [ ] 10. Add Skills tab to Settings page
  - Modify `src/pages/Settings/index.tsx`
  - Add "Skills" tab to navigation
  - Render SkillsManager component when Skills tab is active
  - Ensure only WFM users can access (existing role check)
  - _Requirements: 1.1, 6.1, 6.5_

- [ ]* 10.1 Write property test for access control
  - **Property 17: Non-WFM Access Denial**
  - **Validates: Requirements 6.1, 6.2, 6.5**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Create SkillsMultiSelect component
  - Create `src/components/Skills/SkillsMultiSelect.tsx`
  - Implement multi-select dropdown showing active skills
  - Display selected skills as colored badges
  - Implement accessible keyboard navigation
  - Accept props: `selectedSkillIds`, `onChange`, `availableSkills`
  - Use `useSkills(true)` to fetch active skills only
  - _Requirements: 2.1, 2.2_

- [ ]* 12.1 Write property test for active skills filtering
  - **Property 7: Inactive Skills Filtering**
  - **Validates: Requirements 1.9, 2.2, 4.7**

- [ ]* 12.2 Write unit tests for SkillsMultiSelect
  - Test dropdown rendering
  - Test skill selection
  - Test skill deselection
  - Test keyboard navigation
  - Test badge display
  - _Requirements: 2.1, 2.2_

- [ ] 13. Enhance EditEmployeeModal with skills assignment
  - Modify `src/components/Headcount/EditEmployeeModal.tsx`
  - Add SkillsMultiSelect component after Phone field
  - Add `skill_ids: string[]` to form state
  - Load user's current skills on modal open
  - Call `skillsService.assignSkillsToUser()` on form submit
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 13.1 Write integration tests for employee skills assignment
  - Test loading existing skills
  - Test adding new skills
  - Test removing skills
  - Test saving with no skills
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [ ] 14. Create SkillsBadges component
  - Create `src/components/Skills/SkillsBadges.tsx`
  - Display skills as colored badges with skill name
  - Implement responsive layout (wraps on small screens)
  - Show "No skills assigned" message if skills array is empty
  - Accept props: `skills: Skill[]`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 14.1 Write unit tests for SkillsBadges
  - Test badges rendering with colors
  - Test empty state message
  - Test responsive wrapping
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 15. Enhance EmployeeCard with skills display
  - Modify `src/components/Headcount/EmployeeCard.tsx`
  - Add SkillsBadges component below existing employee info
  - Pass `employee.assigned_skills` to SkillsBadges
  - Ensure skills data is loaded from enhanced HeadcountUser type
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4_

- [ ]* 15.1 Write property test for universal skills visibility
  - **Property 19: Universal Skills Visibility**
  - **Validates: Requirements 6.4**

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Create SkillsFilter component
  - Create `src/components/Schedule/SkillsFilter.tsx`
  - Implement multi-select dropdown for skills filtering
  - Show count of selected skills
  - Accept props: `selectedSkillIds`, `onChange`
  - Use `useSkills(true)` to fetch active skills only
  - Follow existing filter patterns in Schedule page
  - _Requirements: 4.1, 4.2, 4.7_

- [ ]* 17.1 Write unit tests for SkillsFilter
  - Test filter rendering
  - Test skill selection
  - Test selected count display
  - Test clear filter
  - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [ ] 18. Enhance Schedule page with skills filtering
  - Modify `src/pages/Schedule/Schedule.tsx`
  - Add SkillsFilter component above existing Agent filter
  - Add `selectedSkillIds: string[]` state variable
  - Implement filter logic: show users with at least one selected skill (OR logic)
  - Combine with existing Team and Agent filters using AND logic
  - Handle empty filter state (show all users)
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_

- [ ]* 18.1 Write property tests for filtering logic
  - **Property 12: Skills Filter OR Logic**
  - **Validates: Requirements 4.3**
  - **Property 13: Combined Filter AND Logic**
  - **Validates: Requirements 4.4**

- [ ]* 18.2 Write integration tests for Schedule filtering
  - Test skills filter alone
  - Test skills + agent filter combination
  - Test skills + team filter combination
  - Test all filters combined
  - Test empty filter state
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 19. Add access control for Skills filter
  - Ensure SkillsFilter only renders for TL and WFM users
  - Add role check in Schedule page
  - _Requirements: 6.3_

- [ ]* 19.1 Write property test for authorized filter access
  - **Property 18: Authorized Skills Filter Access**
  - **Validates: Requirements 6.3**

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify all property tests pass with 100+ iterations
  - Check for any console errors or warnings
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Create test data generators
  - Create `src/test/generators/skillGenerators.ts`
  - Implement fast-check generators for Skill objects
  - Implement generators for valid/invalid color codes
  - Implement generators for skill names (various lengths)
  - Implement generators for user-skill associations
  - _Requirements: All testing requirements_

- [ ]* 21.1 Write unit tests for generators
  - Test skill generator produces valid skills
  - Test color generator produces valid hex codes
  - Test name generator respects length constraints
  - _Requirements: All testing requirements_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All database operations use transactions for data integrity
- Access control is enforced at both UI and service layers
- Color contrast should meet WCAG AA standards for accessibility
