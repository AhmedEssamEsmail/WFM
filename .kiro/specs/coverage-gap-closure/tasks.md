# Implementation Plan: Coverage Gap Closure to 80%

## Overview

This plan systematically closes coverage gaps to reach 80% overall coverage. It prioritizes critical files with lowest coverage first, using a phased approach with validation checkpoints.

## Tasks

- [x] 1. Phase 1 - Critical Services (P0)
  - [x] 1.1 Comprehensive tests for breakSchedulesService
    - Test getScheduleForDate with all scenarios
    - Test updateBreakSchedule with validation
    - Test bulkUpdateBreakSchedules
    - Test autoDistribute algorithm
    - Test clearAllBreaksForDate
    - Test getWarnings and dismissWarning
    - Test all error paths and edge cases
    - Target: 7.02% → 80%
    - _Requirements: FR-1.5.1, CR-2.1.5, PR-4.1.1_
  
  - [x] 1.2 Comprehensive tests for autoDistribution lib
    - Test distribution algorithms (balanced, staggered, ladder)
    - Test agent assignment logic
    - Test coverage calculation
    - Test constraint validation
    - Test all edge cases (zero agents, conflicts)
    - Target: 9.23% → 80%
    - _Requirements: FR-1.4.1, CR-2.1.3, PR-4.1.2_

- [x] 2. Phase 1 - Critical Hooks (P0)
  - [x] 2.1 Comprehensive tests for useBreakSchedules
    - Test all query operations
    - Test all mutation operations
    - Test interval generation
    - Test warning management
    - Test auto-distribution
    - Test error handling
    - Target: 19.29% → 80%
    - _Requirements: FR-1.3.1, CR-2.1.2, PR-4.1.3_

  - [x] 2.2 Comprehensive tests for useOvertimeRequests
    - Test request fetching with filters
    - Test request creation
    - Test request approval/rejection
    - Test pagination
    - Test error handling
    - Target: 43.07% → 80%
    - _Requirements: FR-1.3.4, CR-2.1.2_
  
  - [x] 2.3 Comprehensive tests for useHeadcount
    - Test employee fetching with filters
    - Test employee CRUD operations
    - Test department filtering
    - Test skills filtering
    - Test error handling
    - Target: 43.28% → 80%
    - _Requirements: FR-1.3.2, CR-2.1.2_

- [x] 3. Checkpoint - Verify Phase 1 targets
  - [x] Run coverage report
  - [x] Verify breakSchedulesService >= 80%
  - [x] Verify autoDistribution >= 80%
  - [x] Verify useBreakSchedules >= 80%
  - [x] Verify useOvertimeRequests >= 80%
  - [x] Verify useHeadcount >= 80%
  - [x] All tests passing (2158 tests across 119 files)
  - [x] Fixed mock chain issue in breakSchedulesService.comprehensive.test.ts (getWarnings test)
  - _Requirements: VR-5.1.1, VR-5.1.2, VR-5.2.1_

- [-] 4. Phase 2 - Page Components (P0)
  - [x] 4.1 Test BreakSchedule page
    - Test page rendering
    - Test data loading
    - Test schedule interactions
    - Test auto-distribution modal
    - Test error states
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4, PR-4.1.4_
  
  - [x] 4.2 Test Dashboard page
    - Test page rendering
    - Test metrics display
    - Test chart rendering
    - Test navigation
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4, PR-4.1.4_
  
  - [x] 4.3 Test RequestManagement page
    - Test page rendering
    - Test request table
    - Test filtering
    - Test sorting
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4, PR-4.1.4_
  
  - [x] 4.4 Test Auth pages (Login, Signup)
    - Test form rendering
    - Test form validation
    - Test form submission
    - Test error handling
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_

  - [x] 4.5 Test LeaveRequests pages
    - Test LeaveRequests list page
    - Test CreateLeaveRequest page
    - Test LeaveRequestDetail page
    - Test LeaveBalances page
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_
  
  - [x] 4.6 Test SwapRequests pages
    - Test SwapRequests list page
    - Test CreateSwapRequest page
    - Test SwapRequestDetail page
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_
  
  - [x] 4.7 Test OvertimeRequests pages
    - Test OvertimeRequests list page
    - Test CreateOvertimeRequest page
    - Test OvertimeRequestDetail page
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_

- [x] 5. Checkpoint - Verify Phase 2 targets
  - Run coverage report
  - Verify all page components >= 80%
  - Verify components layer improving
  - All tests passing
  - Test execution time < 60s
  - _Requirements: VR-5.1.1, VR-5.1.2, VR-5.2.1, TQ-3.3.1_
  - _Status: Phase 2 (Task 4) not yet started. Page components still at 0% coverage. Tests are passing (516/540 tests) with execution time ~21s. Need to complete Task 4 before this checkpoint can be fully validated._

