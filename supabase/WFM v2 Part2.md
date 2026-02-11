📋 FEATURE SPEC: Overtime Management System
🎯 Overview
Add an Overtime Management module to track, approve, and report on agent overtime hours. Includes regular overtime (1.5x pay) and double-time (2x pay) with multi-level approval workflow matching the existing leave requests pattern.

👥 User Stories
Agent Role
AS AN Agent
I WANT TO submit overtime requests for hours worked beyond my scheduled shift
SO THAT I can get compensated for extra hours worked
Team Lead Role
AS A Team Lead
I WANT TO review and approve/reject overtime requests from my team
SO THAT I can ensure overtime is justified and within budget
WFM Role
AS A WFM Administrator
I WANT TO have final approval authority and generate overtime reports
SO THAT I can manage labor costs and prepare accurate payroll data

🏗️ Technical Architecture
Database Schema
1. overtime_requests Table
sqlCREATE TABLE overtime_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL, -- Date when overtime was worked
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

-- Indexes
CREATE INDEX idx_overtime_requests_requester ON overtime_requests(requester_id);
CREATE INDEX idx_overtime_requests_status ON overtime_requests(status);
CREATE INDEX idx_overtime_requests_date ON overtime_requests(request_date);
CREATE INDEX idx_overtime_requests_status_date ON overtime_requests(status, request_date);
CREATE INDEX idx_overtime_requests_date_range ON overtime_requests(request_date) WHERE status = 'approved';

-- Updated_at trigger
CREATE TRIGGER update_overtime_requests_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
2. overtime_settings Table (WFM configurable)
sqlCREATE TABLE overtime_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO overtime_settings (setting_key, setting_value, description) VALUES
('auto_approve', '{"enabled": false}'::jsonb, 'Auto-approve overtime after TL approval (skip WFM)'),
('max_daily_hours', '{"regular": 4, "double": 2}'::jsonb, 'Maximum overtime hours per day by type'),
('max_weekly_hours', '{"regular": 12, "double": 4}'::jsonb, 'Maximum overtime hours per week by type'),
('require_shift_verification', '{"enabled": true}'::jsonb, 'Verify overtime against scheduled shift'),
('approval_deadline_days', '{"days": 7}'::jsonb, 'Number of days from work date to submit overtime'),
('pay_multipliers', '{"regular": 1.5, "double": 2.0}'::jsonb, 'Pay rate multipliers for reporting');
3. RLS Policies for overtime_requests
sqlALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;

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
      SELECT 1 FROM employees e1, employees e2
      WHERE e1.id = auth.uid()
      AND e1.role = 'TL'
      AND e2.id = overtime_requests.requester_id
      AND e1.department = e2.department
    )
  );

-- TL can approve/reject team requests
CREATE POLICY "TL can manage team overtime"
  ON overtime_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e1, employees e2
      WHERE e1.id = auth.uid()
      AND e1.role = 'TL'
      AND e2.id = overtime_requests.requester_id
      AND e1.department = e2.department
    )
    AND status = 'pending_tl'
  );

-- WFM can view all requests
CREATE POLICY "WFM can view all overtime"
  ON overtime_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'WFM'
    )
  );

-- WFM can approve/reject all requests
CREATE POLICY "WFM can manage all overtime"
  ON overtime_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'WFM'
    )
    AND status IN ('pending_tl', 'pending_wfm')
  );

-- WFM can delete requests (admin cleanup)
CREATE POLICY "WFM can delete overtime"
  ON overtime_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'WFM'
    )
  );
4. Database Function: Auto-approve logic
sqlCREATE OR REPLACE FUNCTION handle_overtime_approval()
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
5. Comments Integration (reuse existing table)
sql-- No new table needed, just add reference type to existing comments table
-- Update the check constraint on comments.reference_type to include 'overtime_request'

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_reference_type_check;
ALTER TABLE comments ADD CONSTRAINT comments_reference_type_check 
  CHECK (reference_type IN ('swap_request', 'leave_request', 'overtime_request'));
