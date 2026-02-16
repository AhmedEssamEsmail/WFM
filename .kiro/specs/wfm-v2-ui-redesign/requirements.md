# Requirements Document

## Introduction

This document specifies the requirements for a complete UI redesign of the WFM (Workforce Management) application to match the modern WFM v2 design. The redesign focuses on improving visual consistency, user experience, and information density while preserving all existing functionality. The redesign includes layout restructuring, page redesigns, and a new unified request management interface.

## Glossary

- **WFM_System**: The Workforce Management application that manages employee schedules, shift swaps, and leave requests
- **Sidebar**: The left navigation panel containing menu items and user controls
- **Dashboard**: The main landing page showing system statistics and recent activity
- **Schedule_Page**: The page displaying employee shift schedules in calendar format
- **Request_Management_Page**: A new unified page combining swap and leave request management
- **Swap_Request**: A request from one employee to exchange shifts with another employee
- **Leave_Request**: A request from an employee for time off
- **Stat_Card**: A dashboard component displaying a single metric with icon and colored background
- **Coverage_Overview**: A dashboard component showing daily staffing levels via bar chart
- **View_Toggle**: A UI control allowing users to switch between weekly and monthly schedule views
- **Type_Badge**: A colored label indicating whether a request is a swap or leave request
- **Status_Badge**: A colored label indicating the approval status of a request
- **Agent**: An employee user with basic access to view schedules and manage their own requests
- **TL**: Team Lead user with elevated permissions to approve requests and manage team schedules
- **WFM**: Workforce Management admin user with full system access

## Requirements

### Requirement 1: Sidebar Layout Redesign

**User Story:** As a user, I want a consistently visible navigation sidebar with user controls at the bottom, so that I can easily access all features and account settings.

#### Acceptance Criteria

1. THE WFM_System SHALL display the Sidebar in an always-expanded state without collapse functionality
2. WHEN the Sidebar is rendered, THE WFM_System SHALL position the user profile section (avatar, name, role badge) at the bottom of the Sidebar
3. WHEN the Sidebar is rendered, THE WFM_System SHALL position the dark mode toggle control at the bottom of the Sidebar
4. WHEN the Sidebar is rendered, THE WFM_System SHALL position the sign out button at the bottom of the Sidebar
5. THE WFM_System SHALL preserve all existing navigation menu items in the Sidebar
6. THE WFM_System SHALL maintain the current navigation item ordering and hierarchy

### Requirement 2: Dashboard Statistics Display

**User Story:** As a user, I want to see key system metrics at a glance on the dashboard, so that I can quickly understand the current state of the workforce.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE WFM_System SHALL display four Stat_Cards at the top of the page
2. THE WFM_System SHALL display a "Total Staff" Stat_Card showing the count of active employees
3. THE WFM_System SHALL display an "Active Shifts" Stat_Card showing the count of shifts scheduled for the current day
4. THE WFM_System SHALL display a "Pending Requests" Stat_Card showing the count of leave requests awaiting approval
5. THE WFM_System SHALL display an "Open Swaps" Stat_Card showing the count of swap requests awaiting acceptance or approval
6. WHEN rendering each Stat_Card, THE WFM_System SHALL include an icon and colored background appropriate to the metric type
7. THE WFM_System SHALL arrange the four Stat_Cards in a responsive grid layout

### Requirement 3: Dashboard Recent Requests Section

**User Story:** As a user, I want to see recent swap and leave requests on the dashboard, so that I can quickly review pending actions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE WFM_System SHALL display a "Recent Requests" section below the Stat_Cards
2. THE WFM_System SHALL display recent Swap_Requests and Leave_Requests in a unified list
3. WHEN displaying each request, THE WFM_System SHALL show the requester name
4. WHEN displaying each request, THE WFM_System SHALL show a Type_Badge indicating "Swap" or "Leave"
5. WHEN displaying each request, THE WFM_System SHALL show a Status_Badge indicating the current approval status
6. WHEN displaying a Swap_Request, THE WFM_System SHALL show the target user name
7. WHEN displaying a Leave_Request, THE WFM_System SHALL show the leave date range
8. THE WFM_System SHALL limit the Recent Requests section to the 10 most recent requests

