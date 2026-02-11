# Design Document: Overtime Management System

## Overview

The Overtime Management System is a comprehensive feature that enables agents to request compensation for hours worked beyond their scheduled shifts. The system implements a multi-level approval workflow (Team Lead → WFM Administrator) with configurable auto-approve functionality, validates requests against daily and weekly limits, integrates with the existing shift scheduling system, and provides robust reporting and CSV export capabilities for payroll processing.

The system handles two types of overtime:
- **Regular Overtime (1.5x)**: Standard overtime compensation at 1.5 times the base pay rate
- **Double Time (2.0x)**: Premium overtime compensation at 2.0 times the base pay rate (typically for holidays or extended hours)

Key design principles:
- Reuse existing patterns from swap and leave request systems
- Maintain consistency with existing approval workflows
- Provide comprehensive validation to prevent policy violations
- Enable flexible configuration without code changes
- Support efficient payroll processing through structured exports

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  OvertimeRequests    │  OvertimeRequestDetail  │  Create    │
│  (List Page)         │  (Detail Page)          │  Form      │
├──────────────────────┴──────────────────────────┴───────────┤
│  Reports Integration │  Settings Panel                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│  overtimeRequestsService  │  overtimeSettingsService        │
│  - CRUD operations        │  - Settings management          │
│  - Approval workflow      │  - Configuration retrieval      │
│  - Validation logic       │                                 │
│  - Statistics generation  │                                 │
│  - CSV export            │                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  overtime_requests        │  overtime_settings              │
│  - Request records        │  - Configuration data           │
│  - Approval tracking      │  - Limits and rules             │
│  - Status management      │                                 │
├───────────────────────────┴─────────────────────────────────┤
│  comments (existing)      │  shifts (existing)              │
│  - Discussion threads     │  - Shift verification           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Submission Flow**:
   - Agent fills form → Validation (client-side) → Service layer validation → Database insert → Status: pending_tl

2. **Approval Flow**:
   - TL approves → Check auto-approve setting → If enabled: Status: approved, If disabled: Status: pending_wfm
   - WFM approves → Status: approved

3. **Validation Flow**:
   - Request submitted → Check daily limits → Check weekly limits → Verify shift schedule → Check overlaps → Allow/Reject

4. **Reporting Flow**:
   - Date range selected → Query approved requests → Aggregate statistics → Generate charts → Display results

5. **Export Flow**:
   - Export clicked → Query approved requests → Calculate equivalent hours → Format CSV → Download file

## Components and Interfaces

### Database Schema

#### overtime_requests Table

```sql
CREATE TABLE overtime_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours NUMERIC(4, 2) NOT NULL CHECK (total_hours > 0 AND total_hours <= 24),
  overtime_type TEXT NOT NULL CHECK (overtime_type IN ('regular', 'double')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_tl', 'pending_wfm', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending_tl',
  
  -- Approval tracking
  tl_reviewed_by UUID REFERENCES auth.users(id),
  tl_reviewed_at TIMESTAMPTZ,
  tl_decision TEXT CHECK (tl_decision IN ('approved', 'rejected')),
  tl_notes TEXT,
  
  wfm_reviewed_by UUID REFERENCES auth.users(id),
  wfm_reviewed_at TIMESTAMPTZ,
  wfm_decision TEXT CHECK (wfm_decision IN ('approved', 'rejected')),
  wfm_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate requests for same time period
  CONSTRAINT no_duplicate_overtime UNIQUE(requester_id, request_date, start_time, end_time)
);

-- Indexes for performance
CREATE INDEX idx_overtime_requests_requester ON overtime_requests(requester_id);
CREATE INDEX idx_overtime_requests_status ON overtime_requests(status);
CREATE INDEX idx_overtime_requests_date ON overtime_requests(request_date);
CREATE INDEX idx_overtime_requests_status_date ON overtime_requests(status, request_date);
CREATE INDEX idx_overtime_requests_date_range ON overtime_requests(request_date) WHERE status = 'approved';
```

#### overtime_settings Table

