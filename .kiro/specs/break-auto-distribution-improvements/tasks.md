# Implementation Plan: Break Auto-Distribution Improvements

## Overview

This implementation plan breaks down the ladder-based distribution algorithm, configurable settings, and toast notification fix into discrete coding tasks. The approach is incremental: first establish the database foundation, then implement the core algorithm, add the settings UI, fix the toast issue, and finally integrate everything with comprehensive testing.

## Tasks

- [x] 1. Create database schema for distribution settings
  - Create migration file `supabase/migrations/[timestamp]_add_distribution_settings.sql`
  - Define `distribution_settings` table with columns: id, shift_type, hb1_start_column, b_offset_minutes, hb2_offset_minutes, created_at, updated_at
  - Add unique constraint on shift_type
  - Add check constraints for valid column ranges (0-47) and minimum offsets (>= 90)
  - Insert default settings for AM (column 4), PM (column 16), BET (column 8)
  - Add RLS policies: WFM can manage, all authenticated users can read
  - Add index on shift_type for fast lookups
  - _Requirements: 2.3, 2.4_

- [x] 2. Add TypeScript types for distribution settings
  - [x] 2.1 Update `src/types/index.ts` with new types
    - Add `DistributionSettings` interface
    - Add `DistributionSettingsUpdate` interface
    - Update `DistributionStrategy` type to include 'ladder'
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 2.2 Write unit tests for type definitions
    - Test type compatibility with existing code
    - Test that 'ladder' is a valid DistributionStrategy value
    - _Requirements: 2.1_

- [x] 3. Implement distribution settings service
  - [x] 3.1 Create `src/services/distributionSettingsService.ts`
    - Implement `getSettings()` to fetch all settings from database
    - Implement `updateSettings()` to save settings with validation
    - Implement `resetToDefaults()` to restore default values
    - Implement `getDefaultSettings()` helper for default values
    - Use Supabase client for database operations
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [ ]* 3.2 Write property test for settings persistence
    - **Property 5: Settings Persistence Round-Trip**
    - **Validates: Requirements 2.3**
  
  - [ ]* 3.3 Write unit tests for settings service
    - Test getSettings with existing data
    - Test getSettings with no data (returns defaults)
    - Test updateSettings with valid data
    - Test updateSettings with invalid data (validation errors)
    - Test resetToDefaults
    - _Requirements: 2.3, 2.4_

- [x] 4. Implement ladder distribution algorithm
  - [x] 4.1 Add helper functions to `src/lib/autoDistribution.ts`
    - Implement `columnToTime(column: number): string` to convert column index to time string
    - Implement `timeToColumn(time: string): number` to convert time string to column index
    - Implement `addMinutes(time: string, minutes: number): string` to add minutes to time
    - Implement `mergePendingUpdates()` helper for deduplication
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 4.2 Write unit tests for helper functions
    - Test columnToTime with various columns (0, 4, 16, 47)
    - Test timeToColumn with various times
    - Test addMinutes with various offsets
    - Test round-trip: timeToColumn(columnToTime(n)) === n
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [x] 4.3 Implement `ladderDistributionStrategy()` function
    - Fetch distribution settings from database
    - Group agents by shift type
    - For each shift type, iterate through agents
    - Calculate HB1, B, HB2 times using ladder pattern
    - Build intervals array (including 2 intervals for B break)
    - Validate against rules using existing `getRuleViolations()`
    - Handle blocking violations (add to failed list)
    - Handle non-blocking violations (add to schedules with warning)
    - Update coverage summary incrementally
    - Return schedules and failed agents
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 4.4 Write property test for ladder pattern consistency
    - **Property 1: Ladder Pattern Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  
  - [ ]* 4.5 Write property test for break offset timing
    - **Property 2: Break Offset Timing**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ]* 4.6 Write property test for B break span
    - **Property 3: B Break Span**
    - **Validates: Requirements 1.7**
  
  - [ ]* 4.7 Write property test for validation enforcement
    - **Property 4: Validation Enforcement**
    - **Validates: Requirements 1.8, 4.1, 4.2, 4.3, 4.4**
  
  - [ ]* 4.8 Write property test for blocking rule enforcement
    - **Property 8: Blocking Rule Enforcement**
    - **Validates: Requirements 4.5**
  
  - [ ]* 4.9 Write property test for non-blocking rule warnings
    - **Property 9: Non-Blocking Rule Warnings**
    - **Validates: Requirements 4.6**
  
  - [ ]* 4.10 Write unit tests for ladder distribution
    - Test with 3 AM agents (expect columns 4, 5, 6)
    - Test with empty agent list
    - Test with single agent
    - Test with all agents failing validation
    - Test with mixed shift types
    - Test coverage update logic
    - _Requirements: 1.1, 1.2, 1.3, 1.8_