### Requirement 4: Dashboard Coverage Overview

**User Story:** As a manager, I want to see daily staffing coverage for the week, so that I can identify potential understaffing issues.

#### Acceptance Criteria

1. WHERE the user role is TL or WFM, THE WFM_System SHALL display a "Coverage Overview" section on the Dashboard
2. WHEN the Coverage_Overview is rendered, THE WFM_System SHALL display a bar chart showing staffing levels for each day of the current week (Monday through Sunday)
3. WHEN calculating coverage for a day, THE WFM_System SHALL count the number of employees with assigned shifts minus those on approved leave
4. WHEN rendering the bar chart, THE WFM_System SHALL use different colors to indicate coverage levels (adequate, low, critical)
5. THE WFM_System SHALL update the Coverage_Overview data when the Dashboard is loaded or refreshed

### Requirement 5: Schedule View Toggle

**User Story:** As a user, I want to switch between weekly and monthly schedule views, so that I can see schedule details at different time scales.

#### Acceptance Criteria

1. WHEN the Schedule_Page loads, THE WFM_System SHALL display a View_Toggle control with "Weekly" and "Monthly" options
2. WHEN the user selects "Weekly" view, THE WFM_System SHALL display a 7-day calendar grid showing the current week
3. WHEN the user selects "Monthly" view, THE WFM_System SHALL display the full month calendar grid (existing behavior)
4. THE WFM_System SHALL persist the selected view preference in browser local storage
5. WHEN the Schedule_Page loads, THE WFM_System SHALL restore the previously selected view from local storage
6. THE WFM_System SHALL default to "Monthly" view if no preference is stored

### Requirement 6: Schedule Filter Controls

**User Story:** As a manager, I want to filter the schedule by team and agent, so that I can focus on specific groups or individuals.

#### Acceptance Criteria

1. WHERE the user role is TL or WFM, THE WFM_System SHALL display a "Team" filter dropdown on the Schedule_Page
2. WHERE the user role is TL or WFM, THE WFM_System SHALL display an "Agent" filter dropdown on the Schedule_Page
3. WHEN a team is selected, THE WFM_System SHALL display only employees belonging to that team in the schedule grid
4. WHEN an agent is selected, THE WFM_System SHALL display only that specific agent in the schedule grid
5. THE WFM_System SHALL preserve the existing "All Agents" filter functionality
6. WHEN filters are applied, THE WFM_System SHALL maintain all existing schedule editing capabilities

### Requirement 7: Schedule Visual Design

**User Story:** As a user, I want shift cells to clearly show shift details with color coding, so that I can quickly understand the schedule at a glance.

#### Acceptance Criteria

1. WHEN rendering a shift cell, THE WFM_System SHALL display the shift type name (Morning, Day, Evening, Night)
2. WHEN rendering a shift cell, THE WFM_System SHALL display the time range in 24-hour format (e.g., "08:00 - 17:00")
3. THE WFM_System SHALL apply a light blue background color to Morning shift cells
4. THE WFM_System SHALL apply a blue background color to Day shift cells
5. THE WFM_System SHALL apply a purple background color to Evening shift cells
6. THE WFM_System SHALL apply a dark background color to Night shift cells
7. WHEN rendering a shift cell, THE WFM_System SHALL ensure text remains readable against the background color
8. THE WFM_System SHALL preserve all existing shift editing functionality

### Requirement 8: Unified Request Management Page

**User Story:** As a manager, I want a single page to view and manage all swap and leave requests, so that I can efficiently process approvals.

#### Acceptance Criteria

