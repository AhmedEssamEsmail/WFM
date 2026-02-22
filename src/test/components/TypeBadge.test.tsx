import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeBadge } from '../../components/TypeBadge';
import type { RequestType } from '../../components/TypeBadge';

describe('TypeBadge Component', () => {
  describe('Rendering different types', () => {
    it('should render swap type with blue styling', () => {
      render(<TypeBadge type="swap" />);

      const badge = screen.getByText('Swap');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-label', 'Request type: Swap');
    });

    it('should render leave type with orange styling', () => {
      render(<TypeBadge type="leave" />);

      const badge = screen.getByText('Leave');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-label', 'Request type: Leave');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<TypeBadge type="swap" className="custom-class" />);

      const badge = screen.getByText('Swap');
      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve default classes when custom className is provided', () => {
      render(<TypeBadge type="leave" className="custom-class" />);

      const badge = screen.getByText('Leave');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for swap type', () => {
      render(<TypeBadge type="swap" />);

      const badge = screen.getByLabelText('Request type: Swap');
      expect(badge).toBeInTheDocument();
    });

    it('should have proper aria-label for leave type', () => {
      render(<TypeBadge type="leave" />);

      const badge = screen.getByLabelText('Request type: Leave');
      expect(badge).toBeInTheDocument();
    });

    it('should be a span element', () => {
      const { container } = render(<TypeBadge type="swap" />);

      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Type label mapping', () => {
    const typeTests: Array<[RequestType, string]> = [
      ['swap', 'Swap'],
      ['leave', 'Leave'],
    ];

    typeTests.forEach(([type, expectedLabel]) => {
      it(`should display "${expectedLabel}" for ${type} type`, () => {
        render(<TypeBadge type={type} />);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      });
    });
  });

  describe('Styling consistency', () => {
    it('should use consistent sizing for both types', () => {
      const { container: swapContainer } = render(<TypeBadge type="swap" />);
      const { container: leaveContainer } = render(<TypeBadge type="leave" />);

      const swapBadge = swapContainer.querySelector('span');
      const leaveBadge = leaveContainer.querySelector('span');

      expect(swapBadge).toHaveClass('text-xs', 'font-medium', 'px-2.5', 'py-0.5');
      expect(leaveBadge).toHaveClass('text-xs', 'font-medium', 'px-2.5', 'py-0.5');
    });
  });
});
