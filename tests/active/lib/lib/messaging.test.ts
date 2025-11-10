import { getReadReceiptDetails } from "../messaging"
import type { DirectMessage } from "../types"

describe("getReadReceiptDetails", () => {
  const baseMessage: Omit<DirectMessage, "readAt"> = {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-1",
    content: "Hello there",
    createdAt: "2024-05-01T12:00:00.000Z",
  }

  it("tracks unread recipients when no read timestamps are present", () => {
    const message: DirectMessage = {
      ...baseMessage,
      readAt: {
        "user-1": "2024-05-01T12:00:00.000Z",
        "user-2": null,
        "user-3": null,
      },
    }

    const details = getReadReceiptDetails(message, ["user-1", "user-2", "user-3"])

    expect(details.readBy).toHaveLength(0)
    expect(details.unreadBy).toEqual(["user-2", "user-3"])
    expect(details.isFullyRead).toBe(false)
    expect(details.lastReadAt).toBeNull()
  })

  it("returns read recipients sorted by timestamp", () => {
    const message: DirectMessage = {
      ...baseMessage,
      readAt: {
        "user-1": "2024-05-01T12:00:00.000Z",
        "user-2": "2024-05-01T12:30:00.000Z",
        "user-3": "2024-05-01T12:10:00.000Z",
      },
    }

    const details = getReadReceiptDetails(message, ["user-1", "user-2", "user-3"])

    expect(details.readBy.map((entry) => entry.userId)).toEqual(["user-3", "user-2"])
    expect(details.unreadBy).toHaveLength(0)
    expect(details.isFullyRead).toBe(true)
    expect(details.lastReadAt).toBe("2024-05-01T12:30:00.000Z")
  })

  it("optionally includes the sender in read receipts", () => {
    const message: DirectMessage = {
      ...baseMessage,
      readAt: {
        "user-1": "2024-05-01T12:00:00.000Z",
      },
    }

    const details = getReadReceiptDetails(message, ["user-1"], { includeSender: true })

    expect(details.readBy).toEqual([{ userId: "user-1", readAt: "2024-05-01T12:00:00.000Z" }])
    expect(details.unreadBy).toHaveLength(0)
    expect(details.isFullyRead).toBe(true)
    expect(details.lastReadAt).toBe("2024-05-01T12:00:00.000Z")
  })
})
