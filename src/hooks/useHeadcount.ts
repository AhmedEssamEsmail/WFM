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
    // DEBUG: Check current auth status
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔍 Current session:', {
      userId: session?.user?.id,
      email: session?.user?.email,
      hasSession: !!session
    })

    // DEBUG: Check if we can read from users table
    const { data: currentUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', session?.user?.id)
      .single()
    
    console.log('🔍 Current user from DB:', currentUser)
    console.log('🔍 User check error:', userCheckError)
    
    // Split updates between users and headcount_profiles tables
    const userUpdates: any = {}
    const profileUpdates: any = {}
    
    // Users table fields
    const userFields = ['employee_id', 'status', 'department', 'hire_date', 'manager_id', 'fte_percentage', 'role']
    // Profile fields
    const profileFields = ['job_title', 'job_level', 'employment_type', 'location', 'time_zone', 'phone', 'skills', 'certifications', 'max_weekly_hours', 'cost_center', 'budget_code']
    
    Object.entries(updates).forEach(([key, value]) => {
      if (userFields.includes(key)) {
        userUpdates[key] = value
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = value
      }
    })

    console.log('🔍 Attempting to update:', { userUpdates, profileUpdates })

    // Update users table
    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', id)
      
      console.log('🔍 Users table update error:', userError)
      if (userError) throw userError
    }

    // Update headcount_profiles table
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('headcount_profiles')
        .update(profileUpdates)
        .eq('user_id', id)
      
      console.log('🔍 Profile update error:', profileError)
      if (profileError) throw profileError
    }

    return true
  } catch (err) {
    console.error('🔍 Update failed:', err)
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
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HeadcountUser, Department, HeadcountMetrics } from '../types'

export function useHeadcount() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ... (keep all your existing functions)

  // Bulk import employees from CSV
  const bulkImportEmployees = useCallback(async (employees: Partial<HeadcountUser>[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as { row: number; email: string; error: string }[]
      }

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i]
        
        try {
          // Validate required fields
          if (!emp.email || !emp.name) {
            results.failed++
            results.errors.push({
              row: i + 2, // +2 because row 1 is header and array is 0-indexed
              email: emp.email || 'unknown',
              error: 'Missing required fields (email or name)'
            })
            continue
          }

          // Check if user exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', emp.email)
            .single()

          if (existingUser) {
            // Update existing user
            const userUpdates: any = {}
            const profileUpdates: any = {}
            
            const userFields = ['employee_id', 'status', 'department', 'hire_date', 'manager_id', 'fte_percentage', 'role', 'name']
            const profileFields = ['job_title', 'job_level', 'employment_type', 'location', 'time_zone', 'phone', 'max_weekly_hours', 'cost_center', 'budget_code']
            
            Object.entries(emp).forEach(([key, value]) => {
              if (value !== undefined && value !== '') {
                if (userFields.includes(key)) {
                  userUpdates[key] = value
                } else if (profileFields.includes(key)) {
                  profileUpdates[key] = value
                }
              }
            })

            if (Object.keys(userUpdates).length > 0) {
              const { error: userError } = await supabase
                .from('users')
                .update(userUpdates)
                .eq('id', existingUser.id)
              
              if (userError) throw userError
            }

            if (Object.keys(profileUpdates).length > 0) {
              const { error: profileError } = await supabase
                .from('headcount_profiles')
                .upsert({
                  user_id: existingUser.id,
                  ...profileUpdates
                }, {
                  onConflict: 'user_id'
                })
              
              if (profileError) throw profileError
            }
          } else {
            // Create new user - Note: This requires the user to exist in auth.users first
            // You might need to adjust this based on your user creation workflow
            results.failed++
            results.errors.push({
              row: i + 2,
              email: emp.email,
              error: 'User does not exist in auth system. Please create user account first.'
            })
            continue
          }

          results.success++
        } catch (err) {
          results.failed++
          results.errors.push({
            row: i + 2,
            email: emp.email || 'unknown',
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      return results
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import employees')
      return {
        success: 0,
        failed: employees.length,
        errors: [{ row: 0, email: 'all', error: err instanceof Error ? err.message : 'Unknown error' }]
      }
    } finally {
      setLoading(false)
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
    bulkImportEmployees, // Add this
  }
          }
