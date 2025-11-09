import {
  addToModerationQueue,
  getQueueItemsByType,
  processModerationAction,
  bulkProcessModerationActions,
  cleanupExpiredSoftDeletes,
  assignToModerator,
} from "@/lib/utils/moderation-queue"
import {
  getModerationQueueItems,
  addModerationQueueItem,
  updateModerationQueueItem,
  deleteModerationQueueItem,
  getModerationActionLogs,
  addModerationActionLog,
  getSoftDeleteRecords,
  addSoftDeleteRecord,
  deleteSoftDeleteRecord,
  getBlogPostById,
  getWikiArticleById,
} from "@/lib/storage"
import type {
  ModerationQueueItem,
  ModerationContentType,
  ModerationAction,
} from "@/lib/types"

// Mock storage with shared state
const mockQueueItems: ModerationQueueItem[] = []
const mockActionLogs: any[] = []
const mockSoftDeletes: any[] = []

jest.mock("@/lib/storage", () => ({
  getModerationQueueItems: jest.fn(() => mockQueueItems),
  addModerationQueueItem: jest.fn((item: ModerationQueueItem) => {
    mockQueueItems.push(item)
  }),
  updateModerationQueueItem: jest.fn((id: string, updates: Partial<ModerationQueueItem>) => {
    const index = mockQueueItems.findIndex((item) => item.id === id)
    if (index !== -1) {
      mockQueueItems[index] = { ...mockQueueItems[index], ...updates }
    }
  }),
  deleteModerationQueueItem: jest.fn((id: string) => {
    const index = mockQueueItems.findIndex((item) => item.id === id)
    if (index !== -1) {
      mockQueueItems.splice(index, 1)
    }
  }),
  getModerationActionLogs: jest.fn(() => mockActionLogs),
  addModerationActionLog: jest.fn((log: any) => {
    mockActionLogs.push(log)
  }),
  getSoftDeleteRecords: jest.fn(() => mockSoftDeletes),
  addSoftDeleteRecord: jest.fn((record: any) => {
    mockSoftDeletes.push(record)
  }),
  deleteSoftDeleteRecord: jest.fn((id: string) => {
    const index = mockSoftDeletes.findIndex((record) => record.id === id)
    if (index !== -1) {
      mockSoftDeletes.splice(index, 1)
    }
  }),
    getBlogPostById: jest.fn((id: string) => ({
      id,
      title: "Test Post",
      content: "Test content",
    })),
    getWikiArticleById: jest.fn((id: string) => ({
      id,
      title: "Test Article",
      content: "Test content",
    })),
    getCommentById: jest.fn((id: string) => ({
      id,
      content: "Test comment",
    })),
    getMediaById: jest.fn((id: string) => ({
      id,
      url: "https://example.com/media.jpg",
    })),
}))

