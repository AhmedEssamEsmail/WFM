import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BreakScheduleSettings from '../../../pages/Settings/BreakScheduleSettings';
import { breakRulesService } from '../../../services';
import type { BreakScheduleRule } from '../../../types';

/**
 * Comprehensive tests for BreakScheduleSettings component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.6, CR-2.1.4, PR-4.2.4
 */

vi.mock('../../../services', () => ({
  breakRulesService: {
    getRules: vi.fn(),
    updateRule: vi.fn(),
    toggleRule: vi.fn(),
  },
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../../components/BreakSchedule/RulesConfig', () => ({
  default: ({ rules, onUpdateRule, onToggleRule }: any) => (
    <div data-testid="rules-config">
      <div>Rules Count: {rules.length}</div>
      <button onClick={() => onUpdateRule('rule-1', { name: 'Updated' })}>Update Rule</button>
      <button onClick={() => onToggleRule('rule-1', false)}>Toggle Rule</button>
    </div>
  ),
}));

vi.mock('../../../components/DistributionSettingsForm', () => ({
  default: () => <div data-testid="distribution-settings-form">Distribution Settings</div>,
}));

describe('BreakScheduleSettings Component', () => {
  let queryClient: QueryClient;

  const mockRules: BreakScheduleRule[] = [
    {
      id: 'rule-1',
      name: 'Minimum Break Duration',
      description: 'Breaks must be at least 15 minutes',
      rule_type: 'duration',
      is_active: true,
      severity: 'error',
      config: { min_duration: 15 },
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'rule-2',
      name: 'Maximum Breaks Per Day',
      description: 'No more than 3 breaks per day',
      rule_type: 'count',
      is_active: false,
      severity: 'warning',
      config: { max_count: 3 },
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(breakRulesService.getRules).mockResolvedValue(mockRules);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Rendering', () => {
    it('should render component with tabs', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const distributionButton = buttons.find((b) => b.textContent === 'Distribution Settings');
        const rulesButton = buttons.find((b) => b.textContent === 'Validation Rules');
        expect(distributionButton).toBeInTheDocument();
        expect(rulesButton).toBeInTheDocument();
      });
    });

    it('should render Distribution Settings tab by default', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('distribution-settings-form')).toBeInTheDocument();
      });
    });

    it('should have Distribution Settings tab active by default', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const distributionTab = buttons.find((b) => b.textContent === 'Distribution Settings');
        expect(distributionTab).toHaveClass('border-primary-500');
        expect(distributionTab).toHaveClass('text-primary-600');
      });
    });

    it('should have Validation Rules tab inactive by default', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
        expect(rulesTab).toHaveClass('border-transparent');
        expect(rulesTab).toHaveClass('text-gray-500');
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Validation Rules tab when clicked', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('distribution-settings-form')).toBeInTheDocument();
      });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByTestId('rules-config')).toBeInTheDocument();
        expect(screen.queryByTestId('distribution-settings-form')).not.toBeInTheDocument();
      });
    });

    it('should switch back to Distribution Settings tab when clicked', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('distribution-settings-form')).toBeInTheDocument();
      });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByTestId('rules-config')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const distributionTab = buttons.find((b) => b.textContent === 'Distribution Settings');
      fireEvent.click(distributionTab!);

      await waitFor(() => {
        expect(screen.getByTestId('distribution-settings-form')).toBeInTheDocument();
        expect(screen.queryByTestId('rules-config')).not.toBeInTheDocument();
      });
    });

    it('should update tab styling when switching tabs', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('distribution-settings-form')).toBeInTheDocument();
      });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(rulesTab).toHaveClass('border-primary-500');
        expect(rulesTab).toHaveClass('text-primary-600');

        const buttons = screen.getAllByRole('button');
        const distributionTab = buttons.find((b) => b.textContent === 'Distribution Settings');
        expect(distributionTab).toHaveClass('border-transparent');
        expect(distributionTab).toHaveClass('text-gray-500');
      });
    });
  });

  describe('Break Rules Loading', () => {
    it('should fetch break rules on mount', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        expect(breakRulesService.getRules).toHaveBeenCalled();
      });
    });

    it('should show loading spinner while fetching rules', async () => {
      vi.mocked(breakRulesService.getRules).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRules), 100))
      );

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      // Check for the spinner element by class
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('should display rules after loading', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByText('Rules Count: 2')).toBeInTheDocument();
      });
    });

    it('should handle empty rules array', async () => {
      vi.mocked(breakRulesService.getRules).mockResolvedValue([]);

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByText('Rules Count: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Rule Updates', () => {
    it('should call updateRule service when updating a rule', async () => {
      vi.mocked(breakRulesService.updateRule).mockResolvedValue(undefined);

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByTestId('rules-config')).toBeInTheDocument();
      });

      const updateButton = screen.getByText('Update Rule');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(breakRulesService.updateRule).toHaveBeenCalledWith('rule-1', { name: 'Updated' });
      });
    });

    it('should refetch rules after successful update', async () => {
      vi.mocked(breakRulesService.updateRule).mockResolvedValue(undefined);

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(breakRulesService.getRules).toHaveBeenCalled();
      });

      const initialCallCount = vi.mocked(breakRulesService.getRules).mock.calls.length;

      const updateButton = screen.getByText('Update Rule');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(breakRulesService.getRules).toHaveBeenCalled();
        expect(vi.mocked(breakRulesService.getRules).mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it('should handle update errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(breakRulesService.updateRule).mockRejectedValue(new Error('Update failed'));

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByTestId('rules-config')).toBeInTheDocument();
      });

      const updateButton = screen.getByText('Update Rule');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Rule Toggle', () => {
    it('should call toggleRule service when toggling a rule', async () => {
      vi.mocked(breakRulesService.toggleRule).mockResolvedValue(undefined);

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByTestId('rules-config')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Toggle Rule');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(breakRulesService.toggleRule).toHaveBeenCalledWith('rule-1', false);
      });
    });

    it('should refetch rules after successful toggle', async () => {
      vi.mocked(breakRulesService.toggleRule).mockResolvedValue(undefined);

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(breakRulesService.getRules).toHaveBeenCalled();
      });

      const initialCallCount = vi.mocked(breakRulesService.getRules).mock.calls.length;

      const toggleButton = screen.getByText('Toggle Rule');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(breakRulesService.getRules).toHaveBeenCalled();
        expect(vi.mocked(breakRulesService.getRules).mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it('should handle toggle errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(breakRulesService.toggleRule).mockRejectedValue(new Error('Toggle failed'));

      render(<BreakScheduleSettings />, { wrapper });

      const rulesTab = screen.getByRole('button', { name: 'Validation Rules' });
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByTestId('rules-config')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Toggle Rule');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch rules error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(breakRulesService.getRules).mockRejectedValue(new Error('Fetch failed'));

      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper navigation structure', async () => {
      const { container } = render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();
      });
    });

    it('should have clickable tab buttons', async () => {
      render(<BreakScheduleSettings />, { wrapper });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const distributionTab = buttons.find((b) => b.textContent === 'Distribution Settings');
        const rulesTab = buttons.find((b) => b.textContent === 'Validation Rules');

        expect(distributionTab?.tagName).toBe('BUTTON');
        expect(rulesTab?.tagName).toBe('BUTTON');
      });
    });
  });
});
