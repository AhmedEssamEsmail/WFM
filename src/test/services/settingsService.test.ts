import { describe, it, expect, beforeEach, vi } from 'vitest';
import { settingsService } from '../../services/settingsService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should fetch a setting value', async () => {
      const mockData = { key: 'wfm_auto_approve', value: 'true' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await settingsService.getSetting('wfm_auto_approve');

      expect(result).toBe('true');
      expect(supabase.from).toHaveBeenCalledWith('settings');
    });

    it('should return null when setting not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

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

      const result = await settingsService.getSetting('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockError = new Error('Database error');

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

      await expect(settingsService.getSetting('test')).rejects.toThrow('Database error');
    });
  });

  describe('getAllSettings', () => {
    it('should fetch all settings as key-value pairs', async () => {
      const mockData = [
        { key: 'wfm_auto_approve', value: 'true' },
        { key: 'allow_leave_exceptions', value: 'false' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      } as any);

      const result = await settingsService.getAllSettings();

      expect(result).toEqual({
        wfm_auto_approve: 'true',
        allow_leave_exceptions: 'false',
      });
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      await expect(settingsService.getAllSettings()).rejects.toThrow('Database error');
    });
  });

  describe('updateSetting', () => {
    it('should update a setting successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(
        settingsService.updateSetting('wfm_auto_approve', 'false')
      ).resolves.toBeUndefined();
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      await expect(settingsService.updateSetting('test', 'value')).rejects.toThrow('Update failed');
    });
  });

  describe('updateSettings', () => {
    it('should update multiple settings successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(
        settingsService.updateSettings({
          wfm_auto_approve: 'true',
          allow_leave_exceptions: 'false',
        })
      ).resolves.toBeUndefined();
    });

    it('should throw error when bulk update fails', async () => {
      const mockError = new Error('Bulk update failed');

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      await expect(settingsService.updateSettings({ test: 'value' })).rejects.toThrow(
        'Bulk update failed'
      );
    });
  });

  describe('getAutoApproveSetting', () => {
    it('should return true when setting is "true"', async () => {
      const mockData = { key: 'wfm_auto_approve', value: 'true' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await settingsService.getAutoApproveSetting();

      expect(result).toBe(true);
    });

    it('should return false when setting is not "true"', async () => {
      const mockData = { key: 'wfm_auto_approve', value: 'false' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await settingsService.getAutoApproveSetting();

      expect(result).toBe(false);
    });

    it('should return false when setting not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

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

      const result = await settingsService.getAutoApproveSetting();

      expect(result).toBe(false);
    });
  });

  describe('getAllowLeaveExceptionsSetting', () => {
    it('should return true when setting is "true"', async () => {
      const mockData = { key: 'allow_leave_exceptions', value: 'true' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await settingsService.getAllowLeaveExceptionsSetting();

      expect(result).toBe(true);
    });

    it('should return false when setting is not "true"', async () => {
      const mockData = { key: 'allow_leave_exceptions', value: 'false' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await settingsService.getAllowLeaveExceptionsSetting();

      expect(result).toBe(false);
    });

    it('should return false when setting not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

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

      const result = await settingsService.getAllowLeaveExceptionsSetting();

      expect(result).toBe(false);
    });
  });
});
