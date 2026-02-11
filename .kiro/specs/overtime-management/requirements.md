# Requirements Document

## Introduction

The Overtime Management System enables agents to submit overtime requests for hours worked beyond their scheduled shifts, with a multi-level approval workflow for Team Leads and WFM Administrators. The system tracks regular overtime (1.5x pay) and double-time overtime (2x pay), validates requests against configurable limits, and provides comprehensive reporting and CSV export capabilities for payroll processing.

## Glossary

- **System**: The Overtime Management feature within the WFM application
- **Agent**: A user with the 'agent' role who can submit and view their own overtime requests
- **Team_Lead**: A user with the 'tl' role who provides first-level approval for their team's overtime requests
- **WFM_Administrator**: A user with the 'wfm' role who provides final approval and manages overtime settings
- **Overtime_Request**: A request to compensate an agent for hours worked beyond their scheduled shift
- **Regular_Overtime**: Overtime compensated at 1.5x the standard pay rate
- **Double_Time**: Overtime compensated at 2.0x the standard pay rate
- **Approval_Workflow**: The multi-stage process where Team_Lead reviews first, then WFM_Administrator provides final approval
- **Auto_Approve**: A configurable setting that automatically approves requests after Team_Lead approval, skipping WFM review
- **Daily_Limit**: The maximum number of overtime hours an agent can request per day for each overtime type
- **Weekly_Limit**: The maximum number of overtime hours an agent can request per week for each overtime type
- **Equivalent_Hours**: The calculated payroll cost in hour equivalents (hours × pay multiplier)
- **Submission_Deadline**: The maximum number of days after the work date that an overtime request can be submitted

## Requirements

### Requirement 1: Submit Overtime Request

**User Story:** As an Agent, I want to submit overtime requests for hours worked beyond my scheduled shift, so that I can get compensated for extra hours worked.

#### Acceptance Criteria

1. WHEN an Agent submits an overtime request, THE System SHALL require a work date, start time, end time, overtime type, and reason
2. WHEN an Agent selects start and end times, THE System SHALL automatically calculate the total hours
3. WHEN an Agent submits a request, THE System SHALL validate that the work date is not more than 7 days in the past
4. WHEN an Agent submits a request, THE System SHALL validate that the work date is not in the future
5. WHEN an Agent submits a request, THE System SHALL validate that the end time is after the start time
6. WHEN an Agent submits a request, THE System SHALL validate that total hours are greater than 0 and less than or equal to 24
7. WHEN an Agent submits a request, THE System SHALL validate that the reason is between 10 and 250 characters
8. WHEN an Agent submits a valid request, THE System SHALL create the request with status 'pending_tl'
9. WHEN an Agent submits a request, THE System SHALL prevent duplicate requests for the same time period
10. WHEN an Agent submits a request, THE System SHALL display the agent's scheduled shift information for that date

### Requirement 2: Validate Overtime Limits

**User Story:** As a WFM Administrator, I want the system to enforce daily and weekly overtime limits, so that I can control labor costs and prevent excessive overtime.

#### Acceptance Criteria

1. WHEN an Agent submits an overtime request, THE System SHALL check if the request would exceed the daily limit for that overtime type
2. WHEN an Agent submits an overtime request, THE System SHALL check if the request would exceed the weekly limit for that overtime type
3. WHEN a request would exceed a daily limit, THE System SHALL reject the submission and display an error message
4. WHEN a request would exceed a weekly limit, THE System SHALL reject the submission and display an error message
5. WHEN a request is approaching a daily limit, THE System SHALL display a warning showing remaining hours available
6. WHEN a request is approaching a weekly limit, THE System SHALL display a warning showing remaining hours available
7. WHEN calculating weekly limits, THE System SHALL include all approved and pending overtime requests for the current week

### Requirement 3: Verify Shift Schedule

**User Story:** As a WFM Administrator, I want the system to verify that agents had scheduled shifts on overtime dates, so that overtime requests are legitimate and aligned with work schedules.

#### Acceptance Criteria

1. WHEN an Agent submits an overtime request, THE System SHALL verify that the agent had a scheduled shift on the work date
2. WHEN an agent has no scheduled shift on the work date, THE System SHALL display a warning message
3. WHEN shift verification is enabled in settings, THE System SHALL display the agent's scheduled shift type and hours
4. WHEN an overtime request is outside the agent's scheduled shift hours, THE System SHALL display a warning message
5. WHERE shift verification is disabled in settings, THE System SHALL allow overtime submission without shift validation

### Requirement 4: View Overtime Requests

**User Story:** As a user, I want to view overtime requests filtered by my role, so that I can track request status and take appropriate actions.

#### Acceptance Criteria

