# Implementation Plan: Test Coverage Improvement

## Overview

This plan systematically increases test coverage from 24.42% to 70% by prioritizing critical services layer (4.31%), validation layer (0%), and utility functions. The implementation follows a phased approach: first establishing test infrastructure and coverage tooling, then creating tests for high-priority files (P0), followed by medium-priority files (P1), and finally integrating coverage enforcement into CI/CD. Each phase includes property-based tests for complex business logic and integration tests for critical workflows.

## Tasks

- [x] 1. Set up test infrastructure and coverage configuration
  - Configure Vitest with v8 coverage provider in vite.config.ts
  - Set coverage thresholds: overall 70%, services 70%, components 70%, utils 70%, critical paths 90%, new code 80%
  - Configure coverage output formats (HTML, JSON, text)
  - Set up fast-check for property-based testing
  - Create test configuration file with priorities and exclusions
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 18.1, 18.2, 18.6_

- [x] 2. Implement coverage reporting and analysis tools
  - [x] 2.1 Create Test Suite Manager component
    - Implement generateCoverageReport() function to execute tests and collect coverage data
    - Implement validateThresholds() function to check coverage against configured thresholds
    - Add support for multiple report formats (HTML, JSON, text)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [x] 2.2 Create Coverage Analyzer component
    - Implement identifyGaps() function to find files below target coverage
    - Implement prioritizeFiles() function to sort gaps by priority (P0 > P1 > P2 > P3)
    - Implement suggestTests() function to recommend test types for uncovered code
    - Implement trackProgress() function to compare baseline and current coverage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 3. Checkpoint - Verify coverage tooling works
  - Run coverage report generation and verify all formats are created
  - Test gap identification with current codebase
  - Ensure all tests pass, ask the user if questions arise

- [x] 4. Create Service Test Generator component
  - [x] 4.1 Implement service analysis and mock generation
    - Create function to parse service files and extract method signatures
    - Implement createMocks() function to generate Supabase client mocks
    - Add support for mocking query methods (select, insert, update, delete)
    - Configure mock return values for success and error scenarios
    - _Requirements: 3.1, 3.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 4.2 Implement test generation functions
    - Create generateServiceTest() function for unit test generation
    - Implement test template generation with imports, mocks, and setup
    - Add support for success path, error path, and edge case test generation
    - Ensure generated tests follow project conventions and file organization
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 4.3 Implement property-based test generation
    - Create generatePropertyTest() function using fast-check library
    - Configure property tests to run 100 iterations with max size 50
    - Generate properties for state transitions, calculations, and data integrity
    - Add descriptive property names and validation logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 5. Checkpoint - Verify test generation works
  - Generate sample tests for one service file
  - Verify generated tests are syntactically valid TypeScript
  - Run generated tests and verify they execute successfully
  - Ensure all tests pass, ask the user if questions arise

- [x] 6. Implement tests for P0 priority: Services layer
  - [x] 6.1 Test authentication services
    - Write unit tests for login, logout, and session management functions
    - Mock Supabase auth client responses
    - Test success paths with valid credentials
    - Test error paths with invalid credentials
    - Test edge cases (expired sessions, missing tokens)
    - _Requirements: 3.3, 3.4, 3.5, 13.1_
  
  - [ ]*  6.2 Write property test for authentication state transitions
    - **Property 2: Test Completeness - Every exported function has at least one test**
    - **Validates: Requirements 3.3, 3.4, 3.5**
  
  - [x] 6.3 Test leave request services
    - Write unit tests for createLeaveRequest, approveLeaveRequest, getLeaveBalance functions
    - Mock Supabase database client responses
    - Test leave balance calculations and deductions
    - Test approval workflow state transitions
    - Test edge cases (insufficient balance, overlapping requests)
    - _Requirements: 3.3, 3.4, 3.5, 13.1_
  
  - [ ]* 6.4 Write property test for leave balance calculations
    - **Property 1: Coverage Monotonicity - Leave balance never goes negative**
    - **Validates: Requirements 4.4**
  
  - [x] 6.5 Test swap request services
    - Write unit tests for createSwapRequest, approveSwapRequest, updateShift functions
    - Mock Supabase database client responses
    - Test swap approval workflow
    - Test shift update logic
    - Test edge cases (conflicting swaps, invalid shifts)
    - _Requirements: 3.3, 3.4, 3.5, 13.1_
  
  - [ ]* 6.6 Write property test for swap request state transitions
    - **Property 4: Priority Ordering - State transitions follow valid sequences**
    - **Validates: Requirements 4.3**
  
  - [x] 6.7 Test break schedule services
    - Write unit tests for autoDistributeBreaks, validateCoverage functions
    - Mock Supabase database client responses
    - Test auto-distribution algorithm
    - Test coverage requirement validation
    - Test edge cases (insufficient agents, overlapping breaks)
    - _Requirements: 3.3, 3.4, 3.5, 13.1_
  
  - [ ]* 6.8 Write property test for break auto-distribution
    - **Property: Auto-distribution maintains total coverage**
    - **Validates: Requirements 4.4, 4.5**

