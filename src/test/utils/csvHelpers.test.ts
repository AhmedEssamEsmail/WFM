import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  arrayToCSV,
  isValidCSVFile,
  isValidFileSize,
} from '../../utils/csvHelpers'

describe('csvHelpers', () => {
  describe('parseCSV', () => {
    it('should parse CSV text to array of objects', () => {
      const csv = 'name,email\nJohn,john@example.com\nJane,jane@example.com'
      const result = parseCSV(csv)
      
      expect(result).toEqual([
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ])
    })

    it('should handle empty CSV', () => {
      const result = parseCSV('')
      expect(result).toEqual([])
    })

    it('should skip malformed rows', () => {
      const csv = 'name,email\nJohn,john@example.com\nInvalid\nJane,jane@example.com'
      const result = parseCSV(csv)
      
      expect(result).toHaveLength(2)
    })
  })

  describe('arrayToCSV', () => {
    it('should convert array of objects to CSV string', () => {
      const data = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ]
      const result = arrayToCSV(data)
      
      expect(result).toBe('name,email\nJohn,john@example.com\nJane,jane@example.com')
    })

    it('should handle empty array', () => {
      const result = arrayToCSV([])
      expect(result).toBe('')
    })

    it('should escape commas and quotes', () => {
      const data = [{ name: 'Doe, John', notes: 'Test "quote"' }]
      const result = arrayToCSV(data)
      
      expect(result).toContain('"Doe, John"')
      expect(result).toContain('"Test ""quote"""')
    })
  })

  describe('isValidCSVFile', () => {
    it('should validate CSV file by extension', () => {
      const file = new File([''], 'test.csv', { type: 'text/plain' })
      expect(isValidCSVFile(file)).toBe(true)
    })

    it('should validate CSV file by MIME type', () => {
      const file = new File([''], 'test.txt', { type: 'text/csv' })
      expect(isValidCSVFile(file)).toBe(true)
    })

    it('should reject non-CSV file', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      expect(isValidCSVFile(file)).toBe(false)
    })
  })

  describe('isValidFileSize', () => {
    it('should validate file size within limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.csv')
      expect(isValidFileSize(file)).toBe(true)
    })

    it('should reject file size exceeding limit', () => {
      const file = new File(['a'.repeat(6 * 1024 * 1024)], 'test.csv')
      expect(isValidFileSize(file)).toBe(false)
    })
  })
})
