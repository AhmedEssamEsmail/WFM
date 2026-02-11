📋 FEATURE SPEC: Break Schedule Management
🎯 Overview
Add a Break Schedule page to manage agent break times across 15-minute intervals throughout the day. Supports read-only view for Agents/TLs and full planning capabilities for WFM with configurable business rules.

👥 User Stories
Agent Role
AS AN Agent
I WANT TO view my scheduled breaks for the day
SO THAT I know when to take my half-breaks and full break
Team Lead Role
AS A Team Lead
I WANT TO view my team's break schedule
SO THAT I can ensure adequate coverage during my shifts
WFM Role
AS A WFM Administrator
I WANT TO plan and modify break schedules with visual feedback
SO THAT I can maintain optimal staffing levels throughout the day
AS A WFM Administrator
I WANT TO configure break scheduling rules without code changes
SO THAT I can adapt to changing business requirements quickly

🏗️ Technical Architecture
Database Schema
1. break_schedules Table
sqlCREATE TABLE break_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_type TEXT, -- Denormalized for quick access
  interval_start TIME NOT NULL, -- e.g., '09:00:00'
  break_type TEXT NOT NULL CHECK (break_type IN ('IN', 'HB1', 'B', 'HB2')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate intervals per user per day
  UNIQUE(user_id, schedule_date, interval_start)
);

-- Indexes
CREATE INDEX idx_break_schedules_date ON break_schedules(schedule_date);
CREATE INDEX idx_break_schedules_user_date ON break_schedules(user_id, schedule_date);
CREATE INDEX idx_break_schedules_date_interval ON break_schedules(schedule_date, interval_start);

-- RLS Policies
ALTER TABLE break_schedules ENABLE ROW LEVEL SECURITY;

-- Agents can view their own
CREATE POLICY "Agents can view own breaks"
  ON break_schedules FOR SELECT
  USING (auth.uid() = user_id);

-- TL can view their team's breaks
CREATE POLICY "TL can view team breaks"
  ON break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.role = 'TL'
      AND employees.department = (
        SELECT department FROM employees WHERE id = break_schedules.user_id
      )
    )
  );

-- WFM can view all
CREATE POLICY "WFM can view all breaks"
  ON break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'WFM'
    )
  );

-- Only WFM can insert/update/delete
CREATE POLICY "WFM can manage breaks"
  ON break_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'WFM'
    )
  );
2. break_schedule_rules Table (Configurable Rules)
sqlCREATE TABLE break_schedule_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('distribution', 'ordering', 'timing', 'coverage')),
  description TEXT,
  parameters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Lower number = higher priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example rules data
INSERT INTO break_schedule_rules (rule_name, rule_type, description, parameters, priority) VALUES
('equal_distribution', 'distribution', 'Maintain equal or near-equal agents at all intervals', 
  '{"tolerance_percentage": 20, "target_metric": "available_agents"}', 1),
  
('break_ordering', 'ordering', 'HB1 must come before B, B before HB2',
  '{"sequence": ["HB1", "B", "HB2"], "enforce_strict": true}', 2),
  
('minimum_gap', 'timing', 'Minimum time between consecutive breaks',
  '{"min_minutes": 90, "applies_to": ["HB1-B", "B-HB2"]}', 3),
  
('maximum_gap', 'timing', 'Maximum time between consecutive breaks',
  '{"max_minutes": 270, "applies_to": ["HB1-B", "B-HB2"]}', 4),

('minimum_coverage', 'coverage', 'Minimum agents required per interval',
  '{"min_agents": 3, "alert_threshold": 5}', 5);

-- RLS
ALTER TABLE break_schedule_rules ENABLE ROW LEVEL SECURITY;

-- Everyone can read rules
CREATE POLICY "Everyone can view rules"
  ON break_schedule_rules FOR SELECT
  USING (true);

-- Only WFM can modify rules
CREATE POLICY "WFM can manage rules"
  ON break_schedule_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND role = 'WFM'
    )
  );
