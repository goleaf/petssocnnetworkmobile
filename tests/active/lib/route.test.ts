/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { GET, PATCH, POST, PUT } from "@/app/api/admin/orgs/route"
import { NextRequest } from "next/server"
import {
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  addOrganization,
} from "@/lib/storage"
import type { Organization } from "@/lib/types"

// Mock the storage functions
vi.mock("@/lib/storage", () => ({
  getOrganizations: vi.fn(),
  getOrganizationById: vi.fn(),
  updateOrganization: vi.fn(),
  addOrganization: vi.fn(),
}))

const mockOrganizations: Organization[] = [
  {
    id: "org1",
    name: "Test Shelter",
    type: "shelter",
    verifiedAt: new Date().toISOString(),
  },
  {
    id: "org2",
    name: "Test Brand",
    type: "brand",
  },
]

describe("/api/admin/orgs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getOrganizations as ReturnType<typeof vi.fn>).mockReturnValue(mockOrganizations)
  })

  describe("GET", () => {
    it("returns all organizations", async () => {
      const request = new NextRequest("http://localhost/api/admin/orgs")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.organizations).toHaveLength(2)
      expect(getOrganizations).toHaveBeenCalled()
    })

    it("filters by verification status", async () => {
      const request = new NextRequest("http://localhost/api/admin/orgs?verified=true")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.organizations).toHaveLength(1)
      expect(data.organizations[0].verifiedAt).toBeDefined()
    })

    it("filters by type", async () => {
      const request = new NextRequest("http://localhost/api/admin/orgs?type=shelter")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.organizations).toHaveLength(1)
      expect(data.organizations[0].type).toBe("shelter")
    })
  })

  describe("PATCH", () => {
    it("updates organization", async () => {
      const mockOrg = mockOrganizations[0]
      ;(getOrganizationById as ReturnType<typeof vi.fn>).mockReturnValue(mockOrg)

      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "PATCH",
        body: JSON.stringify({
          id: "org1",
          updates: {
            verifiedAt: undefined,
          },
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(updateOrganization).toHaveBeenCalledWith(
        "org1",
        expect.objectContaining({
          verifiedAt: undefined,
          updatedAt: expect.any(String),
        })
      )
    })

    it("returns 404 for non-existent organization", async () => {
      ;(getOrganizationById as ReturnType<typeof vi.fn>).mockReturnValue(undefined)

      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "PATCH",
        body: JSON.stringify({
          id: "nonexistent",
          updates: {},
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Organization not found")
    })

    it("validates update fields", async () => {
      const mockOrg = mockOrganizations[0]
      ;(getOrganizationById as ReturnType<typeof vi.fn>).mockReturnValue(mockOrg)

      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "PATCH",
        body: JSON.stringify({
          id: "org1",
          updates: {
            invalidField: "value",
          },
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("Invalid fields")
    })
  })

  describe("POST", () => {
    it("creates new organization", async () => {
      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "POST",
        body: JSON.stringify({
          name: "New Org",
          type: "shelter",
          website: "https://example.com",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(addOrganization).toHaveBeenCalled()
      expect(data.organization).toMatchObject({
        name: "New Org",
        type: "shelter",
        website: "https://example.com",
      })
    })

    it("requires name and type", async () => {
      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "POST",
        body: JSON.stringify({
          name: "New Org",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("required")
    })
  })

  describe("PUT", () => {
    it("assigns representative role", async () => {
      const mockOrg = mockOrganizations[0]
      ;(getOrganizationById as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockOrg)
        .mockReturnValueOnce({ ...mockOrg, representatives: [{ userId: "user1", role: "admin", assignedAt: new Date().toISOString(), assignedBy: "admin" }] })

      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "PUT",
        body: JSON.stringify({
          orgId: "org1",
          userId: "user1",
          role: "admin",
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(updateOrganization).toHaveBeenCalled()
    })

    it("removes representative", async () => {
      const mockOrg = {
        ...mockOrganizations[0],
        representatives: [
          {
            userId: "user1",
            role: "admin" as const,
            assignedAt: new Date().toISOString(),
            assignedBy: "admin",
          },
        ],
      }
      ;(getOrganizationById as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockOrg)
        .mockReturnValueOnce({ ...mockOrg, representatives: [] })

      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "PUT",
        body: JSON.stringify({
          orgId: "org1",
          userId: "user1",
          action: "remove",
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(updateOrganization).toHaveBeenCalled()
    })

    it("requires orgId and userId", async () => {
      const request = new NextRequest("http://localhost/api/admin/orgs", {
        method: "PUT",
        body: JSON.stringify({
          orgId: "org1",
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("required")
    })
  })
})