```

---

## 🎨 UI Pages & Components

### 1. Overtime Requests List Page
**Route:** `/overtime-requests`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Overtime Requests                                   [+ New Request]│
│                                                                   │
│ Filters: Status: All ▼  Date Range: [Last 30 Days ▼]            │
│          Agent: [Search...] (TL/WFM only)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 Feb 10, 2026 • Regular OT • 3.5 hours      [Pending TL] │ │
│ │ Reason: Extended customer support coverage                  │ │
│ │ Time: 5:00 PM - 8:30 PM                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 Feb 9, 2026 • Double OT • 2.0 hours         [Approved]  │ │
│ │ Reason: Emergency system outage                             │ │
│ │ Time: 10:00 PM - 12:00 AM                                   │ │
│ │ ✓ Approved by John Doe (TL) on Feb 10                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- List all overtime requests (filtered by role)
- Status badges with consistent colors (from designSystem)
- Date range filter (This week, Last 30 days, Custom)
- Agent search filter (TL/WFM only)
- Pagination (50 per page)
- Click card to view details

---

### 2. Overtime Request Detail Page
**Route:** `/overtime-requests/:id`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                      Overtime Request     │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Request Details                                             │ │
│ │                                                             │ │
│ │ Agent: John Doe                                             │ │
│ │ Date Worked: February 10, 2026                              │ │
│ │ Time: 5:00 PM - 8:30 PM (3.5 hours)                         │ │
│ │ Overtime Type: Regular (1.5x)                               │ │
│ │ Status: Pending TL Approval                                 │ │
│ │                                                             │ │
│ │ Reason:                                                     │ │
│ │ Extended customer support coverage due to high ticket       │ │
│ │ volume during product launch.                               │ │
│ │                                                             │ │
│ │ Submitted: Feb 11, 2026 at 9:00 AM                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Approval Timeline                                           │ │
│ │                                                             │ │
│ │ ● Submitted - Feb 11, 9:00 AM                               │ │
│ │   By John Doe                                               │ │
│ │                                                             │ │
│ │ ○ Pending TL Approval                                       │ │
│ │   Waiting for Team Lead review                              │ │
│ │                                                             │ │
│ │ ○ WFM Approval (if required)                                │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [Approve] [Reject]  (TL/WFM only, based on status)              │
│ [Cancel Request] (Agent only, if pending)                        │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Comments (2)                                                │ │
│ │                                                             │ │
│ │ Jane Smith (TL) • Feb 11, 10:00 AM                          │ │
│ │ Can you provide more details on the ticket volume?          │ │
│ │                                                             │ │
│ │ John Doe • Feb 11, 10:15 AM                                 │ │
│ │ We had 150+ tickets in queue, 3x normal volume.             │ │
│ │                                                             │ │
│ │ [Add Comment...]                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Full request details
- Timeline component (reuse from leave/swap requests)
- Approve/Reject buttons with reason modal
- Cancel button for submitters
- Comment thread (reuse existing component)
- Status-based action buttons

---

### 3. Create Overtime Request Page
**Route:** `/overtime-requests/new`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                  Submit Overtime Request  │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Date Worked *                                               │ │
│ │ [Calendar Picker: Feb 10, 2026]                             │ │
│ │                                                             │ │
│ │ Overtime Type *                                             │ │
│ │ ○ Regular (1.5x) - Standard overtime                        │ │
│ │ ○ Double Time (2.0x) - Worked on holiday/beyond 12hrs       │ │
│ │                                                             │ │
│ │ Start Time *                    End Time *                  │ │
│ │ [17:00] ───────────────────────► [20:30]                    │ │
│ │                                                             │ │
│ │ Total Hours: 3.5 hours                                      │ │
│ │ ⚠️ Max daily regular OT: 4 hours (0.5 hours remaining)      │ │
│ │                                                             │ │
│ │ Reason for Overtime *                                       │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Extended customer support coverage due to high          │ │ │
│ │ │ ticket volume during product launch...                  │ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ 250 characters max                                          │ │
│ │                                                             │ │
│ │ ℹ️ Shift Info (from schedule)                               │ │
│ │ Scheduled: AM (6:00 AM - 2:00 PM)                           │ │
│ │ Overtime starts after: 2:00 PM                              │ │
│ │                                                             │ │
│ │              [Cancel]  [Submit Request]                     │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Validation Rules:**
- Date cannot be more than 7 days in the past (configurable)
- Date cannot be in the future
- End time must be after start time
- Total hours must be > 0 and <= 24
- Check against daily/weekly limits
- Verify agent had a scheduled shift on that date
- Reason required (min 10 chars, max 250 chars)

---

### 4. Reports Page Integration

**Add new "Overtime" section:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Reports Dashboard                                               │
│                                                                   │
│ Date Range: [Last Month ▼]  From: [Feb 1] To: [Feb 11]          │
│                                                                   │
│ ┌─────────── Summary Cards ────────────────────────────────┐    │
│ │                                                           │    │
│ │ [Swap Requests]  [Leave Requests]  [Overtime Requests]    │    │
│ │   45 Total          32 Total         28 Total            │    │
│ │   85% Approved      78% Approved     92% Approved         │    │
│ │                                                           │    │
│ └───────────────────────────────────────────────────────────┘    │
│                                                                   │
│ ┌─────────── Overtime Analytics ──────────────────────────┐     │
│ │                                                           │    │
│ │ Total Overtime Hours: 124.5 hours                         │    │
│ │ • Regular OT (1.5x): 98.5 hours                           │    │
│ │ • Double OT (2.0x): 26.0 hours                            │    │
│ │                                                           │    │
│ │ Total Overtime Cost Multiplier: 163.5 hour equivalents    │    │
│ │ (For payroll: 98.5×1.5 + 26.0×2.0)                        │    │
│ │                                                           │    │
│ │ Top 5 Agents by Overtime:                                 │    │
│ │ 1. John Doe - 18.5 hours (14.5 reg, 4.0 double)           │    │
│ │ 2. Jane Smith - 15.0 hours (15.0 reg, 0.0 double)         │    │
│ │ 3. ...                                                    │    │
│ │                                                           │    │
│ │ [📊 View Chart]  [📥 Export Overtime CSV]                 │    │
│ │                                                           │    │
│ └───────────────────────────────────────────────────────────┘    │
│                                                                   │
│ ┌─────────── Charts ──────────────────────────────────────┐     │
│ │                                                           │    │
│ │ [Overtime by Agent - Bar Chart]                           │    │
│ │ [Overtime Type Distribution - Pie Chart]                  │    │
│ │ [Overtime Trend - Line Chart (by week)]                   │    │
│ │                                                           │    │
│ └───────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

5. Overtime CSV Export Format (for Payroll)
File name: overtime_report_2026-02-01_to_2026-02-28.csv
Columns:
csvEmployee ID,Employee Name,Department,Date Worked,Start Time,End Time,Total Hours,Overtime Type,Pay Multiplier,Equivalent Hours,Status,Approved By (TL),Approved By (WFM),Reason
EMP001,John Doe,Customer Success,2026-02-10,17:00,20:30,3.5,Regular,1.5,5.25,Approved,Jane Smith,Mike Admin,"Extended support coverage"
EMP001,John Doe,Customer Success,2026-02-11,22:00,00:00,2.0,Double,2.0,4.0,Approved,Jane Smith,Mike Admin,"Emergency system outage"
EMP002,Jane Smith,Customer Success,2026-02-08,14:00,18:00,4.0,Regular,1.5,6.0,Approved,Jane Smith,Mike Admin,"Training new hires"
Calculation Notes:

Equivalent Hours = Total Hours × Pay Multiplier
Sum of "Equivalent Hours" column = total cost in hour equivalents for payroll
Filter: Only include status = 'approved' in export
Sort by: Employee Name, then Date Worked


📡 API Endpoints / Service Methods
1. Create Overtime Request
typescriptPOST /api/overtime-requests

Body:
{
  "request_date": "2026-02-10",
  "start_time": "17:00:00",
  "end_time": "20:30:00",
  "overtime_type": "regular",
  "reason": "Extended customer support coverage..."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending_tl",
    "total_hours": 3.5,
    "created_at": "2026-02-11T09:00:00Z"
  },
  "warnings": [
    {
      "type": "approaching_limit",
      "message": "You have 0.5 hours of regular OT remaining for today"
    }
  ]
}
2. Get Overtime Requests (Paginated)
typescriptGET /api/overtime-requests?status=pending_tl&date_from=2026-02-01&date_to=2026-02-28&page=1

Response:
{
  "data": [
    {
      "id": "uuid",
      "requester": {
        "id": "uuid",
        "name": "John Doe",
        "department": "Customer Success"
      },
      "request_date": "2026-02-10",
      "start_time": "17:00:00",
      "end_time": "20:30:00",
      "total_hours": 3.5,
      "overtime_type": "regular",
      "status": "pending_tl",
      "reason": "Extended customer support...",
      "created_at": "2026-02-11T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 28,
    "total_pages": 1
  }
}
3. Get Single Overtime Request
typescriptGET /api/overtime-requests/:id

Response:
{
  "data": {
    "id": "uuid",
    "requester": { ... },
    "request_date": "2026-02-10",
    "start_time": "17:00:00",
    "end_time": "20:30:00",
    "total_hours": 3.5,
    "overtime_type": "regular",
    "status": "pending_tl",
    "reason": "Extended customer support...",
    "tl_reviewed_by": null,
    "tl_reviewed_at": null,
    "wfm_reviewed_by": null,
    "wfm_reviewed_at": null,
    "created_at": "2026-02-11T09:00:00Z",
    "updated_at": "2026-02-11T09:00:00Z"
  }
}
4. Approve/Reject Overtime Request
typescriptPOST /api/overtime-requests/:id/approve
POST /api/overtime-requests/:id/reject

Body:
{
  "notes": "Approved - valid reason provided"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending_wfm", // or "approved" if auto-approve enabled
    "tl_reviewed_by": "uuid",
    "tl_reviewed_at": "2026-02-11T10:00:00Z",
    "tl_decision": "approved"
  }
}
5. Cancel Overtime Request
typescriptPOST /api/overtime-requests/:id/cancel

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled"
  }
}
6. Get Overtime Statistics (for Reports)
typescriptGET /api/overtime-requests/statistics?date_from=2026-02-01&date_to=2026-02-28&department=All

Response:
{
  "summary": {
    "total_requests": 28,
    "approved": 26,
    "rejected": 1,
    "pending": 1,
    "approval_rate": 92.86
  },
  "hours": {
    "total_hours": 124.5,
    "regular_hours": 98.5,
    "double_hours": 26.0,
    "equivalent_hours": 163.5 // (98.5 * 1.5) + (26.0 * 2.0)
  },
  "by_agent": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "department": "Customer Success",
      "total_hours": 18.5,
      "regular_hours": 14.5,
      "double_hours": 4.0,
      "equivalent_hours": 29.75,
      "request_count": 5
    }
  ],
  "by_type": {
    "regular": { "count": 22, "hours": 98.5 },
    "double": { "count": 6, "hours": 26.0 }
  },
  "trend": [
    { "week": "2026-W05", "hours": 32.5 },
    { "week": "2026-W06", "hours": 42.0 }
  ]
}
7. Export Overtime CSV
typescriptGET /api/overtime-requests/export?date_from=2026-02-01&date_to=2026-02-28&department=All&status=approved

Response: CSV file download
8. Get/Update Overtime Settings
typescriptGET /api/overtime-settings

Response:
{
  "auto_approve": { "enabled": false },
  "max_daily_hours": { "regular": 4, "double": 2 },
  "max_weekly_hours": { "regular": 12, "double": 4 },
  "require_shift_verification": { "enabled": true },
  "approval_deadline_days": { "days": 7 },
  "pay_multipliers": { "regular": 1.5, "double": 2.0 }
}

PUT /api/overtime-settings (WFM only)
Body: { "auto_approve": { "enabled": true } }
```

