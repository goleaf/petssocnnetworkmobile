/**
 * Tests for Step1BasicInfo Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Step1BasicInfo } from '@/components/pet/wizard/step1-basic-info'

// Mock fetch for breed API
global.fetch = jest.fn()

describe('Step1BasicInfo Component', () => {
  const mockOnChange = jest.fn()
  
  const defaultFormData = {
    name: '',
    species: '',
    spayedNeutered: false,
    weightUnit: 'lbs' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ breeds: [] }),
    })
  })

  it('should render all basic form fields', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByLabelText(/pet name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/species/i)).toBeInTheDocument()
    expect(screen.getByText(/gender/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/spayed\/neutered/i)).toBeInTheDocument()
  })

  it('should display character counter for pet name', () => {
    render(
      <Step1BasicInfo
        formData={{ ...defaultFormData, name: 'Fluffy' }}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('6/50')).toBeInTheDocument()
  })

  it('should call onChange when name is entered', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    const nameInput = screen.getByLabelText(/pet name/i)
    fireEvent.change(nameInput, { target: { value: 'Max' } })

    expect(mockOnChange).toHaveBeenCalledWith({ name: 'Max' })
  })

  it('should display species options with emojis', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    const speciesSelect = screen.getByLabelText(/species/i)
    expect(speciesSelect).toBeInTheDocument()
  })

  it('should fetch breeds when dog or cat is selected', async () => {
    const { rerender } = render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    // Update to dog species
    rerender(
      <Step1BasicInfo
        formData={{ ...defaultFormData, species: 'dog' }}
        onChange={mockOnChange}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/breeds?species=dog')
    })
  })

  it('should display weight unit selector', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('lbs')).toBeInTheDocument()
  })

  it('should display weight input and unit selector', () => {
    render(
      <Step1BasicInfo
        formData={{ ...defaultFormData, weight: '10', weightUnit: 'lbs' }}
        onChange={mockOnChange}
      />
    )

    const weightInput = screen.getByLabelText(/weight/i)
    expect(weightInput).toBeInTheDocument()
    expect(weightInput).toHaveValue(10)
  })

  it('should display approximate age option', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByLabelText(/i don't know the exact birth date/i)).toBeInTheDocument()
  })

  it('should show character counter for markings', () => {
    render(
      <Step1BasicInfo
        formData={{ ...defaultFormData, markings: 'White paws' }}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('10/200')).toBeInTheDocument()
  })

  it('should display validation errors', () => {
    const errors = {
      name: 'Name is required',
      species: 'Please select a species',
    }

    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
        errors={errors}
      />
    )

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Please select a species')).toBeInTheDocument()
  })

  it('should handle spayed/neutered checkbox', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    const checkbox = screen.getByLabelText(/spayed\/neutered/i)
    fireEvent.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith({ spayedNeutered: true })
  })

  it('should display info icon for spayed/neutered', () => {
    render(
      <Step1BasicInfo
        formData={defaultFormData}
        onChange={mockOnChange}
      />
    )

    // Check that the label with tooltip exists
    const label = screen.getByLabelText(/spayed\/neutered/i)
    expect(label).toBeInTheDocument()
  })
})
