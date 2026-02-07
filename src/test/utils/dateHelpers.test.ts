import { describe, it, expect } from 'vitest'
import { format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns'

describe('Date Helper Functions', () => {
  describe('format', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(format(date, 'yyyy-MM-dd')).toBe('2024-01-15')
    })

    it('should format date with time', () => {
      const date = new Date('2024-01-15T10:30:00')
      expect(format(date, 'yyyy-MM-dd HH:mm')).toBe('2024-01-15 10:30')
    })
  })

  describe('parseISO', () => {
    it('should parse ISO date string', () => {
      const dateString = '2024-01-15'
      const parsed = parseISO(dateString)
      expect(parsed).toBeInstanceOf(Date)
      expect(format(parsed, 'yyyy-MM-dd')).toBe('2024-01-15')
    })
  })

  describe('date comparisons', () => {
    it('should correctly compare dates with isAfter', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-10')
      expect(isAfter(date1, date2)).toBe(true)
      expect(isAfter(date2, date1)).toBe(false)
    })

    it('should correctly compare dates with isBefore', () => {
      const date1 = new Date('2024-01-10')
      const date2 = new Date('2024-01-15')
      expect(isBefore(date1, date2)).toBe(true)
      expect(isBefore(date2, date1)).toBe(false)
    })
  })

  describe('differenceInDays', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-10')
      expect(differenceInDays(date1, date2)).toBe(5)
    })

    it('should handle negative differences', () => {
      const date1 = new Date('2024-01-10')
      const date2 = new Date('2024-01-15')
      expect(differenceInDays(date1, date2)).toBe(-5)
    })
  })
})
