import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewToggle } from '../../components/ViewToggle'
import { ScheduleView } from '../../hooks/useScheduleView'

describe('ViewToggle Component', () => {
  it('should render both Weekly and Monthly options', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="monthly" onChange={mockOnChange} />)
    
    expect(screen.getByText('Weekly')).toBeInTheDocument()
    expect(screen.getByText('Monthly')).toBeInTheDocument()
  })

  it('should highlight the active view (weekly)', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="weekly" onChange={mockOnChange} />)
    
    const weeklyButton = screen.getByText('Weekly')
    const monthlyButton = screen.getByText('Monthly')
    
    // Active button should have primary background
    expect(weeklyButton).toHaveClass('bg-primary-600', 'text-white')
    // Inactive button should have gray text
    expect(monthlyButton).toHaveClass('text-gray-700')
  })

  it('should highlight the active view (monthly)', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="monthly" onChange={mockOnChange} />)
    
    const weeklyButton = screen.getByText('Weekly')
    const monthlyButton = screen.getByText('Monthly')
    
    // Active button should have primary background
    expect(monthlyButton).toHaveClass('bg-primary-600', 'text-white')
    // Inactive button should have gray text
    expect(weeklyButton).toHaveClass('text-gray-700')
  })

  it('should call onChange with "weekly" when Weekly button is clicked', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="monthly" onChange={mockOnChange} />)
    
    const weeklyButton = screen.getByText('Weekly')
    fireEvent.click(weeklyButton)
    
    expect(mockOnChange).toHaveBeenCalledWith('weekly')
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('should call onChange with "monthly" when Monthly button is clicked', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="weekly" onChange={mockOnChange} />)
    
    const monthlyButton = screen.getByText('Monthly')
    fireEvent.click(monthlyButton)
    
    expect(mockOnChange).toHaveBeenCalledWith('monthly')
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('should have proper ARIA attributes for accessibility', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="weekly" onChange={mockOnChange} />)
    
    const group = screen.getByRole('group')
    expect(group).toHaveAttribute('aria-label', 'Schedule view toggle')
    
    const weeklyButton = screen.getByText('Weekly')
    const monthlyButton = screen.getByText('Monthly')
    
    expect(weeklyButton).toHaveAttribute('aria-pressed', 'true')
    expect(monthlyButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('should update aria-pressed when value changes', () => {
    const mockOnChange = vi.fn()
    const { rerender } = render(<ViewToggle value="weekly" onChange={mockOnChange} />)
    
    let weeklyButton = screen.getByText('Weekly')
    let monthlyButton = screen.getByText('Monthly')
    
    expect(weeklyButton).toHaveAttribute('aria-pressed', 'true')
    expect(monthlyButton).toHaveAttribute('aria-pressed', 'false')
    
    // Rerender with different value
    rerender(<ViewToggle value="monthly" onChange={mockOnChange} />)
    
    weeklyButton = screen.getByText('Weekly')
    monthlyButton = screen.getByText('Monthly')
    
    expect(weeklyButton).toHaveAttribute('aria-pressed', 'false')
    expect(monthlyButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should have segmented control design with border and rounded corners', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="monthly" onChange={mockOnChange} />)
    
    const group = screen.getByRole('group')
    expect(group).toHaveClass('inline-flex', 'rounded-lg', 'border', 'border-gray-300', 'bg-white')
  })

  it('should have proper button styling with transitions', () => {
    const mockOnChange = vi.fn()
    render(<ViewToggle value="monthly" onChange={mockOnChange} />)
    
    const weeklyButton = screen.getByText('Weekly')
    const monthlyButton = screen.getByText('Monthly')
    
    // Both buttons should have transition classes
    expect(weeklyButton).toHaveClass('transition-colors', 'rounded-md')
    expect(monthlyButton).toHaveClass('transition-colors', 'rounded-md')
  })
})
