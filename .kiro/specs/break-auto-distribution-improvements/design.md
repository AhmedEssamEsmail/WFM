# Design Document: Break Auto-Distribution Improvements

## Overview

This design introduces a ladder-based break distribution algorithm to replace the current "balanced_coverage" and "staggered_timing" strategies. The ladder approach assigns breaks sequentially with predictable 15-minute increments, creating a staggered pattern that naturally balances coverage while being easy to understand and configure.

The design also adds a database-backed configuration system for distribution parameters and fixes the duplicate toast notification issue when placing B breaks.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Break Schedule UI                         │
│  (BreakScheduleTable, AutoDistributionSettings)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              React Query Layer                               │
│         (useBreakSchedules hook)                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Break Schedules Service                            │
│      (breakSchedulesService.ts)                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│        Auto-Distribution Engine                              │
│      (autoDistribution.ts)                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ladder Distribution Strategy                         │  │
│  │  - Reads settings from DB                            │  │
│  │  - Assigns breaks sequentially                       │  │
│  │  - Validates against rules                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer                              │
│  - break_schedules                                          │
│  - break_schedule_rules                                     │
│  - distribution_settings (NEW)                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User triggers auto-distribution from UI
2. React Query hook calls breakSchedulesService.autoDistribute()
3. Service retrieves distribution settings from database
4. Service calls ladderDistributionStrategy() with settings
5. Strategy assigns breaks sequentially, validating each assignment
6. Results are saved to database
7. UI updates with new schedules
8. Single success toast is displayed

## Components and Interfaces

### 1. Distribution Settings Storage

**New Database Table: `distribution_settings`**

```sql
CREATE TABLE distribution_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_type TEXT NOT NULL CHECK (shift_type IN ('AM', 'PM', 'BET')),
  hb1_start_column INTEGER NOT NULL,
  b_offset_minutes INTEGER NOT NULL DEFAULT 150,
  hb2_offset_minutes INTEGER NOT NULL DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_type)
);
```

**Default Values:**
- AM: hb1_start_column = 4 (9:45 AM)
- PM: hb1_start_column = 16 (1:00 PM)
- BET: hb1_start_column = 8 (10:45 AM)
- All: b_offset_minutes = 150, hb2_offset_minutes = 150

### 2. TypeScript Types

```typescript
// Add to src/types/index.ts

export interface DistributionSettings {
  id: string
  shift_type: ShiftType
  hb1_start_column: number
  b_offset_minutes: number
  hb2_offset_minutes: number
  created_at: string
  updated_at: string
}

export interface DistributionSettingsUpdate {
  shift_type: ShiftType
  hb1_start_column: number
  b_offset_minutes: number
  hb2_offset_minutes: number
}

// Update DistributionStrategy type
export type DistributionStrategy = 
  | 'balanced_coverage' 
  | 'staggered_timing' 
  | 'ladder'
```

### 3. Ladder Distribution Algorithm

**Core Algorithm (Pseudocode):**

```
function ladderDistributionStrategy(
  agents: AgentBreakSchedule[],
  scheduleDate: string,
  rules: BreakScheduleRule[],
  settings: Map<ShiftType, DistributionSettings>
): DistributionResult

  schedules = []
  failed = []
  coverageSummary = getCurrentCoverage(scheduleDate)
  
  // Group agents by shift type
  agentsByShift = groupBy(agents, 'shift_type')
  
  for each shiftType in ['AM', 'PM', 'BET']:
    shiftAgents = agentsByShift[shiftType]
    if shiftAgents is empty:
      continue
    
    shiftSettings = settings[shiftType]
    currentColumn = shiftSettings.hb1_start_column
    
    for each agent in shiftAgents:
      // Calculate break times
      hb1Time = columnToTime(currentColumn)
      bTime = addMinutes(hb1Time, shiftSettings.b_offset_minutes)
      hb2Time = addMinutes(bTime, shiftSettings.hb2_offset_minutes)
      
      // Build intervals array
      intervals = [
        { interval_start: hb1Time, break_type: 'HB1' },
        { interval_start: bTime, break_type: 'B' },
        { interval_start: addMinutes(bTime, 15), break_type: 'B' },
        { interval_start: hb2Time, break_type: 'HB2' }
      ]
      
      // Validate against rules
      validation = validateAgainstRules(agent, intervals, rules, shiftType)
      
      if validation.hasBlockingViolations:
        failed.push({
          user_id: agent.user_id,
          name: agent.name,
          reason: formatViolations(validation.violations),
          blockedBy: extractRuleNames(validation.violations)
        })
        currentColumn++ // Move to next column for next agent
        continue
      
      // Add to schedules
      schedules.push(buildSchedule(agent, intervals))
      
      // Update coverage for next iteration
      updateCoverage(coverageSummary, intervals)
      
      // Increment column for next agent
      currentColumn++
    
  return { schedules, failed }
```

