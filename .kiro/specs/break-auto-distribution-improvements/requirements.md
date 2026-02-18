# Requirements Document

## Introduction

This document specifies requirements for improving the break auto-distribution system in the Workforce Management (WFM) application. The current system uses "balanced_coverage" and "staggered_timing" strategies that don't provide predictable, evenly-distributed break schedules. The improvements will introduce a ladder-based distribution algorithm, configurable settings, and fix UI issues with success notifications.

## Glossary

- **Break_Scheduler**: The system component responsible for automatically assigning break times to agents
- **Ladder_Distribution**: A sequential break assignment pattern where each agent's break starts at incrementally later times (e.g., 9:45, 10:00, 10:15)
- **HB1**: First half-break (15-minute break)
- **B**: Full break (30 minutes, spanning 2 consecutive 15-minute intervals)
- **HB2**: Second half-break (15-minute break)
- **Interval**: A 15-minute time slot from 9:00 AM to 9:00 PM
- **Column**: The position index of an interval (e.g., column 4 = 9:45 AM)
- **Shift_Type**: The type of work shift (AM, PM, BET, or OFF)
- **Distribution_Settings**: Configurable parameters controlling the ladder distribution algorithm
- **Toast_Notification**: A temporary UI message shown to users after actions

## Requirements

### Requirement 1: Ladder-Based Distribution Algorithm

**User Story:** As a WFM manager, I want breaks to be distributed using a predictable ladder pattern, so that coverage is balanced and agents have consistent break timing patterns.

#### Acceptance Criteria

1. WHEN auto-distribution is triggered for AM shift agents, THE Break_Scheduler SHALL assign HB1 breaks starting at column 4 (9:45 AM) for the first agent and increment by one column (15 minutes) for each subsequent agent
2. WHEN auto-distribution is triggered for PM shift agents, THE Break_Scheduler SHALL assign HB1 breaks starting at column 16 (1:00 PM) for the first agent and increment by one column for each subsequent agent
3. WHEN auto-distribution is triggered for BET shift agents, THE Break_Scheduler SHALL assign HB1 breaks starting at column 8 (10:45 AM) for the first agent and increment by one column for each subsequent agent
4. WHEN HB1 breaks are assigned, THE Break_Scheduler SHALL assign B breaks 150 minutes (10 intervals) after each agent's HB1 break
5. WHEN B breaks are assigned, THE Break_Scheduler SHALL assign HB2 breaks 150 minutes (10 intervals) after each agent's B break
6. WHEN distributing breaks, THE Break_Scheduler SHALL maintain balanced coverage by minimizing variance in the "Total IN" count across all intervals
7. WHEN a B break is assigned, THE Break_Scheduler SHALL place it across 2 consecutive 15-minute intervals
8. WHEN distributing breaks, THE Break_Scheduler SHALL validate all assignments against existing break rules (minimum spacing, shift boundaries, ordering)

### Requirement 2: Configurable Distribution Settings

**User Story:** As a WFM manager, I want to configure the distribution parameters, so that I can adjust the algorithm to match operational needs without code changes.

#### Acceptance Criteria

1. WHEN a WFM user accesses distribution settings, THE System SHALL display configuration options for starting columns for each shift type (AM, PM, BET)
2. WHEN a WFM user accesses distribution settings, THE System SHALL display configuration options for the time window between break types (HB1→B and B→HB2)
3. WHEN a WFM user saves distribution settings, THE System SHALL persist the settings to the database
4. WHEN distribution settings are not configured, THE System SHALL use default values (AM: column 4, PM: column 16, BET: column 8, time window: 150 minutes)
5. WHEN the Break_Scheduler runs, THE System SHALL retrieve and apply the current distribution settings from the database
6. WHEN distribution settings are updated, THE System SHALL apply the new settings to subsequent auto-distribution operations

### Requirement 3: Single Success Notification

**User Story:** As a user, I want to see only one success message when I place a break, so that I'm not overwhelmed with duplicate notifications.

#### Acceptance Criteria

1. WHEN a user places a B break that spans 2 intervals, THE System SHALL display exactly one success toast notification
2. WHEN a user places an HB1 or HB2 break that spans 1 interval, THE System SHALL display exactly one success toast notification
3. WHEN multiple break intervals are updated in a single operation, THE System SHALL batch the updates and display exactly one success toast notification

### Requirement 4: Maintain Existing Validation

**User Story:** As a WFM manager, I want the new distribution algorithm to respect existing validation rules, so that break schedules remain compliant with operational policies.

#### Acceptance Criteria

1. WHEN the Break_Scheduler assigns breaks, THE System SHALL validate break ordering (HB1 before B before HB2)
2. WHEN the Break_Scheduler assigns breaks, THE System SHALL validate minimum gap requirements (90 minutes between consecutive breaks)
3. WHEN the Break_Scheduler assigns breaks, THE System SHALL validate maximum gap requirements (270 minutes between consecutive breaks)
4. WHEN the Break_Scheduler assigns breaks, THE System SHALL validate shift boundary constraints (breaks within shift hours)
5. IF a proposed break assignment violates a blocking rule, THEN THE Break_Scheduler SHALL skip that assignment and continue with the next agent
6. IF a proposed break assignment violates a non-blocking rule, THEN THE Break_Scheduler SHALL create a warning but allow the assignment
