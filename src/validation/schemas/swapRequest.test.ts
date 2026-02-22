/**
 * Unit tests for swap request validation schemas
 * Tests valid inputs, invalid inputs, boundary conditions, and error messages
 */

import { describe, it, expect } from 'vitest';
import {
  shiftTypeSchema,
  swapRequestCreateSchema,
  swapRequestValidationSchema,
  csvShiftSchema,
} from './swapRequest';

describe('shiftTypeSchema', () => {
  it('should accept valid shift types', () => {
    const validTypes = ['morning', 'evening', 'night', 'day', 'swing'];

    validTypes.forEach((type) => {
      expect(shiftTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it('should reject empty strings', () => {
    const result = shiftTypeSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('required');
    }
  });

  it('should reject shift types exceeding 10 characters', () => {
    const longType = 'a'.repeat(11);
    const result = shiftTypeSchema.safeParse(longType);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('10 characters');
    }
  });

  it('should accept shift types at maximum length (10 characters)', () => {
    const maxType = 'a'.repeat(10);
    expect(shiftTypeSchema.safeParse(maxType).success).toBe(true);
  });

  it('should accept single character shift types', () => {
    expect(shiftTypeSchema.safeParse('A').success).toBe(true);
  });
});

describe('swapRequestCreateSchema', () => {
  it('should accept valid swap request data', () => {
    const validRequests = [
      {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        requester_shift_id: '550e8400-e29b-41d4-a716-446655440000',
        target_shift_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      },
      {
        target_user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        requester_shift_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        target_shift_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      },
    ];

    validRequests.forEach((request) => {
      expect(swapRequestCreateSchema.safeParse(request).success).toBe(true);
    });
  });

  it('should reject invalid UUIDs', () => {
    const invalidRequest = {
      target_user_id: 'not-a-uuid',
      requester_shift_id: '550e8400-e29b-41d4-a716-446655440000',
      target_shift_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };
    const result = swapRequestCreateSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('UUID');
    }
  });

  it('should reject missing required fields', () => {
    const missingTargetUser = {
      requester_shift_id: '550e8400-e29b-41d4-a716-446655440000',
      target_shift_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };
    const missingRequesterShift = {
      target_user_id: '123e4567-e89b-12d3-a456-426614174000',
      target_shift_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };
    const missingTargetShift = {
      target_user_id: '123e4567-e89b-12d3-a456-426614174000',
      requester_shift_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    expect(swapRequestCreateSchema.safeParse(missingTargetUser).success).toBe(false);
    expect(swapRequestCreateSchema.safeParse(missingRequesterShift).success).toBe(false);
    expect(swapRequestCreateSchema.safeParse(missingTargetShift).success).toBe(false);
  });
});

describe('swapRequestValidationSchema', () => {
  it('should accept valid swap request validation data', () => {
    const validData = {
      requesterId: '123e4567-e89b-12d3-a456-426614174000',
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      requesterShiftId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      targetShiftId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    };
    expect(swapRequestValidationSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject when requester and target user are the same', () => {
    const sameUserId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidData = {
      requesterId: sameUserId,
      targetUserId: sameUserId,
      requesterShiftId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      targetShiftId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    };
    const result = swapRequestValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Cannot swap shifts with yourself');
    }
  });

  it('should reject when requester and target shifts are the same', () => {
    const sameShiftId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const invalidData = {
      requesterId: '123e4567-e89b-12d3-a456-426614174000',
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      requesterShiftId: sameShiftId,
      targetShiftId: sameShiftId,
    };
    const result = swapRequestValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Cannot swap the same shift');
    }
  });

  it('should reject invalid UUIDs', () => {
    const invalidData = {
      requesterId: 'not-a-uuid',
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      requesterShiftId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      targetShiftId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    };
    const result = swapRequestValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('UUID');
    }
  });

  it('should reject missing required fields', () => {
    const missingRequesterId = {
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      requesterShiftId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      targetShiftId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    };
    expect(swapRequestValidationSchema.safeParse(missingRequesterId).success).toBe(false);
  });

  it('should provide descriptive error messages for validation failures', () => {
    const sameUserId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidData = {
      requesterId: sameUserId,
      targetUserId: sameUserId,
      requesterShiftId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      targetShiftId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    };
    const result = swapRequestValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.length).toBeGreaterThan(0);
    }
  });
});

describe('csvShiftSchema', () => {
  it('should accept valid CSV shift data', () => {
    const validData = [
      {
        user_email: 'user@example.com',
        date: '2024-01-01',
        shift_type: 'morning',
      },
      {
        user_email: 'test@example.com',
        date: '2024-12-31',
        shift_type: 'night',
      },
    ];

    validData.forEach((data) => {
      expect(csvShiftSchema.safeParse(data).success).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidData = {
      user_email: 'not-an-email',
      date: '2024-01-01',
      shift_type: 'morning',
    };
    const result = csvShiftSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('email');
    }
  });

  it('should reject invalid date formats', () => {
    const invalidData = {
      user_email: 'user@example.com',
      date: '01/01/2024',
      shift_type: 'morning',
    };
    const result = csvShiftSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('ISO 8601');
    }
  });

  it('should reject invalid shift types', () => {
    const emptyShiftType = {
      user_email: 'user@example.com',
      date: '2024-01-01',
      shift_type: '',
    };
    const longShiftType = {
      user_email: 'user@example.com',
      date: '2024-01-01',
      shift_type: 'a'.repeat(11),
    };

    expect(csvShiftSchema.safeParse(emptyShiftType).success).toBe(false);
    expect(csvShiftSchema.safeParse(longShiftType).success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const missingEmail = {
      date: '2024-01-01',
      shift_type: 'morning',
    };
    const missingDate = {
      user_email: 'user@example.com',
      shift_type: 'morning',
    };
    const missingShiftType = {
      user_email: 'user@example.com',
      date: '2024-01-01',
    };

    expect(csvShiftSchema.safeParse(missingEmail).success).toBe(false);
    expect(csvShiftSchema.safeParse(missingDate).success).toBe(false);
    expect(csvShiftSchema.safeParse(missingShiftType).success).toBe(false);
  });

  it('should accept shift types at boundary length (10 characters)', () => {
    const data = {
      user_email: 'user@example.com',
      date: '2024-01-01',
      shift_type: 'a'.repeat(10),
    };
    expect(csvShiftSchema.safeParse(data).success).toBe(true);
  });
});
