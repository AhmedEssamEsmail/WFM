import { describe, it, expect, vi } from 'vitest';
import {
  parseCSV,
  arrayToCSV,
  isValidCSVFile,
  isValidFileSize,
  readFileAsText,
  validateAndParseCSV,
  downloadCSV,
} from '../../utils/csvHelpers';

describe('csvHelpers', () => {
  describe('parseCSV', () => {
    it('should parse CSV text to array of objects', () => {
      const csv = 'name,email\nJohn,john@example.com\nJane,jane@example.com';
      const result = parseCSV(csv);

      expect(result).toEqual([
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ]);
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      expect(result).toEqual([]);
    });

    it('should skip malformed rows', () => {
      const csv = 'name,email\nJohn,john@example.com\nInvalid\nJane,jane@example.com';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'name,address\n"Smith, John","123 Main St, Apt 4"';
      const result = parseCSV(csv);

      expect(result).toEqual([{ name: 'Smith, John', address: '123 Main St, Apt 4' }]);
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,notes\nJohn,"He said ""hello"""';
      const result = parseCSV(csv);

      expect(result).toEqual([{ name: 'John', notes: 'He said "hello"' }]);
    });

    it('should trim whitespace from fields', () => {
      const csv = 'name,email\n  John  ,  john@example.com  ';
      const result = parseCSV(csv);

      expect(result).toEqual([{ name: 'John', email: 'john@example.com' }]);
    });

    it('should handle single row', () => {
      const csv = 'name,email\nJohn,john@example.com';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
    });
  });

  describe('arrayToCSV', () => {
    it('should convert array of objects to CSV string', () => {
      const data = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ];
      const result = arrayToCSV(data);

      expect(result).toBe('name,email\nJohn,john@example.com\nJane,jane@example.com');
    });

    it('should handle empty array', () => {
      const result = arrayToCSV([]);
      expect(result).toBe('');
    });

    it('should escape commas and quotes', () => {
      const data = [{ name: 'Doe, John', notes: 'Test "quote"' }];
      const result = arrayToCSV(data);

      expect(result).toContain('"Doe, John"');
      expect(result).toContain('"Test ""quote"""');
    });

    it('should handle null and undefined values', () => {
      const data = [{ name: 'John', email: null, phone: undefined }];
      const result = arrayToCSV(data);

      expect(result).toContain('John,,');
    });

    it('should handle numeric values', () => {
      const data = [{ name: 'John', age: 30, score: 95.5 }];
      const result = arrayToCSV(data);

      expect(result).toContain('30');
      expect(result).toContain('95.5');
    });

    it('should handle boolean values', () => {
      const data = [{ name: 'John', active: true, verified: false }];
      const result = arrayToCSV(data);

      expect(result).toContain('true');
      expect(result).toContain('false');
    });
  });

  describe('isValidCSVFile', () => {
    it('should validate CSV file by extension', () => {
      const file = new File([''], 'test.csv', { type: 'text/plain' });
      expect(isValidCSVFile(file)).toBe(true);
    });

    it('should validate CSV file by MIME type', () => {
      const file = new File([''], 'test.txt', { type: 'text/csv' });
      expect(isValidCSVFile(file)).toBe(true);
    });

    it('should reject non-CSV file', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isValidCSVFile(file)).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file size within limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.csv');
      expect(isValidFileSize(file)).toBe(true);
    });

    it('should reject file size exceeding limit', () => {
      const file = new File(['a'.repeat(6 * 1024 * 1024)], 'test.csv');
      expect(isValidFileSize(file)).toBe(false);
    });
  });

  describe('readFileAsText', () => {
    it('should read file as text', async () => {
      const content = 'name,email\nJohn,john@example.com';
      const file = new File([content], 'test.csv', { type: 'text/csv' });

      const result = await readFileAsText(file);
      expect(result).toBe(content);
    });

    it('should handle empty file', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });

      const result = await readFileAsText(file);
      expect(result).toBe('');
    });
  });

  describe('validateAndParseCSV', () => {
    it('should validate and parse valid CSV file', async () => {
      const content = 'name,email\nJohn,john@example.com';
      const file = new File([content], 'test.csv', { type: 'text/csv' });

      const result = await validateAndParseCSV(file);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual({ name: 'John', email: 'john@example.com' });
      }
    });

    it('should reject invalid file type', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const result = await validateAndParseCSV(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid file type');
      }
    });

    it('should reject file exceeding size limit', async () => {
      const content = 'a'.repeat(6 * 1024 * 1024);
      const file = new File([content], 'test.csv', { type: 'text/csv' });

      const result = await validateAndParseCSV(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('size exceeds');
      }
    });

    it('should reject empty CSV file', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });

      const result = await validateAndParseCSV(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    it('should reject CSV with only headers', async () => {
      const file = new File(['name,email'], 'test.csv', { type: 'text/csv' });

      const result = await validateAndParseCSV(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });
  });

  describe('downloadCSV', () => {
    it('should create download link and trigger download', () => {
      // Create a real anchor element for the test
      const mockLink = document.createElement('a');
      const clickSpy = vi.spyOn(mockLink, 'click');
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink);
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const csvContent = 'name,email\nJohn,john@example.com';
      downloadCSV('test.csv', csvContent);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.getAttribute('href')).toBe('blob:mock-url');
      expect(mockLink.getAttribute('download')).toBe('test.csv');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      clickSpy.mockRestore();
    });
  });
});
