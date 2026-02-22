import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeaveTypes } from '../../hooks/useLeaveTypes';
import { leaveTypesService } from '../../services/leaveTypesService';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock services
vi.mock('../../services/leaveTypesService', () => ({
  leaveTypesService: {
    getActiveLeaveTypes: vi.fn(),
    getAllLeaveTypes: vi.fn(),
    createLeaveType: vi.fn(),
    updateLeaveType: vi.fn(),
    deactivateLeaveType: vi.fn(),
  },
}));

describe('useLeaveTypes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );

  const mockLeaveTypes = [
    { id: '1', name: 'Vacation', max_days: 20, requires_approval: true, is_active: true },
    { id: '2', name: 'Sick Leave', max_days: 10, requires_approval: false, is_active: true },
  ];

  it('should fetch active leave types', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.leaveTypes).toEqual(mockLeaveTypes);
    expect(leaveTypesService.getActiveLeaveTypes).toHaveBeenCalledOnce();
  });

  it('should handle empty leave types', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue([]);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.leaveTypes).toEqual([]);
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch leave types');
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.leaveTypes).toEqual([]);
  });

  it('should create leave type successfully', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.createLeaveType).mockResolvedValue({
      id: '3',
      name: 'Personal',
      max_days: 5,
    } as any);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newLeaveType = { name: 'Personal', max_days: 5, requires_approval: true };
    result.current.createLeaveType.mutate(newLeaveType);

    await waitFor(() => expect(result.current.createLeaveType.isSuccess).toBe(true));

    expect(leaveTypesService.createLeaveType).toHaveBeenCalledWith(newLeaveType);
  });

  it('should handle create errors', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    const mockError = new Error('Create failed');
    vi.mocked(leaveTypesService.createLeaveType).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createLeaveType.mutate({ name: 'Test', max_days: 5, requires_approval: true });

    await waitFor(() => expect(result.current.createLeaveType.isError).toBe(true));

    expect(result.current.createLeaveType.error).toEqual(mockError);
  });

  it('should update leave type successfully', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.updateLeaveType).mockResolvedValue(undefined);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updates = { max_days: 25 };
    result.current.updateLeaveType.mutate({ id: '1', updates });

    await waitFor(() => expect(result.current.updateLeaveType.isSuccess).toBe(true));

    expect(leaveTypesService.updateLeaveType).toHaveBeenCalledWith('1', updates);
  });

  it('should handle update errors', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    const mockError = new Error('Update failed');
    vi.mocked(leaveTypesService.updateLeaveType).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateLeaveType.mutate({ id: '1', updates: { max_days: 25 } });

    await waitFor(() => expect(result.current.updateLeaveType.isError).toBe(true));

    expect(result.current.updateLeaveType.error).toEqual(mockError);
  });

  it('should deactivate leave type successfully', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.deactivateLeaveType).mockResolvedValue(undefined);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deactivateLeaveType.mutate('1');

    await waitFor(() => expect(result.current.deactivateLeaveType.isSuccess).toBe(true));

    expect(leaveTypesService.deactivateLeaveType).toHaveBeenCalledWith('1');
  });

  it('should handle deactivate errors', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    const mockError = new Error('Deactivate failed');
    vi.mocked(leaveTypesService.deactivateLeaveType).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deactivateLeaveType.mutate('1');

    await waitFor(() => expect(result.current.deactivateLeaveType.isError).toBe(true));

    expect(result.current.deactivateLeaveType.error).toEqual(mockError);
  });

  it('should invalidate cache after successful create', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.createLeaveType).mockResolvedValue({ id: '3' } as any);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createLeaveType.mutate({ name: 'Test', max_days: 5, requires_approval: true });

    await waitFor(() => expect(result.current.createLeaveType.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should invalidate cache after successful update', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.updateLeaveType).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateLeaveType.mutate({ id: '1', updates: { max_days: 25 } });

    await waitFor(() => expect(result.current.updateLeaveType.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should invalidate cache after successful deactivate', async () => {
    vi.mocked(leaveTypesService.getActiveLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.deactivateLeaveType).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useLeaveTypes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deactivateLeaveType.mutate('1');

    await waitFor(() => expect(result.current.deactivateLeaveType.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
