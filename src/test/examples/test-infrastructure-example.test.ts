/**
 * Example Test Using New Test Infrastructure
 *
 * This file demonstrates how to use the new test infrastructure utilities
 * for testing hooks, components, and libraries.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  // Mock helpers
  createQueryMock,
  createMutationMock,
  createFormMock,
  createRouterMock,

  // Test data
  MOCK_USERS,
  TEST_UUIDS,

  // Generators
  breakScheduleCSVDataArb,
  timeArb,
  dateArb,

  // Performance monitoring
  startPerformanceTracking,
  stopPerformanceTracking,

  // Utilities
  normalizeTimeFormat,
  isBreakScheduleEquivalent,
  propertyTestConfig,
} from '../utils/testInfrastructure';

describe('Test Infrastructure Examples', () => {
  beforeAll(() => {
    startPerformanceTracking('Test Infrastructure Examples');
  });

  afterAll(() => {
    stopPerformanceTracking('Test Infrastructure Examples', 8);
  });

  describe('Mock Helpers Examples', () => {
    it('should use createQueryMock for hook testing', () => {
      // Example: Mock a data fetching hook
      const mockData = { users: [MOCK_USERS.agent, MOCK_USERS.teamLead] };
      const queryMock = createQueryMock(mockData);

      expect(queryMock.data).toEqual(mockData);
      expect(queryMock.isLoading).toBe(false);
      expect(queryMock.isSuccess).toBe(true);
    });

    it('should use createMutationMock for mutation testing', () => {
      // Example: Mock a mutation hook
      const mockMutate = vi.fn();
      const mutationMock = createMutationMock(mockMutate);

      mutationMock.mutate({ id: TEST_UUIDS.USER_1, name: 'Updated' });

      expect(mockMutate).toHaveBeenCalledWith({
        id: TEST_UUIDS.USER_1,
        name: 'Updated',
      });
    });

    it('should use createFormMock for form testing', () => {
      // Example: Mock a form submission
      const mockSubmit = vi.fn();
      const formMock = createFormMock(mockSubmit);

      const callback = vi.fn();
      const submitHandler = formMock.handleSubmit(callback);
      submitHandler({ preventDefault: vi.fn() });

      expect(callback).toHaveBeenCalled();
      expect(mockSubmit).toHaveBeenCalled();
    });

    it('should use createRouterMock for navigation testing', () => {
      // Example: Mock router navigation
      const mockNavigate = vi.fn();
      const routerMock = createRouterMock(mockNavigate);

      routerMock.navigate('/dashboard');

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Test Data Examples', () => {
    it('should use MOCK_USERS for consistent test data', () => {
      const agent = MOCK_USERS.agent;

      expect(agent.role).toBe('agent');
      expect(agent.email).toBe('agent@example.com');
      expect(agent.id).toBe(TEST_UUIDS.USER_1);
    });
  });

  describe('Property-Based Testing Examples', () => {
    it('should use timeArb for time generation', () => {
      // Example: Test time format validation
      fc.assert(
        fc.property(timeArb, (time) => {
          // All generated times should match HH:MM format
          return /^\d{2}:\d{2}$/.test(time);
        }),
        { numRuns: 50 }
      );
    });

    it('should use dateArb for date generation', () => {
      // Example: Test date format validation
      fc.assert(
        fc.property(dateArb, (date) => {
          // All generated dates should match YYYY-MM-DD format
          return /^\d{4}-\d{2}-\d{2}$/.test(date);
        }),
        { numRuns: 50 }
      );
    });

    it('should use breakScheduleCSVDataArb for CSV testing', () => {
      // Example: Test break schedule data structure
      fc.assert(
        fc.property(breakScheduleCSVDataArb, (data) => {
          // All generated data should have required fields
          return (
            typeof data.agent_name === 'string' &&
            typeof data.date === 'string' &&
            typeof data.shift === 'string' &&
            ['AM', 'PM', 'BET'].includes(data.shift)
          );
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Utility Functions Examples', () => {
    it('should use normalizeTimeFormat for time comparison', () => {
      expect(normalizeTimeFormat('09:00')).toBe('09:00:00');
      expect(normalizeTimeFormat('09:00:00')).toBe('09:00:00');
      expect(normalizeTimeFormat(null)).toBeNull();
    });

    it('should use isBreakScheduleEquivalent for data comparison', () => {
      const data1 = {
        agent_name: 'John Doe',
        date: '2024-01-15',
        shift: 'AM',
        hb1_start: '09:00',
        b_start: '12:00',
        hb2_start: '15:00',
      };

      const data2 = {
        agent_name: 'John Doe',
        date: '2024-01-15',
        shift: 'AM',
        hb1_start: '09:00:00', // Different format but equivalent
        b_start: '12:00:00',
        hb2_start: '15:00:00',
      };

      expect(isBreakScheduleEquivalent(data1, data2)).toBe(true);
    });
  });
});
