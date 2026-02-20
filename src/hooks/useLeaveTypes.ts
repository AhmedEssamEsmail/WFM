import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveTypesService } from '../services/leaveTypesService';
import type { LeaveTypeConfig } from '../types';
import { useToast } from '../contexts/ToastContext';
import { QUERY_KEYS, STALE_TIMES } from '../constants/cache';

export function useLeaveTypes() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  // Fetch all active leave types
  const {
    data: leaveTypes,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_TYPES],
    queryFn: () => leaveTypesService.getActiveLeaveTypes(),
    staleTime: STALE_TIMES.SETTINGS, // 5 minutes - rarely changes
  });

  // Fetch all leave types (including inactive) - for admin pages
  const { data: allLeaveTypes, isLoading: isLoadingAll } = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_TYPES, 'all'],
    queryFn: () => leaveTypesService.getAllLeaveTypes(),
    staleTime: STALE_TIMES.SETTINGS,
    enabled: false, // Only fetch when explicitly requested
  });

  // Create leave type mutation
  const createLeaveType = useMutation({
    mutationFn: (newLeaveType: Omit<LeaveTypeConfig, 'id' | 'created_at'>) =>
      leaveTypesService.createLeaveType(newLeaveType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
      success('Leave type created successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create leave type');
    },
  });

  // Update leave type mutation
  const updateLeaveType = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LeaveTypeConfig> }) =>
      leaveTypesService.updateLeaveType(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
      success('Leave type updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update leave type');
    },
  });

  // Deactivate leave type mutation
  const deactivateLeaveType = useMutation({
    mutationFn: (id: string) => leaveTypesService.deactivateLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
      success('Leave type deactivated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to deactivate leave type');
    },
  });

  return {
    leaveTypes: leaveTypes || [],
    allLeaveTypes: allLeaveTypes || [],
    isLoading,
    isLoadingAll,
    error,
    createLeaveType,
    updateLeaveType,
    deactivateLeaveType,
  };
}
