import { searchMessages } from "../direct-messages"
import type { Conversation, DirectMessage, User } from "../types"

const users: User[] = [
  {
    id: "1",
    email: "sarah@example.com",
    username: "sarahpaws",
    fullName: "Sarah Johnson",
    joinedAt: "2024-01-01",
    followers: [],
    following: [],
  },
  {
    id: "2",
    email: "mike@example.com",
    username: "mikecatlover",
    fullName: "Mike Chen",
    joinedAt: "2024-01-02",
    followers: [],
    following: [],
  },
  {
    id: "3",
    email: "emma@example.com",
    username: "emmabirds",
    fullName: "Emma Wilson",
    joinedAt: "2024-01-03",
    followers: [],
    following: [],
  },
]

const conversations: Conversation[] = [
  {
    id: "conversation-1",
    participantIds: ["1", "2"],
    createdAt: "2024-03-01T14:30:00.000Z",
    updatedAt: "2024-03-03T16:45:00.000Z",
    lastMessageId: "message-3",
  },
  {
    id: "conversation-2",
    participantIds: ["1", "3"],
    createdAt: "2024-03-04T10:10:00.000Z",
    updatedAt: "2024-03-05T09:00:00.000Z",
    lastMessageId: "message-5",
  },
]

const messages: DirectMessage[] = [
  {
    id: "message-1",
    conversationId: "conversation-1",
    senderId: "1",
    content: "Hey Mike, that portrait of Luna is incredible!",
    createdAt: "2024-03-01T14:30:00.000Z",
    readAt: {
      "1": "2024-03-01T14:30:10.000Z",
      "2": "2024-03-01T14:32:00.000Z",
    },
  },
  {
    id: "message-2",
    conversationId: "conversation-1",
    senderId: "2",
    content: "Thanks Sarah! Want to plan a joint photo session next week?",
    createdAt: "2024-03-01T14:32:00.000Z",
    readAt: {
      "1": "2024-03-01T14:33:00.000Z",
      "2": "2024-03-01T14:32:00.000Z",
    },
  },
  {
    id: "message-3",
    conversationId: "conversation-1",
    senderId: "1",
    content: "Absolutely, I can do Wednesday or Friday afternoon.",
    createdAt: "2024-03-03T16:45:00.000Z",
    readAt: {
      "1": "2024-03-03T16:45:00.000Z",
      "2": "2024-03-03T17:10:00.000Z",
    },
  },
  {
    id: "message-4",
    conversationId: "conversation-2",
    senderId: "3",
    content: "Could you share the enrichment guide for parrots you mentioned?",
    createdAt: "2024-03-04T10:10:00.000Z",
    readAt: {
      "1": "2024-03-04T10:15:00.000Z",
      "3": "2024-03-04T10:10:00.000Z",
    },
  },
  {
    id: "message-5",
    conversationId: "conversation-2",
    senderId: "3",
    content: "No rush—I just know the rescue flock would love those ideas.",
    createdAt: "2024-03-05T09:00:00.000Z",
    readAt: {
      "1": null,
      "3": "2024-03-05T09:00:00.000Z",
    },
  },
]

const baseContext = {
  messages,
  conversations,
  users,
  currentUserId: "1",
}

describe("searchMessages", () => {
  it("returns matches that include content keywords", () => {
    const results = searchMessages(baseContext, { query: "photo session" })
    expect(results).toHaveLength(1)
    expect(results[0].message.id).toBe("message-2")
  })

  it("matches queries against participant names", () => {
    const results = searchMessages(baseContext, { query: "Emma" })
    expect(results.every((result) => result.message.conversationId === "conversation-2")).toBe(true)
    expect(results).toHaveLength(2)
  })

  it("filters by conversation id", () => {
    const results = searchMessages(baseContext, { conversationIds: ["conversation-1"] })
    expect(results.every((result) => result.message.conversationId === "conversation-1")).toBe(true)
  })

  it("filters by sender id", () => {
    const results = searchMessages(baseContext, { senderIds: ["3"] })
    expect(results).toHaveLength(2)
    expect(results.every((result) => result.message.senderId === "3")).toBe(true)
  })

  it("filters by date range", () => {
    const results = searchMessages(baseContext, {
      startDate: "2024-03-02",
      endDate: "2024-03-04",
    })
    expect(results.map((result) => result.message.id)).toEqual(["message-3", "message-4"])
  })

  it("filters unread messages when requested", () => {
    const results = searchMessages(baseContext, { onlyUnread: true })
    expect(results).toHaveLength(1)
    expect(results[0].message.id).toBe("message-5")
  })

  it("sorts results by newest when specified", () => {
    const results = searchMessages(baseContext, { sort: "newest" })
    expect(results[0].message.id).toBe("message-5")
    expect(results[results.length - 1].message.id).toBe("message-1")
  })

  it("sorts results by oldest when specified", () => {
    const results = searchMessages(baseContext, { sort: "oldest" })
    expect(results[0].message.id).toBe("message-1")
    expect(results[results.length - 1].message.id).toBe("message-5")
  })

  it("returns empty results when current user is not part of conversations", () => {
    const results = searchMessages({ ...baseContext, currentUserId: "999" }, { query: "photo" })
    expect(results).toHaveLength(0)
  })
})
