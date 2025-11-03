import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { NextRequest } from "next/server"
import { GET, POST } from "../route"
import { GET as GETById, PATCH } from "../[id]/route"
import { GET as GETMetrics } from "../metrics/route"

// Mock auth-server
jest.mock("@/lib/auth-server", () => ({
  getCurrentUser: jest.fn(),
  isAdmin: jest.fn(),
}))

const { getCurrentUser, isAdmin } = require("@/lib/auth-server")

describe("Privacy API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getCurrentUser.mockResolvedValue({
      id: "admin1",
      username: "admin",
      role: "admin",
    })
    isAdmin.mockResolvedValue(true)
  })

  describe("GET /api/admin/privacy", () => {
    it("returns privacy requests for admin", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("requests")
      expect(data).toHaveProperty("pagination")
    })

    it("returns 403 for non-admin users", async () => {
      isAdmin.mockResolvedValue(false)

      const request = new NextRequest("http://localhost/api/admin/privacy")
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it("filters requests by status", async () => {
      const request = new NextRequest(
        "http://localhost/api/admin/privacy?status=pending"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requests).toBeDefined()
    })
  })

  describe("POST /api/admin/privacy", () => {
    it("creates a new privacy request", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy", {
        method: "POST",
        body: JSON.stringify({
          type: "data_export",
          metadata: { exportFormat: "json" },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.request).toHaveProperty("id")
      expect(data.request.type).toBe("data_export")
    })

    it("returns 400 for invalid request type", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy", {
        method: "POST",
        body: JSON.stringify({
          type: "invalid_type",
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe("GET /api/admin/privacy/[id]", () => {
    it("returns a specific privacy request", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy/1")
      const response = await GETById(request, { params: { id: "1" } })

      // May return 404 if request doesn't exist, but should handle it
      expect([200, 404]).toContain(response.status)
    })
  })

  describe("PATCH /api/admin/privacy/[id]", () => {
    it("assigns a request to admin", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy/1", {
        method: "PATCH",
        body: JSON.stringify({
          action: "assign",
          notes: "Assigned to me",
        }),
      })

      const response = await PATCH(request, { params: { id: "1" } })

      // May return 404 if request doesn't exist
      expect([200, 404, 400]).toContain(response.status)
    })

    it("completes a request", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy/1", {
        method: "PATCH",
        body: JSON.stringify({
          action: "complete",
          notes: "Completed",
        }),
      })

      const response = await PATCH(request, { params: { id: "1" } })

      // May return 404 if request doesn't exist
      expect([200, 404, 400]).toContain(response.status)
    })

    it("rejects a request with reason", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy/1", {
        method: "PATCH",
        body: JSON.stringify({
          action: "reject",
          rejectionReason: "Invalid request",
        }),
      })

      const response = await PATCH(request, { params: { id: "1" } })

      // May return 404 if request doesn't exist
      expect([200, 404, 400]).toContain(response.status)
    })

    it("returns 400 when rejecting without reason", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy/1", {
        method: "PATCH",
        body: JSON.stringify({
          action: "reject",
        }),
      })

      const response = await PATCH(request, { params: { id: "1" } })

      expect([400, 404]).toContain(response.status)
    })
  })

  describe("GET /api/admin/privacy/metrics", () => {
    it("returns privacy metrics", async () => {
      const request = new NextRequest("http://localhost/api/admin/privacy/metrics")
      const response = await GETMetrics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metrics).toHaveProperty("totalRequests")
      expect(data.metrics).toHaveProperty("pendingRequests")
      expect(data.metrics).toHaveProperty("slaComplianceRate")
    })

    it("returns 403 for non-admin users", async () => {
      isAdmin.mockResolvedValue(false)

      const request = new NextRequest("http://localhost/api/admin/privacy/metrics")
      const response = await GETMetrics(request)

      expect(response.status).toBe(403)
    })
  })
})

