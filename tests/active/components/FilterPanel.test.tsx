import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FilterPanel, FeedFilters } from '@/components/feed/FilterPanel'

describe('FilterPanel', () => {
  const defaultFilters: FeedFilters = {
    contentTypes: [],
    dateRange: 'all',
    highQualityOnly: false,
    topics: [],
    mutedWords: [],
  }

  const mockOnOpenChange = jest.fn()
  const mockOnFiltersChange = jest.fn()
  const mockOnApply = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('renders filter panel when open', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    expect(screen.getByText('Feed Filters')).toBeInTheDocument()
    expect(screen.getByText('Customize what you see in your feed')).toBeInTheDocument()
  })

  it('displays content type checkboxes', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    expect(screen.getByText('Photos')).toBeInTheDocument()
    expect(screen.getByText('Videos')).toBeInTheDocument()
    expect(screen.getByText('Text Only')).toBeInTheDocument()
    expect(screen.getByText('Polls')).toBeInTheDocument()
    expect(screen.getByText('Shared Posts')).toBeInTheDocument()
  })

  it('toggles content type selection', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    const photosCheckbox = screen.getByRole('checkbox', { name: /photos/i })
    fireEvent.click(photosCheckbox)

    expect(photosCheckbox).toBeChecked()
  })

  it('displays date range selector', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    expect(screen.getByText('Date Range')).toBeInTheDocument()
  })

  it('shows custom date inputs when custom range selected', async () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={{ ...defaultFilters, dateRange: 'custom' }}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
      expect(screen.getByLabelText('End Date')).toBeInTheDocument()
    })
  })

  it('displays high quality toggle', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    expect(screen.getByText('High Quality Only')).toBeInTheDocument()
    expect(screen.getByText(/Filter out low-resolution/i)).toBeInTheDocument()
  })

  it('adds and removes topics', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    const topicInput = screen.getByPlaceholderText('Add hashtag...')
    const addButton = screen.getAllByText('Add')[0]

    fireEvent.change(topicInput, { target: { value: 'dogs' } })
    fireEvent.click(addButton)

    expect(screen.getByText('#dogs')).toBeInTheDocument()
  })

  it('adds and removes muted words', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    const mutedWordInput = screen.getByPlaceholderText('Add word to mute...')
    const addButton = screen.getAllByText('Add')[1]

    fireEvent.change(mutedWordInput, { target: { value: 'spam' } })
    fireEvent.click(addButton)

    expect(screen.getByText('spam')).toBeInTheDocument()
  })

  it('shows active filter count', () => {
    const filtersWithActive: FeedFilters = {
      contentTypes: ['photo_album', 'video'],
      dateRange: 'week',
      highQualityOnly: true,
      topics: ['dogs'],
      mutedWords: ['spam'],
    }

    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    expect(screen.getByText('(6 active)')).toBeInTheDocument()
  })

  it('applies filters and closes panel', () => {
    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    const applyButton = screen.getByText('Apply Filters')
    fireEvent.click(applyButton)

    expect(mockOnApply).toHaveBeenCalled()
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets filters to default', () => {
    const filtersWithActive: FeedFilters = {
      contentTypes: ['photo_album'],
      dateRange: 'week',
      highQualityOnly: true,
      topics: ['dogs'],
      mutedWords: ['spam'],
    }

    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)

    // After reset, no filters should be active
    expect(screen.queryByText('(6 active)')).not.toBeInTheDocument()
  })

  it('saves filter preset to localStorage', () => {
    const filtersWithActive: FeedFilters = {
      contentTypes: ['photo_album'],
      dateRange: 'week',
      highQualityOnly: true,
      topics: [],
      mutedWords: [],
    }

    // Mock window.prompt
    global.prompt = jest.fn(() => 'My Preset')

    render(
      <FilterPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        onApply={mockOnApply}
      />
    )

    const saveButton = screen.getByText('Save Preset')
    fireEvent.click(saveButton)

    const savedPresets = localStorage.getItem('feedFilterPresets')
    expect(savedPresets).toBeTruthy()
    
    const presets = JSON.parse(savedPresets!)
    expect(presets).toHaveLength(1)
    expect(presets[0].name).toBe('My Preset')
  })
})