- [ ] 5. Checkpoint - Ensure core algorithm tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Fix duplicate toast notifications
  - [x] 6.1 Update `src/hooks/useBreakSchedules.ts`
    - Modify `updateBreakSchedules` mutation to deduplicate updates
    - Implement deduplication logic to merge updates by user_id + interval_start
    - Ensure onSuccess callback fires only once per mutation call
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 6.2 Update `src/components/BreakSchedule/BreakScheduleTable.tsx`
    - Modify debouncing logic to merge pending updates before calling mutation
    - Implement `mergePendingUpdates()` to combine updates for same user
    - Ensure single mutation call per debounce window
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 6.3 Write property test for single toast per operation
    - **Property 7: Single Toast Per Operation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 6.4 Write unit tests for toast deduplication
    - Test placing B break (2 intervals) shows 1 toast
    - Test placing HB1 break (1 interval) shows 1 toast
    - Test batch update shows 1 toast
    - Mock toast context to count invocations
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Create distribution settings UI
  - [x] 7.1 Create `src/hooks/useDistributionSettings.ts`
    - Implement React Query hook for fetching settings
    - Implement mutation for updating settings
    - Implement mutation for resetting to defaults
    - Handle loading and error states
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [x] 7.2 Create `src/components/DistributionSettingsForm.tsx`
    - Create form with inputs for each shift type's start column
    - Create inputs for b_offset_minutes and hb2_offset_minutes
    - Add validation for column range (0-47) and minimum offsets (90)
    - Display current values from database
    - Show save button (enabled only when changes exist)
    - Show reset to defaults button
    - Display validation errors inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [x] 7.3 Update `src/components/AutoDistributionSettings.tsx`
    - Add section for ladder distribution settings
    - Integrate DistributionSettingsForm component
    - Add radio option for 'ladder' strategy
    - Update default strategy handling
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 7.4 Write unit tests for settings UI
    - Test form renders with current settings
    - Test form validation (invalid columns, invalid offsets)
    - Test save button enabled/disabled state
    - Test reset to defaults functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Integrate ladder strategy with auto-distribution flow
  - [x] 8.1 Update `src/lib/autoDistribution.ts`
    - Add 'ladder' case to strategy selection in `generateDistributionPreview()`
    - Add 'ladder' case to strategy selection in `applyDistribution()`
    - Ensure settings are fetched and passed to ladderDistributionStrategy
    - _Requirements: 2.5, 2.6_
  
  - [x] 8.2 Update `src/services/breakSchedulesService.ts`
    - Ensure autoDistribute endpoint accepts 'ladder' strategy
    - Pass strategy parameter to distribution functions
    - _Requirements: 2.5, 2.6_
  
  - [ ]* 8.3 Write property test for settings application
    - **Property 6: Settings Application**
    - **Validates: Requirements 2.5, 2.6**
  
  - [ ]* 8.4 Write integration tests for end-to-end flow
    - Test auto-distribution with ladder strategy
    - Test that settings changes affect distribution results
    - Test preview generation with ladder strategy
    - Test failed agents are reported correctly
    - _Requirements: 1.1, 1.2, 1.3, 2.5, 2.6_

- [ ] 9. Update documentation and types
  - [ ] 9.1 Update API documentation
    - Document new 'ladder' strategy option
    - Document distribution settings endpoints
    - Document settings validation rules
    - _Requirements: 2.1, 2.2_
  
  - [ ] 9.2 Add JSDoc comments
    - Document ladderDistributionStrategy function
    - Document helper functions (columnToTime, etc.)
    - Document DistributionSettings types
    - _Requirements: 1.1, 2.1_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no regressions in existing functionality
  - Test manual end-to-end flow in UI
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The ladder strategy is implemented alongside existing strategies (no breaking changes)
- Settings are stored in database for persistence across sessions
- Toast deduplication fixes the multiple notification issue for B breaks
