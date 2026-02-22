import { describe, it, expect, vi } from 'vitest';
import {
  validateBreakOrdering,
  validateBreakTiming,
  validateFullBreakDuration,
} from '../../lib/breakValidation';
import type { BreakType } from '../../types';

// Mock shift configurations
vi.mock('../../services/shiftConfigurationsService', () => ({
  shiftConfigurationsService: {
    getShiftHoursMap: vi.fn().mockResolvedValue({
      AM: { start: '09:00:00', end: '17:00:00' },
      PM: { start: '13:00:00', end: '21:00:00' },
      BET: { start: '10:00:00', end: '18:00:00' },
    }),
  },
}));

describe('breakValidation - validateBreakOrdering', () => {
  it('should pass when breaks are in correct order', () => {
    const intervals = [
      { interval_start: '09:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '12:00:00', break_type: 'B' as BreakType },
      { interval_start: '15:00:00', break_type: 'HB2' as BreakType },
    ];

    const result = validateBreakOrdering(intervals);
    expect(result).toBeNull();
  });

  it('should fail when HB1 comes after B', () => {
    const intervals = [
      { interval_start: '13:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '12:00:00', break_type: 'B' as BreakType },
    ];

    const result = validateBreakOrdering(intervals);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('HB1 must come before B');
  });

  it('should fail when B comes after HB2', () => {
    const intervals = [
      { interval_start: '16:00:00', break_type: 'B' as BreakType },
      { interval_start: '15:00:00', break_type: 'HB2' as BreakType },
    ];

    const result = validateBreakOrdering(intervals);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('B must come before HB2');
  });

  it('should fail when HB1 comes after HB2', () => {
    const intervals = [
      { interval_start: '16:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '15:00:00', break_type: 'HB2' as BreakType },
    ];

    const result = validateBreakOrdering(intervals);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('HB1 must come before HB2');
  });

  it('should handle missing breaks', () => {
    const intervals = [{ interval_start: '09:00:00', break_type: 'HB1' as BreakType }];

    const result = validateBreakOrdering(intervals);
    expect(result).toBeNull();
  });
});

describe('breakValidation - validateBreakTiming', () => {
  it('should pass when gaps are within limits', () => {
    const intervals = [
      { interval_start: '09:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '11:00:00', break_type: 'B' as BreakType },
      { interval_start: '13:00:00', break_type: 'HB2' as BreakType },
    ];

    const result = validateBreakTiming(intervals, 90, 270);
    expect(result).toHaveLength(0);
  });

  it('should fail when gap is too small', () => {
    const intervals = [
      { interval_start: '09:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '09:30:00', break_type: 'B' as BreakType },
    ];

    const result = validateBreakTiming(intervals, 90, 270);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].rule_name).toBe('minimum_gap');
  });

  it('should warn when gap is too large', () => {
    const intervals = [
      { interval_start: '09:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '15:00:00', break_type: 'B' as BreakType },
    ];

    const result = validateBreakTiming(intervals, 90, 270);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].rule_name).toBe('maximum_gap');
    expect(result[0].severity).toBe('warning');
  });

  it('should check both HB1-B and B-HB2 gaps', () => {
    const intervals = [
      { interval_start: '09:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '09:30:00', break_type: 'B' as BreakType },
      { interval_start: '10:00:00', break_type: 'HB2' as BreakType },
    ];

    const result = validateBreakTiming(intervals, 90, 270);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('breakValidation - validateFullBreakDuration', () => {
  it('should pass when B spans 2 consecutive intervals', () => {
    const intervals = [
      { interval_start: '12:00:00', break_type: 'B' as BreakType },
      { interval_start: '12:15:00', break_type: 'B' as BreakType },
    ];

    const result = validateFullBreakDuration(intervals);
    expect(result).toBeNull();
  });

  it('should fail when B has only 1 interval', () => {
    const intervals = [{ interval_start: '12:00:00', break_type: 'B' as BreakType }];

    const result = validateFullBreakDuration(intervals);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('30 minutes');
  });

  it('should fail when B intervals are not consecutive', () => {
    const intervals = [
      { interval_start: '12:00:00', break_type: 'B' as BreakType },
      { interval_start: '12:30:00', break_type: 'B' as BreakType },
    ];

    const result = validateFullBreakDuration(intervals);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('consecutive');
  });

  it('should fail when B has more than 2 intervals', () => {
    const intervals = [
      { interval_start: '12:00:00', break_type: 'B' as BreakType },
      { interval_start: '12:15:00', break_type: 'B' as BreakType },
      { interval_start: '12:30:00', break_type: 'B' as BreakType },
    ];

    const result = validateFullBreakDuration(intervals);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('exactly 30 minutes');
  });

  it('should return null when no B breaks exist', () => {
    const intervals = [
      { interval_start: '09:00:00', break_type: 'HB1' as BreakType },
      { interval_start: '15:00:00', break_type: 'HB2' as BreakType },
    ];

    const result = validateFullBreakDuration(intervals);
    expect(result).toBeNull();
  });
});
