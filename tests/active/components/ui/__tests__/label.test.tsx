import React from 'react'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('should render Label component', () => {
    render(<Label htmlFor="test">Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('Test Label')).toHaveAttribute('data-slot', 'label')
  })

  it('should apply htmlFor attribute', () => {
    render(<Label htmlFor="input-id">Label Text</Label>)
    const label = screen.getByText('Label Text')
    expect(label).toHaveAttribute('for', 'input-id')
  })

  it('should apply custom className', () => {
    render(<Label className="custom-class">Label</Label>)
    const label = screen.getByText('Label')
    expect(label).toHaveClass('custom-class')
  })

  it('should handle onClick', () => {
    const handleClick = jest.fn()
    render(<Label onClick={handleClick}>Clickable Label</Label>)
    screen.getByText('Clickable Label').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

