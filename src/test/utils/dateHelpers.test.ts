import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateISO,
  formatDateShort,
  formatDateLong,
  formatDateTime,
  parseDate,
  getDaysBetween,
  getBusinessDaysBetween,
  isDatePast,
  isDateFuture,
  isDateToday,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getLastMonthRange,
  getCurrentMonthRange,
  isValidDateRange,
  getRelativeTimeString,
  getDateRange,
  getTodayISO,
  addDaysToDate,
  subtractDaysFromDate,
} from '../../utils/dateHelpers';

describe('Date Helper Functions', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBeTruthy();
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });

    it('should handle ISO string input', () => {
      const result = formatDate('2024-01-15', 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatDateISO', () => {
    it('should format date to ISO format', () => {
      const date = new Date('2024-01-15');
      expect(formatDateISO(date)).toBe('2024-01-15');
    });

    it('should handle string input', () => {
      expect(formatDateISO('2024-01-15')).toBe('2024-01-15');
    });

    it('should return empty string for null', () => {
      expect(formatDateISO(null)).toBe('');
    });
  });

  describe('formatDateShort', () => {
    it('should format date to short format', () => {
      const date = new Date('2024-01-15');
      const result = formatDateShort(date);
      expect(result).toBeTruthy();
    });

    it('should return empty string for null', () => {
      expect(formatDateShort(null)).toBe('');
    });
  });

  describe('formatDateLong', () => {
    it('should format date to long format', () => {
      const date = new Date('2024-01-15');
      const result = formatDateLong(date);
      expect(result).toBeTruthy();
    });

    it('should return empty string for null', () => {
      expect(formatDateLong(null)).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDateTime(date);
      expect(result).toBeTruthy();
    });

    it('should return empty string for null', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('parseDate', () => {
    it('should parse valid ISO date string', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid date string', () => {
      expect(parseDate('invalid')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseDate(undefined)).toBeNull();
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const result = getDaysBetween('2024-01-10', '2024-01-15');
      expect(result).toBe(6); // Includes both start and end
    });

    it('should handle Date objects', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-15');
      expect(getDaysBetween(start, end)).toBe(6);
    });

    it('should return 0 for invalid dates', () => {
      expect(getDaysBetween('invalid', '2024-01-15')).toBe(0);
    });

    it('should handle same date', () => {
      expect(getDaysBetween('2024-01-15', '2024-01-15')).toBe(1);
    });
  });

  describe('getBusinessDaysBetween', () => {
    it('should calculate business days excluding weekends', () => {
      // Jan 8, 2024 is Monday, Jan 12 is Friday
      const result = getBusinessDaysBetween('2024-01-08', '2024-01-12');
      expect(result).toBe(5); // Mon-Fri
    });

    it('should exclude weekends', () => {
      // Jan 8 (Mon) to Jan 14 (Sun) = 5 business days
      const result = getBusinessDaysBetween('2024-01-08', '2024-01-14');
      expect(result).toBe(5);
    });

    it('should return 0 for invalid dates', () => {
      expect(getBusinessDaysBetween('invalid', '2024-01-15')).toBe(0);
    });

    it('should handle Date objects', () => {
      const start = new Date('2024-01-08');
      const end = new Date('2024-01-12');
      expect(getBusinessDaysBetween(start, end)).toBe(5);
    });
  });

  describe('isDatePast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDatePast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDatePast(futureDate)).toBe(false);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isDatePast(today)).toBe(false);
    });

    it('should handle string input', () => {
      expect(isDatePast('2020-01-01')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isDatePast('invalid')).toBe(false);
    });
  });

  describe('isDateFuture', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDateFuture(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDateFuture(pastDate)).toBe(false);
    });

    it('should handle string input', () => {
      expect(isDateFuture('2030-01-01')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isDateFuture('invalid')).toBe(false);
    });
  });

  describe('isDateToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isDateToday(today)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDateToday(pastDate)).toBe(false);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDateToday(futureDate)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isDateToday('invalid')).toBe(false);
    });
  });

  describe('getStartOfWeek', () => {
    it('should return start of week (Monday)', () => {
      const date = new Date('2024-01-15'); // Monday
      const result = getStartOfWeek(date);
      expect(result).toBeInstanceOf(Date);
    });

    it('should use current date if no date provided', () => {
      const result = getStartOfWeek();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getEndOfWeek', () => {
    it('should return end of week (Sunday)', () => {
      const date = new Date('2024-01-15');
      const result = getEndOfWeek(date);
      expect(result).toBeInstanceOf(Date);
    });

    it('should use current date if no date provided', () => {
      const result = getEndOfWeek();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getStartOfMonth', () => {
    it('should return start of month', () => {
      const date = new Date('2024-01-15');
      const result = getStartOfMonth(date);
      expect(result.getDate()).toBe(1);
    });

    it('should use current date if no date provided', () => {
      const result = getStartOfMonth();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getEndOfMonth', () => {
    it('should return end of month', () => {
      const date = new Date('2024-01-15');
      const result = getEndOfMonth(date);
      expect(result.getDate()).toBeGreaterThan(28);
    });

    it('should use current date if no date provided', () => {
      const result = getEndOfMonth();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getLastMonthRange', () => {
    it('should return last month date range', () => {
      const result = getLastMonthRange();
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.start.getTime()).toBeLessThan(result.end.getTime());
    });
  });

  describe('getCurrentMonthRange', () => {
    it('should return current month date range', () => {
      const result = getCurrentMonthRange();
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.start.getTime()).toBeLessThan(result.end.getTime());
    });
  });

  describe('isValidDateRange', () => {
    it('should return true for valid date range', () => {
      expect(isValidDateRange('2024-01-10', '2024-01-15')).toBe(true);
    });

    it('should return true for same dates', () => {
      expect(isValidDateRange('2024-01-15', '2024-01-15')).toBe(true);
    });

    it('should return false for invalid range (end before start)', () => {
      expect(isValidDateRange('2024-01-15', '2024-01-10')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDateRange('invalid', '2024-01-15')).toBe(false);
    });

    it('should handle Date objects', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-15');
      expect(isValidDateRange(start, end)).toBe(true);
    });
  });

  describe('getRelativeTimeString', () => {
    it('should return "Today" for today', () => {
      const today = new Date();
      expect(getRelativeTimeString(today)).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getRelativeTimeString(yesterday)).toBe('Yesterday');
    });

    it('should return "Tomorrow" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getRelativeTimeString(tomorrow)).toBe('Tomorrow');
    });

    it('should return days ago for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const result = getRelativeTimeString(pastDate);
      expect(result).toContain('days ago');
    });

    it('should return "in X days" for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const result = getRelativeTimeString(futureDate);
      expect(result).toContain('in');
      expect(result).toContain('days');
    });

    it('should return empty string for invalid dates', () => {
      expect(getRelativeTimeString('invalid')).toBe('');
    });
  });

  describe('getDateRange', () => {
    it('should return array of dates between start and end', () => {
      const result = getDateRange('2024-01-10', '2024-01-15');
      expect(result).toHaveLength(6);
      expect(result[0]).toBeInstanceOf(Date);
    });

    it('should include both start and end dates', () => {
      const result = getDateRange('2024-01-10', '2024-01-12');
      expect(result).toHaveLength(3);
    });

    it('should return empty array for invalid dates', () => {
      expect(getDateRange('invalid', '2024-01-15')).toEqual([]);
    });

    it('should handle Date objects', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-12');
      const result = getDateRange(start, end);
      expect(result).toHaveLength(3);
    });
  });

  describe('getTodayISO', () => {
    it('should return today in ISO format', () => {
      const result = getTodayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('addDaysToDate', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-15');
      const result = addDaysToDate(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should handle string input', () => {
      const result = addDaysToDate('2024-01-15', 5);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-15');
      const result = addDaysToDate(date, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('subtractDaysFromDate', () => {
    it('should subtract days from date', () => {
      const date = new Date('2024-01-15');
      const result = subtractDaysFromDate(date, 5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle string input', () => {
      const result = subtractDaysFromDate('2024-01-15', 5);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-15');
      const result = subtractDaysFromDate(date, -5);
      expect(result.getDate()).toBe(20);
    });
  });
});
