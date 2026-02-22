import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  BalanceIcon,
  BreakScheduleIcon,
  CalendarIcon,
  ChevronDoubleLeftIcon,
  ClockIcon,
  CloseIcon,
  DashboardIcon,
  LeaveIcon,
  MenuIcon,
  OvertimeIcon,
  ReportsIcon,
  RequestsIcon,
  ScheduleIcon,
  SettingsIcon,
  SignOutIcon,
  SwapIcon,
  UploadIcon,
  UsersIcon,
} from '../../components/icons';

describe('Icons', () => {
  const icons = [
    { name: 'BalanceIcon', Component: BalanceIcon, acceptsProps: true },
    { name: 'BreakScheduleIcon', Component: BreakScheduleIcon, acceptsProps: true },
    { name: 'CalendarIcon', Component: CalendarIcon, acceptsProps: true },
    { name: 'ChevronDoubleLeftIcon', Component: ChevronDoubleLeftIcon, acceptsProps: true },
    { name: 'ClockIcon', Component: ClockIcon, acceptsProps: true },
    { name: 'CloseIcon', Component: CloseIcon, acceptsProps: false },
    { name: 'DashboardIcon', Component: DashboardIcon, acceptsProps: true },
    { name: 'LeaveIcon', Component: LeaveIcon, acceptsProps: true },
    { name: 'MenuIcon', Component: MenuIcon, acceptsProps: false },
    { name: 'OvertimeIcon', Component: OvertimeIcon, acceptsProps: true },
    { name: 'ReportsIcon', Component: ReportsIcon, acceptsProps: true },
    { name: 'RequestsIcon', Component: RequestsIcon, acceptsProps: true, acceptsSizeProps: false },
    { name: 'ScheduleIcon', Component: ScheduleIcon, acceptsProps: true },
    { name: 'SettingsIcon', Component: SettingsIcon, acceptsProps: true },
    { name: 'SignOutIcon', Component: SignOutIcon, acceptsProps: true },
    { name: 'SwapIcon', Component: SwapIcon, acceptsProps: true },
    { name: 'UploadIcon', Component: UploadIcon, acceptsProps: true },
    { name: 'UsersIcon', Component: UsersIcon, acceptsProps: true },
  ];

  icons.forEach(({ name, Component, acceptsProps, acceptsSizeProps = true }) => {
    describe(name, () => {
      it('should render without crashing', () => {
        const { container } = render(<Component />);
        const svg = container.querySelector('svg');

        expect(svg).toBeInTheDocument();
      });

      if (acceptsProps) {
        it('should accept custom className', () => {
          const { container } = render(<Component className="custom-class" />);
          const svg = container.querySelector('svg');

          expect(svg).toHaveClass('custom-class');
        });

        if (acceptsSizeProps) {
          it('should accept custom size props', () => {
            const { container } = render(<Component width={32} height={32} />);
            const svg = container.querySelector('svg');

            expect(svg).toHaveAttribute('width', '32');
            expect(svg).toHaveAttribute('height', '32');
          });
        }

        it('should accept custom color via className', () => {
          const { container } = render(<Component className="text-blue-500" />);
          const svg = container.querySelector('svg');

          expect(svg).toHaveClass('text-blue-500');
        });
      } else {
        it('should have default styling', () => {
          const { container } = render(<Component />);
          const svg = container.querySelector('svg');

          expect(svg).toHaveClass('h-6');
          expect(svg).toHaveClass('w-6');
        });
      }
    });
  });

  it('should export all icons', () => {
    expect(BalanceIcon).toBeDefined();
    expect(BreakScheduleIcon).toBeDefined();
    expect(CalendarIcon).toBeDefined();
    expect(ChevronDoubleLeftIcon).toBeDefined();
    expect(ClockIcon).toBeDefined();
    expect(CloseIcon).toBeDefined();
    expect(DashboardIcon).toBeDefined();
    expect(LeaveIcon).toBeDefined();
    expect(MenuIcon).toBeDefined();
    expect(OvertimeIcon).toBeDefined();
    expect(ReportsIcon).toBeDefined();
    expect(RequestsIcon).toBeDefined();
    expect(ScheduleIcon).toBeDefined();
    expect(SettingsIcon).toBeDefined();
    expect(SignOutIcon).toBeDefined();
    expect(SwapIcon).toBeDefined();
    expect(UploadIcon).toBeDefined();
    expect(UsersIcon).toBeDefined();
  });
});