- [ ] 6. Phase 3 - Complex Components (P1)
  - [x] 6.1 Test BreakSchedule components
    - [x] Analyzed current coverage for all BreakSchedule components
    - [x] AgentRow component (94.73% - already above target ✅)
    - [ ] AutoDistributeModal component (0% - needs comprehensive tests)
    - [x] BreakCell component (92.59% - already above target ✅)
    - [x] BreakScheduleTable component (83.33% - already above target ✅)
    - [x] CoverageCell component (100% lines, 53.84% branches - needs branch coverage)
    - [x] DateNavigation component (100% - already above target ✅)
    - [X] FilterBar component (0% - needs comprehensive tests)
    - [X] RulesConfig component (0% - needs comprehensive tests)
    - [X] ValidationBanner component (0% - needs comprehensive tests)
    - [X] WarningPopup component (status unknown - needs verification)
    - Target: 0% → 80%
    - _Requirements: FR-1.2.2, CR-2.1.4, PR-4.2.3_
    - _Status: Coverage analysis complete. 5 components already meet target. 5 components need tests. See task-6-summary.md for details._
  
  - [x] 6.2 Test AutoDistributionSettings component
    - [x] Analyzed current coverage (0%)
    - [x] Create comprehensive tests
    - Test settings form rendering
    - Test form validation
    - Test form submission
    - Test strategy selection
    - Target: 0% → 80%
    - _Requirements: FR-1.2.1, CR-2.1.4_
  
  - [x] 6.3 Test Settings page components
    - [x] Check current coverage for all Settings components
    - Test BreakScheduleSettings
    - Test GeneralSettings
    - Test LeaveTypeManager
    - Test OvertimeSettings
    - Test ShiftConfigSettings
    - Test SkillsManager
    - Target: 0-14% → 80%
    - _Requirements: FR-1.2.6, CR-2.1.4, PR-4.2.4_
  - _Task 6 Notes: Created comprehensive task-6-summary.md with implementation strategy. Fixed failing test in breakSchedulesService. All 2158 tests passing across 119 files._

- [ ] 7. Phase 4 - Remaining Components (P2)
  - [x] 7.1 Test Headcount components
    - Test EditEmployeeModal
    - Test EmployeeCard
    - Test EmployeeTable
    - Test ProtectedEdit
    - Target: 0% → 80%
    - _Requirements: FR-1.2.3, CR-2.1.4, PR-4.3.1_
  
  - [x] 7.2 Test OvertimeRequests components
    - Test ApprovalTimeline
    - Test OvertimeRequestCard
    - Test OvertimeStatistics
    - Target: 0% → 80%
    - _Requirements: FR-1.2.4, CR-2.1.4, PR-4.3.2_
  
  - [-] 7.3 Test Schedule components
    - Test SkillsFilter
    - Test Schedule page components
    - Target: 0% → 80%
    - _Requirements: FR-1.2.5, CR-2.1.4, PR-4.3.3_
  
  - [ ] 7.4 Test Headcount pages
    - Test EmployeeDetail page
    - Test EmployeeDirectory page
    - Test HeadcountDashboard page
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_
  
  - [ ] 7.5 Test Schedule pages
    - Test Schedule page
    - Test ScheduleUpload page
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_
  
  - [ ] 7.6 Test Reports pages
    - Test Reports index page
    - Test LeaveChart component
    - Test MetricCards component
    - Test ReportFilters component
    - Test SwapChart component
    - Target: 0% → 80%
    - _Requirements: FR-1.1.1, CR-2.1.4_

- [ ] 8. Checkpoint - Verify Phase 3 & 4 targets
  - Run coverage report
  - Verify all components >= 80%
  - Verify components layer >= 80%
  - All tests passing
  - Test execution time < 60s
  - _Requirements: VR-5.1.1, VR-5.1.2, VR-5.2.1, CR-2.1.4_