- [x] 7. Implement tests for P0 priority: Validation layer
  - [x] 7.1 Test validation schemas
    - Write unit tests for all validation schemas (leave request, swap request, user profile)
    - Test valid inputs that should pass validation
    - Test invalid inputs that should fail validation
    - Test boundary conditions (min/max values, date ranges)
    - Verify error messages are descriptive
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 13.2_
  
  - [ ]* 7.2 Write property test for validation consistency
    - **Property 6: Test Generation Validity - Valid inputs always pass, invalid inputs always fail**
    - **Validates: Requirements 17.1, 17.2**

- [x] 8. Checkpoint - Verify P0 coverage targets met
  - Run coverage report and verify services layer >= 70%
  - Run coverage report and verify validation layer >= 70%
  - Ensure all tests pass, ask the user if questions arise

- [x] 9. Implement tests for P1 priority: Utils layer
  - [x] 9.1 Test date manipulation utilities
    - Write unit tests for date formatting, parsing, and calculation functions
    - Test various date formats and timezones
    - Test edge cases (leap years, DST transitions, invalid dates)
    - _Requirements: 3.3, 3.4, 3.5, 13.3_
  
  - [ ]* 9.2 Write unit tests for date edge cases
    - Test boundary conditions and error handling
    - _Requirements: 3.5_
  
  - [x] 9.3 Test CSV utilities
    - Write unit tests for CSV parsing and generation functions
    - Test various CSV formats and delimiters
    - Test edge cases (empty files, special characters, large files)
    - _Requirements: 3.3, 3.4, 3.5, 13.3_
  
  - [ ]* 9.4 Write unit tests for CSV edge cases
    - Test malformed CSV data and error handling
    - _Requirements: 3.5_
  
  - [x] 9.5 Test formatting utilities
    - Write unit tests for string formatting, number formatting functions
    - Test various input types and formats
    - Test edge cases (null values, empty strings, special characters)
    - _Requirements: 3.3, 3.4, 3.5, 13.3_

- [x] 10. Implement tests for P1 priority: Context providers
  - [x] 10.1 Test authentication context provider
    - Write unit tests for AuthProvider state management
    - Test context value updates on login/logout
    - Test provider composition with child components
    - _Requirements: 3.3, 3.4, 13.4_
  
  - [ ]* 10.2 Write unit tests for auth context edge cases
    - Test error scenarios and state recovery
    - _Requirements: 3.5_
  
  - [x] 10.3 Test other context providers
    - Write unit tests for remaining context providers (theme, notifications, etc.)
    - Test state management and updates
    - Test provider composition
    - _Requirements: 3.3, 3.4, 13.4_

- [x] 11. Checkpoint - Verify P1 coverage targets met
  - Run coverage report and verify utils layer >= 70%
  - Run coverage report and verify context providers >= 70%
  - Ensure all tests pass, ask the user if questions arise

