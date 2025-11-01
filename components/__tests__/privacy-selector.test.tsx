import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrivacySelector } from '../privacy-selector'

describe('PrivacySelector', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with default public value', () => {
    render(<PrivacySelector value="public" onChange={mockOnChange} />)
    
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('should render with friends-only value', () => {
    render(<PrivacySelector value="followers-only" onChange={mockOnChange} />)
    
    expect(screen.getByText('Friends Only')).toBeInTheDocument()
  })

  it('should render with private value', () => {
    render(<PrivacySelector value="private" onChange={mockOnChange} />)
    
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('should open dropdown and show all privacy options', async () => {
    render(<PrivacySelector value="public" onChange={mockOnChange} />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      // Privacy options might appear multiple times (button and dropdown)
      const publicTexts = screen.getAllByText('Public')
      const followersTexts = screen.getAllByText('Friends Only')
      const privateTexts = screen.getAllByText('Private')
      expect(publicTexts.length).toBeGreaterThan(0)
      expect(followersTexts.length).toBeGreaterThan(0)
      expect(privateTexts.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should call onChange when different option is selected', async () => {
    render(<PrivacySelector value="public" onChange={mockOnChange} />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      const privateOption = screen.getByText('Private')
      expect(privateOption).toBeInTheDocument()
    })
    
    const privateOption = screen.getByText('Private')
    await userEvent.click(privateOption.closest('div')!)
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('private')
    })
  })

  it('should display descriptions for each option', async () => {
    render(<PrivacySelector value="public" onChange={mockOnChange} />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/anyone can see this/i)).toBeInTheDocument()
      expect(screen.getByText(/only your friends can see this/i)).toBeInTheDocument()
      expect(screen.getByText(/only you can see this/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should apply custom className', () => {
    const { container } = render(
      <PrivacySelector value="public" onChange={mockOnChange} className="custom-class" />
    )
    
    const button = container.querySelector('button.custom-class')
    expect(button).toBeInTheDocument()
  })

  it('should update displayed value when value prop changes', () => {
    const { rerender } = render(
      <PrivacySelector value="public" onChange={mockOnChange} />
    )
    
    expect(screen.getByText('Public')).toBeInTheDocument()
    
    rerender(<PrivacySelector value="private" onChange={mockOnChange} />)
    
    expect(screen.getByText('Private')).toBeInTheDocument()
  })
})
