/**
 * @jest-environment node
 */

import { POST } from "../signed-url/route"
import { NextRequest } from "next/server"

// Mock AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({})),
  PutObjectCommand: jest.fn((params) => ({ ...params })),
}))

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(async () => "https://signed-upload-url.com"),
}))

describe("POST /api/upload/signed-url", () => {
  beforeEach(() => {
    process.env.AWS_S3_BUCKET = "test-bucket"
    process.env.AWS_REGION = "us-east-1"
    jest.clearAllMocks()
  })

  it("should generate signed upload URL successfully", async () => {
    const request = new NextRequest("http://localhost/api/upload/signed-url", {
      method: "POST",
      body: JSON.stringify({
        fileName: "test.jpg",
        fileType: "image/jpeg",
        fileSize: 1024,
        folder: "articles",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty("uploadUrl")
    expect(data).toHaveProperty("fileUrl")
    expect(data).toHaveProperty("expiresIn")
    expect(data.expiresIn).toBe(3600)
  })

  it("should reject non-image files", async () => {
    const request = new NextRequest("http://localhost/api/upload/signed-url", {
      method: "POST",
      body: JSON.stringify({
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("Only image files are allowed")
  })

  it("should reject files that are too large", async () => {
    const request = new NextRequest("http://localhost/api/upload/signed-url", {
      method: "POST",
      body: JSON.stringify({
        fileName: "large.jpg",
        fileType: "image/jpeg",
        fileSize: 11 * 1024 * 1024, // 11MB
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("File size must be less than 10MB")
  })

  it("should reject requests with missing fields", async () => {
    const request = new NextRequest("http://localhost/api/upload/signed-url", {
      method: "POST",
      body: JSON.stringify({
        fileName: "test.jpg",
        // Missing fileType and fileSize
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("Missing required fields")
  })

  it("should handle errors gracefully", async () => {
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
    getSignedUrl.mockRejectedValueOnce(new Error("AWS Error"))

    const request = new NextRequest("http://localhost/api/upload/signed-url", {
      method: "POST",
      body: JSON.stringify({
        fileName: "test.jpg",
        fileType: "image/jpeg",
        fileSize: 1024,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to generate upload URL")
  })
})