---

## 🎯 Acceptance Criteria

### AC1: Overtime Request Submission
- [ ] Agent can submit overtime request with date, time range, type, and reason
- [ ] System calculates total hours automatically
- [ ] System validates against daily/weekly limits
- [ ] System checks if agent had scheduled shift on that date
- [ ] System prevents submissions more than 7 days after work date
- [ ] System prevents future-dated submissions
- [ ] Shows warning if approaching daily/weekly limits
- [ ] Creates request with status `pending_tl`

### AC2: Overtime Request List
- [ ] Shows all overtime requests filtered by user role
- [ ] Agents see only their requests
- [ ] TLs see their team's requests + their own
- [ ] WFMs see all requests
- [ ] Filter by status (All, Pending TL, Pending WFM, Approved, Rejected)
- [ ] Filter by date range (This week, Last 30 days, Custom)
- [ ] Filter by agent name (TL/WFM only)
- [ ] Pagination with 50 records per page
- [ ] Click card navigates to detail page

### AC3: Overtime Request Detail
- [ ] Shows complete request information
- [ ] Shows approval timeline with status indicators
- [ ] Shows all comments in chronological order
- [ ] TL can approve/reject when status is `pending_tl`
- [ ] WFM can approve/reject when status is `pending_tl` or `pending_wfm`
- [ ] Approval changes status to `pending_wfm` or `approved` (if auto-approve)
- [ ] Rejection changes status to `rejected`
- [ ] Agent can cancel when status is `pending_tl` or `pending_wfm`
- [ ] All users can add comments
- [ ] Approve/Reject requires notes/reason