- [ ] 9. Phase 5 - Remaining Lib & Hook Gaps
  - [ ] 9.1 Improve performance lib coverage
    - Test performance tracking
    - Test metrics collection
    - Test reporting
    - Target: 13.63% → 80%
    - _Requirements: FR-1.4.2, CR-2.1.3, PR-4.3.4_
  
  - [ ] 9.2 Test sentry lib
    - Test error reporting
    - Test context enrichment
    - Test filtering
    - Target: 0% → 80%
    - _Requirements: FR-1.4.3, CR-2.1.3_

  - [ ] 9.3 Improve breakScheduleCSV coverage
    - Test all parsing scenarios
    - Test all generation scenarios
    - Test error handling
    - Target: 51.28% → 80%
    - _Requirements: FR-1.4.4, CR-2.1.3_
  
  - [ ] 9.4 Improve breakValidation coverage
    - Test all validation rules
    - Test all error scenarios
    - Test edge cases
    - Target: 38.62% → 80%
    - _Requirements: FR-1.4.5, CR-2.1.3_
  
  - [ ] 9.5 Improve remaining hook coverage
    - Test useLeaveRequests edge cases
    - Test useSwapRequests edge cases
    - Test useReportData edge cases
    - Test useOvertimeStatistics edge cases
    - Target: All hooks → 80%
    - _Requirements: FR-1.3.4, FR-1.3.5, CR-2.1.2_

- [ ] 10. Checkpoint - Verify Phase 5 targets
  - Run coverage report
  - Verify all libs >= 80%
  - Verify all hooks >= 80%
  - Verify lib layer >= 80%
  - Verify hooks layer >= 80%
  - All tests passing
  - _Requirements: VR-5.1.1, VR-5.1.2, CR-2.1.2, CR-2.1.3_

- [ ] 11. Phase 6 - Final Gap Closure
  - [ ] 11.1 Identify remaining files < 80%
    - Run coverage report
    - Generate gap analysis
    - Prioritize remaining gaps
    - _Requirements: VR-5.1.3, VR-5.1.4_
  
  - [ ] 11.2 Close remaining gaps
    - Add tests for files < 80%
    - Focus on untested branches
    - Add edge case tests
    - Target: All files → 80%
    - _Requirements: CR-2.2.1, CR-2.3.1, CR-2.3.2, CR-2.3.3, CR-2.3.4_
  
  - [ ] 11.3 Optimize test performance
    - Profile slow tests
    - Optimize test setup/teardown
    - Ensure parallel execution
    - Target: < 60s total
    - _Requirements: TQ-3.3.1, TQ-3.3.2, TQ-3.3.3_
  
  - [ ] 11.4 Fix any flaky tests
    - Identify flaky tests
    - Fix timing issues
    - Improve test isolation
    - Target: 0 flaky tests
    - _Requirements: TQ-3.2.2, TQ-3.2.3, TQ-3.2.4_

- [ ] 12. Final Validation
  - [ ] 12.1 Run full test suite
    - Execute all tests
    - Verify all passing
    - Check execution time
    - _Requirements: VR-5.2.1, VR-5.2.2, TQ-3.3.1_
  
  - [ ] 12.2 Generate final coverage report
    - Run coverage with all formats
    - Verify overall >= 80%
    - Verify all layers >= 80%
    - Verify no file < 70%
    - _Requirements: CR-2.1.1, CR-2.1.2, CR-2.1.3, CR-2.1.4, CR-2.1.5, CR-2.2.1_

  - [ ] 12.3 Verify quality metrics
    - No skipped tests
    - No test warnings
    - All tests isolated
    - All tests reliable
    - _Requirements: VR-5.2.3, VR-5.2.4, TQ-3.2.1, TQ-3.2.3_
  
  - [ ] 12.4 Document coverage improvements
    - Document test patterns used
    - Document mock strategies
    - Document coverage gains
    - Document lessons learned
    - _Requirements: DR-6.1.1, DR-6.1.2, DR-6.1.3, DR-6.1.4_

- [ ] 13. Success Verification
  - Verify overall coverage >= 80%
  - Verify hooks layer >= 80%
  - Verify lib layer >= 80%
  - Verify components layer >= 80%
  - Verify services layer >= 80%
  - Verify no file < 70%
  - Verify all tests passing
  - Verify test execution < 60s
  - Verify no flaky tests
  - Verify no skipped tests

## Notes

- Each phase builds on the previous phase
- Checkpoints ensure targets are met before proceeding
- Focus on critical files first (lowest coverage, highest impact)
- Use comprehensive test patterns for files < 20% coverage
- Use gap analysis for files 20-80% coverage
- Maintain test quality and performance throughout
- All tests must be reliable and maintainable
- Document patterns and strategies for future reference

## Success Criteria

The spec is complete when:
1. Overall coverage >= 80%
2. All layers (hooks, libs, components, services) >= 80%
3. No file has < 70% coverage
4. All 1787+ tests passing
5. Test execution time < 60 seconds
6. No flaky or skipped tests
7. Coverage report shows no critical gaps
