# Implementation Plan: Break Schedule Management

## Overview

This implementation plan breaks down the Break Schedule Management feature into discrete, incremental coding tasks. Each task builds on previous work and includes specific requirements references. The plan follows a bottom-up approach: database → services → validation → UI components → integration → polish.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration file `015_break_schedules.sql`
  - Add `break_schedules` table with indexes and constraints
  - Add `break_schedule_rules` table with example rules data
  - Add `break_schedule_warnings` table with indexes
  - Create database functions: `handle_shift_change()` and `swap_break_schedules()`
  - Create triggers for shift changes and swap approvals
  - Add RLS policies for all three tables
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_

- [ ]* 1.1 Write property test for unique interval constraint
  - **Property 29: Unique interval constraint**
  - **Validates: Requirements 14.1**

- [ ]* 1.2 Write property test for referential integrity
  - **Property 31: Referential integrity enforcement**
  - **Validates: Requirements 14.4, 14.5**

- [x] 2. Create TypeScript types and Zod validators
  - [x] 2.1 Add break schedule types to `src/types/index.ts`
    - Add `BreakType`, `BreakSchedule`, `AgentBreakSchedule`, `BreakScheduleWarning`, `BreakScheduleRule` types
    - Add `ValidationViolation`, `BreakScheduleResponse`, `BreakScheduleSummary` types
    - Add `BreakScheduleUpdateRequest`, `BreakScheduleUpdateResponse` types
    - Add `BreakScheduleCSVRow`, `ImportResult` types
    - Add `AutoDistributeRequest`, `AutoDistributePreview`, `DistributionStrategy`, `ApplyMode` types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 5.1-5.7, 6.1-6.5, 7.1-7.5, 9.1-9.6, 11.1-11.5, 12.1-12.13_
  
  - [x] 2.2 Create Zod schemas in `src/lib/validations/breakSchedules.ts`
    - Add schemas for all request/response types
    - Add validation helpers for break schedules
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.2, 9.3_

- [x] 3. Implement core service layer
  - [x] 3.1 Create `src/services/breakSchedulesService.ts`
    - Implement `getScheduleForDate()` - fetch schedules with user/shift data
    - Implement `getCoverageSummary()` - aggregate IN counts per interval
    - Implement `getWarnings()` - fetch unresolved warnings
    - Implement `updateBreakSchedule()` - save schedule with validation
    - Implement `bulkUpdateBreakSchedules()` - batch updates
    - Implement `dismissWarning()` - mark warning as resolved
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 4.6, 7.5, 11.1_
  
  - [ ]* 3.2 Write property test for break schedule data completeness
    - **Property 1: Break schedule data completeness**
    - **Validates: Requirements 1.2, 1.3, 1.4**
  
  - [ ]* 3.3 Write property test for role-based data filtering
    - **Property 2: Role-based data filtering**
    - **Validates: Requirements 2.1**
  
  - [ ]* 3.4 Write property test for warning indicator presence
    - **Property 3: Warning indicator presence**
    - **Validates: Requirements 2.3, 7.3**
  
  - [ ]* 3.5 Write property test for coverage calculation accuracy
    - **Property 16: Coverage calculation accuracy**
    - **Validates: Requirements 2.2, 11.1**
  
  - [ ]* 3.6 Write property test for audit trail completeness
    - **Property 30: Audit trail completeness**
    - **Validates: Requirements 14.2, 14.3**

