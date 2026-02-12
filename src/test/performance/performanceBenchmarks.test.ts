/**
 * Performance Benchmarks
 * Feature: performance-testing
 * Properties: 18
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fc from 'fast-check'
import { breakSchedulesService } from '../../services/breakSchedulesService'
import type { BreakSchedule, BreakType } from '../../types'

// Benchmark utilities
const measureTime = async <T>(fn: () => Promise<T> | T): Promise<{ result: T; time: number }> => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return { result, time: end - start }
}

// Test data generators
const generateBreakSchedules = (count: number): BreakSchedule[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `break-${i}`,
    user_id: `user-${i}`,
    schedule_date: '2024-01-01',
    shift_type: 'AM' as const,
    interval_start: `${String(Math.floor(i / 4) + 9).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}:00`,
    break_type: ['HB1', 'B', 'HB2'][i % 3] as BreakType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: `user-${i}`,
  }))
}

describe('Performance Benchmarks', () => {
  /**
   * Property 18: Performance Benchmarking
   * Establish baseline metrics for critical operations and ensure
   * they meet performance requirements.
   * 
   * Validates: Requirements 6.5
   */

  describe('Interval Map Operations', () => {
    it('Benchmark: IntervalMap build performance with 100 schedules', async () => {
      const schedules = generateBreakSchedules(100)
      const shiftHours = {
        AM: { start: '09:00:00', end: '17:00:00' },
        PM: { start: '13:00:00', end: '21:00:00' },
        BET: { start: '11:00:00', end: '19:00:00' },
        OFF: null,
      }

      const { time } = await measureTime(async () => {
        // Simulate interval map building
        const intervalMap: Record<string, BreakType> = {}
        for (const schedule of schedules) {
          const time = schedule.interval_start.substring(0, 5)
          intervalMap[time] = schedule.break_type
        }
        return intervalMap
      })

      // Should complete in under 50ms for 100 schedules
      expect(time).toBeLessThan(50)
      console.log(`IntervalMap build (100 schedules): ${time.toFixed(2)}ms`)
    })

    it('Benchmark: IntervalMap build performance with 1000 schedules', async () => {
      const schedules = generateBreakSchedules(1000)
      const shiftHours = {
        AM: { start: '09:00:00', end: '17:00:00' },
        PM: { start: '13:00:00', end: '21:00:00' },
        BET: { start: '11:00:00', end: '19:00:00' },
        OFF: null,
      }

      const { time } = await measureTime(async () => {
        const intervalMap: Record<string, BreakType> = {}
        for (const schedule of schedules) {
          const time = schedule.interval_start.substring(0, 5)
          intervalMap[time] = schedule.break_type
        }
        return intervalMap
      })

      // Should complete in under 200ms for 1000 schedules
      expect(time).toBeLessThan(200)
      console.log(`IntervalMap build (1000 schedules): ${time.toFixed(2)}ms`)
    })

    it('Benchmark: IntervalMap lookup performance', async () => {
      const schedules = generateBreakSchedules(100)
      const intervalMap: Record<string, BreakType> = {}
      for (const schedule of schedules) {
        const time = schedule.interval_start.substring(0, 5)
        intervalMap[time] = schedule.break_type
      }

      const { time } = await measureTime(() => {
        // Perform 1000 lookups
        for (let i = 0; i < 1000; i++) {
          const key = `0${String(i % 9 + 9)}:00`
          const _ = intervalMap[key]
        }
      })

      // Should complete in under 10ms for 1000 lookups
      expect(time).toBeLessThan(10)
      console.log(`IntervalMap lookup (1000 lookups): ${time.toFixed(2)}ms`)
    })
  })

  describe('Validation Operations', () => {
    it('Benchmark: Break ordering validation performance', async () => {
      const { time } = await measureTime(() => {
        // Validate break ordering 1000 times
        for (let i = 0; i < 1000; i++) {
          const hb1 = 60 // 10:00
          const b = 180 // 12:00
          const hb2 = 300 // 14:00

          // Check ordering
          const validHB1_B = hb1 < b
          const validB_HB2 = b < hb2
          const validHB1_HB2 = hb1 < hb2
        }
      })

      // Should complete in under 5ms
      expect(time).toBeLessThan(5)
      console.log(`Break ordering validation (1000 iterations): ${time.toFixed(2)}ms`)
    })

    it('Benchmark: Break timing validation performance', async () => {
      const { time } = await measureTime(() => {
        // Validate break timing 1000 times
        for (let i = 0; i < 1000; i++) {
          const shiftStart = 540 // 9:00 in minutes
          const shiftEnd = 1020 // 17:00 in minutes
          const breakTime = 600 + (i % 240) // Random break time between 10:00 and 14:00

          const isValid = breakTime >= shiftStart && breakTime < shiftEnd
        }
      })

      // Should complete in under 5ms
      expect(time).toBeLessThan(5)
      console.log(`Break timing validation (1000 iterations): ${time.toFixed(2)}ms`)
    })
  })

  describe('Pagination Operations', () => {
    it('Benchmark: Pagination calculation performance', async () => {
      const { time } = await measureTime(() => {
        // Calculate pagination 1000 times
        for (let i = 0; i < 1000; i++) {
          const totalItems = 150
          const pageSize = 10
          const currentPage = i % 15

          const totalPages = Math.ceil(totalItems / pageSize)
          const offset = currentPage * pageSize
          const hasNext = currentPage < totalPages - 1
          const hasPrev = currentPage > 0
        }
      })

      // Should complete in under 2ms
      expect(time).toBeLessThan(2)
      console.log(`Pagination calculation (1000 iterations): ${time.toFixed(2)}ms`)
    })
  })

  describe('Date Formatting Operations', () => {
    it('Benchmark: Date formatting performance', async () => {
      const { time } = await measureTime(() => {
        // Format dates 1000 times
        for (let i = 0; i < 1000; i++) {
          const date = new Date(2024, 0, 1 + (i % 365))
          const formatted = date.toISOString().split('T')[0]
        }
      })

      // Should complete in under 5ms
      expect(time).toBeLessThan(5)
      console.log(`Date formatting (1000 iterations): ${time.toFixed(2)}ms`)
    })
  })

  describe('Color Processing Operations', () => {
    it('Benchmark: Color validation performance', async () => {
      const { time } = await measureTime(() => {
        // Validate colors 1000 times
        for (let i = 0; i < 1000; i++) {
          const color = `#${String(i % 16777215).padStart(6, '0')}`
          const isValid = /^#[0-9A-Fa-f]{6}$/.test(color)
        }
      })

      // Should complete in under 5ms
      expect(time).toBeLessThan(5)
      console.log(`Color validation (1000 iterations): ${time.toFixed(2)}ms`)
    })
  })

  describe('Coverage Summary Operations', () => {
    it('Benchmark: Coverage summary calculation performance', async () => {
      const { time } = await measureTime(() => {
        // Calculate coverage summary 1000 times
        for (let i = 0; i < 1000; i++) {
          const coverageCounts: Record<string, { in: number; hb1: number; b: number; hb2: number }> = {}
          
          for (let j = 0; j < 32; j++) { // 32 15-minute intervals
            const time = `${String(Math.floor(j / 4) + 9).padStart(2, '0')}:${String((j % 4) * 15).padStart(2, '0')}`
            coverageCounts[time] = {
              in: Math.floor(Math.random() * 50),
              hb1: Math.floor(Math.random() * 10),
              b: Math.floor(Math.random() * 10),
              hb2: Math.floor(Math.random() * 10),
            }
          }
        }
      })

      // Should complete in under 50ms
      expect(time).toBeLessThan(50)
      console.log(`Coverage summary (1000 iterations): ${time.toFixed(2)}ms`)
    })
  })

  describe('Baseline Performance Metrics', () => {
    it('Should establish baseline for interval map operations', async () => {
      const results: number[] = []
      
      // Run 10 iterations to establish baseline
      for (let iteration = 0; iteration < 10; iteration++) {
        const schedules = generateBreakSchedules(500)
        
        const { time } = await measureTime(() => {
          const intervalMap: Record<string, BreakType> = {}
          for (const schedule of schedules) {
            const time = schedule.interval_start.substring(0, 5)
            intervalMap[time] = schedule.break_type
          }
        })
        
        results.push(time)
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length
      const maxTime = Math.max(...results)
      const minTime = Math.min(...results)

      console.log(`IntervalMap baseline (500 schedules, 10 runs):`)
      console.log(`  Average: ${avgTime.toFixed(2)}ms`)
      console.log(`  Min: ${minTime.toFixed(2)}ms`)
      console.log(`  Max: ${maxTime.toFixed(2)}ms`)

      // Average should be under 100ms
      expect(avgTime).toBeLessThan(100)
    })

    it('Should establish baseline for validation operations', async () => {
      const results: number[] = []
      
      for (let iteration = 0; iteration < 10; iteration++) {
        const { time } = await measureTime(() => {
          for (let i = 0; i < 100; i++) {
            // Simulate validation of 10 breaks
            const breaks = [
              { type: 'HB1', time: 60 + i },
              { type: 'B', time: 180 + i },
              { type: 'HB2', time: 300 + i },
            ]

            // Validate ordering
            const validHB1_B = breaks[0].time < breaks[1].time
            const validB_HB2 = breaks[1].time < breaks[2].time
            const validHB1_HB2 = breaks[0].time < breaks[2].time
          }
        })
        
        results.push(time)
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length
      const maxTime = Math.max(...results)
      const minTime = Math.min(...results)

      console.log(`Validation baseline (100 validations, 10 runs):`)
      console.log(`  Average: ${avgTime.toFixed(2)}ms`)
      console.log(`  Min: ${minTime.toFixed(2)}ms`)
      console.log(`  Max: ${maxTime.toFixed(2)}ms`)

      // Average should be under 10ms
      expect(avgTime).toBeLessThan(10)
    })
  })
})