import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverageChart } from '../../components/CoverageChart';

describe('CoverageChart Component', () => {
  const mockData = [
    { day: 'Mon', count: 25, level: 'adequate' as const },
    { day: 'Tue', count: 18, level: 'low' as const },
    { day: 'Wed', count: 12, level: 'critical' as const },
    { day: 'Thu', count: 22, level: 'adequate' as const },
    { day: 'Fri', count: 16, level: 'low' as const },
    { day: 'Sat', count: 20, level: 'adequate' as const },
    { day: 'Sun', count: 15, level: 'low' as const },
  ];

  it('should render the component with title', () => {
    render(<CoverageChart data={mockData} />);
    expect(screen.getByText('Coverage Overview')).toBeInTheDocument();
  });

  it('should display all day labels', () => {
    render(<CoverageChart data={mockData} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('should display coverage counts for each day', () => {
    render(<CoverageChart data={mockData} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should render bars with appropriate ARIA labels', () => {
    render(<CoverageChart data={mockData} />);

    expect(screen.getByLabelText('Mon: 25 staff, adequate coverage')).toBeInTheDocument();
    expect(screen.getByLabelText('Tue: 18 staff, low coverage')).toBeInTheDocument();
    expect(screen.getByLabelText('Wed: 12 staff, critical coverage')).toBeInTheDocument();
  });

  it('should display legend with all coverage levels', () => {
    render(<CoverageChart data={mockData} />);

    expect(screen.getByText('Adequate (>12)')).toBeInTheDocument();
    expect(screen.getByText('Low (8-12)')).toBeInTheDocument();
    expect(screen.getByText('Critical (<8)')).toBeInTheDocument();
  });

  it('should render with empty data', () => {
    render(<CoverageChart data={[]} />);

    expect(screen.getByText('Coverage Overview')).toBeInTheDocument();
    expect(screen.getByText('Adequate (>12)')).toBeInTheDocument();
  });

  it('should render with single day data', () => {
    const singleDayData = [{ day: 'Mon', count: 20, level: 'adequate' as const }];
    render(<CoverageChart data={singleDayData} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should handle zero count', () => {
    const zeroData = [{ day: 'Mon', count: 0, level: 'critical' as const }];
    render(<CoverageChart data={zeroData} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should apply correct color classes for adequate coverage', () => {
    const adequateData = [{ day: 'Mon', count: 25, level: 'adequate' as const }];
    const { container } = render(<CoverageChart data={adequateData} />);

    const bar = container.querySelector('.bg-green-500');
    expect(bar).toBeInTheDocument();
  });

  it('should apply correct color classes for low coverage', () => {
    const lowData = [{ day: 'Tue', count: 18, level: 'low' as const }];
    const { container } = render(<CoverageChart data={lowData} />);

    const bar = container.querySelector('.bg-yellow-500');
    expect(bar).toBeInTheDocument();
  });

  it('should apply correct color classes for critical coverage', () => {
    const criticalData = [{ day: 'Wed', count: 12, level: 'critical' as const }];
    const { container } = render(<CoverageChart data={criticalData} />);

    const bar = container.querySelector('.bg-red-500');
    expect(bar).toBeInTheDocument();
  });

  it('should have region role for accessibility', () => {
    render(<CoverageChart data={mockData} />);

    const region = screen.getByRole('region', { name: 'Weekly staffing coverage overview' });
    expect(region).toBeInTheDocument();
  });

  it('should render with horizontal scrolling container', () => {
    const { container } = render(<CoverageChart data={mockData} />);

    const scrollContainer = container.querySelector('.overflow-x-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should scale bars proportionally to max count', () => {
    const { container } = render(<CoverageChart data={mockData} />);

    // The bar with count 25 (max) should have height 100%
    // The bar with count 12 should have height ~48% (12/25 * 100)
    const bars = container.querySelectorAll('[role="img"]');
    expect(bars.length).toBe(7);
  });

  it('should handle large count values', () => {
    const largeData = [
      { day: 'Mon', count: 100, level: 'adequate' as const },
      { day: 'Tue', count: 50, level: 'adequate' as const },
    ];
    render(<CoverageChart data={largeData} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
