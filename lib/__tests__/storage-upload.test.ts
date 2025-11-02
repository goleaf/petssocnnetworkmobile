import { uploadImage, getSignedUploadUrl, getImageDimensions } from "../storage-upload"

// Mock fetch
global.fetch = jest.fn()

describe("storage-upload", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe("getSignedUploadUrl", () => {
    it("should return signed upload URL and file URL", async () => {
      const mockResponse = {
        uploadUrl: "https://s3.amazonaws.com/bucket/upload-url",
        fileUrl: "https://s3.amazonaws.com/bucket/file.jpg",
        expiresIn: 3600,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await getSignedUploadUrl("test.jpg", "image/jpeg", 1024, "articles")

      expect(global.fetch).toHaveBeenCalledWith("/api/upload/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: "test.jpg",
          fileType: "image/jpeg",
          fileSize: 1024,
          folder: "articles",
        }),
      })

      expect(result).toEqual(mockResponse)
    })

    it("should throw error on API failure", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "API Error" }),
      })

      await expect(
        getSignedUploadUrl("test.jpg", "image/jpeg", 1024)
      ).rejects.toThrow("API Error")
    })
  })

  describe("getImageDimensions", () => {
    it("should return image dimensions", async () => {
      // Create a mock image file
      const blob = new Blob(["mock image data"], { type: "image/jpeg" })
      const file = new File([blob], "test.jpg", { type: "image/jpeg" })

      // Mock Image constructor
      const mockImage = {
        naturalWidth: 800,
        naturalHeight: 600,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      }

      Object.defineProperty(global, "Image", {
        value: jest.fn(() => mockImage),
        writable: true,
      })

      Object.defineProperty(global, "URL", {
        value: {
          createObjectURL: jest.fn(() => "blob:test-url"),
          revokeObjectURL: jest.fn(),
        },
        writable: true,
      })

      const dimensionsPromise = getImageDimensions(file)

      // Simulate image load immediately
      process.nextTick(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      const dimensions = await dimensionsPromise

      expect(dimensions).toEqual({ width: 800, height: 600 })
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
    })
  })

  describe("uploadImage", () => {
    it("should upload image successfully", async () => {
      const mockSignedUrlResponse = {
        uploadUrl: "https://s3.amazonaws.com/bucket/upload-url",
        fileUrl: "https://s3.amazonaws.com/bucket/file.jpg",
        expiresIn: 3600,
      }

      const blob = new Blob(["mock image data"], { type: "image/jpeg" })
      const file = new File([blob], "test.jpg", { type: "image/jpeg" })

      // Mock Image for dimensions
      const mockImage = {
        naturalWidth: 800,
        naturalHeight: 600,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      }

      Object.defineProperty(global, "Image", {
        value: jest.fn(() => mockImage),
        writable: true,
      })

      Object.defineProperty(global, "URL", {
        value: {
          createObjectURL: jest.fn(() => "blob:test-url"),
          revokeObjectURL: jest.fn(),
        },
        writable: true,
      })

      // Mock API calls
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSignedUrlResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      const resultPromise = uploadImage(file, "articles")

      // Simulate image load for dimensions
      process.nextTick(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      })

      const result = await resultPromise

      expect(result.url).toBe(mockSignedUrlResponse.fileUrl)
      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
      expect(result.size).toBe(file.size)
      expect(result.mimeType).toBe("image/jpeg")
    })

    it("should reject non-image files", async () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" })

      await expect(uploadImage(file)).rejects.toThrow("File must be an image")
    })

    it("should reject files that are too large", async () => {
      const largeBlob = new Blob([new ArrayBuffer(11 * 1024 * 1024)])
      const file = new File([largeBlob], "large.jpg", { type: "image/jpeg" })

      await expect(uploadImage(file)).rejects.toThrow("Image size must be less than 10MB")
    })
  })
})

