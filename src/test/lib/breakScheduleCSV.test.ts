import { describe, it, expect } from 'vitest';
import { parseCSV, validateCSVFormat } from '../../lib/breakScheduleCSV';
import type { BreakScheduleCSVRow } from '../../types';

describe('breakScheduleCSV', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV content', () => {
      const csvContent = `Agent Name,Date,Shift,HB1 Start,B Start,HB2 Start
"John Doe","2024-01-15","AM","10:00","12:00","14:00"
"Jane Smith","2024-01-15","PM","14:00","16:00","18:00"`;

      const result = parseCSV(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0].agent_name).toBe('John Doe');
      expect(result[0].shift).toBe('AM');
      expect(result[0].hb1_start).toBe('10:00');
    });

    it('should handle empty break times', () => {
      const csvContent = `Agent Name,Date,Shift,HB1 Start,B Start,HB2 Start
"John Doe","2024-01-15","AM","10:00","",""`;

      const result = parseCSV(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].hb1_start).toBe('10:00');
      expect(result[0].b_start).toBe(null);
      expect(result[0].hb2_start).toBe(null);
    });

    it('should throw error for empty CSV', () => {
      const csvContent = '';

      expect(() => parseCSV(csvContent)).toThrow('CSV file is empty');
    });

    it('should skip invalid rows', () => {
      const csvContent = `Agent Name,Date,Shift,HB1 Start,B Start,HB2 Start
"John Doe","2024-01-15","AM","10:00","12:00","14:00"
"Invalid"
"Jane Smith","2024-01-15","PM","14:00","16:00","18:00"`;

      const result = parseCSV(csvContent);

      expect(result).toHaveLength(2);
    });
  });

  describe('validateCSVFormat', () => {
    it('should validate correct CSV format', async () => {
      const rows: BreakScheduleCSVRow[] = [
        {
          agent_name: 'John Doe',
          date: '2024-01-15',
          shift: 'AM',
          hb1_start: '10:00',
          b_start: '12:00',
          hb2_start: '14:00',
        },
      ];

      const result = await validateCSVFormat(rows);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty rows', async () => {
      const rows: BreakScheduleCSVRow[] = [];

      const result = await validateCSVFormat(rows);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No data rows found in CSV');
    });

    it('should reject invalid date format', async () => {
      const rows: BreakScheduleCSVRow[] = [
        {
          agent_name: 'John Doe',
          date: '01/15/2024', // Wrong format
          shift: 'AM',
          hb1_start: '10:00',
          b_start: null,
          hb2_start: null,
        },
      ];

      const result = await validateCSVFormat(rows);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Date must be in YYYY-MM-DD format'))).toBe(true);
    });

    it('should reject invalid shift type', async () => {
      const rows: BreakScheduleCSVRow[] = [
        {
          agent_name: 'John Doe',
          date: '2024-01-15',
          shift: 'INVALID' as any,
          hb1_start: '10:00',
          b_start: null,
          hb2_start: null,
        },
      ];

      const result = await validateCSVFormat(rows);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Shift must be one of'))).toBe(true);
    });

    it('should reject invalid time format', async () => {
      const rows: BreakScheduleCSVRow[] = [
        {
          agent_name: 'John Doe',
          date: '2024-01-15',
          shift: 'AM',
          hb1_start: '10:00:00', // Should be HH:MM
          b_start: null,
          hb2_start: null,
        },
      ];

      const result = await validateCSVFormat(rows);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be in HH:MM format'))).toBe(true);
    });

    it('should require agent name', async () => {
      const rows: BreakScheduleCSVRow[] = [
        {
          agent_name: '',
          date: '2024-01-15',
          shift: 'AM',
          hb1_start: null,
          b_start: null,
          hb2_start: null,
        },
      ];

      const result = await validateCSVFormat(rows);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Agent name is required'))).toBe(true);
    });
  });
});