3. break_schedule_warnings Table (Track shift changes)
sqlCREATE TABLE break_schedule_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  warning_type TEXT NOT NULL CHECK (warning_type IN ('shift_changed', 'breaks_cleared', 'swap_pending')),
  old_shift_type TEXT,
  new_shift_type TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, schedule_date, warning_type)
);

-- Index
CREATE INDEX idx_warnings_unresolved ON break_schedule_warnings(schedule_date, is_resolved);
4. Database Function: Clear breaks on shift change
sqlCREATE OR REPLACE FUNCTION handle_shift_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if shift type actually changed
  IF OLD.shift_type IS DISTINCT FROM NEW.shift_type THEN
    -- Delete existing breaks for this user on this date
    DELETE FROM break_schedules
    WHERE user_id = NEW.user_id
      AND schedule_date = NEW.date;
    
    -- Create warning
    INSERT INTO break_schedule_warnings (user_id, schedule_date, warning_type, old_shift_type, new_shift_type)
    VALUES (NEW.user_id, NEW.date, 'shift_changed', OLD.shift_type, NEW.shift_type)
    ON CONFLICT (user_id, schedule_date, warning_type)
    DO UPDATE SET
      old_shift_type = EXCLUDED.old_shift_type,
      new_shift_type = EXCLUDED.new_shift_type,
      is_resolved = false,
      created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shift_change_trigger
  AFTER UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_change();
5. Database Function: Swap breaks when swap approved
sqlCREATE OR REPLACE FUNCTION swap_break_schedules()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if swap request just got approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Swap breaks for date1
    WITH temp_breaks AS (
      DELETE FROM break_schedules
      WHERE (user_id = NEW.requester_id OR user_id = NEW.target_user_id)
        AND schedule_date = NEW.date1
      RETURNING *
    )
    INSERT INTO break_schedules (user_id, schedule_date, shift_type, interval_start, break_type, created_by)
    SELECT
      CASE
        WHEN user_id = NEW.requester_id THEN NEW.target_user_id
        ELSE NEW.requester_id
      END,
      schedule_date,
      shift_type,
      interval_start,
      break_type,
      NEW.updated_by
    FROM temp_breaks;
    
    -- Swap breaks for date2 (same logic)
    WITH temp_breaks AS (
      DELETE FROM break_schedules
      WHERE (user_id = NEW.requester_id OR user_id = NEW.target_user_id)
        AND schedule_date = NEW.date2
      RETURNING *
    )
    INSERT INTO break_schedules (user_id, schedule_date, shift_type, interval_start, break_type, created_by)
    SELECT
      CASE
        WHEN user_id = NEW.requester_id THEN NEW.target_user_id
        ELSE NEW.requester_id
      END,
      schedule_date,
      shift_type,
      interval_start,
      break_type,
      NEW.updated_by
    FROM temp_breaks;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER swap_breaks_trigger
  AFTER UPDATE ON swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION swap_break_schedules();
```

---

## 🎨 UI Components

### Page Layout
```
/break-schedule

