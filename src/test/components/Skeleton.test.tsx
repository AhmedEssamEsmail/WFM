import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonList,
} from '../../components/Skeleton';

describe('Skeleton', () => {
  it('should render with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-gray-200');
    expect(skeleton).toHaveClass('rounded');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded');
  });

  it('should render circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should render rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('should apply custom width and height', () => {
    const { container } = render(<Skeleton width={200} height={100} />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
  });

  it('should apply custom width and height as strings', () => {
    const { container } = render(<Skeleton width="50%" height="2rem" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveStyle({ width: '50%', height: '2rem' });
  });

  it('should apply pulse animation by default', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should apply wave animation', () => {
    const { container } = render(<Skeleton animation="wave" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('animate-wave');
  });

  it('should apply no animation', () => {
    const { container } = render(<Skeleton animation="none" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).not.toHaveClass('animate-pulse');
    expect(skeleton).not.toHaveClass('animate-wave');
  });

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('SkeletonText', () => {
  it('should render single line by default', () => {
    const { container } = render(<SkeletonText />);
    const skeletons = container.querySelectorAll('.bg-gray-200');

    expect(skeletons).toHaveLength(1);
  });

  it('should render multiple lines', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletons = container.querySelectorAll('.bg-gray-200');

    expect(skeletons).toHaveLength(3);
  });

  it('should make last line shorter', () => {
    const { container } = render(<SkeletonText lines={2} />);
    const skeletons = container.querySelectorAll('.bg-gray-200');

    expect(skeletons[0]).toHaveStyle({ width: '100%' });
    expect(skeletons[1]).toHaveStyle({ width: '80%' });
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonText className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('SkeletonCard', () => {
  it('should render card with title and text lines', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.bg-gray-200');

    // 1 title + 3 text lines
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('should have card styling', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('shadow');
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonCard className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('SkeletonTable', () => {
  it('should render table with default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.border-b.border-gray-200.p-4');

    // 5 rows + 1 header
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('should render custom number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll('.border-b.border-gray-200.p-4');

    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should render custom number of columns', () => {
    const { container } = render(<SkeletonTable columns={5} />);
    const headerCells = container.querySelector('.bg-gray-50')?.querySelectorAll('.bg-gray-200');

    expect(headerCells).toHaveLength(5);
  });

  it('should have table styling', () => {
    const { container } = render(<SkeletonTable />);
    const table = container.firstChild as HTMLElement;

    expect(table).toHaveClass('rounded-lg');
    expect(table).toHaveClass('bg-white');
    expect(table).toHaveClass('shadow');
  });
});

describe('SkeletonAvatar', () => {
  it('should render circular skeleton with default size', () => {
    const { container } = render(<SkeletonAvatar />);
    const avatar = container.firstChild as HTMLElement;

    expect(avatar).toHaveClass('rounded-full');
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('should render with custom size', () => {
    const { container } = render(<SkeletonAvatar size={64} />);
    const avatar = container.firstChild as HTMLElement;

    expect(avatar).toHaveStyle({ width: '64px', height: '64px' });
  });
});

describe('SkeletonButton', () => {
  it('should render button skeleton', () => {
    const { container } = render(<SkeletonButton />);
    const button = container.firstChild as HTMLElement;

    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveStyle({ height: '2.5rem', width: '6rem' });
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonButton className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('SkeletonList', () => {
  it('should render list with default items', () => {
    const { container } = render(<SkeletonList />);
    const items = container.querySelectorAll('.flex.items-center.gap-4');

    expect(items).toHaveLength(5);
  });

  it('should render custom number of items', () => {
    const { container } = render(<SkeletonList items={3} />);
    const items = container.querySelectorAll('.flex.items-center.gap-4');

    expect(items).toHaveLength(3);
  });

  it('should render avatar and text in each item', () => {
    const { container } = render(<SkeletonList items={1} />);
    const item = container.querySelector('.flex.items-center.gap-4');
    const avatar = item?.querySelector('.rounded-full');
    const textLines = item?.querySelectorAll('.bg-gray-200');

    expect(avatar).toBeInTheDocument();
    expect(textLines?.length).toBeGreaterThanOrEqual(2);
  });
});
