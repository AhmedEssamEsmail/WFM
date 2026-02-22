import { describe, it, expect } from 'vitest';
import {
  columnToTime,
  timeToColumn,
  addMinutesToTime,
  findHighestCoverageIntervals,
} from '../../lib/autoDistribution';

describe('autoDistribution - columnToTime', () => {
  it('should convert column 0 to 09:00', () => {
    expect(columnToTime(0)).toBe('09:00:00');
  });

  it('should convert column 1 to 09:15', () => {
    expect(columnToTime(1)).toBe('09:15:00');
  });

  it('should convert column 4 to 10:00', () => {
    expect(columnToTime(4)).toBe('10:00:00');
  });

  it('should convert column 32 to 17:00', () => {
    expect(columnToTime(32)).toBe('17:00:00');
  });
});

describe('autoDistribution - timeToColumn', () => {
  it('should convert 09:00:00 to column 0', () => {
    expect(timeToColumn('09:00:00')).toBe(0);
  });

  it('should convert 09:15:00 to column 1', () => {
    expect(timeToColumn('09:15:00')).toBe(1);
  });

  it('should convert 10:00:00 to column 4', () => {
    expect(timeToColumn('10:00:00')).toBe(4);
  });

  it('should convert 17:00:00 to column 32', () => {
    expect(timeToColumn('17:00:00')).toBe(32);
  });
});

describe('autoDistribution - addMinutesToTime', () => {
  it('should add 15 minutes to 09:00:00', () => {
    expect(addMinutesToTime('09:00:00', 15)).toBe('09:15:00');
  });

  it('should add 30 minutes to 09:00:00', () => {
    expect(addMinutesToTime('09:00:00', 30)).toBe('09:30:00');
  });

  it('should add 90 minutes to 09:00:00', () => {
    expect(addMinutesToTime('09:00:00', 90)).toBe('10:30:00');
  });

  it('should handle hour boundary', () => {
    expect(addMinutesToTime('09:45:00', 30)).toBe('10:15:00');
  });

  it('should handle large time additions', () => {
    expect(addMinutesToTime('09:00:00', 180)).toBe('12:00:00');
  });
});

describe('autoDistribution - findHighestCoverageIntervals', () => {
  it('should find interval with highest coverage', () => {
    const coverageSummary = {
      '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
      '09:15': { in: 15, hb1: 0, b: 0, hb2: 0 },
      '09:30': { in: 12, hb1: 0, b: 0, hb2: 0 },
    };

    const result = findHighestCoverageIntervals(coverageSummary, 9 * 60, 10 * 60, 1);
    expect(result).toEqual(['09:15']);
  });

  it('should return multiple intervals when requested', () => {
    const coverageSummary = {
      '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
      '09:15': { in: 15, hb1: 0, b: 0, hb2: 0 },
      '09:30': { in: 12, hb1: 0, b: 0, hb2: 0 },
    };

    const result = findHighestCoverageIntervals(coverageSummary, 9 * 60, 10 * 60, 2);
    expect(result).toHaveLength(2);
    expect(result).toContain('09:15');
    expect(result).toContain('09:30');
  });

  it('should prefer earlier time when coverage is equal', () => {
    const coverageSummary = {
      '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
      '09:15': { in: 10, hb1: 0, b: 0, hb2: 0 },
    };

    const result = findHighestCoverageIntervals(coverageSummary, 9 * 60, 10 * 60, 1);
    expect(result).toEqual(['09:00']);
  });

  it('should handle empty coverage summary', () => {
    const coverageSummary = {};

    const result = findHighestCoverageIntervals(coverageSummary, 9 * 60, 10 * 60, 1);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should only consider intervals within time range', () => {
    const coverageSummary = {
      '08:00': { in: 20, hb1: 0, b: 0, hb2: 0 },
      '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
      '10:00': { in: 25, hb1: 0, b: 0, hb2: 0 },
    };

    const result = findHighestCoverageIntervals(coverageSummary, 9 * 60, 10 * 60, 1);
    expect(result).not.toContain('08:00');
    expect(result).not.toContain('10:00');
  });
});