1. WHEN an Agent accesses the overtime requests page, THE System SHALL display only their own overtime requests
2. WHEN a Team_Lead accesses the overtime requests page, THE System SHALL display their team's overtime requests and their own requests
3. WHEN a WFM_Administrator accesses the overtime requests page, THE System SHALL display all overtime requests
4. WHEN displaying overtime requests, THE System SHALL show the work date, overtime type, total hours, status, and reason
5. WHEN displaying overtime requests, THE System SHALL show approval information for approved or rejected requests
6. WHEN a user clicks on an overtime request card, THE System SHALL navigate to the request detail page
7. WHEN displaying overtime requests, THE System SHALL paginate results with 50 requests per page

### Requirement 5: Filter Overtime Requests

**User Story:** As a user, I want to filter overtime requests by status, date range, and agent, so that I can quickly find specific requests.

#### Acceptance Criteria

1. WHEN a user selects a status filter, THE System SHALL display only requests matching that status
2. WHEN a user selects a date range filter, THE System SHALL display only requests within that date range
3. WHEN a Team_Lead or WFM_Administrator uses the agent search filter, THE System SHALL display only requests from agents matching the search term
4. WHEN the "All" status filter is selected, THE System SHALL display requests with any status
5. WHEN date range filters are applied, THE System SHALL provide preset options for "This Week", "Last 30 Days", and "Custom"
6. WHEN a user navigates to a different page, THE System SHALL preserve the current filter settings

### Requirement 6: View Overtime Request Details

**User Story:** As a user, I want to view complete overtime request details with approval timeline and comments, so that I can understand the request context and history.

#### Acceptance Criteria

1. WHEN a user views an overtime request detail page, THE System SHALL display all request information including agent, date, time range, hours, type, status, and reason
2. WHEN viewing request details, THE System SHALL display an approval timeline showing submission, Team_Lead review, and WFM review stages
3. WHEN viewing request details, THE System SHALL display all comments in chronological order
4. WHEN viewing request details, THE System SHALL display approval or rejection notes from Team_Lead and WFM_Administrator
5. WHEN viewing request details, THE System SHALL display the submission timestamp and last update timestamp

### Requirement 7: Approve or Reject Overtime Requests

**User Story:** As a Team Lead or WFM Administrator, I want to approve or reject overtime requests with notes, so that I can manage team overtime and provide feedback to agents.

#### Acceptance Criteria

1. WHEN a Team_Lead views a request with status 'pending_tl', THE System SHALL display approve and reject buttons
2. WHEN a WFM_Administrator views a request with status 'pending_tl' or 'pending_wfm', THE System SHALL display approve and reject buttons
3. WHEN a Team_Lead approves a request, THE System SHALL change the status to 'pending_wfm' or 'approved' based on auto-approve setting
4. WHEN a WFM_Administrator approves a request with status 'pending_wfm', THE System SHALL change the status to 'approved'
5. WHEN a Team_Lead or WFM_Administrator rejects a request, THE System SHALL change the status to 'rejected'
6. WHEN approving or rejecting a request, THE System SHALL require notes or a reason
7. WHEN a request is approved or rejected, THE System SHALL record the reviewer's user ID and timestamp
8. WHEN a request is approved or rejected, THE System SHALL create a system comment documenting the action

### Requirement 8: Auto-Approve Overtime Requests

**User Story:** As a WFM Administrator, I want to configure auto-approve to skip WFM review for Team Lead approved requests, so that I can streamline the approval process for trusted teams.

#### Acceptance Criteria

1. WHERE auto-approve is enabled, WHEN a Team_Lead approves a request, THE System SHALL change the status directly to 'approved'
2. WHERE auto-approve is enabled, WHEN a request is auto-approved, THE System SHALL record the Team_Lead as both TL and WFM reviewer
3. WHERE auto-approve is enabled, WHEN a request is auto-approved, THE System SHALL add a system comment indicating auto-approval
4. WHERE auto-approve is disabled, WHEN a Team_Lead approves a request, THE System SHALL change the status to 'pending_wfm'
5. WHERE auto-approve is disabled, WHEN a request reaches 'pending_wfm' status, THE System SHALL require WFM_Administrator approval

### Requirement 9: Cancel Overtime Requests

**User Story:** As an Agent, I want to cancel my pending overtime requests, so that I can withdraw requests that are no longer needed.

#### Acceptance Criteria

1. WHEN an Agent views their own request with status 'pending_tl' or 'pending_wfm', THE System SHALL display a cancel button
2. WHEN an Agent clicks the cancel button, THE System SHALL change the request status to 'cancelled'
3. WHEN a request is cancelled, THE System SHALL record the cancellation timestamp
4. WHEN a request is cancelled, THE System SHALL create a system comment documenting the cancellation
5. WHEN a request has status 'approved', 'rejected', or 'cancelled', THE System SHALL not display a cancel button

### Requirement 10: Add Comments to Overtime Requests

**User Story:** As a user, I want to add comments to overtime requests, so that I can discuss details and provide additional context.

#### Acceptance Criteria

1. WHEN a user views an overtime request detail page, THE System SHALL display a comment input field
2. WHEN a user submits a comment, THE System SHALL save the comment with the user's ID and timestamp
3. WHEN displaying comments, THE System SHALL show the commenter's name and timestamp
4. WHEN displaying comments, THE System SHALL distinguish between user comments and system-generated comments
5. WHEN a comment is added, THE System SHALL display it immediately in the comment thread

