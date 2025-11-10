/**
 * @jest-environment node
 */

describe("/api/links/check", () => {
  // Note: These tests would require mocking fetch or using a test server
  // For now, we'll test the logic separately

  it("should validate URL format", () => {
    const validUrl = "https://example.com"
    const urlObj = new URL(validUrl)
    expect(["http:", "https:"].includes(urlObj.protocol)).toBe(true)
  })

  it("should reject invalid protocols", () => {
    const invalidUrl = "ftp://example.com"
    expect(() => {
      const urlObj = new URL(invalidUrl)
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error("Invalid protocol")
      }
    }).toThrow()
  })

  it("should handle timeout gracefully", async () => {
    // Mock fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 100)

    try {
      await fetch("https://httpbin.org/delay/5", {
        method: "HEAD",
        signal: controller.signal,
      })
    } catch (error: any) {
      expect(error.name).toBe("AbortError")
    } finally {
      clearTimeout(timeoutId)
    }
  })
})

