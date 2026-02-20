import { describe, it, expect, beforeEach, vi } from 'vitest';
import { headcountService } from '../../services/headcountService';
import { supabase } from '../../lib/supabase';
import type { HeadcountUser, Department } from '../../types';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Test data
const TEST_UUID_1 = '123e4567-e89b-12d3-a456-426614174000';
const TEST_UUID_2 = '123e4567-e89b-12d3-a456-426614174001';

const mockEmployee: HeadcountUser = {
  id: TEST_UUID_1,
  name: 'John Doe',
  email: 'john.doe@dabdoob.com',
  role: 'agent',
  employee_id: 'EMP001',
  status: 'active',
  department: 'Engineering',
  hire_date: '2024-01-01',
  manager_id: TEST_UUID_2,
  job_title: 'Software Engineer',
  job_level: 'Senior',
  employment_type: 'full_time',
  location: 'Remote',
  time_zone: 'UTC',
  phone: '+1234567890',
  skills: ['TypeScript', 'React'],
  certifications: [],
  max_weekly_hours: 40,
  cost_center: 'CC001',
  budget_code: 'BC001',
  termination_date: null,
  onboarding_status: 'completed',
  created_at: '2024-01-01T00:00:00Z',
};

const mockDepartment: Department = {
  id: TEST_UUID_1,
  name: 'Engineering',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
};

describe('headcountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmployeesPaginated', () => {
    it('should fetch paginated employees successfully', async () => {
      const mockData = [mockEmployee];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await headcountService.getEmployeesPaginated();

      expect(result.data).toEqual(mockData);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('v_headcount_active');
    });

    it('should handle cursor-based pagination', async () => {
      const mockData = [mockEmployee];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              gt: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await headcountService.getEmployeesPaginated('Alice');

      expect(result.data).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('v_headcount_active');
    });

    it('should indicate when more results exist', async () => {
      // Return 21 items when limit is 20 (default)
      const mockData = Array.from({ length: 21 }, (_, i) => ({
        ...mockEmployee,
        id: `uuid-${i}`,
        name: `Employee ${i}`,
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await headcountService.getEmployeesPaginated();

      expect(result.data).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('Employee 19');
    });

    it('should respect custom page size', async () => {
      const mockData = [mockEmployee];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      await headcountService.getEmployeesPaginated(undefined, 10);

      expect(supabase.from).toHaveBeenCalledWith('v_headcount_active');
    });

    it('should cap page size at maximum', async () => {
      const mockData = [mockEmployee];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      await headcountService.getEmployeesPaginated(undefined, 1000);

      expect(supabase.from).toHaveBeenCalledWith('v_headcount_active');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(headcountService.getEmployeesPaginated()).rejects.toThrow('Database error');
    });
  });

  describe('getEmployees', () => {
    it('should fetch all employees successfully', async () => {
      const mockData = [mockEmployee];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any);

      const result = await headcountService.getEmployees();

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('v_headcount_active');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(headcountService.getEmployees()).rejects.toThrow('Database error');
    });
  });

  describe('getEmployeeById', () => {
    it('should fetch employee by ID successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockEmployee,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await headcountService.getEmployeeById(TEST_UUID_1);

      expect(result).toEqual(mockEmployee);
      expect(supabase.from).toHaveBeenCalledWith('v_headcount_active');
    });

    it('should throw error when employee not found', async () => {
      const mockError = new Error('Employee not found');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(headcountService.getEmployeeById(TEST_UUID_1)).rejects.toThrow(
        'Employee not found'
      );
    });
  });

  describe('updateEmployee', () => {
    it('should update user fields successfully', async () => {
      const updates = { name: 'Jane Doe', email: 'jane.doe@dabdoob.com' };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await expect(headcountService.updateEmployee(TEST_UUID_1, updates)).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should update profile fields successfully', async () => {
      const updates = { job_title: 'Lead Engineer', job_level: 'Staff' };

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(headcountService.updateEmployee(TEST_UUID_1, updates)).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('headcount_profiles');
    });

    it('should update both user and profile fields', async () => {
      const updates = {
        name: 'Jane Doe',
        job_title: 'Lead Engineer',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table) => {
        callCount++;
        if (table === 'users') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          } as any;
        } else {
          return {
            upsert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
      });

      await headcountService.updateEmployee(TEST_UUID_1, updates);

      expect(callCount).toBe(2);
    });

    it('should throw error when user update fails', async () => {
      const mockError = new Error('Update failed');
      const updates = { name: 'Jane Doe' };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(headcountService.updateEmployee(TEST_UUID_1, updates)).rejects.toThrow(
        'Update failed'
      );
    });

    it('should throw error when profile update fails', async () => {
      const mockError = new Error('Update failed');
      const updates = { job_title: 'Lead Engineer' };

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      await expect(headcountService.updateEmployee(TEST_UUID_1, updates)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('getDepartments', () => {
    it('should fetch all active departments successfully', async () => {
      const mockData = [mockDepartment];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await headcountService.getDepartments();

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('departments');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(headcountService.getDepartments()).rejects.toThrow('Database error');
    });
  });

  describe('getHeadcountMetrics', () => {
    it('should fetch headcount metrics successfully', async () => {
      const mockData = [{ department: 'Engineering', count: 10 }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      } as any);

      const result = await headcountService.getHeadcountMetrics();

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('v_department_summary');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      await expect(headcountService.getHeadcountMetrics()).rejects.toThrow('Database error');
    });
  });

  describe('logAudit', () => {
    it('should log audit entry successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(
        headcountService.logAudit(
          TEST_UUID_1,
          'update',
          { name: 'Old Name' },
          { name: 'New Name' },
          TEST_UUID_2,
          'Name change'
        )
      ).resolves.toBeUndefined();

      expect(supabase.from).toHaveBeenCalledWith('headcount_audit_log');
    });

    it('should log audit without reason', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(
        headcountService.logAudit(
          TEST_UUID_1,
          'update',
          { name: 'Old Name' },
          { name: 'New Name' },
          TEST_UUID_2
        )
      ).resolves.toBeUndefined();
    });

    it('should throw error when audit log fails', async () => {
      const mockError = new Error('Audit log failed');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      await expect(
        headcountService.logAudit(
          TEST_UUID_1,
          'update',
          { name: 'Old Name' },
          { name: 'New Name' },
          TEST_UUID_2
        )
      ).rejects.toThrow('Audit log failed');
    });
  });

  describe('getEmployeeAuditLog', () => {
    it('should fetch employee audit log successfully', async () => {
      const mockData = [
        {
          id: TEST_UUID_1,
          user_id: TEST_UUID_1,
          action: 'update',
          previous_values: { name: 'Old Name' },
          new_values: { name: 'New Name' },
          performed_by: TEST_UUID_2,
          performed_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await headcountService.getEmployeeAuditLog(TEST_UUID_1);

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('headcount_audit_log');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(headcountService.getEmployeeAuditLog(TEST_UUID_1)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