**Helper Functions:**

```
function columnToTime(column: number): string
  // Column 0 = 9:00 AM
  // Each column = 15 minutes
  baseMinutes = 9 * 60 // 9:00 AM in minutes
  totalMinutes = baseMinutes + (column * 15)
  hours = totalMinutes / 60
  minutes = totalMinutes % 60
  return formatTime(hours, minutes)

function addMinutes(time: string, minutes: number): string
  timeMinutes = parseTime(time)
  newMinutes = timeMinutes + minutes
  return formatTime(newMinutes / 60, newMinutes % 60)

function updateCoverage(
  summary: BreakScheduleSummary,
  intervals: BreakInterval[]
): void
  for each interval in intervals:
    time = interval.interval_start
    if summary[time] not exists:
      summary[time] = { in: 0, hb1: 0, b: 0, hb2: 0 }
    
    summary[time].in = max(0, summary[time].in - 1)
    
    if interval.break_type == 'HB1':
      summary[time].hb1++
    else if interval.break_type == 'B':
      summary[time].b++
    else if interval.break_type == 'HB2':
      summary[time].hb2++
```

### 4. Settings Service

**New Service: `distributionSettingsService.ts`**

```typescript
class DistributionSettingsService {
  async getSettings(): Promise<Map<ShiftType, DistributionSettings>>
  async updateSettings(updates: DistributionSettingsUpdate[]): Promise<void>
  async resetToDefaults(): Promise<void>
  
  private getDefaultSettings(): DistributionSettingsUpdate[]
}
```

### 5. Toast Notification Fix

**Problem:** When placing a B break (2 intervals), the mutation success callback fires twice.

**Root Cause:** The `updateBreakSchedules` mutation in `useBreakSchedules.ts` shows a success toast in its `onSuccess` callback. When a B break is placed, two separate update requests are batched together, but the debouncing logic in `BreakScheduleTable.tsx` may trigger the mutation multiple times.

**Solution:** Implement request deduplication in the mutation logic.

**Modified Hook (Pseudocode):**

```typescript
// In useBreakSchedules.ts
const updateBreakSchedules = useMutation({
  mutationFn: (updates: BreakScheduleUpdateRequest[]) => {
    // Deduplicate updates by user_id + interval_start
    const deduplicated = deduplicateUpdates(updates)
    return breakSchedulesService.bulkUpdateBreakSchedules(deduplicated)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREAK_SCHEDULES] })
    // Only show toast once per mutation call
    success('Break schedules updated successfully!')
  },
  onError: (error: Error) => {
    showError(error.message || 'Failed to update break schedules')
  },
})

function deduplicateUpdates(
  updates: BreakScheduleUpdateRequest[]
): BreakScheduleUpdateRequest[] {
  const seen = new Set<string>()
  const deduplicated: BreakScheduleUpdateRequest[] = []
  
  for (const update of updates) {
    for (const interval of update.intervals) {
      const key = `${update.user_id}:${interval.interval_start}`
      if (!seen.has(key)) {
        seen.add(key)
        deduplicated.push({
          user_id: update.user_id,
          schedule_date: update.schedule_date,
          intervals: [interval]
        })
      }
    }
  }
  
  return deduplicated
}
```

**Alternative Solution:** Modify the debouncing logic in `BreakScheduleTable.tsx` to batch all pending updates into a single mutation call.