### Requirement 11: Configure Overtime Settings

**User Story:** As a WFM Administrator, I want to configure overtime settings including limits, auto-approve, and deadlines, so that I can adapt the system to changing business requirements.

#### Acceptance Criteria

1. WHEN a WFM_Administrator accesses overtime settings, THE System SHALL display all configurable settings with current values
2. WHEN a WFM_Administrator updates the auto-approve setting, THE System SHALL apply the change immediately to future approvals
3. WHEN a WFM_Administrator updates daily or weekly limits, THE System SHALL apply the change immediately to future validations
4. WHEN a WFM_Administrator updates the submission deadline, THE System SHALL apply the change immediately to future submissions
5. WHEN a WFM_Administrator updates pay multipliers, THE System SHALL apply the change immediately to future reports
6. WHEN a WFM_Administrator saves settings, THE System SHALL record the administrator's user ID and update timestamp
7. WHEN settings are updated, THE System SHALL validate that daily limits are positive numbers
8. WHEN settings are updated, THE System SHALL validate that weekly limits are positive numbers
9. WHEN settings are updated, THE System SHALL validate that pay multipliers are positive numbers

### Requirement 12: View Overtime Reports

**User Story:** As a WFM Administrator, I want to view overtime statistics and analytics, so that I can monitor overtime trends and identify high-overtime agents.

#### Acceptance Criteria

1. WHEN a WFM_Administrator accesses the reports page, THE System SHALL display an overtime summary card showing total requests and approval rate
2. WHEN viewing overtime statistics, THE System SHALL display total overtime hours broken down by regular and double-time
3. WHEN viewing overtime statistics, THE System SHALL display total equivalent hours for payroll calculation
4. WHEN viewing overtime statistics, THE System SHALL display the top 5 agents by total overtime hours
5. WHEN viewing overtime statistics, THE System SHALL display a bar chart showing overtime hours by agent
6. WHEN viewing overtime statistics, THE System SHALL display a pie chart showing regular versus double-time distribution
7. WHEN viewing overtime statistics, THE System SHALL display a line chart showing overtime trends by week
8. WHEN a WFM_Administrator selects a date range filter, THE System SHALL update all overtime statistics and charts
9. WHEN a WFM_Administrator selects a department filter, THE System SHALL update all overtime statistics and charts

### Requirement 13: Export Overtime Data for Payroll

**User Story:** As a WFM Administrator, I want to export approved overtime data to CSV format, so that I can process payroll accurately.

#### Acceptance Criteria

1. WHEN a WFM_Administrator clicks the export button, THE System SHALL generate a CSV file containing all approved overtime requests
2. WHEN exporting overtime data, THE System SHALL include employee ID, name, department, work date, start time, end time, total hours, overtime type, pay multiplier, and equivalent hours
3. WHEN exporting overtime data, THE System SHALL include approval information showing who approved at each stage
4. WHEN exporting overtime data, THE System SHALL include the reason for each overtime request
5. WHEN exporting overtime data, THE System SHALL calculate equivalent hours as total hours multiplied by pay multiplier
6. WHEN exporting overtime data, THE System SHALL sort records by employee name, then by work date
7. WHEN exporting overtime data, THE System SHALL respect the current date range filter
8. WHEN exporting overtime data, THE System SHALL respect the current department filter
9. WHEN exporting overtime data, THE System SHALL include the date range in the filename

### Requirement 14: Prevent Overlapping Overtime Requests

**User Story:** As a WFM Administrator, I want the system to prevent overlapping overtime requests, so that agents cannot submit duplicate or conflicting requests.

#### Acceptance Criteria

1. WHEN an Agent submits an overtime request, THE System SHALL check for existing requests with overlapping time periods on the same date
2. WHEN an overlapping request is detected, THE System SHALL reject the submission and display an error message
3. WHEN checking for overlaps, THE System SHALL consider requests with status 'pending_tl', 'pending_wfm', or 'approved'
4. WHEN checking for overlaps, THE System SHALL not consider requests with status 'rejected' or 'cancelled'

### Requirement 15: Display Mobile-Responsive Interface

**User Story:** As a user, I want the overtime management interface to work on mobile devices, so that I can submit and review requests from anywhere.

#### Acceptance Criteria

1. WHEN a user accesses overtime pages on a mobile device, THE System SHALL display a responsive layout optimized for small screens
2. WHEN displaying forms on mobile devices, THE System SHALL stack form fields vertically
3. WHEN displaying request cards on mobile devices, THE System SHALL stack cards vertically
4. WHEN displaying date pickers on mobile devices, THE System SHALL use touch-friendly controls
5. WHEN displaying buttons on mobile devices, THE System SHALL ensure minimum 44px touch targets
6. WHEN displaying charts on mobile devices, THE System SHALL scale charts to fit the screen width