1. THE WFM_System SHALL provide a Request_Management_Page accessible via navigation
2. WHEN the Request_Management_Page loads, THE WFM_System SHALL display both Swap_Requests and Leave_Requests in a unified table
3. WHEN displaying each request row, THE WFM_System SHALL show the requester avatar and name
4. WHEN displaying each request row, THE WFM_System SHALL show a Type_Badge indicating "Swap" (blue) or "Leave" (orange)
5. WHEN displaying each request row, THE WFM_System SHALL show request-specific details (target user for swaps, date range for leave)
6. WHEN displaying each request row, THE WFM_System SHALL show a Status_Badge with color coding (Approved=green, Pending TL=yellow, Pending Recipient=blue, Rejected=red)
7. WHERE the user has permission to act on a request, THE WFM_System SHALL display action buttons (Approve, Reject, Revoke) in the Actions column
8. WHEN a user clicks on a request row, THE WFM_System SHALL navigate to the detailed view page for that request
9. THE WFM_System SHALL preserve all existing filter functionality for both request types

### Requirement 9: Request Table Status Badges

**User Story:** As a user, I want clear visual indicators of request status, so that I can quickly identify which requests need attention.

#### Acceptance Criteria

1. WHEN rendering a Status_Badge for an approved request, THE WFM_System SHALL display "Approved" with a green background
2. WHEN rendering a Status_Badge for a request pending TL approval, THE WFM_System SHALL display "Pending TL" with a yellow background
3. WHEN rendering a Status_Badge for a swap request pending recipient acceptance, THE WFM_System SHALL display "Pending Recipient" with a blue background
4. WHEN rendering a Status_Badge for a rejected request, THE WFM_System SHALL display "Rejected" with a red background
5. WHEN rendering a Status_Badge for a request pending WFM approval, THE WFM_System SHALL display "Pending WFM" with a yellow background
6. THE WFM_System SHALL ensure Status_Badge text is readable against the background color

### Requirement 10: Request Type Badges

**User Story:** As a user, I want to quickly distinguish between swap and leave requests, so that I can understand the request type at a glance.

#### Acceptance Criteria

1. WHEN rendering a Type_Badge for a Swap_Request, THE WFM_System SHALL display "Swap" with a blue background
2. WHEN rendering a Type_Badge for a Leave_Request, THE WFM_System SHALL display "Leave" with an orange background
3. THE WFM_System SHALL ensure Type_Badge text is readable against the background color
4. WHEN rendering a Type_Badge, THE WFM_System SHALL use consistent sizing and styling across all request displays

### Requirement 11: Request Action Buttons

**User Story:** As a manager, I want to approve or reject requests directly from the table view, so that I can process requests efficiently.

#### Acceptance Criteria

1. WHERE the user role is TL or WFM, WHEN a request status is "pending_tl" or "pending_wfm", THE WFM_System SHALL display "Approve" and "Reject" action buttons
2. WHERE the user is the requester, WHEN a request status is "pending_acceptance" or "pending_tl" or "pending_wfm", THE WFM_System SHALL display a "Revoke" action button
3. WHEN a user clicks "Approve", THE WFM_System SHALL update the request status according to the approval workflow
4. WHEN a user clicks "Reject", THE WFM_System SHALL update the request status to "rejected"
5. WHEN a user clicks "Revoke", THE WFM_System SHALL delete the request
6. WHEN an action completes successfully, THE WFM_System SHALL refresh the request list to reflect the updated status
7. IF an action fails, THEN THE WFM_System SHALL display an error message to the user

### Requirement 12: Swap Requests Page Update

**User Story:** As a user, I want the Swap Requests page to match the new design aesthetic, so that the interface is visually consistent.

#### Acceptance Criteria

1. THE WFM_System SHALL update the Swap Requests page table design to match the Request_Management_Page styling
2. THE WFM_System SHALL preserve all existing Swap_Request detail page functionality
3. THE WFM_System SHALL preserve all existing Swap_Request filter functionality
4. THE WFM_System SHALL preserve all existing Swap_Request approval workflow logic

### Requirement 13: Leave Requests Page Update

**User Story:** As a user, I want the Leave Requests page to match the new design aesthetic, so that the interface is visually consistent.

#### Acceptance Criteria

1. THE WFM_System SHALL update the Leave Requests page table design to match the Request_Management_Page styling
2. THE WFM_System SHALL preserve all existing Leave_Request detail page functionality
3. THE WFM_System SHALL preserve all existing Leave_Request filter functionality
4. THE WFM_System SHALL preserve all existing Leave_Request approval workflow logic

