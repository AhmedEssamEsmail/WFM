import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache';
import { shiftsService, leaveRequestsService } from '../services';
import { formatDateISO } from '../utils';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { User, Shift, LeaveRequest } from '../types';

interface ShiftWithSwap extends Shift {
  swapped_with_user_id?: string | null;
  original_user_id?: string | null;
  swapped_user?: User | null;
}

interface UseScheduleOptions {
  currentDate: Date;
  userRole: 'agent' | 'tl' | 'wfm';
}

export function useSchedule({ currentDate, userRole }: UseScheduleOptions) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const startDate = formatDateISO(startOfMonth(currentDate));
  const endDate = formatDateISO(endOfMonth(currentDate));

  // Fetch users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, userRole],
    queryFn: async () => {
      let usersQuery = supabase.from('v_headcount_active').select('*');

      if (userRole === 'agent') {
        usersQuery = usersQuery.eq('role', 'agent');
      }

      const { data, error } = await usersQuery.order('name');
      if (error) throw error;
      return data as User[];
    },
    staleTime: STALE_TIMES.EMPLOYEES,
  });

  // Fetch shifts
  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: [QUERY_KEYS.SHIFTS, startDate, endDate, userRole],
    queryFn: async () => {
      let shiftsQuery = supabase
        .from('shifts')
        .select('*, users!inner(role)')
        .gte('date', startDate)
        .lte('date', endDate);

      if (userRole === 'agent') {
        shiftsQuery = shiftsQuery.eq('users.role', 'agent');
      }

      const { data, error } = await shiftsQuery;
      if (error) throw error;
      return data as ShiftWithSwap[];
    },
    staleTime: STALE_TIMES.SHIFTS,
  });

  // Fetch approved leaves
  const { data: approvedLeaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, 'approved', startDate, endDate, userRole],
    queryFn: async () => {
      let leavesQuery = supabase
        .from('leave_requests')
        .select('*, users!inner(role)')
        .eq('status', 'approved')
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      if (userRole === 'agent') {
        leavesQuery = leavesQuery.eq('users.role', 'agent');
      }

      const { data, error } = await leavesQuery;
      if (error) throw error;
      return data as LeaveRequest[];
    },
    staleTime: STALE_TIMES.LEAVE_REQUESTS,
  });

  // Fetch swapped user names
  const { data: swappedUserNames = {} } = useQuery({
    queryKey: ['swappedUserNames', shifts],
    queryFn: async () => {
      const swappedUserIds = shifts
        .filter((s) => s.swapped_with_user_id)
        .map((s) => s.swapped_with_user_id)
        .filter((id, index, self) => id && self.indexOf(id) === index);

      if (swappedUserIds.length === 0) return {};

      const { data } = await supabase.from('users').select('id, name').in('id', swappedUserIds);

      const namesMap: Record<string, string> = {};
      data?.forEach((u) => {
        namesMap[u.id] = u.name;
      });
      return namesMap;
    },
    enabled: shifts.length > 0,
    staleTime: STALE_TIMES.EMPLOYEES,
  });

  // Create shift mutation
  const createShift = useMutation({
    mutationFn: (shift: Omit<Shift, 'id' | 'created_at'>) => shiftsService.createShift(shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFTS] });
      success('Shift created successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create shift');
    },
  });

  // Update shift mutation
  const updateShift = useMutation({
    mutationFn: ({ shiftId, updates }: { shiftId: string; updates: Partial<Shift> }) =>
      shiftsService.updateShift(shiftId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFTS] });
      success('Shift updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update shift');
    },
  });

  // Delete shift mutation
  const deleteShift = useMutation({
    mutationFn: (shiftId: string) => shiftsService.deleteShift(shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFTS] });
      success('Shift deleted successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete shift');
    },
  });

  // Create leave mutation
  const createLeave = useMutation({
    mutationFn: async (leave: Omit<LeaveRequest, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('leave_requests').insert(leave).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      success('Leave assigned successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to assign leave');
    },
  });

  // Update leave mutation
  const updateLeave = useMutation({
    mutationFn: async ({
      leaveId,
      updates,
    }: {
      leaveId: string;
      updates: Partial<LeaveRequest>;
    }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', leaveId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      success('Leave updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update leave');
    },
  });

  // Delete leave mutation
  const deleteLeave = useMutation({
    mutationFn: (leaveId: string) => leaveRequestsService.deleteLeaveRequest(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      success('Leave deleted successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete leave');
    },
  });

  const isLoading = loadingUsers || loadingShifts || loadingLeaves;

  return {
    users,
    shifts,
    approvedLeaves,
    swappedUserNames,
    isLoading,
    createShift,
    updateShift,
    deleteShift,
    createLeave,
    updateLeave,
    deleteLeave,
  };
}