```sql
CREATE TABLE overtime_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO overtime_settings (setting_key, setting_value, description) VALUES
('auto_approve', '{"enabled": false}'::jsonb, 'Auto-approve overtime after TL approval (skip WFM)'),
('max_daily_hours', '{"regular": 4, "double": 2}'::jsonb, 'Maximum overtime hours per day by type'),
('max_weekly_hours', '{"regular": 12, "double": 4}'::jsonb, 'Maximum overtime hours per week by type'),
('require_shift_verification', '{"enabled": true}'::jsonb, 'Verify overtime against scheduled shift'),
('approval_deadline_days', '{"days": 7}'::jsonb, 'Number of days from work date to submit overtime'),
('pay_multipliers', '{"regular": 1.5, "double": 2.0}'::jsonb, 'Pay rate multipliers for reporting');
```

#### Row Level Security Policies

```sql
-- Agents can view their own requests
CREATE POLICY "Agents can view own overtime"
  ON overtime_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Agents can insert their own requests
CREATE POLICY "Agents can create overtime"
  ON overtime_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Agents can cancel their own pending requests
CREATE POLICY "Agents can cancel own overtime"
  ON overtime_requests FOR UPDATE
  USING (
    auth.uid() = requester_id
    AND status IN ('pending_tl', 'pending_wfm')
  )
  WITH CHECK (status = 'cancelled');

-- TL can view their team's requests
CREATE POLICY "TL can view team overtime"
  ON overtime_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u1.role = 'tl'
      AND u2.id = overtime_requests.requester_id
      AND u1.department = u2.department
    )
  );

-- TL can approve/reject team requests
CREATE POLICY "TL can manage team overtime"
  ON overtime_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u1.role = 'tl'
      AND u2.id = overtime_requests.requester_id
      AND u1.department = u2.department
    )
    AND status = 'pending_tl'
  );

-- WFM can view all requests
CREATE POLICY "WFM can view all overtime"
  ON overtime_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- WFM can approve/reject all requests
CREATE POLICY "WFM can manage all overtime"
  ON overtime_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
    AND status IN ('pending_tl', 'pending_wfm')
  );

-- WFM can delete requests (admin cleanup)
CREATE POLICY "WFM can delete overtime"
  ON overtime_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );
```

#### Database Trigger: Auto-Approve Logic

```sql
CREATE OR REPLACE FUNCTION handle_overtime_approval()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_enabled BOOLEAN;
BEGIN
  -- Check if auto-approve is enabled
  SELECT (setting_value->>'enabled')::boolean INTO auto_approve_enabled
  FROM overtime_settings
  WHERE setting_key = 'auto_approve';
  
  -- If TL just approved and auto-approve is on, skip to approved
  IF NEW.status = 'pending_wfm' AND OLD.status = 'pending_tl' AND auto_approve_enabled THEN
    NEW.status := 'approved';
    NEW.wfm_reviewed_by := NEW.tl_reviewed_by;
    NEW.wfm_reviewed_at := NOW();
    NEW.wfm_decision := 'approved';
    NEW.wfm_notes := 'Auto-approved (setting enabled)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER overtime_auto_approve_trigger
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_overtime_approval();
```

### Service Layer Interfaces

#### overtimeRequestsService