```typescript
// In BreakScheduleTable.tsx
useEffect(() => {
  if (pendingUpdates.length === 0) return

  const timer = setTimeout(async () => {
    if (onUpdate && pendingUpdates.length > 0) {
      setIsSaving(true)
      try {
        // Merge all updates for the same user into single requests
        const merged = mergePendingUpdates(pendingUpdates)
        await onUpdate(merged)
        setPendingUpdates([])
      } catch (error) {
        console.error('Failed to save updates:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }, 500)

  return () => clearTimeout(timer)
}, [pendingUpdates, onUpdate])

function mergePendingUpdates(
  updates: BreakScheduleUpdateRequest[]
): BreakScheduleUpdateRequest[] {
  const byUser = new Map<string, BreakScheduleUpdateRequest>()
  
  for (const update of updates) {
    const existing = byUser.get(update.user_id)
    if (existing) {
      existing.intervals.push(...update.intervals)
    } else {
      byUser.set(update.user_id, { ...update })
    }
  }
  
  return Array.from(byUser.values())
}
```

## Data Models

### Distribution Settings Model

```typescript
interface DistributionSettings {
  id: string
  shift_type: 'AM' | 'PM' | 'BET'
  hb1_start_column: number        // Column index (0-based)
  b_offset_minutes: number        // Minutes between HB1 and B
  hb2_offset_minutes: number      // Minutes between B and HB2
  created_at: string
  updated_at: string
}
```

**Constraints:**
- `hb1_start_column` must be >= 0 and < 48 (total intervals in 12 hours)
- `b_offset_minutes` must be >= 90 (minimum gap rule)
- `hb2_offset_minutes` must be >= 90 (minimum gap rule)
- `shift_type` must be unique

### Break Schedule Model (Existing)

```typescript
interface BreakSchedule {
  id: string
  user_id: string
  schedule_date: string
  shift_type: ShiftType | null
  interval_start: string          // 'HH:MM:SS'
  break_type: 'IN' | 'HB1' | 'B' | 'HB2'
  created_by: string | null
  created_at: string
  updated_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Ladder Pattern Consistency

*For any* set of agents with the same shift type, when auto-distribution is applied, the HB1 breaks SHALL be assigned starting at the configured start column for that shift type, with each subsequent agent receiving an HB1 break one column (15 minutes) later than the previous agent.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Break Offset Timing

*For any* agent with assigned breaks, the time between HB1 and B SHALL equal the configured b_offset_minutes, and the time between B and HB2 SHALL equal the configured hb2_offset_minutes.

**Validates: Requirements 1.4, 1.5**

### Property 3: B Break Span

*For any* B break assignment, the break SHALL occupy exactly 2 consecutive 15-minute intervals.

**Validates: Requirements 1.7**

### Property 4: Validation Enforcement

*For any* agent in the successful schedules list, all assigned breaks SHALL satisfy all active validation rules (break ordering, minimum gap, maximum gap, shift boundaries).

**Validates: Requirements 1.8, 4.1, 4.2, 4.3, 4.4**

### Property 5: Settings Persistence Round-Trip

*For any* valid distribution settings update, saving the settings and then retrieving them SHALL return settings equivalent to what was saved.

**Validates: Requirements 2.3**

### Property 6: Settings Application

*For any* distribution operation, the algorithm SHALL use the distribution settings currently stored in the database.

**Validates: Requirements 2.5, 2.6**

### Property 7: Single Toast Per Operation

*For any* break update operation (single interval, multiple intervals, or batch), exactly one success toast notification SHALL be displayed to the user.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 8: Blocking Rule Enforcement

*For any* agent whose proposed break assignment violates a blocking rule, that agent SHALL appear in the failed list and SHALL NOT appear in the successful schedules list.

**Validates: Requirements 4.5**

### Property 9: Non-Blocking Rule Warnings

*For any* agent whose proposed break assignment violates only non-blocking rules, that agent SHALL appear in the successful schedules list and a warning SHALL be created.

**Validates: Requirements 4.6**

## Error Handling

### Validation Errors

**Scenario:** Break assignment violates blocking rules

**Handling:**
- Add agent to failed list with detailed reason
- Include rule names that blocked the assignment
- Continue processing remaining agents
- Return both successful and failed assignments

**Example:**
```typescript
{
  user_id: "uuid",
  name: "Agent Name",
  reason: "Break ordering violation: HB1 must come before B",
  blockedBy: ["break_ordering"]
}
```

### Database Errors

**Scenario:** Failed to retrieve or save distribution settings

**Handling:**
- Fall back to default settings for retrieval failures
- Show error toast for save failures
- Log error details for debugging
- Do not proceed with distribution if settings cannot be determined

### Invalid Configuration

**Scenario:** Settings contain invalid values (e.g., negative offsets, out-of-range columns)

**Handling:**
- Validate settings before saving
- Return validation errors to user
- Prevent saving invalid settings
- Provide clear error messages indicating which fields are invalid

**Validation Rules:**
```typescript
function validateSettings(settings: DistributionSettingsUpdate): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (settings.hb1_start_column < 0 || settings.hb1_start_column >= 48) {
    errors.push({
      field: 'hb1_start_column',
      message: 'Start column must be between 0 and 47'
    })
  }
  
  if (settings.b_offset_minutes < 90) {
    errors.push({
      field: 'b_offset_minutes',
      message: 'Offset must be at least 90 minutes (minimum gap rule)'
    })
  }
  
  if (settings.hb2_offset_minutes < 90) {
    errors.push({
      field: 'hb2_offset_minutes',
      message: 'Offset must be at least 90 minutes (minimum gap rule)'
    })
  }
  
  return errors
}
```

### Coverage Calculation Errors

**Scenario:** Coverage summary data is missing or corrupted

**Handling:**
- Initialize empty coverage summary if missing
- Assume 0 coverage for missing intervals
- Log warning about missing data
- Continue with distribution using available data

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of ladder distribution (e.g., 3 AM agents get columns 4, 5, 6)
- Edge cases (empty agent list, single agent, all agents fail validation)
- Settings CRUD operations with specific values
- Toast deduplication with specific update patterns
- Error handling scenarios

**Property-Based Tests** focus on:
- Universal properties across all inputs (ladder pattern, offsets, validation)
- Randomized agent sets, shift types, and settings
- Comprehensive input coverage through 100+ iterations per test

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: break-auto-distribution-improvements, Property {number}: {property_text}`