### AC4: Approval Workflow
- [ ] TL approval: `pending_tl` → `pending_wfm` (or `approved` if auto-approve)
- [ ] WFM approval: `pending_wfm` → `approved`
- [ ] TL rejection: `pending_tl` → `rejected`
- [ ] WFM rejection: `pending_wfm` → `rejected`
- [ ] System creates comment for each approval/rejection action
- [ ] Email notification sent on status change (future phase)

### AC5: Settings Integration
- [ ] WFM can toggle auto-approve in Settings page
- [ ] WFM can configure daily/weekly hour limits
- [ ] WFM can configure submission deadline (days)
- [ ] WFM can configure pay multipliers
- [ ] Settings changes apply immediately
- [ ] Shows current settings on overtime submission form

### AC6: Reports Integration
- [ ] Overtime summary card shows: total requests, approval rate
- [ ] Overtime statistics section shows:
  - Total hours (broken down by type)
  - Equivalent hours for payroll
  - Top 5 agents by overtime
- [ ] Bar chart: Overtime hours by agent
- [ ] Pie chart: Regular vs Double OT distribution
- [ ] Line chart: Overtime trend over weeks
- [ ] Date range filter applies to all overtime metrics

### AC7: CSV Export for Payroll
- [ ] Export button generates CSV with all approved overtime
- [ ] CSV includes all payroll-relevant fields
- [ ] CSV calculates equivalent hours (hours × multiplier)
- [ ] CSV sorted by employee name, then date
- [ ] Export respects date range filter
- [ ] Export respects department filter
- [ ] File name includes date range

