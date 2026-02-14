import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScheduleView } from '../../hooks/useScheduleView'

describe('useScheduleView Hook', () => {
  const STORAGE_KEY = 'wfm_schedule_view_preference'

  // Clean up localStorage before and after each test
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Default behavior', () => {
    it('should default to monthly view when no preference is stored', () => {
      const { result } = renderHook(() => useScheduleView())
      
      expect(result.current.view).toBe('monthly')
    })
  })

  describe('View state management', () => {
    it('should update view state when setView is called', () => {
      const { result } = renderHook(() => useScheduleView())
      
      act(() => {
        result.current.setView('weekly')
      })
      
      expect(result.current.view).toBe('weekly')
    })

    it('should switch between weekly and monthly views', () => {
      const { result } = renderHook(() => useScheduleView())
      
      // Start with default monthly
      expect(result.current.view).toBe('monthly')
      
      // Switch to weekly
      act(() => {
        result.current.setView('weekly')
      })
      expect(result.current.view).toBe('weekly')
      
      // Switch back to monthly
      act(() => {
        result.current.setView('monthly')
      })
      expect(result.current.view).toBe('monthly')
    })
  })

  describe('localStorage persistence', () => {
    it('should persist view preference to localStorage', () => {
      const { result } = renderHook(() => useScheduleView())
      
      act(() => {
        result.current.setView('weekly')
      })
      
      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).toBe('weekly')
    })

    it('should restore view preference from localStorage on mount', () => {
      // Set preference before mounting
      localStorage.setItem(STORAGE_KEY, 'weekly')
      
      const { result } = renderHook(() => useScheduleView())
      
      expect(result.current.view).toBe('weekly')
    })

    it('should restore monthly preference from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'monthly')
      
      const { result } = renderHook(() => useScheduleView())
      
      expect(result.current.view).toBe('monthly')
    })

    it('should persist changes across hook remounts', () => {
      // First mount - set to weekly
      const { unmount } = renderHook(() => useScheduleView())
      const { result: result1 } = renderHook(() => useScheduleView())
      
      act(() => {
        result1.current.setView('weekly')
      })
      
      unmount()
      
      // Second mount - should restore weekly
      const { result: result2 } = renderHook(() => useScheduleView())
      expect(result2.current.view).toBe('weekly')
    })
  })

  describe('Error handling', () => {
    it('should default to monthly when localStorage contains invalid value', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-view')
      
      const { result } = renderHook(() => useScheduleView())
      
      expect(result.current.view).toBe('monthly')
    })

    it('should handle localStorage read failures gracefully', () => {
      // Mock localStorage.getItem to throw an error
      const originalGetItem = localStorage.getItem
      localStorage.getItem = () => {
        throw new Error('localStorage disabled')
      }
      
      const { result } = renderHook(() => useScheduleView())
      
      // Should fall back to default
      expect(result.current.view).toBe('monthly')
      
      // Restore original
      localStorage.getItem = originalGetItem
    })

    it('should handle localStorage write failures gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('localStorage quota exceeded')
      }
      
      const { result } = renderHook(() => useScheduleView())
      
      // Should not throw error when setting view
      expect(() => {
        act(() => {
          result.current.setView('weekly')
        })
      }).not.toThrow()
      
      // State should still update even if persistence fails
      expect(result.current.view).toBe('weekly')
      
      // Restore original
      localStorage.setItem = originalSetItem
    })
  })
})
