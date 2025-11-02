import {
  calculateEditAge,
  filterEditRequests,
  checkRateLimit,
  approveEditRequest,
  rejectEditRequest,
  createChangesSummary,
  getPaginatedEditRequests,
  getEditRequestAuditTrail,
  getModerationStats,
  type EditRequestFilter,
} from "@/lib/moderation"
import {
  addEditRequest,
  getEditRequests,
  getEditRequestsByAuthor,
  updateEditRequest,
  getUserById,
  getBlogPostById,
  updateBlogPost,
} from "@/lib/storage"
import type { EditRequest, EditRequestAuditLog } from "@/lib/types"

// Mock storage functions
jest.mock("@/lib/storage", () => ({
  addEditRequest: jest.fn(),
  getEditRequests: jest.fn(),
  getEditRequestsByAuthor: jest.fn(),
  updateEditRequest: jest.fn(),
  getUserById: jest.fn(),
  getBlogPostById: jest.fn(),
  updateBlogPost: jest.fn(),
  addNotification: jest.fn(),
}))

describe("Moderation Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe("calculateEditAge", () => {
    it("should calculate age in hours correctly", () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const age = calculateEditAge(twoHoursAgo.toISOString())
      expect(age).toBe(2)
    })

    it("should handle edge case of just created", () => {
      const now = new Date()
      const age = calculateEditAge(now.toISOString())
      expect(age).toBe(0)
    })
  })

  describe("filterEditRequests", () => {
    const mockRequests: EditRequest[] = [
      {
        id: "1",
        type: "blog",
        contentId: "post1",
        authorId: "user1",
        status: "pending",
        originalData: {},
        editedData: {},
        changesSummary: "Changed title",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        id: "2",
        type: "wiki",
        contentId: "wiki1",
        authorId: "user2",
        reporterId: "reporter1",
        status: "approved",
        originalData: {},
        editedData: {},
        changesSummary: "Updated content",
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
      },
      {
        id: "3",
        type: "blog",
        contentId: "post2",
        authorId: "user1",
        status: "pending",
        priority: "high",
        originalData: {},
        editedData: {},
        changesSummary: "Fixed typo",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
    ]

    beforeEach(() => {
      ;(getEditRequests as jest.Mock).mockReturnValue(mockRequests)
    })

    it("should filter by type", () => {
      const filtered = filterEditRequests({ type: "blog" })
      expect(filtered).toHaveLength(2)
      expect(filtered.every((r) => r.type === "blog")).toBe(true)
    })

    it("should filter by status", () => {
      const filtered = filterEditRequests({ status: "pending" })
      expect(filtered).toHaveLength(2)
      expect(filtered.every((r) => r.status === "pending")).toBe(true)
    })

    it("should filter by reporterId", () => {
      const filtered = filterEditRequests({ reporterId: "reporter1" })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].reporterId).toBe("reporter1")
    })

    it("should filter by authorId", () => {
      const filtered = filterEditRequests({ authorId: "user1" })
      expect(filtered).toHaveLength(2)
      expect(filtered.every((r) => r.authorId === "user1")).toBe(true)
    })

    it("should filter by minAge", () => {
      const filtered = filterEditRequests({ minAge: 3 })
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach((req) => {
        const age = calculateEditAge(req.createdAt)
        expect(age).toBeGreaterThanOrEqual(3)
      })
    })

    it("should filter by maxAge", () => {
      const filtered = filterEditRequests({ maxAge: 3 })
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach((req) => {
        const age = calculateEditAge(req.createdAt)
        expect(age).toBeLessThanOrEqual(3)
      })
    })

    it("should filter by priority", () => {
      const filtered = filterEditRequests({ priority: "high" })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].priority).toBe("high")
    })

    it("should combine multiple filters", () => {
      const filtered = filterEditRequests({ type: "blog", status: "pending" })
      expect(filtered).toHaveLength(2)
      expect(filtered.every((r) => r.type === "blog" && r.status === "pending")).toBe(true)
    })

    it("should sort by priority then age", () => {
      const filtered = filterEditRequests({})
      expect(filtered.length).toBeGreaterThan(0)
      // High priority should come first
      const highPriorityIndex = filtered.findIndex((r) => r.priority === "high")
      if (highPriorityIndex !== -1) {
        // All items before should also be high priority
        for (let i = 0; i < highPriorityIndex; i++) {
          expect(filtered[i].priority).toBe("high")
        }
      }
    })
  })

  describe("checkRateLimit", () => {
    beforeEach(() => {
      ;(getEditRequestsByAuthor as jest.Mock).mockReturnValue([])
    })

    it("should allow requests within hourly limit", () => {
      const recentRequests: EditRequest[] = Array(5).fill(null).map((_, i) => ({
        id: `req${i}`,
        type: "blog",
        contentId: `post${i}`,
        authorId: "user1",
        status: "pending",
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - i * 10 * 60 * 1000).toISOString(), // Within last hour
      }))
      ;(getEditRequestsByAuthor as jest.Mock).mockReturnValue(recentRequests)

      const result = checkRateLimit("user1")
      expect(result.allowed).toBe(true)
    })

    it("should reject requests exceeding hourly limit", () => {
      const recentRequests: EditRequest[] = Array(11).fill(null).map((_, i) => ({
        id: `req${i}`,
        type: "blog",
        contentId: `post${i}`,
        authorId: "user1",
        status: "pending",
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(), // Within last hour
      }))
      ;(getEditRequestsByAuthor as jest.Mock).mockReturnValue(recentRequests)

      const result = checkRateLimit("user1")
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("hour")
    })

    it("should reject requests exceeding daily limit", () => {
      const recentRequests: EditRequest[] = Array(51).fill(null).map((_, i) => ({
        id: `req${i}`,
        type: "blog",
        contentId: `post${i}`,
        authorId: "user1",
        status: "pending",
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(), // Within last day
      }))
      ;(getEditRequestsByAuthor as jest.Mock).mockReturnValue(recentRequests)

      const result = checkRateLimit("user1")
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("day")
    })

    it("should allow requests with custom limits", () => {
      const recentRequests: EditRequest[] = Array(15).fill(null).map((_, i) => ({
        id: `req${i}`,
        type: "blog",
        contentId: `post${i}`,
        authorId: "user1",
        status: "pending",
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      }))
      ;(getEditRequestsByAuthor as jest.Mock).mockReturnValue(recentRequests)

      const result = checkRateLimit("user1", { maxRequestsPerHour: 20 })
      expect(result.allowed).toBe(true)
    })
  })

  describe("createChangesSummary", () => {
    it("should detect added fields", () => {
      const original = { title: "Old Title" }
      const edited = { title: "Old Title", description: "New Description" }
      const summary = createChangesSummary(original, edited)
      expect(summary).toContain("Added description")
    })

    it("should detect removed fields", () => {
      const original = { title: "Old Title", description: "Old Description" }
      const edited = { title: "Old Title" }
      const summary = createChangesSummary(original, edited)
      expect(summary).toContain("Removed description")
    })

    it("should detect modified fields", () => {
      const original = { title: "Old Title" }
      const edited = { title: "New Title" }
      const summary = createChangesSummary(original, edited)
      expect(summary).toContain("Modified title")
    })

    it("should handle multiple changes", () => {
      const original = { title: "Old", content: "Old Content" }
      const edited = { title: "New", content: "New Content", tags: ["new"] }
      const summary = createChangesSummary(original, edited)
      expect(summary).toContain("Modified title")
      expect(summary).toContain("Modified content")
      expect(summary).toContain("Added tags")
    })

    it("should return 'No changes detected' for identical objects", () => {
      const original = { title: "Same" }
      const edited = { title: "Same" }
      const summary = createChangesSummary(original, edited)
      expect(summary).toBe("No changes detected")
    })
  })

  describe("getPaginatedEditRequests", () => {
    const mockRequests: EditRequest[] = Array(25).fill(null).map((_, i) => ({
      id: `req${i}`,
      type: "blog",
      contentId: `post${i}`,
      authorId: "user1",
      status: "pending",
      originalData: {},
      editedData: {},
      changesSummary: `Change ${i}`,
      createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    }))

    beforeEach(() => {
      ;(getEditRequests as jest.Mock).mockReturnValue(mockRequests)
    })

    it("should paginate correctly", () => {
      const result = getPaginatedEditRequests({}, { page: 1, pageSize: 10 })
      expect(result.items).toHaveLength(10)
      expect(result.total).toBe(25)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(3)
    })

    it("should handle last page correctly", () => {
      const result = getPaginatedEditRequests({}, { page: 3, pageSize: 10 })
      expect(result.items).toHaveLength(5)
      expect(result.totalPages).toBe(3)
    })

    it("should respect filters with pagination", () => {
      const filteredRequests = mockRequests.filter((r) => r.type === "blog")
      ;(getEditRequests as jest.Mock).mockReturnValue(filteredRequests)

      const result = getPaginatedEditRequests({ type: "blog" }, { page: 1, pageSize: 10 })
      expect(result.items.every((r) => r.type === "blog")).toBe(true)
    })

    it("should return empty results for page beyond total", () => {
      const result = getPaginatedEditRequests({}, { page: 10, pageSize: 10 })
      expect(result.items).toHaveLength(0)
      expect(result.totalPages).toBe(3)
    })
  })

  describe("approveEditRequest", () => {
    const mockRequest: EditRequest = {
      id: "req1",
      type: "blog",
      contentId: "post1",
      authorId: "user1",
      status: "pending",
      originalData: { title: "Old Title" },
      editedData: { title: "New Title" },
      changesSummary: "Changed title",
      createdAt: new Date().toISOString(),
    }

    beforeEach(() => {
      ;(getEditRequests as jest.Mock).mockReturnValue([mockRequest])
      ;(getBlogPostById as jest.Mock).mockReturnValue({
        id: "post1",
        title: "Old Title",
        content: "Content",
      })
      ;(getUserById as jest.Mock).mockReturnValue({
        id: "user1",
        username: "testuser",
      })
    })

    it("should approve request successfully", () => {
      const result = approveEditRequest("req1", "moderator1")
      expect(result.success).toBe(true)
      expect(updateEditRequest).toHaveBeenCalledWith("req1", expect.objectContaining({
        status: "approved",
        reviewedBy: "moderator1",
      }))
    })

    it("should fail for non-existent request", () => {
      ;(getEditRequests as jest.Mock).mockReturnValue([])
      const result = approveEditRequest("nonexistent", "moderator1")
      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })

    it("should fail for already processed request", () => {
      const processedRequest = { ...mockRequest, status: "approved" as const }
      ;(getEditRequests as jest.Mock).mockReturnValue([processedRequest])
      const result = approveEditRequest("req1", "moderator1")
      expect(result.success).toBe(false)
      expect(result.error).toContain("already processed")
    })
  })

  describe("rejectEditRequest", () => {
    const mockRequest: EditRequest = {
      id: "req1",
      type: "blog",
      contentId: "post1",
      authorId: "user1",
      status: "pending",
      originalData: {},
      editedData: {},
      changesSummary: "Test",
      createdAt: new Date().toISOString(),
    }

    beforeEach(() => {
      ;(getEditRequests as jest.Mock).mockReturnValue([mockRequest])
      ;(getUserById as jest.Mock).mockReturnValue({
        id: "user1",
        username: "testuser",
      })
    })

    it("should reject request with reason", () => {
      const result = rejectEditRequest("req1", "moderator1", "Inappropriate content")
      expect(result.success).toBe(true)
      expect(updateEditRequest).toHaveBeenCalledWith("req1", expect.objectContaining({
        status: "rejected",
        reviewedBy: "moderator1",
        reason: "Inappropriate content",
      }))
    })

    it("should fail for non-existent request", () => {
      ;(getEditRequests as jest.Mock).mockReturnValue([])
      const result = rejectEditRequest("nonexistent", "moderator1", "Reason")
      expect(result.success).toBe(false)
    })
  })

  describe("getModerationStats", () => {
    const mockRequests: EditRequest[] = [
      {
        id: "1",
        type: "blog",
        contentId: "post1",
        authorId: "user1",
        status: "pending",
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        type: "wiki",
        contentId: "wiki1",
        authorId: "user2",
        status: "approved",
        reviewedBy: "mod1",
        reviewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        type: "blog",
        contentId: "post2",
        authorId: "user1",
        status: "rejected",
        reviewedBy: "mod1",
        reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reason: "Spam",
        originalData: {},
        editedData: {},
        changesSummary: "Test",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ]

    beforeEach(() => {
      ;(getEditRequests as jest.Mock).mockReturnValue(mockRequests)
    })

    it("should calculate correct statistics", () => {
      const stats = getModerationStats()
      expect(stats.totalPending).toBe(1)
      expect(stats.totalApproved).toBe(1)
      expect(stats.totalRejected).toBe(1)
      expect(stats.pendingByType.blog).toBe(1)
      expect(stats.oldestPending).not.toBeNull()
    })

    it("should calculate average processing time", () => {
      const stats = getModerationStats()
      // Approved: 8h created, 5h ago reviewed = 3h processing
      // Rejected: 5h created, 2h ago reviewed = 3h processing
      // Average = 3h
      expect(stats.avgProcessingTime).toBeCloseTo(3, 0)
    })
  })
})

