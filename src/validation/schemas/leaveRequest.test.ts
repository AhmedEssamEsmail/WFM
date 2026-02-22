/**
 * Unit tests for leave request validation schemas
 * Tests valid inputs, invalid inputs, boundary conditions, and error messages
 */

import { describe, it, expect } from 'vitest';
import {
  leaveTypeSchema,
  leaveRequestCreateSchema,
  leaveRequestValidationSchema,
  leaveBalanceSchema,
  csvLeaveBalanceSchema,
} from './leaveRequest';

describe('leaveTypeSchema', () => {
  it('should accept valid leave types', () => {
    const validTypes = ['annual', 'sick', 'personal', 'maternity', 'unpaid'];

    validTypes.forEach((type) => {
      expect(leaveTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it('should reject empty strings', () => {
    const result = leaveTypeSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('required');
    }
  });
});

describe('leaveRequestCreateSchema', () => {
  it('should accept valid leave request data', () => {
    const validRequests = [
      {
        leave_type: 'annual',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        notes: 'Vacation',
      },
      {
        leave_type: 'sick',
        start_date: '2024-02-01',
        end_date: '2024-02-01',
        notes: null,
      },
      {
        leave_type: 'personal',
        start_date: '2024-03-01',
        end_date: '2024-03-10',
      },
    ];

    validRequests.forEach((request) => {
      expect(leaveRequestCreateSchema.safeParse(request).success).toBe(true);
    });
  });

  it('should accept requests where start_date equals end_date', () => {
    const request = {
      leave_type: 'sick',
      start_date: '2024-01-15',
      end_date: '2024-01-15',
    };
    expect(leaveRequestCreateSchema.safeParse(request).success).toBe(true);
  });

  it('should reject requests where end_date is before start_date', () => {
    const invalidRequest = {
      leave_type: 'annual',
      start_date: '2024-01-10',
      end_date: '2024-01-05',
    };
    const result = leaveRequestCreateSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('End date must be on or after start date');
    }
  });

  it('should reject requests with invalid date formats', () => {
    const invalidRequest = {
      leave_type: 'annual',
      start_date: '01/01/2024',
      end_date: '2024-01-05',
    };
    const result = leaveRequestCreateSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('should reject requests with missing required fields', () => {
    const missingLeaveType = {
      start_date: '2024-01-01',
      end_date: '2024-01-05',
    };
    const missingStartDate = {
      leave_type: 'annual',
      end_date: '2024-01-05',
    };
    const missingEndDate = {
      leave_type: 'annual',
      start_date: '2024-01-01',
    };

    expect(leaveRequestCreateSchema.safeParse(missingLeaveType).success).toBe(false);
    expect(leaveRequestCreateSchema.safeParse(missingStartDate).success).toBe(false);
    expect(leaveRequestCreateSchema.safeParse(missingEndDate).success).toBe(false);
  });

  it('should reject notes exceeding maximum length', () => {
    const longNotes = 'a'.repeat(501); // NOTES_MAX_LENGTH is 500
    const request = {
      leave_type: 'annual',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      notes: longNotes,
    };
    const result = leaveRequestCreateSchema.safeParse(request);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('characters');
    }
  });

  it('should accept notes at maximum length boundary', () => {
    const maxNotes = 'a'.repeat(500); // NOTES_MAX_LENGTH is 500
    const request = {
      leave_type: 'annual',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      notes: maxNotes,
    };
    expect(leaveRequestCreateSchema.safeParse(request).success).toBe(true);
  });

  it('should accept null notes', () => {
    const request = {
      leave_type: 'annual',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      notes: null,
    };
    expect(leaveRequestCreateSchema.safeParse(request).success).toBe(true);
  });
});

describe('leaveRequestValidationSchema', () => {
  it('should accept valid validation data', () => {
    const validData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      leaveType: 'annual',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      requestedDays: 5,
    };
    expect(leaveRequestValidationSchema.safeParse(validData).success).toBe(true);
  });

  it('should accept zero requested days', () => {
    const data = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      leaveType: 'annual',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      requestedDays: 0,
    };
    expect(leaveRequestValidationSchema.safeParse(data).success).toBe(true);
  });

  it('should reject negative requested days', () => {
    const invalidData = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      leaveType: 'annual',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      requestedDays: -5,
    };
    const result = leaveRequestValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('non-negative');
    }
  });

  it('should reject invalid UUIDs', () => {
    const invalidData = {
      userId: 'not-a-uuid',
      leaveType: 'annual',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      requestedDays: 5,
    };
    const result = leaveRequestValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('UUID');
    }
  });

  it('should reject missing required fields', () => {
    const missingUserId = {
      leaveType: 'annual',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      requestedDays: 5,
    };
    expect(leaveRequestValidationSchema.safeParse(missingUserId).success).toBe(false);
  });
});

