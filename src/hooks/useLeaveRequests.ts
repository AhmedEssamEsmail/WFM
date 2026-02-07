import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { LeaveRequest } from '../types'
import { useToast } from '../lib/ToastContext'

export function useLeaveRequests() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  // Fetch all leave requests
  const { data: leaveRequests, isLoading, error } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          user:users(id, name, email, role)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  // Fetch single leave request
  const useLeaveRequest = (id: string) => {
    return useQuery({
      queryKey: ['leaveRequest', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            *,
            user:users(id, name, email, role)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      },
      enabled: !!id,
    })
  }

  // Create leave request mutation
  const createLeaveRequest = useMutation({
    mutationFn: async (newRequest: Partial<LeaveRequest>) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(newRequest)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      success('Leave request created successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create leave request')
    },
  })

  // Update leave request mutation
  const updateLeaveRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LeaveRequest> }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      queryClient.invalidateQueries({ queryKey: ['leaveRequest', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      success('Leave request updated successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update leave request')
    },
  })

  // Delete leave request mutation
  const deleteLeaveRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      success('Leave request deleted successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete leave request')
    },
  })

  return {
    leaveRequests,
    isLoading,
    error,
    useLeaveRequest,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
  }
}
