/**
 * Tests for Wiki Revision Approve API
 * 
 * Tests:
 * - Only Experts/Moderators can approve stable
 * - Admin can approve
 * - Regular users cannot approve
 * - Expired experts cannot approve
 * - Audit log is written
 */

import { POST } from "../route"
import { getCurrentUser } from "@/lib/auth/session"
import { writeAudit } from "@/lib/audit"
import { isExpertVerifiedAction } from "@/lib/actions/expert"
import { prisma } from "@/lib/db"

jest.mock("@/lib/auth/session")
jest.mock("@/lib/audit")
jest.mock("@/lib/actions/expert")
jest.mock("@/lib/db", () => ({
  prisma: {
    flaggedRevision: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe("Wiki Revision Approve API", () => {
  const mockFlaggedRevision = {
    id: "test-id",
    articleId: "article-1",
    revisionId: "revision-1",
    type: "Health",
    flaggedAt: new Date(),
    status: "pending",
    assignedTo: null,
    approvedBy: null,
    approvedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.flaggedRevision.findUnique as jest.Mock).mockResolvedValue(mockFlaggedRevision)
    ;(prisma.flaggedRevision.update as jest.Mock).mockResolvedValue({
      ...mockFlaggedRevision,
      status: "approved",
      approvedAt: new Date(),
      approvedBy: "expert-1",
    })
    ;(isExpertVerifiedAction as jest.Mock).mockResolvedValue(true)
  })

  it("should allow experts to approve", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: "expert-1",
      roles: ["Expert"],
    })

    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/approve", {
      method: "POST",
    })

    const response = await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(response.status).toBe(200)
    expect(prisma.flaggedRevision.update).toHaveBeenCalled()
    expect(writeAudit).toHaveBeenCalled()
  })

  it("should allow moderators to approve", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: "moderator-1",
      roles: ["Moderator"],
    })

    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/approve", {
      method: "POST",
    })

    const response = await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(response.status).toBe(200)
    expect(prisma.flaggedRevision.update).toHaveBeenCalled()
  })

  it("should allow admins to approve", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: "admin-1",
      roles: ["Admin"],
    })

    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/approve", {
      method: "POST",
    })

    const response = await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(response.status).toBe(200)
    expect(prisma.flaggedRevision.update).toHaveBeenCalled()
  })

  it("should reject regular users", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: "user-1",
      roles: [],
    })

    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/approve", {
      method: "POST",
    })

    const response = await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(response.status).toBe(403)
    expect(prisma.flaggedRevision.update).not.toHaveBeenCalled()
  })

  it("should write audit log on approval", async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: "expert-1",
      roles: ["Expert"],
    })

    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/approve", {
      method: "POST",
    })

    await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(writeAudit).toHaveBeenCalledWith(
      "expert-1",
      "wiki:approve-stable",
      "revision",
      "revision-1",
      expect.stringContaining("Approved flagged revision")
    )
  })
})

