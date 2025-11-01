import type { Conversation, DirectMessage, User } from "./types"

export type MessageSearchSort = "relevance" | "newest" | "oldest"

export interface MessageSearchFilters {
  query?: string
  conversationIds?: string[]
  senderIds?: string[]
  startDate?: string
  endDate?: string
  onlyUnread?: boolean
  sort?: MessageSearchSort
}

export interface MessageSearchContext {
  messages: DirectMessage[]
  conversations: Conversation[]
  users: User[]
  currentUserId: string
}

export interface MessageSearchResult {
  message: DirectMessage
  conversation: Conversation
  isUnread: boolean
  relevance: number
}

interface ConversationIndexEntry {
  conversation: Conversation
  participantIds: string[]
  searchableText: string
}

const HOURS_IN_DAY = 24
const MS_IN_HOUR = 60 * 60 * 1000

function buildSearchableText(participantIds: string[], users: User[]): string {
  const pieces: string[] = []

  participantIds.forEach((participantId) => {
    const user = users.find((candidate) => candidate.id === participantId)
    if (!user) return
    if (user.username) {
      pieces.push(user.username.toLowerCase())
      pieces.push(`@${user.username.toLowerCase()}`)
    }
    if (user.fullName) {
      pieces.push(user.fullName.toLowerCase())
    }
    if (user.bio) {
      pieces.push(user.bio.toLowerCase())
    }
  })

  return Array.from(new Set(pieces)).join(" ")
}

function createConversationIndex(
  conversations: Conversation[],
  users: User[],
  currentUserId: string,
): Record<string, ConversationIndexEntry> {
  return conversations
    .filter((conversation) => conversation.participantIds.includes(currentUserId))
    .reduce<Record<string, ConversationIndexEntry>>((acc, conversation) => {
      const participantIds = conversation.participantIds
      acc[conversation.id] = {
        conversation,
        participantIds,
        searchableText: buildSearchableText(participantIds, users),
      }
      return acc
    }, {})
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  const regex = new RegExp(escapeRegExp(needle), "gi")
  const matches = haystack.match(regex)
  return matches ? matches.length : 0
}

function normalizeDateInput(value?: string): number | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getTime()
}

function clampToEndOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

export function searchMessages(
  context: MessageSearchContext,
  filters: MessageSearchFilters,
): MessageSearchResult[] {
  const { messages, conversations, users, currentUserId } = context
  if (!currentUserId) return []

  const index = createConversationIndex(conversations, users, currentUserId)
  const query = filters.query?.trim() || ""
  const tokens = query ? query.toLowerCase().split(/\s+/).filter(Boolean) : []
  const startDateMs = normalizeDateInput(filters.startDate)
  const endDateMsRaw = normalizeDateInput(filters.endDate)
  const endDateMs = endDateMsRaw !== null ? clampToEndOfDay(endDateMsRaw) : null
  const allowedConversationIds = filters.conversationIds?.length
    ? new Set(filters.conversationIds)
    : null
  const allowedSenderIds = filters.senderIds?.length
    ? new Set(filters.senderIds)
    : null
  const now = Date.now()

  const results: MessageSearchResult[] = []

  for (const message of messages) {
    const entry = index[message.conversationId]
    if (!entry) continue

    if (allowedConversationIds && !allowedConversationIds.has(message.conversationId)) {
      continue
    }

    if (allowedSenderIds && !allowedSenderIds.has(message.senderId)) {
      continue
    }

    const createdAt = new Date(message.createdAt).getTime()
    if (Number.isNaN(createdAt)) {
      continue
    }

    if (startDateMs !== null && createdAt < startDateMs) {
      continue
    }

    if (endDateMs !== null && createdAt > endDateMs) {
      continue
    }

    const readMap = message.readAt || {}
    const isUnread = !readMap[currentUserId]
    if (filters.onlyUnread && !isUnread) {
      continue
    }

    const lowerContent = message.content.toLowerCase()
    const combinedSearch = `${lowerContent} ${entry.searchableText}`

    if (tokens.length > 0) {
      let matchedTokens = 0
      let occurrenceTotal = 0

      for (const token of tokens) {
        if (!token) continue
        if (combinedSearch.includes(token)) {
          matchedTokens += 1
          occurrenceTotal += countOccurrences(lowerContent, token)
          occurrenceTotal += countOccurrences(entry.searchableText, token)
        }
      }

      if (matchedTokens < tokens.length) {
        continue
      }

      const ageHours = (now - createdAt) / MS_IN_HOUR
      const recencyScore = Math.max(0, HOURS_IN_DAY * 3 - ageHours) / HOURS_IN_DAY
      const contentScore = occurrenceTotal * 8 + matchedTokens * 12
      const unreadBonus = isUnread ? 20 : 0
      const relevance = contentScore + unreadBonus + recencyScore

      results.push({
        message,
        conversation: entry.conversation,
        isUnread,
        relevance,
      })
    } else {
      const ageHours = (now - createdAt) / MS_IN_HOUR
      const recencyScore = Math.max(0, HOURS_IN_DAY * 3 - ageHours) / HOURS_IN_DAY
      const unreadBonus = isUnread ? 20 : 0
      const baseScore = 5

      results.push({
        message,
        conversation: entry.conversation,
        isUnread,
        relevance: baseScore + unreadBonus + recencyScore,
      })
    }
  }

  const effectiveSort =
    filters.sort ||
    (tokens.length === 0 && (filters.startDate || filters.endDate) ? "oldest" : "relevance")

  if (effectiveSort === "newest") {
    results.sort(
      (a, b) =>
        new Date(b.message.createdAt).getTime() - new Date(a.message.createdAt).getTime(),
    )
  } else if (effectiveSort === "oldest") {
    results.sort(
      (a, b) =>
        new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime(),
    )
  } else {
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance
      }
      return new Date(b.message.createdAt).getTime() - new Date(a.message.createdAt).getTime()
    })
  }

  return results
}

export function getConversationParticipants(
  conversation: Conversation,
  users: User[],
): User[] {
  return conversation.participantIds
    .map((participantId) => users.find((user) => user.id === participantId))
    .filter((user): user is User => Boolean(user))
}
