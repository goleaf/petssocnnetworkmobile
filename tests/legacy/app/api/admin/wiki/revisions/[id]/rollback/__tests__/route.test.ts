/**
 * Tests for Wiki Revision Rollback API
 * 
 * Tests:
 * - Rollback creates new revision
 * - Rollback updates flagged revision status
 * - Rollback is audited
 */

import { POST } from "../route"
import { getCurrentUser } from "@/lib/auth/session"
import { writeAudit } from "@/lib/audit"
import { prisma } from "@/lib/db"

jest.mock("@/lib/auth/session")
jest.mock("@/lib/audit")
jest.mock("@/lib/db", () => ({
  prisma: {
    flaggedRevision: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    article: {
      findUnique: jest.fn(),
    },
    revision: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe("Wiki Revision Rollback API", () => {
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

  const mockArticle = {
    id: "article-1",
    title: "Test Article",
    slug: "test-article",
    revisions: [
      {
        id: "stable-1",
        rev: 1,
        authorId: "author-1",
        summary: "Initial",
        contentJSON: { blocks: [{ type: "paragraph", text: "Stable content" }] },
        infoboxJSON: null,
        approvedById: "approver-1",
        approvedAt: new Date(),
        createdAt: new Date(),
      },
    ],
  }

  const mockRollbackRevision = {
    id: "rollback-1",
    articleId: "article-1",
    rev: 2,
    authorId: "expert-1",
    summary: "Rolled back to stable revision",
    contentJSON: { blocks: [{ type: "paragraph", text: "Stable content" }] },
    infoboxJSON: null,
    approvedById: "expert-1",
    approvedAt: new Date(),
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: "expert-1",
      roles: ["Expert"],
    })
    ;(prisma.flaggedRevision.findUnique as jest.Mock).mockResolvedValue(mockFlaggedRevision)
    ;(prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle)
    ;(prisma.revision.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.revision.create as jest.Mock).mockResolvedValue(mockRollbackRevision)
    ;(prisma.flaggedRevision.update as jest.Mock).mockResolvedValue({
      ...mockFlaggedRevision,
      status: "rolled-back",
    })
  })

  it("should create rollback revision", async () => {
    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/rollback", {
      method: "POST",
      body: JSON.stringify({ reason: "Test rollback" }),
    })

    const response = await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(response.status).toBe(200)
    expect(prisma.revision.create).toHaveBeenCalled()
    expect(prisma.flaggedRevision.update).toHaveBeenCalledWith({
      where: { id: "test-id" },
      data: { status: "rolled-back" },
    })
  })

  it("should write audit log on rollback", async () => {
    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/rollback", {
      method: "POST",
      body: JSON.stringify({ reason: "Test rollback" }),
    })

    await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(writeAudit).toHaveBeenCalledWith(
      "expert-1",
      "wiki:rollback",
      "revision",
      "revision-1",
      "Test rollback",
      expect.objectContaining({
        articleId: "article-1",
        articleTitle: "Test Article",
        stableRevisionId: "stable-1",
        rollbackRevisionId: "rollback-1",
      })
    )
  })

  it("should use default reason if not provided", async () => {
    const request = new Request("http://localhost/api/admin/wiki/revisions/test-id/rollback", {
      method: "POST",
      body: JSON.stringify({}),
    })

    await POST(request, {
      params: Promise.resolve({ id: "test-id" }),
    })

    expect(prisma.revision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          summary: "Rolled back to stable revision",
        }),
      })
    )
  })
})

