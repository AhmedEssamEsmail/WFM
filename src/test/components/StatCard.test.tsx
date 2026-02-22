import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatCard } from '../../components/StatCard';

// Mock icon component
const MockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg data-testid="mock-icon" {...props}>
    <path d="M0 0" />
  </svg>
);

describe('StatCard Component', () => {
  describe('Basic rendering', () => {
    it('should render title and value', () => {
      render(
        <StatCard
          title="Total Requests"
          value={42}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render string value', () => {
      render(
        <StatCard
          title="Status"
          value="Active"
          icon={MockIcon}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render icon with correct styling', () => {
      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-red-100"
          iconColor="text-red-600"
        />
      );

      const icon = screen.getByTestId('mock-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-8', 'w-8', 'text-red-600');
    });

    it('should apply background color to icon container', () => {
      const { container } = render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      );

      const iconContainer = container.querySelector('.bg-purple-100');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Click functionality', () => {
    it('should call onClick when card is clicked', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Clickable"
          value={5}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have button role when onClick is provided', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not have button role when onClick is not provided', () => {
      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should be keyboard accessible with Enter key', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible with Space key', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onClick for other keys', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have tabIndex 0 when clickable', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have cursor-pointer class when clickable', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive aria-label when clickable', () => {
      const handleClick = vi.fn();

      render(
        <StatCard
          title="Total Requests"
          value={42}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={handleClick}
        />
      );

      const card = screen.getByLabelText('Total Requests: 42. Click to view details');
      expect(card).toBeInTheDocument();
    });

    it('should have simple aria-label when not clickable', () => {
      render(
        <StatCard
          title="Total Requests"
          value={42}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      const card = screen.getByLabelText('Total Requests: 42');
      expect(card).toBeInTheDocument();
    });

    it('should mark icon as decorative with aria-hidden', () => {
      render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      const icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Layout and styling', () => {
    it('should have proper layout classes', () => {
      const { container } = render(
        <StatCard
          title="Test"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-6', 'shadow');
    });

    it('should display value with large font', () => {
      render(
        <StatCard
          title="Test"
          value={999}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      const value = screen.getByText('999');
      expect(value).toHaveClass('text-3xl', 'font-bold');
    });

    it('should display title with smaller font', () => {
      render(
        <StatCard
          title="Test Title"
          value={10}
          icon={MockIcon}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-sm', 'font-medium');
    });
  });
});
