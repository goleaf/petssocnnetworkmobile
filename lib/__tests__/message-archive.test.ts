import {
  getConversationsForUser,
  getArchivedConversationsForUser,
  setConversationArchiveState,
  searchMessagesForUser,
  setStorageAdapter,
} from "../storage"
import { mockConversations, mockDirectMessages } from "../mock-data"

const STORAGE_KEYS = {
  CONVERSATIONS: "pet_social_conversations",
  DIRECT_MESSAGES: "pet_social_direct_messages",
}

type MemoryStore = Record<string, string>

const createAdapter = (store: MemoryStore) => ({
  read<T>(key: string, fallback: T): T {
    if (key in store) {
      return JSON.parse(store[key]) as T
    }
    return JSON.parse(JSON.stringify(fallback)) as T
  },
  write<T>(key: string, value: T) {
    store[key] = JSON.stringify(value)
  },
  remove(key: string) {
    delete store[key]
  },
})

describe("message archive storage helpers", () => {
  let memoryStore: MemoryStore

  beforeEach(() => {
    memoryStore = {}
    const adapter = createAdapter(memoryStore)
    setStorageAdapter(adapter)
    memoryStore[STORAGE_KEYS.CONVERSATIONS] = JSON.stringify(mockConversations)
    memoryStore[STORAGE_KEYS.DIRECT_MESSAGES] = JSON.stringify(mockDirectMessages)
  })

  it("returns only active conversations by default", () => {
    const conversations = getConversationsForUser("1")
    expect(conversations.map((conversation) => conversation.id)).toEqual(["conversation-3", "conversation-1"])
    expect(conversations.every((conversation) => conversation.isArchived !== true)).toBe(true)
  })

  it("returns only archived conversations when requested", () => {
    const conversations = getConversationsForUser("1", { archivedOnly: true })
    expect(conversations.map((conversation) => conversation.id)).toEqual(["conversation-2", "conversation-4"])
    expect(conversations.every((conversation) => conversation.isArchived === true)).toBe(true)
  })

  it("provides helper to fetch archived conversations", () => {
    const conversations = getArchivedConversationsForUser("1")
    expect(conversations.map((conversation) => conversation.id)).toEqual(["conversation-2", "conversation-4"])
  })

  it("can toggle archive state for a conversation", () => {
    const updated = setConversationArchiveState("conversation-1", true)
    expect(updated).toBeDefined()
    expect(updated?.isArchived).toBe(true)

    const archived = getConversationsForUser("1", { archivedOnly: true })
    expect(archived.map((conversation) => conversation.id)).toContain("conversation-1")

    const active = getConversationsForUser("1")
    expect(active.map((conversation) => conversation.id)).not.toContain("conversation-1")
  })

  it("searches across archived conversations by default", () => {
    const results = searchMessagesForUser("1", "perches")
    const archivedConversationIds = results.map((result) => result.conversationId)
    expect(archivedConversationIds).toContain("conversation-2")
  })
})
