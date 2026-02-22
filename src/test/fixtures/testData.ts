/**
 * Shared Test Fixtures
 *
 * Provides reusable test data and mock objects to minimize test setup overhead.
 * These fixtures are immutable and can be safely shared across tests.
 */

import type {
  User,
  Skill,
  BreakScheduleRule,
  DistributionSettings,
  SwapRequest,
  LeaveRequest,
} from '../../types';

// Test UUIDs - reusable across tests
export const TEST_UUIDS = {
  USER_1: '123e4567-e89b-12d3-a456-426614174000',
  USER_2: '123e4567-e89b-12d3-a456-426614174001',
  USER_3: '123e4567-e89b-12d3-a456-426614174002',
  SKILL_1: '223e4567-e89b-12d3-a456-426614174000',
  SKILL_2: '223e4567-e89b-12d3-a456-426614174001',
  SKILL_3: '223e4567-e89b-12d3-a456-426614174002',
  RULE_1: '323e4567-e89b-12d3-a456-426614174000',
  RULE_2: '323e4567-e89b-12d3-a456-426614174001',
  SETTING_1: '423e4567-e89b-12d3-a456-426614174000',
  SETTING_2: '423e4567-e89b-12d3-a456-426614174001',
  SWAP_1: '523e4567-e89b-12d3-a456-426614174000',
  SWAP_2: '523e4567-e89b-12d3-a456-426614174001',
  LEAVE_1: '623e4567-e89b-12d3-a456-426614174000',
  LEAVE_2: '623e4567-e89b-12d3-a456-426614174001',
  SHIFT_1: '723e4567-e89b-12d3-a456-426614174000',
  SHIFT_2: '723e4567-e89b-12d3-a456-426614174001',
} as const;

// Mock Users
export const MOCK_USERS = {
  agent: {
    id: TEST_UUIDS.USER_1,
    name: 'Agent User',
    email: 'agent@example.com',
    role: 'agent' as const,
    shift_type: 'morning',
    created_at: '2024-01-01T00:00:00Z',
  } as User,

  teamLead: {
    id: TEST_UUIDS.USER_2,
    name: 'Team Lead',
    email: 'tl@example.com',
    role: 'tl' as const,
    shift_type: 'morning',
    created_at: '2024-01-01T00:00:00Z',
  } as User,

  wfm: {
    id: TEST_UUIDS.USER_3,
    name: 'WFM User',
    email: 'wfm@example.com',
    role: 'wfm' as const,
    shift_type: 'morning',
    created_at: '2024-01-01T00:00:00Z',
  } as User,
} as const;

// Mock Skills
export const MOCK_SKILLS = {
  javascript: {
    id: TEST_UUIDS.SKILL_1,
    name: 'JavaScript',
    description: 'JavaScript programming',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as Skill,

  typescript: {
    id: TEST_UUIDS.SKILL_2,
    name: 'TypeScript',
    description: 'TypeScript programming',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as Skill,

  python: {
    id: TEST_UUIDS.SKILL_3,
    name: 'Python',
    description: 'Python programming',
    is_active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as Skill,
} as const;

// Mock Break Rules
export const MOCK_BREAK_RULES = {
  timing: {
    id: TEST_UUIDS.RULE_1,
    rule_name: 'Timing Rule',
    rule_type: 'timing' as const,
    description: 'Test timing rule',
    parameters: { min_minutes: 30, max_minutes: 60 },
    priority: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as BreakScheduleRule,

  coverage: {
    id: TEST_UUIDS.RULE_2,
    rule_name: 'Coverage Rule',
    rule_type: 'coverage' as const,
    description: 'Test coverage rule',
    parameters: { min_agents: 2, alert_threshold: 1 },
    priority: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as BreakScheduleRule,
} as const;

// Mock Distribution Settings
export const MOCK_DISTRIBUTION_SETTINGS = {
  am: {
    id: TEST_UUIDS.SETTING_1,
    shift_type: 'AM' as const,
    hb1_start_column: 4,
    b_offset_minutes: 150,
    hb2_offset_minutes: 150,
    ladder_increment: 1,
    max_agents_per_cycle: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as DistributionSettings,

  pm: {
    id: TEST_UUIDS.SETTING_2,
    shift_type: 'PM' as const,
    hb1_start_column: 16,
    b_offset_minutes: 150,
    hb2_offset_minutes: 150,
    ladder_increment: 1,
    max_agents_per_cycle: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as DistributionSettings,
} as const;

// Mock Swap Requests
export const MOCK_SWAP_REQUESTS = {
  pending: {
    id: TEST_UUIDS.SWAP_1,
    requester_id: TEST_UUIDS.USER_1,
    target_user_id: TEST_UUIDS.USER_2,
    requester_shift_id: TEST_UUIDS.SHIFT_1,
    target_shift_id: TEST_UUIDS.SHIFT_2,
    status: 'pending_tl' as const,
    created_at: '2024-01-15T10:00:00Z',
    requester: MOCK_USERS.agent,
    target_user: MOCK_USERS.teamLead,
  } as SwapRequest,

  approved: {
    id: TEST_UUIDS.SWAP_2,
    requester_id: TEST_UUIDS.USER_1,
    target_user_id: TEST_UUIDS.USER_2,
    requester_shift_id: TEST_UUIDS.SHIFT_1,
    target_shift_id: TEST_UUIDS.SHIFT_2,
    status: 'approved' as const,
    created_at: '2024-01-14T10:00:00Z',
    requester: MOCK_USERS.agent,
    target_user: MOCK_USERS.teamLead,
  } as SwapRequest,
} as const;

// Mock Leave Requests
export const MOCK_LEAVE_REQUESTS = {
  pending: {
    id: TEST_UUIDS.LEAVE_1,
    user_id: TEST_UUIDS.USER_1,
    start_date: '2024-02-01',
    end_date: '2024-02-05',
    leave_type: 'annual' as const,
    status: 'pending_tl' as const,
    created_at: '2024-01-15T10:00:00Z',
    user: MOCK_USERS.agent,
  } as LeaveRequest,

  approved: {
    id: TEST_UUIDS.LEAVE_2,
    user_id: TEST_UUIDS.USER_2,
    start_date: '2024-02-10',
    end_date: '2024-02-12',
    leave_type: 'sick' as const,
    status: 'approved' as const,
    created_at: '2024-01-14T10:00:00Z',
    user: MOCK_USERS.teamLead,
  } as LeaveRequest,
} as const;

/**
 * Helper to create a deep copy of fixture data for mutation in tests
 */
export function cloneFixture<T>(fixture: T): T {
  return JSON.parse(JSON.stringify(fixture));
}

/**
 * Helper to create multiple instances of a fixture with different IDs
 */
export function createMultiple<T extends { id: string }>(
  fixture: T,
  count: number,
  idPrefix: string = 'test'
): T[] {
  return Array.from({ length: count }, (_, i) => ({
    ...cloneFixture(fixture),
    id: `${idPrefix}-${i}`,
  }));
}