### AC8: Validation & Business Rules
- [ ] Cannot submit overlapping overtime requests
- [ ] Cannot exceed daily limit per overtime type
- [ ] Cannot exceed weekly limit per overtime type
- [ ] Must have scheduled shift on overtime date
- [ ] Overtime must be outside scheduled shift hours
- [ ] Start time < End time
- [ ] Total hours > 0 and <= 24
- [ ] Reason must be 10-250 characters

### AC9: Comments System
- [ ] Reuses existing comments component
- [ ] All stakeholders can view comments
- [ ] All stakeholders can add comments
- [ ] System adds comment on approval/rejection
- [ ] Comments sorted chronologically

### AC10: Mobile Responsiveness
- [ ] All pages work on mobile devices
- [ ] Forms stack vertically on small screens
- [ ] Cards stack vertically in list view
- [ ] Date pickers are touch-friendly
- [ ] Buttons have minimum 44px touch targets

---

## 🚀 Implementation Steps

### Phase 1: Database & Backend (2 days)
1. Create migration `015_overtime_management.sql`
2. Create service: `overtimeRequestsService.ts`
3. Create service: `overtimeSettingsService.ts`
4. Add Zod validators: `overtimeValidators.ts`
5. Update comments reference type constraint
6. Write service layer unit tests

### Phase 2: Core Pages (3 days)
7. Create `pages/OvertimeRequests/OvertimeRequests.tsx` (list)
8. Create `pages/OvertimeRequests/OvertimeRequestDetail.tsx`
9. Create `pages/OvertimeRequests/CreateOvertimeRequest.tsx`
10. Create hooks: `useOvertimeRequests.ts`
11. Implement pagination and filters
12. Add status badges and timeline component (reuse)

