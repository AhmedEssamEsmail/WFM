import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from '../../pages/Settings';
import { AuthContext } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import type { User } from '../../types';

// Mock services
vi.mock('../../services', () => ({
  settingsService: {
    getAutoApproveSetting: vi.fn(),
    getAllowLeaveExceptionsSetting: vi.fn(),
    updateSetting: vi.fn(),
  },
  leaveTypesService: {
    getAllLeaveTypes: vi.fn(),
  },
}));

// Import after mocking
import { settingsService } from '../../services';

describe('Settings Page', () => {
  let queryClient: QueryClient;
  let mockUser: User;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUser = {
      id: 'user-1',
      email: 'user@dabdoob.com',
      name: 'John Doe',
      role: 'wfm',
      created_at: '2024-01-01T00:00:00Z',
    };

    vi.clearAllMocks();
  });

  const renderSettings = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user,
              loading: false,
              signOut: vi.fn(),
              supabaseUser: null,
              session: null,
              isAuthenticated: !!user,
              signUp: vi.fn(),
              signIn: vi.fn(),
            }}
          >
            <ToastProvider>
              <Settings />
            </ToastProvider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Settings display', () => {
    it('should render page title', async () => {
      vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(false);
      vi.mocked(settingsService.getAllowLeaveExceptionsSetting).mockResolvedValue(true);

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('WFM Settings')).toBeDefined();
      });
    });

    it('should display settings when data is available', async () => {
      vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(false);
      vi.mocked(settingsService.getAllowLeaveExceptionsSetting).mockResolvedValue(true);

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('WFM Settings')).toBeDefined();
        expect(screen.getByText('Auto-Approve Requests')).toBeDefined();
        expect(screen.getByText('Allow Leave Exceptions')).toBeDefined();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state initially', async () => {
      vi.mocked(settingsService.getAutoApproveSetting).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(settingsService.getAllowLeaveExceptionsSetting).mockImplementation(
        () => new Promise(() => {})
      );

      renderSettings();

      // Wait a bit for the component to mount
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('should hide loading state after data loads', async () => {
      vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(false);
      vi.mocked(settingsService.getAllowLeaveExceptionsSetting).mockResolvedValue(true);

      renderSettings();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeNull();
      });
    });
  });

  describe('Settings updates', () => {
    it('should render settings form', async () => {
      vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(false);
      vi.mocked(settingsService.getAllowLeaveExceptionsSetting).mockResolvedValue(true);

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('WFM Settings')).toBeDefined();
        expect(screen.getByText('Auto-Approve Requests')).toBeDefined();
        expect(screen.getByText('Allow Leave Exceptions')).toBeDefined();
      });
    });
  });
});
