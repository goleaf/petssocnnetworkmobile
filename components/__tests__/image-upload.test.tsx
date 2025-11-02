/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ImageUpload } from "../image-upload"
import { uploadImage } from "@/lib/storage-upload"

jest.mock("@/lib/storage-upload", () => ({
  uploadImage: jest.fn(),
  getImageDimensions: jest.fn(),
}))

jest.mock("@capacitor/camera", () => ({
  Camera: {
    getPhoto: jest.fn(),
  },
}))

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}))

describe("ImageUpload", () => {
  const mockOnUploadComplete = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(uploadImage as jest.Mock).mockClear()
  })

  it("should render upload buttons", () => {
    render(
      <ImageUpload onUploadComplete={mockOnUploadComplete} onError={mockOnError} />
    )

    expect(screen.getByText(/Choose Image/i)).toBeInTheDocument()
  })

  it("should show camera button on mobile", () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    })

    render(
      <ImageUpload onUploadComplete={mockOnUploadComplete} onError={mockOnError} />
    )

    expect(screen.getByText(/Camera/i)).toBeInTheDocument()
    expect(screen.getByText(/Gallery/i)).toBeInTheDocument()
  })

  it("should handle file upload", async () => {
    const mockResult = {
      url: "https://example.com/image.jpg",
      width: 800,
      height: 600,
      size: 1024,
      mimeType: "image/jpeg",
    }

    ;(uploadImage as jest.Mock).mockResolvedValueOnce(mockResult)

    render(
      <ImageUpload onUploadComplete={mockOnUploadComplete} onError={mockOnError} />
    )

    const fileInput = screen.getByRole("button", { name: /Choose Image/i })
    fireEvent.click(fileInput)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith(file, undefined)
      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockResult)
    })
  })

  it("should display error on upload failure", async () => {
    const error = new Error("Upload failed")
    ;(uploadImage as jest.Mock).mockRejectedValueOnce(error)

    render(
      <ImageUpload onUploadComplete={mockOnUploadComplete} onError={mockOnError} />
    )

    const fileInput = screen.getByRole("button", { name: /Choose Image/i })
    fireEvent.click(fileInput)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(error)
    })
  })

  it("should show preview when existing image URL is provided", () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
        existingImageUrl="https://example.com/image.jpg"
      />
    )

    const img = document.querySelector("img")
    expect(img).toBeInTheDocument()
    expect(img?.src).toContain("example.com/image.jpg")
  })

  it("should call onRemove when remove button is clicked", () => {
    const mockOnRemove = jest.fn()

    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
        existingImageUrl="https://example.com/image.jpg"
        onRemove={mockOnRemove}
      />
    )

    const removeButton = screen.getByRole("button", { name: /remove/i })
    fireEvent.click(removeButton)

    expect(mockOnRemove).toHaveBeenCalled()
  })
})

