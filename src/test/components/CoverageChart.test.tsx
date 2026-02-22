import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverageChart } from '../../components/CoverageChart';

describe('CoverageChart', () => {
  const mockData = [
    { day: 'Mon', count: 15, level: 'adequate' as const },
    { day: 'Tue', count: 10, level: 'low' as const },
    { day: 'Wed', count: 5, level: 'critical' as const },
    { day: 'Thu', count: 13, level: 'adequate' as const },
    { day: 'Fri', count: 8, level: 'low' as const },
    { day: 'Sat', count: 12, level: 'adequate' as const },
    { day: 'Sun', count: 6, level: 'critical' as const },
  ];

  describe('Chart Rendering', () => {
    it('should render chart with data', () => {
      render(<CoverageChart data={mockData} />);

      // Verify title is rendered
      expect(screen.getByText('Coverage Overview')).toBeInTheDocument();

      // Verify all days are rendered
      mockData.forEach((item) => {
        expect(screen.getByText(item.day)).toBeInTheDocument();
      });

      // Verify all counts are rendered
      mockData.forEach((item) => {
        expect(screen.getByText(item.count.toString())).toBeInTheDocument();
      });
    });

    it('should render bars with correct heights proportional to max value', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const bars = container.querySelectorAll('[role="img"]');

      expect(bars).toHaveLength(mockData.length);

      // The highest value (15) should have 100% height
      const maxBar = bars[0] as HTMLElement;
      expect(maxBar.style.height).toBe('100%');
    });

    it('should render bars with correct colors based on level', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const bars = container.querySelectorAll('[role="img"]');

      // Check adequate level (green)
      expect(bars[0]).toHaveClass('bg-green-500');

      // Check low level (yellow)
      expect(bars[1]).toHaveClass('bg-yellow-500');

      // Check critical level (red)
      expect(bars[2]).toHaveClass('bg-red-500');
    });

    it('should handle empty data array', () => {
      render(<CoverageChart data={[]} />);

      // Title should still render
      expect(screen.getByText('Coverage Overview')).toBeInTheDocument();

      // Legend should still render
      expect(screen.getByText(/Adequate/)).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleData = [{ day: 'Mon', count: 10, level: 'low' as const }];
      render(<CoverageChart data={singleData} />);

      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle zero count values', () => {
      const zeroData = [
        { day: 'Mon', count: 0, level: 'critical' as const },
        { day: 'Tue', count: 5, level: 'critical' as const },
      ];
      const { container } = render(<CoverageChart data={zeroData} />);
      const bars = container.querySelectorAll('[role="img"]');

      // Zero count bar should have 0% height
      const zeroBar = bars[0] as HTMLElement;
      expect(zeroBar.style.height).toBe('0%');
      expect(zeroBar.style.minHeight).toBe('0');
    });

    it('should apply minimum height to non-zero bars', () => {
      const smallData = [
        { day: 'Mon', count: 1, level: 'critical' as const },
        { day: 'Tue', count: 100, level: 'adequate' as const },
      ];
      const { container } = render(<CoverageChart data={smallData} />);
      const bars = container.querySelectorAll('[role="img"]');

      // Small bar should have minimum height of 24px
      const smallBar = bars[0] as HTMLElement;
      expect(smallBar.style.minHeight).toBe('24px');
    });
  });

  describe('Legend Display', () => {
    it('should render legend with all coverage levels', () => {
      render(<CoverageChart data={mockData} />);

      // Check all legend items are present
      expect(screen.getByText(/Adequate/)).toBeInTheDocument();
      expect(screen.getByText(/Low/)).toBeInTheDocument();
      expect(screen.getByText(/Critical/)).toBeInTheDocument();
    });

    it('should render legend color indicators', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const legendColors = container.querySelectorAll('.h-4.w-4.rounded');

      expect(legendColors).toHaveLength(3);
      expect(legendColors[0]).toHaveClass('bg-green-500');
      expect(legendColors[1]).toHaveClass('bg-yellow-500');
      expect(legendColors[2]).toHaveClass('bg-red-500');
    });

    it('should mark legend color indicators as decorative', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const legendColors = container.querySelectorAll('.h-4.w-4.rounded');

      legendColors.forEach((color) => {
        expect(color).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Accessibility Attributes', () => {
    it('should have region role with descriptive label', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const region = container.querySelector('[role="region"]');

      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-label', 'Weekly staffing coverage overview');
    });

    it('should have ARIA labels on bars with complete information', () => {
      render(<CoverageChart data={mockData} />);

      // Check first bar has descriptive label
      const monBar = screen.getByLabelText('Mon: 15 staff, adequate coverage');
      expect(monBar).toBeInTheDocument();

      // Check critical level bar
      const wedBar = screen.getByLabelText('Wed: 5 staff, critical coverage');
      expect(wedBar).toBeInTheDocument();

      // Check low level bar
      const tueBar = screen.getByLabelText('Tue: 10 staff, low coverage');
      expect(tueBar).toBeInTheDocument();
    });

    it('should mark bars with img role for screen readers', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const bars = container.querySelectorAll('[role="img"]');

      expect(bars).toHaveLength(mockData.length);
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should have horizontal scrolling container', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const scrollContainer = container.querySelector('.overflow-x-auto');

      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have minimum width for chart content', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const chartContent = container.querySelector('.min-w-\\[400px\\]');

      expect(chartContent).toBeInTheDocument();
    });

    it('should maintain chart structure with many data points', () => {
      const manyDays = Array.from({ length: 14 }, (_, i) => ({
        day: `Day${i + 1}`,
        count: Math.floor(Math.random() * 20),
        level: 'adequate' as const,
      }));

      render(<CoverageChart data={manyDays} />);

      // All days should render
      manyDays.forEach((item) => {
        expect(screen.getByText(item.day)).toBeInTheDocument();
      });
    });
  });

  describe('Visual Styling', () => {
    it('should have card styling with shadow and padding', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const card = container.querySelector('.rounded-lg.bg-white.p-6.shadow');

      expect(card).toBeInTheDocument();
    });

    it('should apply transition animation to bars', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const bars = container.querySelectorAll('[role="img"]');

      bars.forEach((bar) => {
        expect(bar).toHaveClass('transition-all');
        expect(bar).toHaveClass('duration-300');
      });
    });

    it('should have rounded tops on bars', () => {
      const { container } = render(<CoverageChart data={mockData} />);
      const bars = container.querySelectorAll('[role="img"]');

      bars.forEach((bar) => {
        expect(bar).toHaveClass('rounded-t');
      });
    });
  });

  describe('Data Scaling', () => {
    it('should scale bars relative to maximum value', () => {
      const scaledData = [
        { day: 'Mon', count: 20, level: 'adequate' as const },
        { day: 'Tue', count: 10, level: 'low' as const },
        { day: 'Wed', count: 5, level: 'critical' as const },
      ];
      const { container } = render(<CoverageChart data={scaledData} />);
      const bars = container.querySelectorAll('[role="img"]');

      // Max value (20) should be 100%
      expect((bars[0] as HTMLElement).style.height).toBe('100%');

      // Half of max (10) should be 50%
      expect((bars[1] as HTMLElement).style.height).toBe('50%');

      // Quarter of max (5) should be 25%
      expect((bars[2] as HTMLElement).style.height).toBe('25%');
    });

    it('should handle all equal values', () => {
      const equalData = [
        { day: 'Mon', count: 10, level: 'adequate' as const },
        { day: 'Tue', count: 10, level: 'adequate' as const },
        { day: 'Wed', count: 10, level: 'adequate' as const },
      ];
      const { container } = render(<CoverageChart data={equalData} />);
      const bars = container.querySelectorAll('[role="img"]');

      // All bars should be 100% height
      bars.forEach((bar) => {
        expect((bar as HTMLElement).style.height).toBe('100%');
      });
    });

    it('should handle all zero values', () => {
      const zeroData = [
        { day: 'Mon', count: 0, level: 'critical' as const },
        { day: 'Tue', count: 0, level: 'critical' as const },
      ];
      const { container } = render(<CoverageChart data={zeroData} />);
      const bars = container.querySelectorAll('[role="img"]');

      // All bars should be 0% height with no minimum
      bars.forEach((bar) => {
        expect((bar as HTMLElement).style.height).toBe('0%');
        expect((bar as HTMLElement).style.minHeight).toBe('0');
      });
    });
  });
});
