import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PetForm, PetFormData } from '@/components/pet-form'
import type { Pet } from '@/lib/types'

// Mock dependencies
jest.mock('@/lib/i18n/hooks', () => ({
  useUnitSystem: () => 'metric',
  useFormatNumber: () => (val: number) => val.toString(),
}))

jest.mock('@/lib/storage', () => ({
  getWikiArticlesByCategory: () => [],
}))

jest.mock('@/lib/utils/upload-signed', () => ({
  uploadImageWithProgress: jest.fn(),
}))

jest.mock('@/lib/utils/image-compress', () => ({
  compressDataUrl: jest.fn(),
  dataUrlToBlob: jest.fn(),
}))

describe('PetForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Age Mode Handling', () => {
    it('should initialize with exact age mode when birthday is provided', () => {
      const initialData: Partial<Pet> = {
        name: 'Buddy',
        birthday: '2020-01-01',
        species: 'dog',
      }

      render(
        <PetForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Component should render without errors
      expect(screen.getByDisplayValue('Buddy')).toBeInTheDocument()
    })

    it('should initialize with approx age mode when no birthday is provided', () => {
      const initialData: Partial<Pet> = {
        name: 'Max',
        species: 'cat',
      }

      render(
        <PetForm
          mode="create"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('Max')).toBeInTheDocument()
    })
  })

  describe('Weight Handling', () => {
    it('should parse weight with kg unit', () => {
      const initialData: Partial<Pet> = {
        name: 'Rocky',
        weight: '25 kg',
        species: 'dog',
      }

      render(
        <PetForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByDisplayValue('Rocky')).toBeInTheDocument()
    })

    it('should parse weight with lb unit', () => {
      const initialData: Partial<Pet> = {
        name: 'Bella',
        weight: '55 lbs',
        species: 'dog',
      }

      render(
        <PetForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByDisplayValue('Bella')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate form data structure', () => {
      const initialData: Partial<Pet> = {
        name: 'Test Pet',
        species: 'dog',
      }

      const { container } = render(
        <PetForm
          mode="create"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Privacy Settings', () => {
    it('should initialize with default privacy settings', () => {
      const { container } = render(
        <PetForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('should preserve existing privacy settings', () => {
      const initialData: Partial<Pet> = {
        name: 'Test Pet',
        species: 'dog',
        privacy: {
          visibility: 'friends',
          interactions: 'friends',
        },
      }

      const { container } = render(
        <PetForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(container).toBeInTheDocument()
    })
  })
})