```typescript
interface OvertimeRequest {
  id: string;
  requester_id: string;
  request_date: string; // ISO date
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  total_hours: number;
  overtime_type: 'regular' | 'double';
  reason: string;
  status: 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected' | 'cancelled';
  tl_reviewed_by?: string;
  tl_reviewed_at?: string;
  tl_decision?: 'approved' | 'rejected';
  tl_notes?: string;
  wfm_reviewed_by?: string;
  wfm_reviewed_at?: string;
  wfm_decision?: 'approved' | 'rejected';
  wfm_notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateOvertimeRequestInput {
  request_date: string;
  start_time: string;
  end_time: string;
  overtime_type: 'regular' | 'double';
  reason: string;
}

interface OvertimeRequestFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  agent_name?: string;
  department?: string;
  page?: number;
  per_page?: number;
}

interface OvertimeStatistics {
  summary: {
    total_requests: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate: number;
  };
  hours: {
    total_hours: number;
    regular_hours: number;
    double_hours: number;
    equivalent_hours: number;
  };
  by_agent: Array<{
    user_id: string;
    name: string;
    department: string;
    total_hours: number;
    regular_hours: number;
    double_hours: number;
    equivalent_hours: number;
    request_count: number;
  }>;
  by_type: {
    regular: { count: number; hours: number };
    double: { count: number; hours: number };
  };
  trend: Array<{
    week: string;
    hours: number;
  }>;
}

// Service methods
async function createOvertimeRequest(input: CreateOvertimeRequestInput): Promise<OvertimeRequest>
async function getOvertimeRequests(filters: OvertimeRequestFilters): Promise<{ data: OvertimeRequest[]; pagination: Pagination }>
async function getOvertimeRequestById(id: string): Promise<OvertimeRequest>
async function approveOvertimeRequest(id: string, notes: string): Promise<OvertimeRequest>
async function rejectOvertimeRequest(id: string, notes: string): Promise<OvertimeRequest>
async function cancelOvertimeRequest(id: string): Promise<OvertimeRequest>
async function getOvertimeStatistics(filters: { date_from: string; date_to: string; department?: string }): Promise<OvertimeStatistics>
async function exportOvertimeCSV(filters: { date_from: string; date_to: string; department?: string; status: string }): Promise<string>
```

#### overtimeSettingsService

```typescript
interface OvertimeSettings {
  auto_approve: { enabled: boolean };
  max_daily_hours: { regular: number; double: number };
  max_weekly_hours: { regular: number; double: number };
  require_shift_verification: { enabled: boolean };
  approval_deadline_days: { days: number };
  pay_multipliers: { regular: number; double: number };
}

// Service methods
async function getOvertimeSettings(): Promise<OvertimeSettings>
async function updateOvertimeSetting(key: string, value: any): Promise<void>
```

### Validation Logic