### Phase 3: Approval Workflow (2 days)
13. Implement approve/reject modals
14. Add approval actions to detail page
15. Implement cancel functionality
16. Add comments integration
17. Add system comment generation

### Phase 4: Settings Integration (1 day)
18. Add "Overtime Settings" section to Settings page
19. Create `components/Settings/OvertimeSettings.tsx`
20. Implement settings update functionality
21. Display current settings on submission form

### Phase 5: Reports Integration (2-3 days)
22. Add overtime summary card to Reports page
23. Create overtime statistics component
24. Add bar chart: Overtime by agent
25. Add pie chart: Regular vs Double distribution
26. Add line chart: Weekly trend
27. Implement overtime export service
28. Add "Export Overtime CSV" button

### Phase 6: Validation & Testing (2 days)
29. Implement all client-side validation
30. Implement server-side validation
31. Add limit checking (daily/weekly)
32. Add shift verification
33. Write integration tests
34. Manual QA testing

### Phase 7: Polish (1 day)
35. Add loading skeletons
36. Add error handling
37. Add success toasts
38. Mobile responsiveness testing
39. Bug fixes

**Total Estimated Time: 13-14 days**

---

## 📝 File Structure
```
src/
├── pages/
│   └── OvertimeRequests/
│       ├── OvertimeRequests.tsx          # List page
│       ├── OvertimeRequestDetail.tsx     # Detail page
│       └── CreateOvertimeRequest.tsx     # Submission form
├── components/
│   ├── OvertimeRequests/
│   │   ├── OvertimeRequestCard.tsx       # Card component
│   │   ├── OvertimeStatistics.tsx        # Stats widget for Reports
│   │   └── OvertimeCharts.tsx            # Charts for Reports
│   └── Settings/
│       └── OvertimeSettings.tsx          # Settings panel
├── hooks/
│   ├── useOvertimeRequests.ts            # React Query hook
│   └── useOvertimeSettings.ts            # Settings hook
├── services/
│   ├── overtimeRequestsService.ts        # CRUD operations
│   └── overtimeSettingsService.ts        # Settings operations
├── utils/
│   ├── overtimeValidation.ts             # Validation logic
│   └── overtimeCsvHelpers.ts             # CSV generation
└── types/
    └── overtime.ts                       # TypeScript types

🎨 Design System Integration
Status Colors (from designSystem.ts):
typescriptpending_tl: Yellow/Warning
pending_wfm: Blue/Info
approved: Green/Success
rejected: Red/Error
cancelled: Gray/Neutral
Overtime Type Badges:
typescriptregular: Light blue background (#DBEAFE)
double: Purple background (#E9D5FF)

🔮 Future Enhancements (Post-MVP)

Email Notifications: Notify agents/TLs/WFM on status changes
Bulk Approve: TL/WFM can approve multiple requests at once
Overtime Patterns: Identify agents consistently working OT
Budget Tracking: Set OT budgets per department and track spend
Shift Integration: Auto-suggest OT based on actual clock-in/out times
Recurring OT: Support for recurring overtime patterns
Manager Self-Service: Managers can view team OT reports
Integration with Payroll System: API export to payroll software
Overtime Forecasting: Predict OT needs based on historical data
Mobile App: Submit OT requests from mobile app


❓ Questions / Decisions Needed

Auto-approve default: Should auto-approve be ON or OFF by default? (Recommendation: OFF)
Limits: What are reasonable daily/weekly limits? (Recommendation: 4h regular/2h double daily, 12h regular/4h double weekly)
Shift verification: Should OT submission be blocked if no shift found? (Recommendation: Show warning but allow submission)
Backdating: Should we allow OT submission for dates before current pay period? (Recommendation: Yes, with 7-day limit)
Department budgets: Do departments have OT budgets we should track? (Recommendation: Phase 2)
Pay rates: Should pay multipliers be editable or fixed? (Recommendation: Editable by WFM in settings)
Double-time triggers: What qualifies for double-time? (Recommendation: Leave to agent discretion, require explanation)