- [x] 12. Implement integration tests for critical workflows
  - [x] 12.1 Set up Supabase local instance for integration testing
    - Configure Supabase CLI and local instance
    - Create test database schema
    - Implement test data seeding functions
    - Implement test data cleanup functions
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 12.2 Write integration test for authentication flow
    - Test complete login → session → logout workflow
    - Verify database state changes (session creation, deletion)
    - Test error scenarios (invalid credentials, expired sessions)
    - _Requirements: 9.5, 9.4, 9.7_
  
  - [x] 12.3 Write integration test for leave request workflow
    - Test complete create → approve → balance deduction workflow
    - Verify database state changes (request creation, status updates, balance updates)
    - Test error scenarios (insufficient balance, invalid dates)
    - _Requirements: 9.6, 9.4, 9.7_
  
  - [x] 12.4 Write integration test for swap request workflow
    - Test complete create → approve → shift update workflow
    - Verify database state changes (request creation, status updates, shift updates)
    - Test error scenarios (conflicting swaps, invalid shifts)
    - _Requirements: 9.6, 9.4, 9.7_
  
  - [x] 12.5 Write integration test for break schedule workflow
    - Test complete auto-distribution → validation → save workflow
    - Verify database state changes (schedule creation, coverage validation)
    - Test error scenarios (insufficient coverage, overlapping breaks)
    - _Requirements: 9.6, 9.4, 9.7_

- [x] 13. Checkpoint - Verify integration test coverage
  - Run coverage report and verify critical paths >= 90%
  - Verify all integration tests pass with Supabase local instance
  - Ensure all tests pass, ask the user if questions arise

- [x] 14. Implement CI/CD coverage enforcement
  - [x] 14.1 Create GitHub Actions workflow for coverage validation
    - Configure workflow to run on pull request creation
    - Execute full test suite with coverage enabled
    - Generate coverage report in JSON format
    - _Requirements: 6.1, 6.2_
  
  - [x] 14.2 Implement coverage threshold validation in CI
    - Parse coverage report JSON
    - Validate overall coverage >= 70%
    - Validate category-specific coverage (services, components, utils >= 70%)
    - Validate critical paths coverage >= 90%
    - Validate new code coverage >= 80%
    - Fail build if any threshold is not met
    - _Requirements: 6.2, 6.3, 6.4, 6.7, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 14.3 Implement coverage delta calculation
    - Load baseline coverage report from main branch
    - Calculate coverage delta (current - baseline)
    - Fail build if coverage decreases by more than 1%
    - _Requirements: 6.6, 8.1, 8.6, 11.3, 11.4_
  
  - [x] 14.4 Implement PR comment generation
    - Generate coverage summary with overall and category metrics
    - Include coverage delta and list of improved/regressed files
    - Post comment to pull request
    - _Requirements: 6.5, 8.2, 8.3, 8.5_

- [x] 15. Implement coverage monitoring and progress tracking
  - [x] 15.1 Create coverage dashboard script
    - Parse coverage reports and extract key metrics
    - Generate visual progress indicators
    - Display files below target with priority
    - Show coverage trends over time
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 15.2 Create coverage gap report script
    - Identify all files below 70% coverage
    - Sort by priority (P0 > P1 > P2 > P3)
    - Estimate tests needed for each file
    - Generate actionable recommendations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 16. Optimize test execution performance
  - [x] 16.1 Configure parallel test execution
    - Set Vitest to use multiple workers based on CPU cores
    - Configure test isolation to prevent conflicts
    - _Requirements: 12.2, 12.4_
  
  - [x] 16.2 Optimize test setup and teardown
    - Minimize test data creation in beforeEach hooks
    - Use shared test fixtures where possible
    - Implement aggressive cleanup in afterEach hooks
    - _Requirements: 12.4_
  
  - [x] 16.3 Verify performance targets
    - Run full test suite and measure execution time
    - Verify execution completes within 30 seconds
    - Verify coverage report generation completes within 10 seconds
    - _Requirements: 12.1, 1.6_

- [x] 17. Final checkpoint - Verify 70% coverage target achieved
  - Run full test suite with coverage
  - Verify overall coverage >= 70%
  - Verify services layer >= 70%
  - Verify validation layer >= 70%
  - Verify utils layer >= 70%
  - Verify critical paths >= 90%
  - Verify CI/CD enforcement is working
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Integration tests validate end-to-end workflows with real database interactions
- P0 priority (services and validation) must be completed before P1 priority (utils and context providers)
- CI/CD enforcement ensures coverage standards are maintained automatically
- Test execution performance targets: full suite < 30s, coverage report < 10s