┌─────────────────────────────────────────────────────────────────┐
│ Break Schedule                                    [WFM View Only]│
│                                                                   │
│ [← Prev Day]  Tuesday, Feb 11, 2026  [Next Day →]  [Today]      │
│                                                                   │
│ 🔍 Search agent...  📁 Department: All ▼   [Import CSV] [Export]│
│                                                                   │
│ ⚙️ Break Rules: Active  [Configure Rules]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ [Agent Table - See detailed structure below]                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Table Structure (Read View - Agent/TL)
```
┌──────────────┬───────┬────────┬────────┬────────┬──────┬──────┬──────┬─────┐
│ Agent Name ⚠ │ Shift │  HB1   │   B    │  HB2   │ 9:00 │ 9:15 │ 9:30 │ ... │
│ (Sticky)     │       │        │        │        │      │      │      │     │
├──────────────┼───────┼────────┼────────┼────────┼──────┼──────┼──────┼─────┤
│ Total IN     │   -   │   -    │   -    │   -    │  12  │  11  │  10  │ ... │ ← Summary row
├──────────────┼───────┼────────┼────────┼────────┼──────┼──────┼──────┼─────┤
│ John Doe     │  AM   │ 10:00  │ 12:00  │ 3:30   │  IN  │  IN  │ HB1  │ ... │
│ Jane Smith ⚠ │  PM   │ 11:00  │ 1:00   │ 4:00   │  IN  │  IN  │  IN  │ ... │
│ Mike Johnson │  BET  │ 10:30  │ 12:30  │ 3:00   │  IN  │ HB1  │ HB1  │ ... │
└──────────────┴───────┴────────┴────────┴────────┴──────┴──────┴──────┴─────┘
                                                    └─────── Horizontal scroll ──→
```

### Agent Table Structure (Plan View - WFM)
```
Same as above BUT:
- Interval cells are clickable/draggable
- Multi-select enabled (Shift+Click, Ctrl+Click)
- Right-click context menu: Set IN/HB1/B/HB2, Copy, Paste
- Total IN row has color scale: Green (high coverage) → Red (low coverage)
- Warning icons (⚠️) are clickable to show details
```

### Color Scale for Total IN Row
```
Green:   10+ agents IN
Yellow:  5-9 agents IN
Orange:  3-4 agents IN
Red:     0-2 agents IN
Break Cell Colors
cssIN:  White background / No border
HB1: Light blue background (#DBEAFE)
B:   Blue background (#93C5FD)
HB2: Light blue background (#DBEAFE)

📡 API Endpoints
1. Get Break Schedule for Date
typescriptGET /api/break-schedules?date=2026-02-11&department=Customer%20Success

Response:
{
  "agents": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "shift_type": "AM",
      "department": "Customer Success",
      "has_warning": true,
      "warning_details": {
        "type": "shift_changed",
        "old_shift": "PM",
        "new_shift": "AM"
      },
      "breaks": {
        "HB1": "10:00:00",  // Start time
        "B": "12:00:00",
        "HB2": "15:30:00"
      },
      "intervals": {
        "09:00": "IN",
        "09:15": "IN",
        "09:30": "IN",
        "09:45": "IN",
        "10:00": "HB1",
        // ... all intervals up to 21:00
      }
    }
  ],
  "summary": {
    "09:00": { "in": 12, "hb1": 0, "b": 0, "hb2": 0 },
    "09:15": { "in": 11, "hb1": 1, "b": 0, "hb2": 0 },
    // ... for all intervals
  }
}
2. Update Break Schedule (WFM Only)
typescriptPOST /api/break-schedules

Body:
{
  "user_id": "uuid",
  "schedule_date": "2026-02-11",
  "intervals": [
    {
      "interval_start": "10:00:00",
      "break_type": "HB1"
    },
    {
      "interval_start": "12:00:00",
      "break_type": "B"
    },
    {
      "interval_start": "12:15:00",
      "break_type": "B"  // Auto-added for 30min break
    }
  ]
}

Response:
{
  "success": true,
  "violations": [
    {
      "rule": "minimum_gap",
      "message": "Gap between HB1 and B is only 60 minutes (minimum 90 required)",
      "severity": "warning"  // or "error" for blocking violations
    }
  ]
}
3. Validate Break Schedule
typescriptPOST /api/break-schedules/validate

Body:
{
  "user_id": "uuid",
  "schedule_date": "2026-02-11",
  "intervals": [ /* same as update */ ]
}

Response:
{
  "is_valid": false,
  "violations": [
    {
      "rule_name": "break_ordering",
      "message": "B must come after HB1",
      "severity": "error"
    }
  ]
}
4. Get Break Rules
typescriptGET /api/break-schedules/rules

Response:
{
  "rules": [
    {
      "id": "uuid",
      "rule_name": "equal_distribution",
      "rule_type": "distribution",
      "description": "Maintain equal or near-equal agents at all intervals",
      "parameters": {
        "tolerance_percentage": 20,
        "target_metric": "available_agents"
      },
      "is_active": true,
      "priority": 1
    }
  ]
}
5. Update Break Rule (WFM Only)
typescriptPUT /api/break-schedules/rules/:id

Body:
{
  "parameters": {
    "min_minutes": 120  // Changed from 90
  },
  "is_active": true
}
6. Bulk Import CSV
typescriptPOST /api/break-schedules/import

Body: FormData with CSV file

CSV Format:
Agent Name,Date,Shift,HB1 Start,B Start,HB2 Start
John Doe,2026-02-11,AM,10:00,12:00,15:30
Jane Smith,2026-02-11,PM,11:00,13:00,16:00

Response:
{
  "success": true,
  "imported": 45,
  "errors": [
    {
      "row": 3,
      "agent": "Mike Johnson",
      "error": "Shift type not found for this date"
    }
  ]
}
7. Export CSV
typescriptGET /api/break-schedules/export?date=2026-02-11&department=All

Response: CSV file download
8. Dismiss Warning
typescriptPOST /api/break-schedules/warnings/:id/dismiss

Response:
{
  "success": true
}
```

