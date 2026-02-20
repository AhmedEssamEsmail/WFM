import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LeaveRequest } from '../types';
import { useToast } from '../contexts/ToastContext';
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache';
import type { PaginationParams, PaginatedResult } from '../types/pagination';
import {
  DEFAULT_PAGINATION_PARAMS,
  calculateOffset,
  calculatePagination,
} from '../types/pagination';

export function useLeaveRequests(params: PaginationParams = {}) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const mergedParams = { ...DEFAULT_PAGINATION_PARAMS, ...params };

  // Fetch paginated leave requests
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, mergedParams],
    queryFn: async (): Promise<
      PaginatedResult<
        LeaveRequest & { user: { id: string; name: string; email: string; role: string } }
      >
    > => {
      const offset = calculateOffset(mergedParams);
      const { data, error, count } = await supabase
        .from('leave_requests')
        .select(
          `
          *,
          user:users(id, name, email, role)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: mergedParams.sortOrder === 'asc' })
        .range(offset, offset + (mergedParams.pageSize ?? 10) - 1);

      if (error) throw error;

      const pagination = calculatePagination(mergedParams, count || 0);

      return {
        data: data || [],
        ...pagination,
      };
    },
    staleTime: STALE_TIMES.LEAVE_REQUESTS,
  });

  // Computed values for convenience
  const leaveRequests = paginatedData?.data ?? [];
  const totalItems = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.totalPages ?? 0;
  const currentPage = paginatedData?.page ?? 1;
  const hasNextPage = paginatedData?.hasNextPage ?? false;
  const hasPreviousPage = paginatedData?.hasPreviousPage ?? false;

  // Pagination actions
  const nextPage = () => {
    if (hasNextPage) {
      queryClient.setQueryData(
        [QUERY_KEYS.LEAVE_REQUESTS, mergedParams],
        (old: PaginatedResult<LeaveRequest> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            page: old.page + 1,
            hasPreviousPage: true,
            hasNextPage: old.page + 1 < old.totalPages,
          };
        }
      );
    }
  };

  const prevPage = () => {
    if (hasPreviousPage) {
      queryClient.setQueryData(
        [QUERY_KEYS.LEAVE_REQUESTS, mergedParams],
        (old: PaginatedResult<LeaveRequest> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            page: old.page - 1,
            hasPreviousPage: old.page - 1 > 1,
            hasNextPage: true,
          };
        }
      );
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      queryClient.setQueryData(
        [QUERY_KEYS.LEAVE_REQUESTS, mergedParams],
        (old: PaginatedResult<LeaveRequest> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            page,
            hasPreviousPage: page > 1,
            hasNextPage: page < old.totalPages,
          };
        }
      );
    }
  };

  // Fetch single leave request
  const useLeaveRequest = (id: string) => {
    return useQuery({
      queryKey: [QUERY_KEYS.LEAVE_REQUESTS, id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('leave_requests')
          .select(
            `
            *,
            user:users(id, name, email, role)
          `
          )
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      },
      enabled: !!id,
      staleTime: STALE_TIMES.LEAVE_REQUESTS, // 1 minute - frequent updates
    });
  };

  // Create leave request mutation
  const createLeaveRequest = useMutation({
    mutationFn: async (newRequest: Partial<LeaveRequest>) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(newRequest)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_BALANCES] });
      success('Leave request created successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create leave request');
    },
  });

  // Update leave request mutation
  const updateLeaveRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LeaveRequest> }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_BALANCES] });
      success('Leave request updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update leave request');
    },
  });

  // Delete leave request mutation
  const deleteLeaveRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leave_requests').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      success('Leave request deleted successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete leave request');
    },
  });

  return {
    leaveRequests,
    isLoading,
    error,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    prevPage,
    goToPage,
    useLeaveRequest,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
  };
}
