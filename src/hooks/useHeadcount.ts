import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HeadcountUser, Department, HeadcountMetrics } from '../types'

export function useHeadcount() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all employees with full details
  const getEmployees = useCallback(async (filters?: {
    department?: string
    status?: string
    role?: string
    search?: string
  }): Promise<HeadcountUser[]> => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('v_headcount_active')
        .select('*')
        .order('name')

      if (filters?.department) {
        query = query.eq('department', filters.department)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.role) {
        query = query.eq('role', filters.role)
      }
      if (filters?.search) {
        // Use ilike for search
        const searchTerm = `%${filters.search}%`
        query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},employee_id.ilike.${searchTerm}`)
      }

      const { data, error: supabaseError } = await query
      
      if (supabaseError) throw supabaseError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch single employee
  const getEmployee = useCallback(async (id: string): Promise<HeadcountUser | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('v_headcount_active')
        .select('*')
        .eq('id', id)
        .single()
      
      if (supabaseError) throw supabaseError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update employee (WFM only)
  const updateEmployee = useCallback(async (id: string, updates: Partial<HeadcountUser>) => {
    setLoading(true)
    setError(null)
    
    try {
      // Split updates between users and headcount_profiles tables
      const userUpdates: any = {}
      const profileUpdates: any = {}
      
      // Users table fields
      const userFields = ['employee_id', 'status', 'department', 'hire_date', 'manager_id', 'fte_percentage']
      // Profile fields
      const profileFields = ['job_title', 'job_level', 'employment_type', 'location', 'time_zone', 'phone', 'skills', 'certifications', 'max_weekly_hours', 'cost_center', 'budget_code']
      
      Object.entries(updates).forEach(([key, value]) => {
        if (userFields.includes(key)) {
          userUpdates[key] = value
        } else if (profileFields.includes(key)) {
          profileUpdates[key] = value
        }
      })

      // Update users table
      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', id)
        
        if (userError) throw userError
      }

      // Update headcount_profiles table
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('headcount_profiles')
          .update(profileUpdates)
          .eq('user_id', id)
        
        if (profileError) throw profileError
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get departments list
  const getDepartments = useCallback(async (): Promise<Department[]> => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      return data || []
    } catch (err) {
      return []
    }
  }, [])

  // Get headcount metrics
  const getMetrics = useCallback(async (): Promise<HeadcountMetrics | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_headcount_metrics')
      
      if (error) throw error
      
      // Transform array to object
      const metrics: any = {}
      data?.forEach((row: any) => {
        metrics[row.metric_name] = parseInt(row.metric_value)
      })
      
      return metrics as HeadcountMetrics
    } catch (err) {
      return null
    }
  }, [])

  // Get department summary
  const getDepartmentSummary = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_department_summary')
        .select('*')
        .order('department')
      
      if (error) throw error
      return data || []
    } catch (err) {
      return []
    }
  }, [])

  return {
    loading,
    error,
    getEmployees,
    getEmployee,
    updateEmployee,
    getDepartments,
    getMetrics,
    getDepartmentSummary,
  }
                          }
