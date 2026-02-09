import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatPhoneNumber,
  formatFileSize,
  truncateText,
  capitalizeWords,
  snakeToTitleCase,
  camelToTitleCase,
  formatList,
  getInitials,
  emailToDisplayName,
  pluralize,
  formatCount,
  formatDuration,
  formatBoolean,
} from '../../utils/formatters'

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format number as USD currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatNumber', () => {
    it('should format number with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(1234.567, 2)).toBe('1,234.57')
    })
  })

  describe('formatPercentage', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercentage(0.75)).toBe('75%')
      expect(formatPercentage(0.333, 1)).toBe('33.3%')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit US phone number', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    })

    it('should format 11-digit phone number with country code', () => {
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890')
    })

    it('should return original if format does not match', () => {
      expect(formatPhoneNumber('123')).toBe('123')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes to human-readable size', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
    })
  })

  describe('truncateText', () => {
    it('should truncate text with ellipsis', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...')
      expect(truncateText('Hi', 10)).toBe('Hi')
    })
  })

  describe('capitalizeWords', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World')
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World')
    })
  })

  describe('snakeToTitleCase', () => {
    it('should convert snake_case to Title Case', () => {
      expect(snakeToTitleCase('hello_world')).toBe('Hello World')
      expect(snakeToTitleCase('user_name')).toBe('User Name')
    })
  })

  describe('camelToTitleCase', () => {
    it('should convert camelCase to Title Case', () => {
      expect(camelToTitleCase('helloWorld')).toBe('Hello World')
      expect(camelToTitleCase('userName')).toBe('User Name')
    })
  })

  describe('formatList', () => {
    it('should format array as comma-separated list', () => {
      expect(formatList(['apple'])).toBe('apple')
      expect(formatList(['apple', 'banana'])).toBe('apple and banana')
      expect(formatList(['apple', 'banana', 'cherry'])).toBe('apple, banana, and cherry')
      expect(formatList([])).toBe('')
    })
  })

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
    })
  })

  describe('emailToDisplayName', () => {
    it('should convert email to display name', () => {
      expect(emailToDisplayName('john.doe@example.com')).toBe('John Doe')
      expect(emailToDisplayName('jane_smith@example.com')).toBe('Jane Smith')
    })
  })

  describe('pluralize', () => {
    it('should pluralize word based on count', () => {
      expect(pluralize(1, 'item')).toBe('item')
      expect(pluralize(2, 'item')).toBe('items')
      expect(pluralize(0, 'item')).toBe('items')
      expect(pluralize(2, 'person', 'people')).toBe('people')
    })
  })

  describe('formatCount', () => {
    it('should format count with pluralized word', () => {
      expect(formatCount(1, 'item')).toBe('1 item')
      expect(formatCount(5, 'item')).toBe('5 items')
    })
  })

  describe('formatDuration', () => {
    it('should format duration in minutes', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(90)).toBe('1h 30m')
    })
  })

  describe('formatBoolean', () => {
    it('should format boolean to Yes/No', () => {
      expect(formatBoolean(true)).toBe('Yes')
      expect(formatBoolean(false)).toBe('No')
    })
  })
})