#### Client-Side Validation

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateOvertimeRequest(input: CreateOvertimeRequestInput, settings: OvertimeSettings, existingRequests: OvertimeRequest[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Date validations
  const requestDate = new Date(input.request_date);
  const today = new Date();
  const deadlineDays = settings.approval_deadline_days.days;
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() - deadlineDays);
  
  if (requestDate > today) {
    errors.push('Work date cannot be in the future');
  }
  
  if (requestDate < minDate) {
    errors.push(`Work date cannot be more than ${deadlineDays} days in the past`);
  }
  
  // Time validations
  const startTime = parseTime(input.start_time);
  const endTime = parseTime(input.end_time);
  
  if (endTime <= startTime) {
    errors.push('End time must be after start time');
  }
  
  const totalHours = calculateHours(startTime, endTime);
  
  if (totalHours <= 0 || totalHours > 24) {
    errors.push('Total hours must be between 0 and 24');
  }
  
  // Reason validation
  if (input.reason.length < 10) {
    errors.push('Reason must be at least 10 characters');
  }
  
  if (input.reason.length > 250) {
    errors.push('Reason must not exceed 250 characters');
  }
  
  // Daily limit check
  const dailyRequests = existingRequests.filter(r => 
    r.request_date === input.request_date && 
    r.overtime_type === input.overtime_type &&
    ['pending_tl', 'pending_wfm', 'approved'].includes(r.status)
  );
  
  const dailyHours = dailyRequests.reduce((sum, r) => sum + r.total_hours, 0);
  const maxDaily = input.overtime_type === 'regular' 
    ? settings.max_daily_hours.regular 
    : settings.max_daily_hours.double;
  
  if (dailyHours + totalHours > maxDaily) {
    errors.push(`This request would exceed the daily ${input.overtime_type} overtime limit of ${maxDaily} hours`);
  } else if (dailyHours + totalHours > maxDaily * 0.8) {
    warnings.push(`You have ${maxDaily - dailyHours} hours of ${input.overtime_type} overtime remaining for today`);
  }
  
  // Weekly limit check
  const weekStart = getWeekStart(requestDate);
  const weekEnd = getWeekEnd(requestDate);
  const weeklyRequests = existingRequests.filter(r => {
    const rDate = new Date(r.request_date);
    return rDate >= weekStart && rDate <= weekEnd &&
      r.overtime_type === input.overtime_type &&
      ['pending_tl', 'pending_wfm', 'approved'].includes(r.status);
  });
  
  const weeklyHours = weeklyRequests.reduce((sum, r) => sum + r.total_hours, 0);
  const maxWeekly = input.overtime_type === 'regular'
    ? settings.max_weekly_hours.regular
    : settings.max_weekly_hours.double;
  
  if (weeklyHours + totalHours > maxWeekly) {
    errors.push(`This request would exceed the weekly ${input.overtime_type} overtime limit of ${maxWeekly} hours`);
  } else if (weeklyHours + totalHours > maxWeekly * 0.8) {
    warnings.push(`You have ${maxWeekly - weeklyHours} hours of ${input.overtime_type} overtime remaining for this week`);
  }
  
  // Overlap check
  const overlapping = existingRequests.filter(r =>
    r.request_date === input.request_date &&
    ['pending_tl', 'pending_wfm', 'approved'].includes(r.status) &&
    timesOverlap(input.start_time, input.end_time, r.start_time, r.end_time)
  );
  
  if (overlapping.length > 0) {
    errors.push('This time period overlaps with an existing overtime request');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

#### Server-Side Validation

Server-side validation mirrors client-side validation but also includes:
- Shift schedule verification (if enabled)
- Database-level constraint checks
- Authorization checks (RLS policies)
- Duplicate prevention via unique constraint

### UI Components

#### OvertimeRequestCard Component

```typescript
interface OvertimeRequestCardProps {
  request: OvertimeRequest;
  onClick: () => void;
}

// Displays:
// - Work date with calendar icon
// - Overtime type badge (Regular/Double)
// - Total hours
// - Status badge
// - Reason (truncated)
// - Time range
// - Approval info (if approved/rejected)
```

#### OvertimeRequestDetail Component

```typescript
interface OvertimeRequestDetailProps {
  requestId: string;
}

// Sections:
// 1. Request Details Card
//    - Agent name, date, time range, hours, type, status, reason
//    - Submission timestamp
// 2. Approval Timeline
//    - Submitted stage (always shown)
//    - TL Approval stage (pending/completed)
//    - WFM Approval stage (pending/completed/skipped)
// 3. Action Buttons
//    - Approve/Reject (role-based)
//    - Cancel (agent only, if pending)
// 4. Comments Thread
//    - All comments chronologically
//    - Add comment input
```

#### CreateOvertimeRequest Component

```typescript
interface CreateOvertimeRequestProps {
  onSuccess: () => void;
}

// Form fields:
// - Date picker (work date)
// - Radio buttons (overtime type)
// - Time inputs (start/end)
// - Calculated total hours display
// - Textarea (reason)
// - Shift info display (if available)
// - Validation messages
// - Submit button
```

#### OvertimeStatistics Component

```typescript
interface OvertimeStatisticsProps {
  dateFrom: string;
  dateTo: string;
  department?: string;
}

// Displays:
// - Summary card (total requests, approval rate)
// - Hours breakdown (regular, double, equivalent)
// - Top 5 agents table
// - Bar chart (overtime by agent)
// - Pie chart (regular vs double)
// - Line chart (weekly trend)
// - Export CSV button
```

#### OvertimeSettings Component

```typescript
interface OvertimeSettingsProps {
  // WFM only
}

// Settings:
// - Auto-approve toggle
// - Daily limits (regular/double) number inputs
// - Weekly limits (regular/double) number inputs
// - Shift verification toggle
// - Submission deadline (days) number input
// - Pay multipliers (regular/double) number inputs
// - Save button
```

## Data Models

### TypeScript Types

```typescript
// Core types
type OvertimeType = 'regular' | 'double';
type OvertimeStatus = 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected' | 'cancelled';
type ApprovalDecision = 'approved' | 'rejected';

// Request model
interface OvertimeRequest {
  id: string;
  requester_id: string;
  requester?: {
    id: string;
    name: string;
    department: string;
    employee_id: string;
  };
  request_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  overtime_type: OvertimeType;
  reason: string;
  status: OvertimeStatus;
  tl_reviewed_by?: string;
  tl_reviewed_at?: string;
  tl_decision?: ApprovalDecision;
  tl_notes?: string;
  wfm_reviewed_by?: string;
  wfm_reviewed_at?: string;
  wfm_decision?: ApprovalDecision;
  wfm_notes?: string;
  created_at: string;
  updated_at: string;
}

// Settings model
interface OvertimeSettings {
  auto_approve: { enabled: boolean };
  max_daily_hours: { regular: number; double: number };
  max_weekly_hours: { regular: number; double: number };
  require_shift_verification: { enabled: boolean };
  approval_deadline_days: { days: number };
  pay_multipliers: { regular: number; double: number };
}

// CSV export row
interface OvertimeCSVRow {
  employee_id: string;
  employee_name: string;
  department: string;
  date_worked: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  overtime_type: string;
  pay_multiplier: number;
  equivalent_hours: number;
  status: string;
  approved_by_tl: string;
  approved_by_wfm: string;
  reason: string;
}

// Filter types
interface OvertimeFilters {
  status: string; // 'all' | OvertimeStatus
  dateRange: 'this_week' | 'last_30_days' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  agentName?: string;
  department?: string;
}

// Statistics types
interface OvertimeSummary {
  total_requests: number;
  approved: number;
  rejected: number;
  pending: number;
  approval_rate: number;
}

interface OvertimeHours {
  total_hours: number;
  regular_hours: number;
  double_hours: number;
  equivalent_hours: number;
}

interface AgentOvertimeStats {
  user_id: string;
  name: string;
  department: string;
  total_hours: number;
  regular_hours: number;
  double_hours: number;
  equivalent_hours: number;
  request_count: number;
}

interface OvertimeTrend {
  week: string; // ISO week format: "2026-W06"
  hours: number;
}
```

### State Management

```typescript
// React Query hooks
function useOvertimeRequests(filters: OvertimeFilters) {
  return useQuery(['overtime-requests', filters], () => 
    overtimeRequestsService.getOvertimeRequests(filters)
  );
}

function useOvertimeRequest(id: string) {
  return useQuery(['overtime-request', id], () =>
    overtimeRequestsService.getOvertimeRequestById(id)
  );
}

function useOvertimeSettings() {
  return useQuery(['overtime-settings'], () =>
    overtimeSettingsService.getOvertimeSettings()
  );
}

function useOvertimeStatistics(filters: { date_from: string; date_to: string; department?: string }) {
  return useQuery(['overtime-statistics', filters], () =>
    overtimeRequestsService.getOvertimeStatistics(filters)
  );
}

// Mutations
function useCreateOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation(
    (input: CreateOvertimeRequestInput) => overtimeRequestsService.createOvertimeRequest(input),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['overtime-requests']);
      }
    }
  );
}

function useApproveOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, notes }: { id: string; notes: string }) => 
      overtimeRequestsService.approveOvertimeRequest(id, notes),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['overtime-request', data.id]);
        queryClient.invalidateQueries(['overtime-requests']);
      }
    }
  );
}

function useRejectOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, notes }: { id: string; notes: string }) => 
      overtimeRequestsService.rejectOvertimeRequest(id, notes),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['overtime-request', data.id]);
        queryClient.invalidateQueries(['overtime-requests']);
      }
    }
  );
}

function useCancelOvertimeRequest() {
  const queryClient = useQueryClient();
  return useMutation(
    (id: string) => overtimeRequestsService.cancelOvertimeRequest(id),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['overtime-request', data.id]);
        queryClient.invalidateQueries(['overtime-requests']);
      }
    }
  );
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Request Validation

*For any* overtime request submission, all validation rules (date within deadline, end time after start time, hours in valid range, reason length between 10-250 characters) should be enforced, and invalid requests should be rejected with appropriate error messages.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7**

### Property 2: Hours Calculation

*For any* valid start time and end time, the calculated total hours should equal the time difference in hours, accurate to 2 decimal places.

**Validates: Requirements 1.2**

### Property 3: Initial Status Assignment

*For any* successfully created overtime request, the initial status should be 'pending_tl'.

**Validates: Requirements 1.8**

### Property 4: Duplicate Prevention

*For any* agent and date, if an overtime request already exists for a specific time period with status 'pending_tl', 'pending_wfm', or 'approved', then submitting another request for the same time period should be rejected.

**Validates: Requirements 1.9**

### Property 5: Daily Limit Enforcement

*For any* agent, date, and overtime type, if the sum of existing overtime hours (from requests with status 'pending_tl', 'pending_wfm', or 'approved') plus the new request hours exceeds the configured daily limit for that overtime type, then the submission should be rejected.

**Validates: Requirements 2.1, 2.3**

### Property 6: Weekly Limit Enforcement

*For any* agent, week, and overtime type, if the sum of existing overtime hours (from requests with status 'pending_tl', 'pending_wfm', or 'approved') plus the new request hours exceeds the configured weekly limit for that overtime type, then the submission should be rejected.

**Validates: Requirements 2.2, 2.4, 2.7**

### Property 7: Shift Verification

*For any* overtime request, when shift verification is enabled in settings, if the agent has no scheduled shift on the work date, then the system should flag this as a validation warning.

**Validates: Requirements 3.1**

### Property 8: Shift Verification Bypass

*For any* overtime request, when shift verification is disabled in settings, the request should be allowed regardless of whether a shift exists on the work date.

**Validates: Requirements 3.5**

### Property 9: Role-Based Access Control

*For any* user accessing overtime requests: if the user is an Agent, only their own requests should be returned; if the user is a Team_Lead, only requests from their team and their own requests should be returned; if the user is a WFM_Administrator, all requests should be returned.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 10: Request Data Completeness

*For any* overtime request returned by the system, all required fields (work date, overtime type, total hours, status, reason) should be present and non-null.

**Validates: Requirements 4.4, 6.1**

### Property 11: Approval Data Inclusion

*For any* overtime request with status 'approved' or 'rejected', the approval information (reviewer ID, timestamp, decision, notes) should be present for the appropriate approval stage.

**Validates: Requirements 4.5, 6.4**

### Property 12: Pagination Limit

*For any* request list query, the number of returned results should not exceed 50 per page.

**Validates: Requirements 4.7**

### Property 13: Filter Application

*For any* filter criteria (status, date range, agent name, department), all returned requests should match the specified filter criteria, and requests not matching the criteria should be excluded.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 14: Comment Chronological Ordering

*For any* overtime request with multiple comments, the comments should be ordered by timestamp in ascending order (oldest first).

**Validates: Requirements 6.3**

### Property 15: Timestamp Presence

*For any* overtime request, both the submission timestamp (created_at) and last update timestamp (updated_at) should be present and non-null.

**Validates: Requirements 6.5**

### Property 16: State Transition Correctness

*For any* overtime request, state transitions should follow the valid state machine:
- 'pending_tl' can transition to 'pending_wfm', 'approved' (if auto-approve), 'rejected', or 'cancelled'
- 'pending_wfm' can transition to 'approved', 'rejected', or 'cancelled'
- 'approved', 'rejected', and 'cancelled' are terminal states (no further transitions)

**Validates: Requirements 7.3, 7.4, 7.5, 9.2**

### Property 17: Approval Requires Notes

*For any* approval or rejection action, if notes are not provided or are empty, the action should be rejected.

**Validates: Requirements 7.6**

### Property 18: Approval Metadata Recording

*For any* approved or rejected overtime request, the reviewer's user ID and timestamp should be recorded in the appropriate fields (tl_reviewed_by/tl_reviewed_at or wfm_reviewed_by/wfm_reviewed_at).

**Validates: Requirements 7.7**

### Property 19: Approval System Comment

*For any* approval or rejection action, a system comment should be created documenting the action, including the reviewer's name and decision.

**Validates: Requirements 7.8**

### Property 20: Auto-Approve Workflow

*For any* overtime request approved by a Team_Lead, when auto-approve is enabled, the status should transition directly to 'approved', the Team_Lead should be recorded as both TL and WFM reviewer, and a system comment indicating auto-approval should be created. When auto-approve is disabled, the status should transition to 'pending_wfm'.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 21: Cancellation Metadata

*For any* cancelled overtime request, the cancellation timestamp (updated_at) should be recorded and a system comment documenting the cancellation should be created.

**Validates: Requirements 9.3, 9.4**

### Property 22: Comment Data Recording

*For any* submitted comment, the comment should be saved with the commenter's user ID and a timestamp.

**Validates: Requirements 10.2**

### Property 23: Settings Retrieval Completeness

*For any* settings retrieval request, all configured settings (auto_approve, max_daily_hours, max_weekly_hours, require_shift_verification, approval_deadline_days, pay_multipliers) should be returned with their current values.

**Validates: Requirements 11.1**

### Property 24: Settings Update Persistence

*For any* settings update, the new value should be immediately persisted and used in subsequent operations (approvals, validations, reports).

**Validates: Requirements 11.2, 11.3, 11.4, 11.5**

### Property 25: Settings Update Audit

*For any* settings update, the administrator's user ID and update timestamp should be recorded.

**Validates: Requirements 11.6**

### Property 26: Settings Validation

*For any* settings update, if daily limits, weekly limits, or pay multipliers are not positive numbers, the update should be rejected.

**Validates: Requirements 11.7, 11.8, 11.9**

### Property 27: Statistics Calculation Correctness

*For any* date range and department filter, the overtime statistics should correctly calculate:
- Total requests count
- Approval rate (approved / total)
- Total hours by type (sum of hours for each overtime type)
- Equivalent hours (sum of hours × multiplier for each request)

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 28: Top Agents Ranking

*For any* date range and department filter, the top 5 agents should be correctly identified by sorting all agents by total overtime hours in descending order and taking the first 5.

**Validates: Requirements 12.4**

### Property 29: Statistics Filtering

*For any* date range or department filter applied to statistics, only overtime requests matching the filter criteria should be included in the calculations.

**Validates: Requirements 12.8, 12.9**

### Property 30: CSV Export Status Filter

*For any* CSV export operation, only overtime requests with status 'approved' should be included in the export.

**Validates: Requirements 13.1**

### Property 31: CSV Export Data Completeness

*For any* overtime request included in a CSV export, all required fields (employee ID, name, department, work date, start time, end time, total hours, overtime type, pay multiplier, equivalent hours, approval information, reason) should be present in the CSV row.

**Validates: Requirements 13.2, 13.3, 13.4**

### Property 32: Equivalent Hours Calculation

*For any* overtime request, the equivalent hours should equal the total hours multiplied by the pay multiplier for that overtime type.

**Validates: Requirements 13.5**

### Property 33: CSV Export Sorting

*For any* CSV export, the records should be sorted first by employee name (alphabetically), then by work date (chronologically).

**Validates: Requirements 13.6**

### Property 34: CSV Export Filtering

*For any* CSV export with date range or department filters, only overtime requests matching the filter criteria should be included in the export.

**Validates: Requirements 13.7, 13.8**

### Property 35: CSV Filename Format

*For any* CSV export, the filename should include the date range in the format "overtime_report_YYYY-MM-DD_to_YYYY-MM-DD.csv".

**Validates: Requirements 13.9**

### Property 36: Overlap Detection

*For any* overtime request submission, if there exists another request for the same agent and date with overlapping time periods and status 'pending_tl', 'pending_wfm', or 'approved', then the submission should be rejected. Requests with status 'rejected' or 'cancelled' should not be considered for overlap detection.

**Validates: Requirements 14.1, 14.3**

## Error Handling

### Validation Errors

All validation errors should be returned to the client with:
- HTTP 400 Bad Request status code
- Structured error response with field-level error messages
- Clear, user-friendly error descriptions

Example error response:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "request_date",
      "message": "Work date cannot be more than 7 days in the past"
    },
    {
      "field": "total_hours",
      "message": "This request would exceed the daily regular overtime limit of 4 hours"
    }
  ]
}
```

### Authorization Errors

When a user attempts an unauthorized action:
- HTTP 403 Forbidden status code
- Clear message indicating insufficient permissions
- No sensitive information about other users or requests

### Database Errors

Database constraint violations should be caught and translated to user-friendly messages:
- Unique constraint violation (duplicate request) → "An overtime request already exists for this time period"
- Foreign key violation → "Referenced user or shift not found"
- Check constraint violation → "Invalid status or overtime type"

### Not Found Errors

When a requested resource doesn't exist:
- HTTP 404 Not Found status code
- Clear message indicating what resource was not found
- No information leakage about existence of other resources

### Server Errors

Unexpected server errors should:
- Return HTTP 500 Internal Server Error
- Log full error details server-side
- Return generic error message to client (no stack traces)
- Trigger monitoring alerts for investigation

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing as complementary approaches:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Together, they provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness

### Property-Based Testing

Property-based testing will be implemented using **fast-check** (for TypeScript/JavaScript), which is the standard PBT library for the JavaScript ecosystem.

**Configuration:**
- Each property test must run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: overtime-management, Property N: [property description]`

**Example property test structure:**
```typescript
import fc from 'fast-check';

// Feature: overtime-management, Property 2: Hours Calculation
test('calculated hours equal time difference', () => {
  fc.assert(
    fc.property(
      fc.tuple(timeGenerator(), timeGenerator()).filter(([start, end]) => end > start),
      ([startTime, endTime]) => {
        const calculated = calculateHours(startTime, endTime);
        const expected = (endTime - startTime) / (1000 * 60 * 60);
        expect(calculated).toBeCloseTo(expected, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

Unit tests should focus on:
- Specific examples that demonstrate correct behavior (e.g., "TL approval with auto-approve enabled transitions to 'approved'")
- Edge cases (e.g., overtime request exactly at daily limit, request at midnight boundary)
- Error conditions (e.g., invalid date formats, missing required fields)
- Integration points between components (e.g., service layer calling database, UI components calling services)

**Balance:**
- Avoid writing too many unit tests for scenarios covered by property tests
- Use unit tests for concrete examples and integration scenarios
- Use property tests for comprehensive input coverage

### Test Coverage Areas

1. **Validation Logic**
   - Property tests: All validation rules across random inputs
   - Unit tests: Specific edge cases (e.g., exactly 10 characters, exactly 250 characters)

2. **State Transitions**
   - Property tests: All valid state transitions
   - Unit tests: Specific approval workflows (e.g., TL → WFM → approved)

3. **Calculations**
   - Property tests: Hours calculation, equivalent hours calculation
   - Unit tests: Specific examples with known results

4. **Filtering and Sorting**
   - Property tests: Filter application correctness
   - Unit tests: Specific filter combinations

5. **Access Control**
   - Property tests: Role-based access rules
   - Unit tests: Specific user/role scenarios

6. **CSV Export**
   - Property tests: Data completeness, sorting correctness
   - Unit tests: Specific export scenarios with known data

7. **Settings Management**
   - Property tests: Settings validation, persistence
   - Unit tests: Specific settings update scenarios

### Integration Testing

Integration tests should verify:
- End-to-end request submission and approval workflows
- Database triggers (auto-approve logic)
- RLS policies (access control)
- Comment system integration
- Settings changes affecting validation behavior

### Manual Testing Checklist

Before release, manually verify:
- Mobile responsiveness on actual devices
- UI/UX flows for all user roles
- Chart rendering and interactivity
- CSV download and file format
- Error message clarity and helpfulness
- Loading states and error states
- Accessibility (keyboard navigation, screen readers)
