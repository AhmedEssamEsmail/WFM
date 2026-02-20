/**
 * Unit tests for Overtime Requests Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { overtimeRequestsService } from '../../services/overtimeRequestsService';
import type { OvertimeRequest, CreateOvertimeRequestInput } from '../../types/overtime';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        })
      ),
    },
    from: vi.fn((table: string) => ({
      insert: vi.fn((data: any) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            // Calculate hours from the inserted data
            const insertedData = Array.isArray(data) ? data[0] : data;
            return Promise.resolve({
              data: {
                id: 'test-request-id',
                requester_id: 'test-user-id',
                request_date: insertedData.request_date,
                start_time: insertedData.start_time,
                end_time: insertedData.end_time,
                total_hours: insertedData.total_hours, // Use calculated hours from service
                overtime_type: insertedData.overtime_type,
                reason: insertedData.reason,
                status: 'pending_tl',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });
          }),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: null,
            })
          ),
        })),
      })),
    })),
  },
}));

describe('OvertimeRequestsService', () => {
  describe('createOvertimeRequest', () => {
    it('should create a valid overtime request', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Project deadline work',
      };

      const result = await overtimeRequestsService.createOvertimeRequest(input);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-request-id');
      expect(result.total_hours).toBe(4);
      expect(result.status).toBe('pending_tl');
    });

    it('should calculate total hours correctly', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '14:30:00',
        end_time: '18:45:00',
        overtime_type: 'double',
        reason: 'Emergency maintenance work',
      };

      const result = await overtimeRequestsService.createOvertimeRequest(input);

      expect(result.total_hours).toBeCloseTo(4.25, 2);
    });

    it('should reject invalid overtime type', async () => {
      const input = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'invalid' as any,
        reason: 'Test reason',
      };

      await expect(overtimeRequestsService.createOvertimeRequest(input)).rejects.toThrow();
    });

    it('should reject reason that is too short', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Short',
      };

      await expect(overtimeRequestsService.createOvertimeRequest(input)).rejects.toThrow();
    });

    it('should reject reason that is too long', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'A'.repeat(251),
      };

      await expect(overtimeRequestsService.createOvertimeRequest(input)).rejects.toThrow();
    });
  });

  describe('Hours calculation edge cases', () => {
    it('should handle midnight crossing', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '23:00:00',
        end_time: '01:00:00',
        overtime_type: 'regular',
        reason: 'Night shift overtime work',
      };

      // This should be handled by validation - negative hours
      await expect(overtimeRequestsService.createOvertimeRequest(input)).rejects.toThrow();
    });

    it('should handle exact hour boundaries', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '17:00:00',
        overtime_type: 'regular',
        reason: 'Full day overtime work',
      };

      const result = await overtimeRequestsService.createOvertimeRequest(input);
      expect(result.total_hours).toBe(8);
    });

    it('should handle 30-minute increments', async () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:30:00',
        end_time: '12:00:00',
        overtime_type: 'regular',
        reason: 'Half-day overtime work',
      };

      const result = await overtimeRequestsService.createOvertimeRequest(input);
      expect(result.total_hours).toBe(2.5);
    });
  });
});