---

## 🎯 Acceptance Criteria

### AC1: Date Navigation
- [ ] Page defaults to today's date on load
- [ ] Prev/Next buttons navigate to adjacent days
- [ ] "Today" button always returns to current date
- [ ] Date displayed in human-readable format (e.g., "Tuesday, Feb 11, 2026")

### AC2: Agent Table (Read View)
- [ ] Shows all agents with shifts for selected date
- [ ] Displays shift type (AM/PM/BET/OFF)
- [ ] Shows break times in HB1/B/HB2 columns (e.g., "10:00 AM")
- [ ] Shows break status per 15-min interval (IN/HB1/B/HB2)
- [ ] Agent name column is sticky during horizontal scroll
- [ ] Total IN row shows count of available agents per interval
- [ ] Warning icon (⚠️) appears for agents with unresolved warnings
- [ ] Clicking warning icon shows popup with details

### AC3: Agent Table (Plan View - WFM)
- [ ] All features from AC2 plus editing capabilities
- [ ] Click on interval cell to cycle through: IN → HB1 → B → HB2 → IN
- [ ] Clicking "B" automatically sets next cell to "B" (30-min duration)
- [ ] Shift+Click to select range of cells
- [ ] Ctrl/Cmd+Click to multi-select non-contiguous cells
- [ ] Right-click shows context menu with break type options
- [ ] Selected cells have blue border/highlight
- [ ] Total IN row uses color scale (green→yellow→orange→red)
- [ ] Changes save automatically with debounce (500ms)
- [ ] Shows validation errors inline below affected cells

### AC4: Break Rules Validation
- [ ] HB1 must come before B, B before HB2 (same day)
- [ ] Minimum 1:30 hours between consecutive breaks
- [ ] Maximum 4:30 hours between consecutive breaks
- [ ] Breaks cannot be scheduled outside agent's shift hours
- [ ] Breaking rules shows warning banner at top of page
- [ ] Non-blocking warnings allow saving with confirmation
- [ ] Blocking errors prevent saving until resolved

### AC5: CSV Import/Export
- [ ] Export button downloads CSV with current day's schedule
- [ ] CSV includes: Agent Name, Date, Shift, HB1 Start, B Start, HB2 Start
- [ ] Import button opens file picker
- [ ] Import validates CSV format before processing
- [ ] Import shows success message with count of imported records
- [ ] Import shows error report for failed rows
- [ ] Import clears existing breaks for affected agents before inserting new ones

