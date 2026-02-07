// Performance optimization utilities

import { useEffect, useRef, useCallback } from 'react'

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for intersection observer (lazy loading, infinite scroll)
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, options])

  return isIntersecting
}

/**
 * Hook for measuring component render performance
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`)
    }
  })

  return renderCount.current
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Hook for async data with loading and error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setStatus('pending')
    setData(null)
    setError(null)

    try {
      const response = await asyncFunction()
      setData(response)
      setStatus('success')
      return response
    } catch (error) {
      setError(error as Error)
      setStatus('error')
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { execute, status, data, error, loading: status === 'pending' }
}

/**
 * Hook for local storage with sync across tabs
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        
        // Dispatch custom event for cross-tab sync
        window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value: valueToStore } }))
      } catch (error) {
        console.error('Error writing to localStorage:', error)
      }
    },
    [key, storedValue]
  )

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue))
      } else if ('detail' in e && e.detail.key === key) {
        setStoredValue(e.detail.value)
      }
    }

    window.addEventListener('storage', handleStorageChange as EventListener)
    window.addEventListener('local-storage', handleStorageChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener)
      window.removeEventListener('local-storage', handleStorageChange as EventListener)
    }
  }, [key])

  return [storedValue, setValue] as const
}

// Import useState for hooks
import { useState } from 'react'