- [x] 4. Implement validation logic
  - [x] 4.1 Create `src/lib/breakValidation.ts`
    - Implement `validateBreakOrdering()` - check HB1 → B → HB2 sequence
    - Implement `validateBreakTiming()` - check 90-270 minute gaps
    - Implement `validateShiftBoundary()` - check breaks within shift hours
    - Implement `validateAgainstRules()` - apply all active rules
    - Implement `getRuleViolations()` - collect and prioritize violations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.5_
  
  - [ ]* 4.2 Write property test for break ordering invariant
    - **Property 4: Break ordering invariant**
    - **Validates: Requirements 5.1**
  
  - [ ]* 4.3 Write property test for break timing constraints
    - **Property 5: Break timing constraints**
    - **Validates: Requirements 5.2, 5.3**
  
  - [ ]* 4.4 Write property test for shift boundary validation
    - **Property 6: Shift boundary validation**
    - **Validates: Requirements 5.4**
  
  - [ ]* 4.5 Write property test for blocking rule enforcement
    - **Property 7: Blocking rule enforcement**
    - **Validates: Requirements 5.6**
  
  - [ ]* 4.6 Write property test for rule priority resolution
    - **Property 8: Rule priority resolution**
    - **Validates: Requirements 6.5**

- [x] 5. Implement break rules service
  - [x] 5.1 Create `src/services/breakRulesService.ts`
    - Implement `getRules()` - fetch all rules ordered by priority
    - Implement `getActiveRules()` - fetch only active rules
    - Implement `updateRule()` - update rule parameters
    - Implement `toggleRule()` - activate/deactivate rule
    - Implement `validateRuleParameters()` - validate rule config
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 5.2 Write property test for rule parameter validation
    - **Property 32: Rule parameter validation**
    - **Validates: Requirements 6.2**
  
  - [ ]* 5.3 Write property test for rule activation effect
    - **Property 33: Rule activation effect**
    - **Validates: Requirements 6.3**

- [x] 6. Implement CSV import/export functionality
  - [x] 6.1 Create `src/lib/breakScheduleCSV.ts`
    - Implement `exportToCSV()` - generate CSV from schedules
    - Implement `parseCSV()` - parse uploaded CSV file
    - Implement `validateCSVFormat()` - validate CSV structure
    - Implement `importFromCSV()` - process and save CSV data
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 6.2 Write property test for CSV export round-trip
    - **Property 14: CSV export round-trip**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  
  - [ ]* 6.3 Write property test for import clears existing breaks
    - **Property 15: Import clears existing breaks**
    - **Validates: Requirements 9.4**

- [x] 7. Implement auto-distribution algorithms
  - [x] 7.1 Create `src/lib/autoDistribution.ts`
    - Implement `calculateShiftThirds()` - divide shift into early/middle/late
    - Implement `findHighestCoverageIntervals()` - identify optimal placement
    - Implement `balancedCoverageStrategy()` - minimize coverage variance
    - Implement `staggeredTimingStrategy()` - spread breaks evenly
    - Implement `generateDistributionPreview()` - create preview with stats
    - Implement `applyDistribution()` - save auto-distributed schedules
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12, 12.13_
  
  - [ ]* 7.2 Write property test for break placement in shift thirds
    - **Property 23: Break placement in shift thirds**
    - **Validates: Requirements 12.5**
  
  - [ ]* 7.3 Write property test for auto-distribution rule compliance
    - **Property 24: Auto-distribution rule compliance**
    - **Validates: Requirements 12.6**
  
  - [ ]* 7.4 Write property test for balanced coverage variance
    - **Property 25: Balanced coverage variance**
    - **Validates: Requirements 12.2**
  
  - [ ]* 7.5 Write property test for unscheduled mode preservation
    - **Property 26: Unscheduled mode preservation**
    - **Validates: Requirements 12.8**
  
  - [ ]* 7.6 Write property test for all agents mode clearing
    - **Property 27: All agents mode clearing**
    - **Validates: Requirements 12.9**
  
  - [ ]* 7.7 Write property test for auto-schedule indicator tracking
    - **Property 28: Auto-schedule indicator tracking**
    - **Validates: Requirements 12.12, 12.13**

