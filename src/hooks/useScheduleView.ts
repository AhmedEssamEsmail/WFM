import { useState, useEffect } from 'react'

export type ScheduleView = 'weekly' | 'monthly'

const STORAGE_KEY = 'wfm_schedule_view_preference'
const DEFAULT_VIEW: ScheduleView = 'monthly'

/**
 * Custom hook to manage schedule view state with localStorage persistence
 * 
 * Requirements:
 * - 5.4: Persist the selected view preference in browser local storage
 * - 5.5: Restore the previously selected view from local storage
 * - 5.6: Default to "Monthly" view if no preference is stored
 */
export function useScheduleView() {
  const [view, setView] = useState<ScheduleView>(() => {
    // Initialize state from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'weekly' || stored === 'monthly') {
        return stored
      }
    } catch (error) {
      // Handle localStorage access failures gracefully
      console.warn('Failed to read schedule view preference from localStorage:', error)
    }
    return DEFAULT_VIEW
  })

  // Persist view changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view)
    } catch (error) {
      // Handle localStorage write failures gracefully (e.g., quota exceeded, disabled)
      console.warn('Failed to save schedule view preference to localStorage:', error)
    }
  }, [view])

  return {
    view,
    setView,
  }
}
