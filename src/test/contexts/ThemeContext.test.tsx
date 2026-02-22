import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses ThemeContext
function TestComponent() {
  const theme = useTheme();

  return (
    <div>
      <div data-testid="dark-mode">{theme.isDarkMode ? 'Dark' : 'Light'}</div>
      <button onClick={theme.toggleDarkMode}>Toggle Theme</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should throw error when useTheme is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Initial state', () => {
    it('should start with light mode by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Light');
    });

    it('should load dark mode from localStorage', () => {
      localStorageMock.setItem('darkMode', 'true');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Dark');
    });

    it('should load light mode from localStorage', () => {
      localStorageMock.setItem('darkMode', 'false');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Light');
    });
  });

  describe('toggleDarkMode', () => {
    it('should toggle from light to dark mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Light');

      const button = screen.getByText('Toggle Theme');
      act(() => {
        button.click();
      });

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Dark');
    });

    it('should toggle from dark to light mode', () => {
      localStorageMock.setItem('darkMode', 'true');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Dark');

      const button = screen.getByText('Toggle Theme');
      act(() => {
        button.click();
      });

      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Light');
    });

    it('should toggle multiple times', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const button = screen.getByText('Toggle Theme');

      act(() => {
        button.click(); // Light -> Dark
      });
      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Dark');

      act(() => {
        button.click(); // Dark -> Light
      });
      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Light');

      act(() => {
        button.click(); // Light -> Dark
      });
      expect(screen.getByTestId('dark-mode')).toHaveTextContent('Dark');
    });
  });

  describe('localStorage persistence', () => {
    it('should save dark mode to localStorage', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const button = screen.getByText('Toggle Theme');
      act(() => {
        button.click();
      });

      expect(localStorageMock.getItem('darkMode')).toBe('true');
    });

    it('should save light mode to localStorage', () => {
      localStorageMock.setItem('darkMode', 'true');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const button = screen.getByText('Toggle Theme');
      act(() => {
        button.click();
      });

      expect(localStorageMock.getItem('darkMode')).toBe('false');
    });
  });

  describe('DOM class manipulation', () => {
    it('should add dark class to documentElement in dark mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const button = screen.getByText('Toggle Theme');
      act(() => {
        button.click();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from documentElement in light mode', () => {
      localStorageMock.setItem('darkMode', 'true');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      const button = screen.getByText('Toggle Theme');
      act(() => {
        button.click();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply dark class on initial render if dark mode is saved', () => {
      localStorageMock.setItem('darkMode', 'true');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not have dark class on initial render if light mode is saved', () => {
      localStorageMock.setItem('darkMode', 'false');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
