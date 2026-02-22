import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logUnauthorizedAccess,
  getSecurityLogs,
  clearSecurityLogs,
} from '../../lib/securityLogger';
import { Sentry } from '../../lib/sentry';

vi.mock('../../lib/sentry');

describe('Security Logger', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logUnauthorizedAccess', () => {
    it('should log unauthorized access attempt', () => {
      logUnauthorizedAccess('user-123', 'agent', '/admin', 'Insufficient permissions');

      const logs = getSecurityLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        userId: 'user-123',
        userRole: 'agent',
        requestedRoute: '/admin',
        reason: 'Insufficient permissions',
        action: 'unauthorized_access',
      });
      expect(logs[0].timestamp).toBeDefined();
    });

    it('should log domain violations', () => {
      logUnauthorizedAccess(
        'user-456',
        'agent',
        '/login',
        'Invalid email domain',
        'domain_violation'
      );

      const logs = getSecurityLogs();
      expect(logs[0].action).toBe('domain_violation');
    });

    it('should log role violations', () => {
      logUnauthorizedAccess(
        'user-789',
        'agent',
        '/settings',
        'Role not authorized',
        'role_violation'
      );

      const logs = getSecurityLogs();
      expect(logs[0].action).toBe('role_violation');
    });

    it('should maintain rolling buffer of 50 logs', () => {
      // Add 60 logs
      for (let i = 0; i < 60; i++) {
        logUnauthorizedAccess(`user-${i}`, 'agent', '/test', 'Test reason');
      }

      const logs = getSecurityLogs();
      expect(logs.length).toBeLessThanOrEqual(50);
      // Should keep the most recent logs
      expect(logs[logs.length - 1].userId).toBe('user-59');
    });

    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      expect(() => {
        logUnauthorizedAccess('user-123', 'agent', '/test', 'Test');
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('getSecurityLogs', () => {
    it('should retrieve security logs', () => {
      logUnauthorizedAccess('user-1', 'agent', '/route1', 'Reason 1');
      logUnauthorizedAccess('user-2', 'tl', '/route2', 'Reason 2');

      const logs = getSecurityLogs();
      expect(logs).toHaveLength(2);
    });

    it('should limit returned logs', () => {
      for (let i = 0; i < 20; i++) {
        logUnauthorizedAccess(`user-${i}`, 'agent', '/test', 'Test');
      }

      const logs = getSecurityLogs(10);
      expect(logs).toHaveLength(10);
    });

    it('should filter expired logs', () => {
      const now = Date.now();
      const expiredTimestamp = new Date(now - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
      const validTimestamp = new Date(now - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago

      localStorage.setItem(
        'wfm_security_logs',
        JSON.stringify([
          {
            userId: 'expired-user',
            userRole: 'agent',
            requestedRoute: '/test',
            timestamp: expiredTimestamp,
            reason: 'Expired',
            action: 'unauthorized_access',
          },
          {
            userId: 'valid-user',
            userRole: 'agent',
            requestedRoute: '/test',
            timestamp: validTimestamp,
            reason: 'Valid',
            action: 'unauthorized_access',
          },
        ])
      );

      const logs = getSecurityLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('valid-user');
    });

    it('should return empty array on error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const logs = getSecurityLogs();
      expect(logs).toEqual([]);
    });

    it('should handle invalid JSON', () => {
      localStorage.setItem('wfm_security_logs', 'invalid-json{');

      const logs = getSecurityLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('clearSecurityLogs', () => {
    it('should clear all security logs', () => {
      logUnauthorizedAccess('user-1', 'agent', '/test', 'Test');
      expect(getSecurityLogs()).toHaveLength(1);

      clearSecurityLogs();
      expect(getSecurityLogs()).toHaveLength(0);
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => clearSecurityLogs()).not.toThrow();
    });
  });

  describe('Size limits', () => {
    it('should trim logs when size exceeds limit', () => {
      // Create large log entries
      const largeReason = 'x'.repeat(1000);
      for (let i = 0; i < 100; i++) {
        logUnauthorizedAccess(`user-${i}`, 'agent', '/test', largeReason);
      }

      const stored = localStorage.getItem('wfm_security_logs');
      expect(stored).toBeDefined();
      if (stored) {
        expect(stored.length).toBeLessThan(1024 * 50); // Should be under 50KB
      }
    });
  });
});
