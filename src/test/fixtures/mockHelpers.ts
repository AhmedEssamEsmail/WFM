/**
 * Shared Mock Helpers
 *
 * Provides reusable mock setup functions to minimize boilerplate in tests.
 * These helpers create consistent mock chains for Supabase operations.
 *
 * ## Usage Patterns
 *
 * ### 1. Supabase Query Mocks
 * Use these helpers to mock Supabase database operations without actual database calls.
 * Each helper returns a mock object that mimics the Supabase query chain.
 *
 * Example:
 * ```typescript
 * const mockSupabase = {
 *   from: vi.fn(() => createSelectMock(mockData))
 * };
 * ```
 *
 * ### 2. React Query Mocks
 * Use createQueryMock and createMutationMock for testing hooks that use React Query.
 *
 * Example:
 * ```typescript
 * vi.mock('@tanstack/react-query', () => ({
 *   useQuery: () => createQueryMock(mockData, false, null)
 * }));
 * ```
 *
 * ### 3. Form and Router Mocks
 * Use createFormMock and createRouterMock for testing components with forms or navigation.
 *
 * Example:
 * ```typescript
 * const mockForm = createFormMock(vi.fn());
 * render(<MyForm {...mockForm} />);
 * ```
 */

import { vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Creates a mock Supabase query chain for select operations
 *
 * @template T - The type of data returned by the query
 * @param data - The mock data to return
 * @param error - Optional error to return (null for success)
 * @returns Mock object with select() and order() methods
 *
 * @example
 * ```typescript
 * const mockData = [{ id: '1', name: 'Test' }];
 * const mock = createSelectMock(mockData);
 * const supabase = { from: vi.fn(() => mock) };
 *
 * // Usage in test
 * const { data } = await supabase.from('users').select('*').order('name');
 * expect(data).toEqual(mockData);
 * ```
 */
export function createSelectMock<T>(data: T, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for select with eq filter
 *
 * @template T - The type of data returned by the query
 * @param data - The mock data to return
 * @param error - Optional error to return (null for success)
 * @returns Mock object with select(), eq(), and single() methods
 *
 * @example
 * ```typescript
 * const mockUser = { id: '1', name: 'John' };
 * const mock = createSelectEqMock(mockUser);
 * const supabase = { from: vi.fn(() => mock) };
 *
 * // Usage in test
 * const { data } = await supabase.from('users').select('*').eq('id', '1').single();
 * expect(data).toEqual(mockUser);
 * ```
 */
export function createSelectEqMock<T>(data: T, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for select with order and eq
 */
export function createSelectOrderEqMock<T>(data: T, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for insert operations
 */
export function createInsertMock<T>(data: T, error: any = null) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for update operations
 */
export function createUpdateMock<T>(data: T, error: any = null) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for delete operations
 */
export function createDeleteMock(error: any = null) {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  };
}

/**
 * Creates a mock Supabase query chain for upsert operations
 */
export function createUpsertMock<T>(data: T, error: any = null) {
  return {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for select with date range filters
 */
export function createSelectDateRangeMock<T>(data: T, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for select with ilike filter
 */
export function createSelectIlikeMock<T>(data: T, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for select with ilike and neq filters
 */
export function createSelectIlikeNeqMock<T>(data: T, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    neq: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Creates a mock Supabase query chain for select with maybeSingle
 */
export function createSelectMaybeSingleMock<T>(data: T | null, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * Mock factory for Supabase auth operations
 */
export function createAuthMock() {
  return {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  };
}

/**
 * Helper to setup common beforeEach cleanup
 * Use this in describe blocks to ensure mocks are cleared
 */
export function setupMockCleanup() {
  return vi.clearAllMocks();
}

/**
 * Creates a mock React Query query result for hooks
 * Useful for mocking useQuery hooks
 *
 * @template T - The type of data returned by the query
 * @param data - The mock data to return
 * @param isLoading - Whether the query is in loading state
 * @param error - Optional error object (null for success)
 * @returns Mock query result object with all React Query properties
 *
 * @example
 * ```typescript
 * // Mock a successful query
 * const mockQuery = createQueryMock({ users: [] }, false, null);
 *
 * // Mock a loading query
 * const loadingQuery = createQueryMock(null, true, null);
 *
 * // Mock an error query
 * const errorQuery = createQueryMock(null, false, new Error('Failed'));
 *
 * // Use in hook test
 * vi.mock('@tanstack/react-query', () => ({
 *   useQuery: () => mockQuery
 * }));
 * ```
 */
export function createQueryMock<T>(data: T, isLoading = false, error: any = null) {
  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch: vi.fn(),
    isSuccess: error === null && !isLoading,
    isFetching: isLoading,
    status: error ? 'error' : isLoading ? 'loading' : 'success',
  };
}

/**
 * Creates a mock React Query mutation result for hooks
 * Useful for mocking useMutation hooks
 *
 * @template T - The type of data returned by the mutation
 * @param mutate - Optional mock function for the mutate method
 * @returns Mock mutation result object with all React Query mutation properties
 *
 * @example
 * ```typescript
 * const mockMutate = vi.fn();
 * const mockMutation = createMutationMock(mockMutate);
 *
 * // Use in hook test
 * vi.mock('@tanstack/react-query', () => ({
 *   useMutation: () => mockMutation
 * }));
 *
 * // Test mutation call
 * mockMutation.mutate({ name: 'New User' });
 * expect(mockMutate).toHaveBeenCalledWith({ name: 'New User' });
 * ```
 */
export function createMutationMock<T>(mutate: any = vi.fn()) {
  return {
    mutate,
    mutateAsync: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    reset: vi.fn(),
    status: 'idle' as const,
  };
}

/**
 * Creates a mock form handler for component testing
 * Useful for mocking react-hook-form
 *
 * @param onSubmit - Optional callback function called on form submission
 * @returns Mock form object with all react-hook-form methods
 *
 * @example
 * ```typescript
 * const handleSubmit = vi.fn();
 * const mockForm = createFormMock(handleSubmit);
 *
 * // Use in component test
 * render(<MyForm {...mockForm} />);
 *
 * // Simulate form submission
 * fireEvent.submit(screen.getByRole('form'));
 * expect(handleSubmit).toHaveBeenCalled();
 * ```
 */
export function createFormMock(onSubmit: any = vi.fn()) {
  return {
    handleSubmit: (callback: any) => (e: any) => {
      e?.preventDefault?.();
      callback();
      onSubmit();
    },
    register: vi.fn((name: string) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })),
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      isSubmitted: false,
      touchedFields: {},
      dirtyFields: {},
    },
    watch: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
    trigger: vi.fn(),
  };
}

/**
 * Creates a mock router for component testing
 * Useful for mocking react-router-dom navigation
 *
 * @param navigate - Optional mock function for navigation
 * @returns Mock router object with location, params, and navigation hooks
 *
 * @example
 * ```typescript
 * const mockNavigate = vi.fn();
 * const mockRouter = createRouterMock(mockNavigate);
 *
 * // Mock react-router-dom hooks
 * vi.mock('react-router-dom', () => ({
 *   useNavigate: () => mockNavigate,
 *   useLocation: () => mockRouter.location,
 *   useParams: () => mockRouter.params
 * }));
 *
 * // Test navigation
 * fireEvent.click(screen.getByText('Go Back'));
 * expect(mockNavigate).toHaveBeenCalledWith(-1);
 * ```
 */
export function createRouterMock(navigate: any = vi.fn()) {
  return {
    navigate,
    location: {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    },
    params: {},
    useNavigate: () => navigate,
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    }),
    useParams: () => ({}),
  };
}

/**
 * Creates a React Query wrapper for testing hooks
 * Provides QueryClientProvider with test-friendly configuration
 */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Changed from cacheTime to gcTime for React Query v5
      },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}
