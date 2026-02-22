import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSkills } from '../../hooks/useSkills';
import { skillsService } from '../../services/skillsService';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock services
vi.mock('../../services/skillsService', () => ({
  skillsService: {
    getSkills: vi.fn(),
    createSkill: vi.fn(),
    updateSkill: vi.fn(),
    deleteSkill: vi.fn(),
  },
}));

describe('useSkills', () => {
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

  const mockSkills = [
    { id: '1', name: 'JavaScript', description: 'JS programming', is_active: true },
    { id: '2', name: 'TypeScript', description: 'TS programming', is_active: true },
  ];

  it('should fetch active skills by default', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.skills).toEqual(mockSkills);
    expect(skillsService.getSkills).toHaveBeenCalledWith(false);
  });

  it('should fetch only active skills when activeOnly is true', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);

    const { result } = renderHook(() => useSkills(true), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.skills).toEqual(mockSkills);
    expect(skillsService.getSkills).toHaveBeenCalledWith(true);
  });

  it('should handle empty skills', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue([]);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.skills).toEqual([]);
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch skills');
    vi.mocked(skillsService.getSkills).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.skills).toEqual([]);
  });

  it('should create skill successfully', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    vi.mocked(skillsService.createSkill).mockResolvedValue({
      id: '3',
      name: 'React',
      description: 'React framework',
    } as any);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newSkill = { name: 'React', description: 'React framework', is_active: true };
    result.current.createSkill.mutate(newSkill);

    await waitFor(() => expect(result.current.createSkill.isSuccess).toBe(true));

    expect(skillsService.createSkill).toHaveBeenCalledWith(newSkill);
  });

  it('should handle create errors', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    const mockError = new Error('Create failed');
    vi.mocked(skillsService.createSkill).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createSkill.mutate({ name: 'Test', description: 'Test', is_active: true });

    await waitFor(() => expect(result.current.createSkill.isError).toBe(true));

    expect(result.current.createSkill.error).toEqual(mockError);
  });

  it('should update skill successfully', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    vi.mocked(skillsService.updateSkill).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updates = { description: 'Updated description' };
    result.current.updateSkill.mutate({ id: '1', updates });

    await waitFor(() => expect(result.current.updateSkill.isSuccess).toBe(true));

    expect(skillsService.updateSkill).toHaveBeenCalledWith('1', updates);
  });

  it('should handle update errors', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    const mockError = new Error('Update failed');
    vi.mocked(skillsService.updateSkill).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateSkill.mutate({ id: '1', updates: { description: 'Updated' } });

    await waitFor(() => expect(result.current.updateSkill.isError).toBe(true));

    expect(result.current.updateSkill.error).toEqual(mockError);
  });

  it('should delete skill successfully', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    vi.mocked(skillsService.deleteSkill).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteSkill.mutate('1');

    await waitFor(() => expect(result.current.deleteSkill.isSuccess).toBe(true));

    expect(skillsService.deleteSkill).toHaveBeenCalledWith('1');
  });

  it('should handle delete errors', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    const mockError = new Error('Delete failed');
    vi.mocked(skillsService.deleteSkill).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteSkill.mutate('1');

    await waitFor(() => expect(result.current.deleteSkill.isError).toBe(true));

    expect(result.current.deleteSkill.error).toEqual(mockError);
  });

  it('should invalidate both skills and employees cache after create', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    vi.mocked(skillsService.createSkill).mockResolvedValue({ id: '3' } as any);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createSkill.mutate({ name: 'Test', description: 'Test', is_active: true });

    await waitFor(() => expect(result.current.createSkill.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should invalidate both skills and employees cache after update', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    vi.mocked(skillsService.updateSkill).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateSkill.mutate({ id: '1', updates: { description: 'Updated' } });

    await waitFor(() => expect(result.current.updateSkill.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should invalidate both skills and employees cache after delete', async () => {
    vi.mocked(skillsService.getSkills).mockResolvedValue(mockSkills);
    vi.mocked(skillsService.deleteSkill).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSkills(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteSkill.mutate('1');

    await waitFor(() => expect(result.current.deleteSkill.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