describe("Moderation Queue Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear mock arrays
    mockQueueItems.length = 0
    mockActionLogs.length = 0
    mockSoftDeletes.length = 0
  })

  describe("addToModerationQueue", () => {
    it("should create a new queue item", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      expect(item).toBeDefined()
      expect(item.contentType).toBe("post")
      expect(item.contentId).toBe("post-1")
      expect(item.reportedBy).toContain("user-1")
      expect(item.reportCount).toBe(1)
      expect(item.status).toBe("pending")
    })

    it("should update existing item when same reporter reports again", () => {
      addToModerationQueue("post", "post-1", "user-1")
      const item = addToModerationQueue("post", "post-1", "user-1")
      expect(item.reportCount).toBe(1) // Same user reporting again shouldn't increase count
    })

    it("should escalate priority based on report count", () => {
      addToModerationQueue("post", "post-1", "user-1")
      addToModerationQueue("post", "post-1", "user-2")
      addToModerationQueue("post", "post-1", "user-3")
      addToModerationQueue("post", "post-1", "user-4")
      addToModerationQueue("post", "post-1", "user-5")
      const items = getModerationQueueItems()
      const item = items.find((i) => i.contentId === "post-1")
      expect(item?.priority).toBe("high")
    })

    it("should set high priority for high AI score", () => {
      const item = addToModerationQueue("post", "post-1", "user-1", {
        aiScore: 85,
      })
      expect(item.priority).toBe("high")
    })
  })

  describe("getQueueItemsByType", () => {
    beforeEach(() => {
      // Add test items
      addToModerationQueue("post", "post-1", "user-1", { aiScore: 50 })
      addToModerationQueue("post", "post-2", "user-2", { aiScore: 80 })
      addToModerationQueue("comment", "comment-1", "user-1", { aiScore: 30 })
    })

    it("should filter by content type", () => {
      const result = getQueueItemsByType("post", { page: 1, pageSize: 10 })
      expect(result.items.length).toBe(2)
      expect(result.items.every((item) => item.contentType === "post")).toBe(true)
    })

    it("should paginate correctly", () => {
      const result1 = getQueueItemsByType("post", { page: 1, pageSize: 1 })
      expect(result1.items.length).toBe(1)
      expect(result1.total).toBe(2)
      expect(result1.totalPages).toBe(2)

      const result2 = getQueueItemsByType("post", { page: 2, pageSize: 1 })
      expect(result2.items.length).toBe(1)
      expect(result2.page).toBe(2)
    })

    it("should sort by AI score descending", () => {
      const result = getQueueItemsByType("post", { page: 1, pageSize: 10 }, {
        sortBy: "aiScore",
        sortOrder: "desc",
      })
      expect(result.items[0].aiScore).toBeGreaterThanOrEqual(result.items[1].aiScore || 0)
    })

    it("should sort by priority descending", () => {
      addToModerationQueue("post", "post-urgent", "user-1", {
        aiScore: 90,
      })
      const result = getQueueItemsByType("post", { page: 1, pageSize: 10 }, {
        sortBy: "priority",
        sortOrder: "desc",
      })
      expect(result.items[0].priority).toBe("high")
    })

    it("should filter by status", () => {
      const item = addToModerationQueue("post", "post-resolved", "user-1")
      updateModerationQueueItem(item.id, { status: "resolved" })

      const pendingResult = getQueueItemsByType("post", { page: 1, pageSize: 10 }, {
        status: "pending",
      })
      expect(pendingResult.items.every((i) => i.status === "pending")).toBe(true)
    })
  })

  describe("processModerationAction", () => {
    it("should require justification", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      const result = processModerationAction(item.id, "approve", "moderator-1", "")
      expect(result.success).toBe(false)
      expect(result.error).toContain("Justification is required")
    })

    it("should process approve action successfully", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      const result = processModerationAction(
        item.id,
        "approve",
        "moderator-1",
        "Content is appropriate"
      )
      expect(result.success).toBe(true)

      const updatedItem = getModerationQueueItems().find((i) => i.id === item.id)
      expect(updatedItem?.status).toBe("resolved")
      expect(updatedItem?.justification).toBe("Content is appropriate")
    })

    it("should create action log", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      processModerationAction(item.id, "reject", "moderator-1", "Violates guidelines")

      const logs = getModerationActionLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe("reject")
      expect(logs[0].justification).toBe("Violates guidelines")
    })

    it("should create soft delete record for delete action", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      processModerationAction(item.id, "delete", "moderator-1", "Inappropriate content")

      const records = getSoftDeleteRecords()
      expect(records.length).toBe(1)
      expect(records[0].contentType).toBe("post")
      expect(records[0].contentId).toBe("post-1")
    })

    it("should not process already resolved items", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      updateModerationQueueItem(item.id, { status: "resolved" })

      const result = processModerationAction(
        item.id,
        "approve",
        "moderator-1",
        "Test justification"
      )
      expect(result.success).toBe(false)
      expect(result.error).toContain("already resolved")
    })
  })

  describe("bulkProcessModerationActions", () => {
    it("should process multiple actions", () => {
      const item1 = addToModerationQueue("post", "post-1", "user-1")
      const item2 = addToModerationQueue("post", "post-2", "user-2")
      const item3 = addToModerationQueue("wiki_revision", "wiki-1", "user-1")

      const result = bulkProcessModerationActions([
        {
          queueItemId: item1.id,
          action: "approve",
          performedBy: "moderator-1",
          justification: "Approved 1",
        },
        {
          queueItemId: item2.id,
          action: "reject",
          performedBy: "moderator-1",
          justification: "Rejected 2",
        },
        {
          queueItemId: item3.id,
          action: "approve",
          performedBy: "moderator-1",
          justification: "Approved wiki revision",
        },
      ])

      expect(result.success).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it("should handle partial failures", () => {
      const item1 = addToModerationQueue("post", "post-1", "user-1")
      const item2 = addToModerationQueue("post", "post-2", "user-2")
      updateModerationQueueItem(item2.id, { status: "resolved" }) // Already resolved

      const result = bulkProcessModerationActions([
        {
          queueItemId: item1.id,
          action: "approve",
          performedBy: "moderator-1",
          justification: "Approved",
        },
        {
          queueItemId: item2.id,
          action: "approve",
          performedBy: "moderator-1",
          justification: "Should fail",
        },
      ])

      expect(result.success).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors.length).toBe(1)
    })

    it("should be idempotent - processing same action twice", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")

      // First processing
      const result1 = bulkProcessModerationActions([
        {
          queueItemId: item.id,
          action: "approve",
          performedBy: "moderator-1",
          justification: "First approval",
        },
      ])

      // Second processing should fail (already resolved)
      const result2 = bulkProcessModerationActions([
        {
          queueItemId: item.id,
          action: "approve",
          performedBy: "moderator-1",
          justification: "Second approval",
        },
      ])

      expect(result1.success).toBe(1)
      expect(result2.success).toBe(0)
      expect(result2.failed).toBe(1)
    })
  })

  describe("cleanupExpiredSoftDeletes", () => {
    it("should delete expired records", () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 100) // 100 days ago

      const record = {
        id: "record-1",
        contentType: "post" as ModerationContentType,
        contentId: "post-1",
        deletedBy: "moderator-1",
        reason: "Test",
        deletedAt: new Date().toISOString(),
        expiresAt: expiredDate.toISOString(),
      }
      addSoftDeleteRecord(record)

      const deleted = cleanupExpiredSoftDeletes()
      expect(deleted).toBe(1)

      const records = getSoftDeleteRecords()
      expect(records.length).toBe(0)
    })

    it("should not delete non-expired records", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30 days in future

      const record = {
        id: "record-1",
        contentType: "post" as ModerationContentType,
        contentId: "post-1",
        deletedBy: "moderator-1",
        reason: "Test",
        deletedAt: new Date().toISOString(),
        expiresAt: futureDate.toISOString(),
      }
      addSoftDeleteRecord(record)

      const deleted = cleanupExpiredSoftDeletes()
      expect(deleted).toBe(0)

      const records = getSoftDeleteRecords()
      expect(records.length).toBe(1)
    })
  })

  describe("assignToModerator", () => {
    it("should assign item to moderator", () => {
      const item = addToModerationQueue("post", "post-1", "user-1")
      const result = assignToModerator(item.id, "moderator-1")

      expect(result.success).toBe(true)

      const updatedItem = getModerationQueueItems().find((i) => i.id === item.id)
      expect(updatedItem?.assignedTo).toBe("moderator-1")
      expect(updatedItem?.status).toBe("in_review")
    })

    it("should fail for non-existent item", () => {
      const result = assignToModerator("non-existent", "moderator-1")
      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })
  })

  describe("Pagination Stability", () => {
    beforeEach(() => {
      // Create 25 items for pagination testing
      for (let i = 1; i <= 25; i++) {
        addToModerationQueue("post", `post-${i}`, `user-${i}`)
      }
    })

    it("should maintain stable pagination across requests", () => {
      const page1a = getQueueItemsByType("post", { page: 1, pageSize: 10 })
      const page1b = getQueueItemsByType("post", { page: 1, pageSize: 10 })

      expect(page1a.items.length).toBe(page1b.items.length)
      expect(page1a.items.map((i) => i.id)).toEqual(page1b.items.map((i) => i.id))
    })

    it("should return consistent total count", () => {
      const page1 = getQueueItemsByType("post", { page: 1, pageSize: 10 })
      const page2 = getQueueItemsByType("post", { page: 2, pageSize: 10 })
      const page3 = getQueueItemsByType("post", { page: 3, pageSize: 10 })

      expect(page1.total).toBe(page2.total)
      expect(page2.total).toBe(page3.total)
      expect(page1.total).toBe(25)
    })

    it("should not overlap items across pages", () => {
      const page1 = getQueueItemsByType("post", { page: 1, pageSize: 10 })
      const page2 = getQueueItemsByType("post", { page: 2, pageSize: 10 })

      const page1Ids = new Set(page1.items.map((i) => i.id))
      const page2Ids = new Set(page2.items.map((i) => i.id))

      const intersection = [...page1Ids].filter((id) => page2Ids.has(id))
      expect(intersection.length).toBe(0)
    })
  })
})