**Example Test Structure:**
```typescript
import fc from 'fast-check'

describe('Ladder Distribution Properties', () => {
  it('Property 1: Ladder Pattern Consistency', () => {
    // Feature: break-auto-distribution-improvements, Property 1: Ladder Pattern Consistency
    fc.assert(
      fc.property(
        fc.array(agentArbitrary, { minLength: 1, maxLength: 20 }),
        fc.constantFrom('AM', 'PM', 'BET'),
        async (agents, shiftType) => {
          // Filter agents to single shift type
          const shiftAgents = agents.map(a => ({ ...a, shift_type: shiftType }))
          
          // Run distribution
          const result = await ladderDistributionStrategy(
            shiftAgents,
            '2026-02-17',
            rules,
            settings
          )
          
          // Verify ladder pattern
          const successful = result.schedules
          for (let i = 0; i < successful.length; i++) {
            const expectedColumn = settings.get(shiftType).hb1_start_column + i
            const actualTime = successful[i].breaks.HB1
            const actualColumn = timeToColumn(actualTime)
            expect(actualColumn).toBe(expectedColumn)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing Balance

Unit tests should focus on:
- Specific examples demonstrating correct behavior (e.g., "3 AM agents get breaks at 9:45, 10:00, 10:15")
- Integration between components (settings service → distribution algorithm)
- Edge cases (no agents, all agents fail validation, missing settings)
- Error conditions (database failures, invalid settings)

Avoid writing too many unit tests for input variations—property-based tests handle comprehensive input coverage.

### Test Coverage Goals

- **Unit Tests:** 80%+ code coverage
- **Property Tests:** All 9 correctness properties implemented
- **Integration Tests:** End-to-end distribution flow with database
- **UI Tests:** Settings form validation and toast behavior

## Implementation Notes

### Migration Strategy

1. Create `distribution_settings` table with default values
2. Add new `ladder` strategy to `DistributionStrategy` type
3. Implement `ladderDistributionStrategy` function alongside existing strategies
4. Update settings UI to include ladder configuration
5. Keep existing strategies functional during rollout
6. After validation, make `ladder` the default strategy

### Performance Considerations

- **Database Queries:** Batch settings retrieval with schedule data
- **Coverage Updates:** Update coverage incrementally during distribution
- **Validation:** Cache rule lookups to avoid repeated database queries
- **Toast Deduplication:** Use Set for O(1) duplicate detection

### Backward Compatibility

- Existing `balanced_coverage` and `staggered_timing` strategies remain functional
- Default strategy can be configured in settings
- No breaking changes to API contracts
- Database migration is additive (no column removals)

### Security Considerations

- Only WFM role can modify distribution settings
- Settings validation prevents SQL injection via parameterized queries
- RLS policies enforce role-based access to settings table
