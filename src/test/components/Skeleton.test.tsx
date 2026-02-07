import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar } from '../../components/Skeleton'

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default props', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveClass('bg-gray-200')
    })

    it('should render text variant', () => {
      const { container } = render(<Skeleton variant="text" />)
      expect(container.firstChild).toHaveClass('rounded')
    })

    it('should render circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />)
      expect(container.firstChild).toHaveClass('rounded-full')
    })

    it('should render rectangular variant', () => {
      const { container } = render(<Skeleton variant="rectangular" />)
      expect(container.firstChild).toHaveClass('rounded-lg')
    })

    it('should apply pulse animation by default', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveClass('animate-pulse')
    })

    it('should apply wave animation', () => {
      const { container } = render(<Skeleton animation="wave" />)
      expect(container.firstChild).toHaveClass('animate-wave')
    })

    it('should apply no animation', () => {
      const { container } = render(<Skeleton animation="none" />)
      expect(container.firstChild).not.toHaveClass('animate-pulse')
      expect(container.firstChild).not.toHaveClass('animate-wave')
    })

    it('should apply custom width and height', () => {
      const { container } = render(<Skeleton width={100} height={50} />)
      const element = container.firstChild as HTMLElement
      expect(element.style.width).toBe('100px')
      expect(element.style.height).toBe('50px')
    })
  })

  describe('SkeletonText', () => {
    it('should render single line by default', () => {
      const { container } = render(<SkeletonText />)
      const skeletons = container.querySelectorAll('.bg-gray-200')
      expect(skeletons).toHaveLength(1)
    })

    it('should render multiple lines', () => {
      const { container } = render(<SkeletonText lines={3} />)
      const skeletons = container.querySelectorAll('.bg-gray-200')
      expect(skeletons).toHaveLength(3)
    })
  })

  describe('SkeletonCard', () => {
    it('should render card skeleton', () => {
      const { container } = render(<SkeletonCard />)
      expect(container.firstChild).toHaveClass('bg-white', 'rounded-lg', 'shadow')
    })
  })

  describe('SkeletonAvatar', () => {
    it('should render circular avatar with default size', () => {
      const { container } = render(<SkeletonAvatar />)
      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('rounded-full')
      expect(element.style.width).toBe('40px')
      expect(element.style.height).toBe('40px')
    })

    it('should render avatar with custom size', () => {
      const { container } = render(<SkeletonAvatar size={60} />)
      const element = container.firstChild as HTMLElement
      expect(element.style.width).toBe('60px')
      expect(element.style.height).toBe('60px')
    })
  })
})