- [x] 8. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create base UI components
  - [x] 9.1 Create `src/components/BreakSchedule/BreakCell.tsx`
    - Display break type with appropriate styling
    - Handle click events for WFM users (cycle break types)
    - Support multi-select (Shift+Click, Ctrl+Click)
    - Show validation errors inline
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.7_
  
  - [ ]* 9.2 Write property test for break type cycling
    - **Property 9: Break type cycling**
    - **Validates: Requirements 4.1**
  
  - [ ]* 9.3 Write property test for full break duration enforcement
    - **Property 10: Full break duration enforcement**
    - **Validates: Requirements 4.2**
  
  - [x] 9.4 Create `src/components/BreakSchedule/CoverageCell.tsx`
    - Display coverage count with color coding
    - Apply green/yellow/orange/red based on thresholds
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 9.5 Write property test for coverage color mapping
    - **Property 17: Coverage color mapping**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5**
  
  - [x] 9.6 Create `src/components/BreakSchedule/AgentRow.tsx`
    - Display agent name with warning indicator
    - Display shift type and break start times
    - Render interval cells for the day
    - _Requirements: 1.2, 1.3, 1.4, 2.3, 7.3_

- [x] 10. Create date navigation components
  - [x] 10.1 Create `src/components/BreakSchedule/DateNavigation.tsx`
    - Implement Previous Day, Next Day, Today buttons
    - Display formatted date
    - Handle date state changes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 10.2 Write property test for date formatting consistency
    - **Property 18: Date formatting consistency**
    - **Validates: Requirements 3.5**
  
  - [ ]* 10.3 Write property test for date navigation arithmetic
    - **Property 19: Date navigation arithmetic**
    - **Validates: Requirements 3.2, 3.3**

- [x] 11. Create filter and search components
  - [x] 11.1 Create `src/components/BreakSchedule/FilterBar.tsx`
    - Implement search input with debounce (300ms)
    - Implement department filter dropdown
    - Show action buttons for WFM (Auto-Distribute, Import, Export)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 11.2 Write property test for case-insensitive name search
    - **Property 20: Case-insensitive name search**
    - **Validates: Requirements 10.1**
  
  - [ ]* 11.3 Write property test for department filter accuracy
    - **Property 21: Department filter accuracy**
    - **Validates: Requirements 10.2**
  
  - [ ]* 11.4 Write property test for filter state persistence
    - **Property 22: Filter state persistence**
    - **Validates: Requirements 10.5**

- [x] 12. Create break schedule table component
  - [x] 12.1 Create `src/components/BreakSchedule/BreakScheduleTable.tsx`
    - Render table header with sticky agent column
    - Render Total IN summary row
    - Render agent rows with break cells
    - Handle horizontal scrolling
    - Support context menu for multi-select (right-click)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 4.5, 11.1_
  
  - [x] 12.2 Implement auto-save with debounce (500ms)
    - Debounce break schedule updates
    - Show saving indicator
    - Handle save errors with toast notifications
    - _Requirements: 4.6_

- [x] 13. Create warning management components
  - [x] 13.1 Create `src/components/BreakSchedule/WarningPopup.tsx`
    - Display shift change details
    - Show old and new shift types
    - Provide dismiss button
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [ ]* 13.2 Write property test for warning dismissal state change
    - **Property 12: Warning dismissal state change**
    - **Validates: Requirements 7.5**

- [x] 14. Create rules configuration UI
  - [x] 14.1 Create `src/components/BreakSchedule/RulesConfig.tsx`
    - Display all rules with status indicators
    - Allow editing rule parameters
    - Allow activating/deactivating rules
    - Show validation errors for invalid parameters
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 15. Create auto-distribution modal
  - [x] 15.1 Create `src/components/BreakSchedule/AutoDistributeModal.tsx`
    - Display strategy selection (Balanced Coverage, Staggered Timing)
    - Display apply mode selection (Only Unscheduled, All Agents)
    - Show department filter option
    - Generate and display preview
    - Show coverage statistics and rule compliance
    - Display failed agents report
    - Provide Apply and Cancel buttons
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.8, 12.9, 12.10, 12.11_