### AC6: Shift Change Handling
- [ ] When shift type changes in Schedule page, breaks are auto-cleared
- [ ] Warning icon appears next to agent name
- [ ] Warning popup shows: "Shift changed from [OLD] to [NEW]. Breaks cleared."
- [ ] WFM can dismiss warning by clicking "×" or "Dismiss" button
- [ ] Dismissed warnings are hidden from view

### AC7: Swap Integration
- [ ] When swap request is approved, breaks swap between requester and target
- [ ] Swap applies to both date1 and date2
- [ ] If only one user has breaks scheduled, they transfer to the other user
- [ ] Swap creates audit log entry

### AC8: Department Filter
- [ ] Department dropdown shows all departments
- [ ] "All" option shows agents from all departments
- [ ] Filter applies immediately on selection
- [ ] Filter state persists during date navigation

### AC9: Search
- [ ] Search box filters agents by name (case-insensitive)
- [ ] Search applies immediately as user types (debounced 300ms)
- [ ] Shows "No agents found" message when no matches

### AC10: Mobile Responsiveness
- [ ] Agent name column remains sticky on mobile
- [ ] Table scrolls horizontally on small screens
- [ ] Touch-friendly targets (minimum 44px)
- [ ] Date navigation buttons stack vertically on mobile
- [ ] Import/Export buttons accessible on mobile

### AC11: Rules Configuration Page (Settings)
- [ ] New section in Settings page: "Break Schedule Rules"
- [ ] Shows list of all rules with name, description, status (Active/Inactive)
- [ ] WFM can edit rule parameters via modal
- [ ] WFM can activate/deactivate rules with toggle
- [ ] Changes to rules apply immediately
- [ ] Shows validation errors if invalid parameters entered

---

## 🚀 Implementation Steps

### Phase 1: Database & Backend (2-3 days)
1. Create migration `014_break_schedules.sql` with all tables
2. Create database functions for shift changes and swaps
3. Create service layer: `breakSchedulesService.ts`
4. Create API endpoints in `pages/api/` or service layer
5. Add Zod validators for break schedule data
6. Write unit tests for service layer

### Phase 2: Core UI (3-4 days)
7. Create `pages/BreakSchedule/BreakSchedule.tsx` (read view)
8. Create `hooks/useBreakSchedules.ts` with React Query
9. Create `components/BreakSchedule/BreakScheduleTable.tsx`
10. Create `components/BreakSchedule/BreakCell.tsx`
11. Implement date navigation
12. Implement agent name sticky column
13. Implement horizontal scroll
14. Add Total IN summary row

### Phase 3: WFM Planning Features (3-4 days)
15. Add editable mode for WFM role
16. Implement cell click to cycle break types
17. Implement auto-fill for 30-min "B" breaks
18. Implement multi-select (Shift+Click, Ctrl+Click)
19. Implement context menu (right-click)
20. Add color scale to Total IN row
21. Implement auto-save with debounce
22. Add loading states and error handling

### Phase 4: Validation & Rules (2-3 days)
23. Create `hooks/useBreakRules.ts`
24. Implement client-side validation against rules
25. Show validation errors inline
26. Add warning banners for rule violations
27. Implement rule severity (warning vs error)

### Phase 5: CSV Import/Export (2 days)
28. Implement CSV export functionality
29. Implement CSV import with validation
30. Show import results (success count + errors)
31. Add CSV parsing utility functions

### Phase 6: Integration Features (2 days)
32. Add shift change trigger and warning system
33. Add swap integration trigger
34. Create warning popup component
35. Implement warning dismissal

### Phase 7: Rules Configuration UI (2 days)
36. Add "Break Schedule Rules" section to Settings page
37. Create `components/Settings/BreakRulesConfig.tsx`
38. Implement rule editing modal
39. Add rule toggle for activate/deactivate

### Phase 8: Polish & Testing (2-3 days)
40. Add department filter
41. Add agent search
42. Implement mobile responsiveness
43. Add skeleton loading states
44. Write integration tests
45. Manual QA testing
46. Fix bugs

**Total Estimated Time: 18-23 days**

---