describe('leaveBalanceSchema', () => {
  it('should accept valid leave balance data', () => {
    const validBalances = [
      {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        leave_type: 'annual',
        balance: 20,
        year: 2024,
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        leave_type: 'sick',
        balance: 0,
        year: 2000,
      },
      {
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        leave_type: 'personal',
        balance: 15.5,
        year: 2100,
      },
    ];

    validBalances.forEach((balance) => {
      expect(leaveBalanceSchema.safeParse(balance).success).toBe(true);
    });
  });

  it('should reject negative balance', () => {
    const invalidBalance = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      leave_type: 'annual',
      balance: -5,
      year: 2024,
    };
    const result = leaveBalanceSchema.safeParse(invalidBalance);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('non-negative');
    }
  });

  it('should reject year below minimum (2000)', () => {
    const invalidBalance = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      leave_type: 'annual',
      balance: 20,
      year: 1999,
    };
    const result = leaveBalanceSchema.safeParse(invalidBalance);
    expect(result.success).toBe(false);
  });

  it('should reject year above maximum (2100)', () => {
    const invalidBalance = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      leave_type: 'annual',
      balance: 20,
      year: 2101,
    };
    const result = leaveBalanceSchema.safeParse(invalidBalance);
    expect(result.success).toBe(false);
  });

  it('should accept year at boundaries (2000 and 2100)', () => {
    const minYear = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      leave_type: 'annual',
      balance: 20,
      year: 2000,
    };
    const maxYear = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      leave_type: 'annual',
      balance: 20,
      year: 2100,
    };

    expect(leaveBalanceSchema.safeParse(minYear).success).toBe(true);
    expect(leaveBalanceSchema.safeParse(maxYear).success).toBe(true);
  });

  it('should reject non-integer years', () => {
    const invalidBalance = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      leave_type: 'annual',
      balance: 20,
      year: 2024.5,
    };
    const result = leaveBalanceSchema.safeParse(invalidBalance);
    expect(result.success).toBe(false);
  });
});

describe('csvLeaveBalanceSchema', () => {
  it('should accept valid CSV leave balance data', () => {
    const validData = [
      {
        user_email: 'user@example.com',
        leave_type: 'annual',
        balance: 20,
      },
      {
        user_email: 'test@example.com',
        leave_type: 'sick',
        balance: 0,
      },
    ];

    validData.forEach((data) => {
      expect(csvLeaveBalanceSchema.safeParse(data).success).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidData = {
      user_email: 'not-an-email',
      leave_type: 'annual',
      balance: 20,
    };
    const result = csvLeaveBalanceSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('email');
    }
  });

  it('should reject negative balance', () => {
    const invalidData = {
      user_email: 'user@example.com',
      leave_type: 'annual',
      balance: -5,
    };
    const result = csvLeaveBalanceSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept zero balance', () => {
    const data = {
      user_email: 'user@example.com',
      leave_type: 'annual',
      balance: 0,
    };
    expect(csvLeaveBalanceSchema.safeParse(data).success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const missingEmail = {
      leave_type: 'annual',
      balance: 20,
    };
    const missingLeaveType = {
      user_email: 'user@example.com',
      balance: 20,
    };
    const missingBalance = {
      user_email: 'user@example.com',
      leave_type: 'annual',
    };

    expect(csvLeaveBalanceSchema.safeParse(missingEmail).success).toBe(false);
    expect(csvLeaveBalanceSchema.safeParse(missingLeaveType).success).toBe(false);
    expect(csvLeaveBalanceSchema.safeParse(missingBalance).success).toBe(false);
  });
});
