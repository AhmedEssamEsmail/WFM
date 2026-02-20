import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Shift, SwapRequest } from '../types';
import { useToast } from '../contexts/ToastContext';
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache';
import type { PaginationParams, PaginatedResult } from '../types/pagination';
import {
  DEFAULT_PAGINATION_PARAMS,
  calculateOffset,
  calculatePagination,
} from '../types/pagination';

type SwapRequestWithRelations = SwapRequest & {
  requester: { id: string; name: string; email: string };
  target: { id: string; name: string; email: string };
  requester_shift: Shift;
  target_shift: Shift;
};

export function useSwapRequests(params: PaginationParams = {}) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const mergedParams = { ...DEFAULT_PAGINATION_PARAMS, ...params };

  // Fetch paginated swap requests
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.SWAP_REQUESTS, mergedParams],
    queryFn: async (): Promise<PaginatedResult<SwapRequestWithRelations>> => {
      const offset = calculateOffset(mergedParams);
      const { data, error, count } = await supabase
        .from('swap_requests')
        .select(
          `
          *,
          requester:users!swap_requests_requester_id_fkey(id, name, email),
          target:users!swap_requests_target_user_id_fkey(id, name, email),
          requester_shift:shifts!swap_requests_requester_shift_id_fkey(*),
          target_shift:shifts!swap_requests_target_shift_id_fkey(*)
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
    staleTime: STALE_TIMES.SWAP_REQUESTS,
  });

  // Computed values for convenience
  const swapRequests = paginatedData?.data ?? [];
  const totalItems = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.totalPages ?? 0;
  const currentPage = paginatedData?.page ?? 1;
  const hasNextPage = paginatedData?.hasNextPage ?? false;
  const hasPreviousPage = paginatedData?.hasPreviousPage ?? false;

  // Pagination actions
  const nextPage = () => {
    if (hasNextPage) {
      queryClient.setQueryData(
        [QUERY_KEYS.SWAP_REQUESTS, mergedParams],
        (old: PaginatedResult<SwapRequest> | undefined) => {
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
        [QUERY_KEYS.SWAP_REQUESTS, mergedParams],
        (old: PaginatedResult<SwapRequest> | undefined) => {
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
        [QUERY_KEYS.SWAP_REQUESTS, mergedParams],
        (old: PaginatedResult<SwapRequest> | undefined) => {
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

  // Fetch single swap request
  const useSwapRequest = (id: string) => {
    return useQuery({
      queryKey: [QUERY_KEYS.SWAP_REQUESTS, id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('swap_requests')
          .select(
            `
            *,
            requester:users!swap_requests_requester_id_fkey(id, name, email),
            target:users!swap_requests_target_user_id_fkey(id, name, email),
            requester_shift:shifts!swap_requests_requester_shift_id_fkey(*),
            target_shift:shifts!swap_requests_target_shift_id_fkey(*)
          `
          )
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      },
      enabled: !!id,
      staleTime: STALE_TIMES.SWAP_REQUESTS, // 1 minute - frequent updates
    });
  };

  // Create swap request mutation
  const createSwapRequest = useMutation({
    mutationFn: async (newRequest: Partial<SwapRequest>) => {
      const { data, error } = await supabase
        .from('swap_requests')
        .insert(newRequest)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SWAP_REQUESTS] });
      success('Swap request created successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create swap request');
    },
  });

  // Update swap request mutation
  const updateSwapRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SwapRequest> }) => {
      const { data, error } = await supabase
        .from('swap_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SWAP_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SWAP_REQUESTS, variables.id] });
      success('Swap request updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update swap request');
    },
  });

  // Delete swap request mutation
  const deleteSwapRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('swap_requests').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SWAP_REQUESTS] });
      success('Swap request deleted successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete swap request');
    },
  });

  return {
    swapRequests,
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
    useSwapRequest,
    createSwapRequest,
    updateSwapRequest,
    deleteSwapRequest,
  };
}