## 📝 File Structure
```
src/
├── pages/
│   └── BreakSchedule/
│       ├── BreakSchedule.tsx              # Main page
│       └── BreakScheduleUpload.tsx        # CSV import page (optional)
├── components/
│   └── BreakSchedule/
│       ├── BreakScheduleTable.tsx         # Table component
│       ├── BreakCell.tsx                  # Individual cell
│       ├── TotalInRow.tsx                 # Summary row with color scale
│       ├── WarningIcon.tsx                # Warning indicator
│       ├── WarningPopup.tsx               # Warning details popup
│       └── BreakRulesConfig.tsx           # Rules configuration (in Settings)
├── hooks/
│   ├── useBreakSchedules.ts               # React Query hook for data
│   └── useBreakRules.ts                   # React Query hook for rules
├── services/
│   ├── breakSchedulesService.ts           # CRUD operations
│   └── breakRulesService.ts               # Rules operations
├── utils/
│   ├── breakValidation.ts                 # Validation logic
│   └── breakCsvHelpers.ts                 # CSV parse/generate
└── types/
    └── breakSchedule.ts                   # TypeScript types

🎨 Design System Integration
Use existing design system from lib/designSystem.ts:

Break cell colors should match theme
Status colors for validation warnings
Use statusColors for Total IN row scale
Toast notifications for save confirmations/errors


✅ Testing Requirements
Unit Tests

 Break schedule service CRUD operations
 CSV parsing and generation
 Break validation rules
 Time calculation utilities

Integration Tests

 Load break schedule for date
 Update break schedule (WFM)
 Shift change triggers break clear
 Swap approval triggers break swap
 CSV import/export roundtrip

E2E Tests (Optional)

 Agent can view their breaks
 WFM can plan breaks for team
 Multi-select and bulk edit
 Rules validation prevents invalid schedules


🚨 Edge Cases to Handle

Agent has no shift for selected date → Show grayed out row or hide entirely?
Agent on leave/OFF → Show grayed out or hide?
Multiple WFMs editing simultaneously → Last-write-wins with optimistic locking
Shift swap pending approval → Show both original and swapped breaks?
Agent transfers to different department mid-day → Handle department filter edge case
Break extends beyond shift end time → Validation error
CSV import with unknown agents → Skip row and report error
Rule parameters invalid (e.g., min > max gap) → Validation on save
Very large team (100+ agents) → Implement pagination or virtual scrolling
Timezone handling → All times in organization's timezone


📊 Success Metrics

Adoption: 80%+ of WFM admins use this page weekly
Efficiency: Reduce time to plan breaks by 50%
Coverage: Maintain minimum coverage thresholds 95%+ of the time
Rule compliance: 90%+ of schedules comply with all active rules
User satisfaction: 4+/5 rating from WFM admins


🔮 Future Enhancements (Post-MVP)

Auto-distribute algorithm: AI-powered break distribution
Break pattern templates: Save and apply common patterns
Real-time collaboration: See other WFMs' cursors/edits
Mobile app integration: Push notifications for break reminders
Break adherence tracking: Monitor if agents take breaks on time
Historical analytics: Break pattern trends over time
Department-specific rules: Different rules per department
Agent preferences: Let agents request preferred break times
Undo/Redo: Track change history with undo capability
Audit log: Detailed log of who changed what and when


❓ Questions / Decisions Needed

Shift times: Should we validate breaks against shift start/end times from the shifts table? (Recommendation: YES)
Grayed out agents: Should agents on OFF/Leave be shown grayed out or hidden? (Recommendation: Grayed out with opacity 0.5)
Pagination: With 100+ agents, should we paginate or virtual scroll? (Recommendation: Show all with virtual scroll if >50 agents)
Rule conflicts: What if two rules conflict? Priority-based resolution? (Recommendation: Higher priority wins, show warning)
Notification: Should agents receive notification when breaks are scheduled/changed? (Recommendation: Phase 2 feature)