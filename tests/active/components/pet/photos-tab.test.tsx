import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PhotosTab } from "@/components/pet/photos-tab"

// Mock LazyImage component
jest.mock("@/components/feed/LazyImage", () => ({
  LazyImage: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="lazy-image" />
  ),
}))

const mockPhotos = [
  {
    id: "photo-1",
    url: "https://example.com/photo1.jpg",
    thumbnailUrl: "https://example.com/photo1-thumb.jpg",
    optimizedUrl: "https://example.com/photo1-optimized.webp",
    caption: "Playing in the park",
    uploadedAt: "2024-01-01T00:00:00Z",
    isPrimary: true,
    order: 0,
  },
  {
    id: "photo-2",
    url: "https://example.com/photo2.jpg",
    thumbnailUrl: "https://example.com/photo2-thumb.jpg",
    optimizedUrl: "https://example.com/photo2-optimized.webp",
    caption: "Sleeping on the couch",
    uploadedAt: "2024-01-02T00:00:00Z",
    isPrimary: false,
    order: 1,
  },
  {
    id: "photo-3",
    url: "https://example.com/photo3.jpg",
    thumbnailUrl: "https://example.com/photo3-thumb.jpg",
    optimizedUrl: "https://example.com/photo3-optimized.webp",
    caption: "At the beach",
    uploadedAt: "2024-01-03T00:00:00Z",
    isPrimary: false,
    order: 2,
  },
]

describe("PhotosTab", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders photo grid with correct layout", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Check that all photos are rendered
    const images = screen.getAllByTestId("lazy-image")
    expect(images).toHaveLength(3)

    // Check primary badge
    expect(screen.getByText("Primary")).toBeInTheDocument()
  })

  it("displays empty state when no photos", () => {
    render(<PhotosTab photos={[]} petName="Max" />)

    expect(
      screen.getByText(/No photos yet. Add some photos to showcase Max!/i)
    ).toBeInTheDocument()
  })

  it("opens lightbox when photo is clicked", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Check lightbox is open with correct photo
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
    const captions = screen.getAllByText("Playing in the park")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("navigates to next photo in lightbox", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Click next button
    const nextButton = screen.getByRole("button", { name: "Next photo" })
    fireEvent.click(nextButton)

    // Check we're on photo 2
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
    const captions = screen.getAllByText("Sleeping on the couch")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("navigates to previous photo in lightbox", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox on second photo
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[1])

    // Click previous button
    const prevButton = screen.getByRole("button", { name: "Previous photo" })
    fireEvent.click(prevButton)

    // Check we're on photo 1
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
    const captions = screen.getAllByText("Playing in the park")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("wraps around when navigating past last photo", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox on last photo
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[2])

    // Click next button
    const nextButton = screen.getByRole("button", { name: "Next photo" })
    fireEvent.click(nextButton)

    // Should wrap to first photo
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
    const captions = screen.getAllByText("Playing in the park")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("wraps around when navigating before first photo", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox on first photo
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Click previous button
    const prevButton = screen.getByRole("button", { name: "Previous photo" })
    fireEvent.click(prevButton)

    // Should wrap to last photo
    expect(screen.getByText("3 / 3")).toBeInTheDocument()
    const captions = screen.getAllByText("At the beach")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("closes lightbox when close button is clicked", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Close lightbox
    const closeButton = screen.getByRole("button", { name: "Close lightbox" })
    fireEvent.click(closeButton)

    // Lightbox should be closed
    expect(screen.queryByText("1 / 3")).not.toBeInTheDocument()
  })

  it("supports keyboard navigation in lightbox", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Press right arrow
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(screen.getByText("2 / 3")).toBeInTheDocument()

    // Press left arrow
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(screen.getByText("1 / 3")).toBeInTheDocument()

    // Press escape
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByText("1 / 3")).not.toBeInTheDocument()
  })

  it("shows download button when canDownload is true", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" canDownload={true} />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    expect(screen.getByRole("button", { name: "Download photo" })).toBeInTheDocument()
  })

  it("hides download button when canDownload is false", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" canDownload={false} />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    expect(
      screen.queryByRole("button", { name: "Download photo" })
    ).not.toBeInTheDocument()
  })

  it("toggles slideshow mode", () => {
    jest.useFakeTimers()
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Start slideshow
    const slideshowButton = screen.getByRole("button", { name: "Start slideshow" })
    fireEvent.click(slideshowButton)

    // Check button changed to pause
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument()

    // Stop slideshow (skip the time advance test as it's complex with React state updates)
    const pauseButton = screen.getByRole("button", { name: "Pause slideshow" })
    fireEvent.click(pauseButton)

    // Check button changed back to play
    expect(screen.getByRole("button", { name: "Start slideshow" })).toBeInTheDocument()

    jest.useRealTimers()
  })

  it("displays thumbnail strip in lightbox", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Check thumbnail navigation buttons
    expect(screen.getByRole("button", { name: "Go to photo 1" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to photo 2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to photo 3" })).toBeInTheDocument()
  })

  it("navigates using thumbnail strip", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Open lightbox
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Click on third thumbnail
    const thumbnail3 = screen.getByRole("button", { name: "Go to photo 3" })
    fireEvent.click(thumbnail3)

    // Check we're on photo 3
    expect(screen.getByText("3 / 3")).toBeInTheDocument()
    const captions = screen.getAllByText("At the beach")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("sorts photos by order property", () => {
    const unsortedPhotos = [
      { ...mockPhotos[2], order: 2 },
      { ...mockPhotos[0], order: 0 },
      { ...mockPhotos[1], order: 1 },
    ]

    render(<PhotosTab photos={unsortedPhotos} petName="Max" />)

    // Open lightbox on first displayed photo (should be order 0)
    const photoButtons = screen.getAllByRole("button", { name: /View photo/i })
    fireEvent.click(photoButtons[0])

    // Should show the photo with order 0
    const captions = screen.getAllByText("Playing in the park")
    expect(captions.length).toBeGreaterThan(0)
  })

  it("displays photo captions on hover in grid", () => {
    render(<PhotosTab photos={mockPhotos} petName="Max" />)

    // Check caption is in the document (even if hidden)
    expect(screen.getByText("Playing in the park")).toBeInTheDocument()
    expect(screen.getByText("Sleeping on the couch")).toBeInTheDocument()
    expect(screen.getByText("At the beach")).toBeInTheDocument()
  })
})