### Requirement 14: Headcount Page Update

**User Story:** As a manager, I want the Headcount page to match the new design aesthetic, so that the interface is visually consistent.

#### Acceptance Criteria

1. THE WFM_System SHALL update the Headcount page styling to match the WFM v2 design aesthetic
2. THE WFM_System SHALL preserve all existing employee directory functionality
3. THE WFM_System SHALL preserve all existing employee detail page functionality
4. THE WFM_System SHALL preserve all existing employee management features

### Requirement 19: Employee Edit Popup

**User Story:** As a manager, I want to edit employee information through a popup modal, so that I can update employee details without navigating away from the current page.

#### Acceptance Criteria

1. WHEN a manager clicks an edit action for an employee, THE WFM_System SHALL display a popup modal overlay
2. WHEN the employee edit popup is displayed, THE WFM_System SHALL show all editable employee fields including name, email, role, team, and any other configured attributes
3. WHEN the user modifies employee fields in the popup, THE WFM_System SHALL validate the input according to existing validation rules
4. WHEN the user clicks "Save" in the popup, THE WFM_System SHALL update the employee record in the database
5. WHEN the save operation completes successfully, THE WFM_System SHALL close the popup and refresh the employee list
6. WHEN the user clicks "Cancel" or clicks outside the popup, THE WFM_System SHALL close the popup without saving changes
7. IF the save operation fails, THEN THE WFM_System SHALL display an error message within the popup without closing it

### Requirement 15: Mobile Responsiveness

**User Story:** As a mobile user, I want all redesigned pages to work well on small screens, so that I can use the system on any device.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 pixels, THE WFM_System SHALL adapt the Sidebar to a mobile-friendly overlay menu
2. WHEN the viewport width is less than 768 pixels, THE WFM_System SHALL stack Stat_Cards vertically on the Dashboard
3. WHEN the viewport width is less than 768 pixels, THE WFM_System SHALL enable horizontal scrolling for the Schedule_Page calendar grid
4. WHEN the viewport width is less than 768 pixels, THE WFM_System SHALL adapt the Request_Management_Page table to a card-based layout
5. THE WFM_System SHALL ensure all interactive elements remain accessible and usable on touch devices

### Requirement 16: Performance Preservation

**User Story:** As a user, I want the redesigned interface to load and respond quickly, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN loading the Dashboard, THE WFM_System SHALL fetch and display data within 2 seconds under normal network conditions
2. WHEN switching between schedule views, THE WFM_System SHALL render the new view within 500 milliseconds
3. WHEN filtering requests on the Request_Management_Page, THE WFM_System SHALL update the display within 300 milliseconds
4. THE WFM_System SHALL maintain or improve upon existing page load performance metrics
5. THE WFM_System SHALL not introduce memory leaks or performance degradation during extended use

### Requirement 17: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the redesigned interface to be fully accessible, so that I can use all features effectively.

#### Acceptance Criteria

1. THE WFM_System SHALL ensure all interactive elements are keyboard navigable
2. THE WFM_System SHALL provide appropriate ARIA labels for all custom UI components
3. THE WFM_System SHALL maintain a minimum contrast ratio of 4.5:1 for all text elements
4. THE WFM_System SHALL ensure all Status_Badges and Type_Badges meet color contrast requirements
5. THE WFM_System SHALL provide focus indicators for all interactive elements
6. THE WFM_System SHALL ensure screen readers can announce all status changes and notifications

### Requirement 18: Data Integrity

**User Story:** As a system administrator, I want the UI redesign to maintain data integrity, so that no information is lost or corrupted.

#### Acceptance Criteria

1. THE WFM_System SHALL preserve all existing database schemas without modification
2. THE WFM_System SHALL preserve all existing API endpoints and data contracts
3. WHEN updating request statuses, THE WFM_System SHALL maintain referential integrity across related tables
4. WHEN displaying aggregated statistics, THE WFM_System SHALL calculate values accurately from the database
5. THE WFM_System SHALL not introduce any data loss scenarios during the redesign implementation
