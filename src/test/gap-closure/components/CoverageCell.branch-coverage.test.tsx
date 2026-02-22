import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CoverageCell from '../../../components/BreakSchedule/CoverageCell';

describe('CoverageCell Branch Coverage Tests', () => {
  describe('Color Classification Branches', () => {
    it('should apply green styling when count equals green threshold', () => {
      const { container } = render(<CoverageCell count={8} />);
      const cell = container.querySelector('.bg-green-100.text-green-900.border-green-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply green styling when count exceeds green threshold', () => {
      const { container } = render(<CoverageCell count={10} />);
      const cell = container.querySelector('.bg-green-100.text-green-900.border-green-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply yellow styling when count equals yellow threshold', () => {
      const { container } = render(<CoverageCell count={6} />);
      const cell = container.querySelector('.bg-yellow-100.text-yellow-900.border-yellow-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply yellow styling when count is between yellow and green thresholds', () => {
      const { container } = render(<CoverageCell count={7} />);
      const cell = container.querySelector('.bg-yellow-100.text-yellow-900.border-yellow-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply orange styling when count equals orange threshold', () => {
      const { container } = render(<CoverageCell count={4} />);
      const cell = container.querySelector('.bg-orange-100.text-orange-900.border-orange-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply orange styling when count is between orange and yellow thresholds', () => {
      const { container } = render(<CoverageCell count={5} />);
      const cell = container.querySelector('.bg-orange-100.text-orange-900.border-orange-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply red styling when count is below orange threshold', () => {
      const { container } = render(<CoverageCell count={3} />);
      const cell = container.querySelector('.bg-red-100.text-red-900.border-red-300');
      expect(cell).toBeInTheDocument();
    });

    it('should apply red styling when count is zero', () => {
      const { container } = render(<CoverageCell count={0} />);
      const cell = container.querySelector('.bg-red-100.text-red-900.border-red-300');
      expect(cell).toBeInTheDocument();
    });
  });

  describe('Status Label Branches', () => {
    it('should return "Good coverage" when count equals green threshold', () => {
      render(<CoverageCell count={8} />);
      const cell = screen.getByTitle('Good coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Good coverage" when count exceeds green threshold', () => {
      render(<CoverageCell count={15} />);
      const cell = screen.getByTitle('Good coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Moderate coverage" when count equals yellow threshold', () => {
      render(<CoverageCell count={6} />);
      const cell = screen.getByTitle('Moderate coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Moderate coverage" when count is between yellow and green', () => {
      render(<CoverageCell count={7} />);
      const cell = screen.getByTitle('Moderate coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Low coverage" when count equals orange threshold', () => {
      render(<CoverageCell count={4} />);
      const cell = screen.getByTitle('Low coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Low coverage" when count is between orange and yellow', () => {
      render(<CoverageCell count={5} />);
      const cell = screen.getByTitle('Low coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Critical coverage" when count is below orange threshold', () => {
      render(<CoverageCell count={2} />);
      const cell = screen.getByTitle('Critical coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should return "Critical coverage" when count is zero', () => {
      render(<CoverageCell count={0} />);
      const cell = screen.getByTitle('Critical coverage');
      expect(cell).toBeInTheDocument();
    });
  });

  describe('Custom Thresholds', () => {
    const customThresholds = {
      green: 10,
      yellow: 7,
      orange: 5,
    };

    it('should use custom green threshold', () => {
      const { container } = render(<CoverageCell count={10} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-green-100');
      expect(cell).toBeInTheDocument();
    });

    it('should use custom yellow threshold', () => {
      const { container } = render(<CoverageCell count={7} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-yellow-100');
      expect(cell).toBeInTheDocument();
    });

    it('should use custom orange threshold', () => {
      const { container } = render(<CoverageCell count={5} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-orange-100');
      expect(cell).toBeInTheDocument();
    });

    it('should apply red when below custom orange threshold', () => {
      const { container } = render(<CoverageCell count={4} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-red-100');
      expect(cell).toBeInTheDocument();
    });

    it('should handle edge case at custom green threshold boundary', () => {
      const { container } = render(<CoverageCell count={9} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-yellow-100');
      expect(cell).toBeInTheDocument();
    });

    it('should handle edge case at custom yellow threshold boundary', () => {
      const { container } = render(<CoverageCell count={6} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-orange-100');
      expect(cell).toBeInTheDocument();
    });

    it('should handle edge case at custom orange threshold boundary', () => {
      const { container } = render(<CoverageCell count={4} thresholds={customThresholds} />);
      const cell = container.querySelector('.bg-red-100');
      expect(cell).toBeInTheDocument();
    });
  });

  describe('ARIA Labels', () => {
    it('should include count in ARIA label', () => {
      render(<CoverageCell count={8} />);
      const cell = screen.getByLabelText('8 agents in, Good coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should include status in ARIA label for green', () => {
      render(<CoverageCell count={10} />);
      const cell = screen.getByLabelText('10 agents in, Good coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should include status in ARIA label for yellow', () => {
      render(<CoverageCell count={6} />);
      const cell = screen.getByLabelText('6 agents in, Moderate coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should include status in ARIA label for orange', () => {
      render(<CoverageCell count={4} />);
      const cell = screen.getByLabelText('4 agents in, Low coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should include status in ARIA label for red', () => {
      render(<CoverageCell count={2} />);
      const cell = screen.getByLabelText('2 agents in, Critical coverage');
      expect(cell).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative count values', () => {
      const { container } = render(<CoverageCell count={-1} />);
      const cell = container.querySelector('.bg-red-100');
      expect(cell).toBeInTheDocument();
      expect(screen.getByText('-1')).toBeInTheDocument();
    });

    it('should handle very large count values', () => {
      render(<CoverageCell count={999} />);
      expect(screen.getByText('999')).toBeInTheDocument();
      const cell = screen.getByTitle('Good coverage');
      expect(cell).toBeInTheDocument();
    });

    it('should handle thresholds with same values', () => {
      const sameThresholds = {
        green: 5,
        yellow: 5,
        orange: 5,
      };
      const { container } = render(<CoverageCell count={5} thresholds={sameThresholds} />);
      const cell = container.querySelector('.bg-green-100');
      expect(cell).toBeInTheDocument();
    });

    it('should handle thresholds in descending order', () => {
      const descendingThresholds = {
        green: 10,
        yellow: 8,
        orange: 6,
      };
      const { container } = render(<CoverageCell count={9} thresholds={descendingThresholds} />);
      const cell = container.querySelector('.bg-yellow-100');
      expect(cell).toBeInTheDocument();
    });

    it('should handle zero thresholds', () => {
      const zeroThresholds = {
        green: 0,
        yellow: 0,
        orange: 0,
      };
      const { container } = render(<CoverageCell count={0} thresholds={zeroThresholds} />);
      const cell = container.querySelector('.bg-green-100');
      expect(cell).toBeInTheDocument();
    });

    it('should handle count exactly at boundary between categories', () => {
      // Test count = 8 (exactly at green threshold)
      const { container: container1 } = render(<CoverageCell count={8} />);
      expect(container1.querySelector('.bg-green-100')).toBeInTheDocument();

      // Test count = 7 (one below green threshold)
      const { container: container2 } = render(<CoverageCell count={7} />);
      expect(container2.querySelector('.bg-yellow-100')).toBeInTheDocument();

      // Test count = 6 (exactly at yellow threshold)
      const { container: container3 } = render(<CoverageCell count={6} />);
      expect(container3.querySelector('.bg-yellow-100')).toBeInTheDocument();

      // Test count = 5 (one below yellow threshold)
      const { container: container4 } = render(<CoverageCell count={5} />);
      expect(container4.querySelector('.bg-orange-100')).toBeInTheDocument();

      // Test count = 4 (exactly at orange threshold)
      const { container: container5 } = render(<CoverageCell count={4} />);
      expect(container5.querySelector('.bg-orange-100')).toBeInTheDocument();

      // Test count = 3 (one below orange threshold)
      const { container: container6 } = render(<CoverageCell count={3} />);
      expect(container6.querySelector('.bg-red-100')).toBeInTheDocument();
    });
  });

  describe('Display', () => {
    it('should display count as text content', () => {
      render(<CoverageCell count={8} />);
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display zero count', () => {
      render(<CoverageCell count={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<CoverageCell count={8} />);
      const cell = container.querySelector(
        '.rounded.border.px-2.py-1.text-center.text-xs.font-medium'
      );
      expect(cell).toBeInTheDocument();
    });
  });
});
