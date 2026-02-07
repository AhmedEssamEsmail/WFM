import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SwapRequest } from '../types'
import { useToast } from '../lib/ToastContext'

export function useSwapRequests() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  // Fetch all swap requests
  const { data: swapRequests, isLoading, error } = useQuery({
    queryKey: ['swapRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swap_requests')
        .select(`
          *,
          requester:users!swap_requests_requester_id_fkey(id, name, email),
          target:users!swap_requests_target_user_id_fkey(id, name, email),
          requester_shift:shifts!swap_requests_requester_shift_id_fkey(*),
          target_shift:shifts!swap_requests_target_shift_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  // Fetch single swap request
  const useSwapRequest = (id: string) => {
    return useQuery({
      queryKey: ['swapRequest', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('swap_requests')
          .select(`
            *,
            requester:users!swap_requests_requester_id_fkey(id, name, email),
            target:users!swap_requests_target_user_id_fkey(id, name, email),
            requester_shift:shifts!swap_requests_requester_shift_id_fkey(*),
            target_shift:shifts!swap_requests_target_shift_id_fkey(*)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      },
      enabled: !!id,
    })
  }

  // Create swap request mutation
  const createSwapRequest = useMutation({
    mutationFn: async (newRequest: Partial<SwapRequest>) => {
      const { data, error } = await supabase
        .from('swap_requests')
        .insert(newRequest)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
      success('Swap request created successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create swap request')
    },
  })

  // Update swap request mutation
  const updateSwapRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SwapRequest> }) => {
      const { data, error } = await supabase
        .from('swap_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
      queryClient.invalidateQueries({ queryKey: ['swapRequest', variables.id] })
      success('Swap request updated successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update swap request')
    },
  })

  // Delete swap request mutation
  const deleteSwapRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('swap_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
      success('Swap request deleted successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete swap request')
    },
  })

  return {
    swapRequests,
    isLoading,
    error,
    useSwapRequest,
    createSwapRequest,
    updateSwapRequest,
    deleteSwapRequest,
  }
}