- [x] 16. Create settings configuration
  - [x] 16.1 Create `src/components/Settings/AutoDistributionSettings.tsx`
    - Display default strategy selection
    - Display default apply mode selection
    - Save settings to user preferences
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ]* 16.2 Write property test for settings default application
    - **Property 34: Settings default application**
    - **Validates: Requirements 13.2, 13.3, 13.4**

- [x] 17. Create main page component
  - [x] 17.1 Create `src/pages/BreakSchedule.tsx`
    - Integrate DateNavigation component
    - Integrate FilterBar component
    - Integrate BreakScheduleTable component
    - Set up React Query hooks for data fetching
    - Handle loading and error states
    - Implement role-based rendering (Agent/TL/WFM views)
    - _Requirements: 1.1, 1.5, 2.1, 3.1, 10.4_

- [ ] 18. Implement database trigger testing
  - [ ]* 18.1 Write property test for shift change clears breaks
    - **Property 11: Shift change clears breaks**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ]* 18.2 Write property test for break swap completeness
    - **Property 13: Break swap completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 19. Checkpoint - Ensure all UI tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Add CSV import/export UI integration
  - [x] 20.1 Add import button handler to FilterBar
    - Open file picker
    - Upload and process CSV
    - Display import results (success count, errors)
    - Refresh schedule data after import
    - _Requirements: 9.3, 9.4, 9.5, 9.6_
  
  - [x] 20.2 Add export button handler to FilterBar
    - Generate CSV from current schedule
    - Trigger file download
    - _Requirements: 9.1, 9.2_

- [x] 21. Add validation error display
  - [x] 21.1 Create `src/components/BreakSchedule/ValidationBanner.tsx`
    - Display warning banner for non-blocking violations
    - Display error banner for blocking violations
    - Show "Save Anyway" button for warnings
    - List all violations with details
    - _Requirements: 5.5, 5.6, 5.7_

- [x] 22. Add responsive design and accessibility
  - [x] 22.1 Implement responsive breakpoints
    - Desktop layout (≥1024px)
    - Tablet layout (768px-1023px)
    - Mobile layout (<768px)
    - _Requirements: All (UI/UX)_
  
  - [x] 22.2 Add accessibility features
    - Keyboard navigation support
    - ARIA labels for screen readers
    - Focus indicators
    - Skip links for table navigation
    - _Requirements: All (Accessibility)_

- [x] 23. Add performance optimizations
  - [x] 23.1 Implement virtual scrolling for large teams
    - Use react-window or react-virtual
    - Render only visible rows
    - _Requirements: 2.1 (Performance)_
  
  - [x] 23.2 Optimize React Query caching
    - Configure stale time (5 minutes)
    - Configure cache time (30 minutes)
    - Implement optimistic updates
    - _Requirements: 4.6 (Performance)_

- [x] 24. Add error handling and user feedback
  - [x] 24.1 Implement error boundaries
    - Catch component errors
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: All (Error Handling)_
  
  - [x] 24.2 Add toast notifications
    - Success notifications for saves
    - Error notifications for failures
    - Info notifications for warnings
    - _Requirements: 4.6, 9.5, 9.6_

- [x] 25. Final checkpoint - Integration testing
  - [x] 25.1 Test complete user flows
    - Agent viewing their schedule
    - Team Lead viewing team schedule
    - WFM planning breaks with validation
    - WFM using auto-distribution
    - WFM importing/exporting CSV
    - WFM configuring rules
    - Shift change triggering warning
    - Swap approval triggering break swap
    - _Requirements: All_
  
  - [x] 25.2 Test edge cases
    - Large teams (100+ agents)
    - Concurrent edits
    - Network failures
    - Invalid data scenarios
    - _Requirements: All (Edge Cases)_

- [x] 26. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (34 total)
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → services → validation → UI → integration
- All 34 correctness properties from the design document are included as property test tasks
