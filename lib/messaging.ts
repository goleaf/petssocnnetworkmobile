"use client"

import { create } from "zustand"
import type { Conversation, DirectMessage, MessageReadMap } from "./types"
import {
  addMessageToConversation,
  createConversation as storageCreateConversation,
  getConversationById,
  getConversationsForUser,
  getMessagesByConversationId,
  markConversationMessagesRead,
} from "./storage"

type ConversationMessages = Record<string, DirectMessage[]>

export interface ReadReceiptDetails {
  readBy: Array<{ userId: string; readAt: string }>
  unreadBy: string[]
  lastReadAt: string | null
  isFullyRead: boolean
}

type MessagingBroadcastEvent =
  | { type: "message:sent"; conversationId: string; senderId: string }
  | { type: "conversation:created"; conversationId: string }
  | { type: "conversation:read"; conversationId: string; userId: string }
  | { type: "typing"; conversationId: string; userId: string; timestamp: string }

interface MessagingState {
  initializedForUserId: string | null
  conversations: Conversation[]
  messages: ConversationMessages
  activeConversationId: string | null
  typingIndicators: Record<string, Record<string, number>>
  initialize: (userId: string) => void
  setActiveConversation: (conversationId: string | null) => void
  sendMessage: (conversationId: string, senderId: string, content: string) => DirectMessage | null
  createConversation: (participantIds: string[]) => Conversation
  markConversationRead: (conversationId: string, userId: string) => void
  handleExternalEvent: (event: MessagingBroadcastEvent) => void
  pushTypingIndicator: (conversationId: string, userId: string) => void
  clearTypingIndicator: (conversationId: string, userId: string) => void
  getConversationMessages: (conversationId: string) => DirectMessage[]
}

const CHANNEL_NAME = "pet-social-messaging"
const TYPING_INDICATOR_TIMEOUT = 4000
const typingTimers = new Map<string, number>()

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `message_${crypto.randomUUID()}`
  }
  return `message_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function buildReadMap(participants: string[], senderId: string, timestamp: string): MessageReadMap {
  return participants.reduce<MessageReadMap>((acc, participantId) => {
    acc[participantId] = participantId === senderId ? timestamp : null
    return acc
  }, {})
}

export function getReadReceiptDetails(
  message: DirectMessage,
  participants: string[],
  options?: { includeSender?: boolean },
): ReadReceiptDetails {
  const uniqueParticipants = Array.from(new Set(participants))
  const relevantParticipants = uniqueParticipants.filter(
    (participantId) => options?.includeSender || participantId !== message.senderId,
  )

  const readMap = message.readAt ?? {}
  const readEntries = relevantParticipants
    .map((participantId) => {
      const readAt = readMap[participantId]
      if (!readAt) return null
      return {
        userId: participantId,
        readAt,
      }
    })
    .filter((entry): entry is { userId: string; readAt: string } => Boolean(entry))
    .sort((a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime())

  const readIds = new Set(readEntries.map((entry) => entry.userId))
  const unreadBy = relevantParticipants.filter((participantId) => !readIds.has(participantId))

  const lastReadAt =
    readEntries.length > 0
      ? readEntries.reduce((latest, entry) => {
          if (!latest) return entry.readAt
          return new Date(entry.readAt).getTime() > new Date(latest).getTime() ? entry.readAt : latest
        }, readEntries[0].readAt)
      : null

  return {
    readBy: readEntries,
    unreadBy,
    lastReadAt,
    isFullyRead: unreadBy.length === 0 && readEntries.length === relevantParticipants.length,
  }
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function upsertConversationInList(conversations: Conversation[], conversation: Conversation): Conversation[] {
  const index = conversations.findIndex((item) => item.id === conversation.id)
  if (index === -1) {
    return sortConversations([...conversations, conversation])
  }
  const updated = [...conversations]
  updated[index] = conversation
  return sortConversations(updated)
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  initializedForUserId: null,
  conversations: [],
  messages: {},
  activeConversationId: null,
  typingIndicators: {},

  initialize: (userId: string) => {
    const conversations = getConversationsForUser(userId)
    const loadedMessages: ConversationMessages = {}
    conversations.forEach((conversation) => {
      loadedMessages[conversation.id] = getMessagesByConversationId(conversation.id)
    })

    set((state) => {
      const activeConversationId =
        state.activeConversationId && conversations.some((conversation) => conversation.id === state.activeConversationId)
          ? state.activeConversationId
          : conversations[0]?.id ?? null

      return {
        initializedForUserId: userId,
        conversations,
        messages: loadedMessages,
        activeConversationId,
      }
    })

    ensureBroadcastChannel()
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId })
  },

  sendMessage: (conversationId: string, senderId: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return null

    const state = get()
    const conversation = state.conversations.find((item) => item.id === conversationId)
    if (!conversation) return null

    const timestamp = new Date().toISOString()
    const message: DirectMessage = {
      id: createMessageId(),
      conversationId,
      senderId,
      content: trimmed,
      createdAt: timestamp,
      readAt: buildReadMap(conversation.participantIds, senderId, timestamp),
    }

    addMessageToConversation(message)

    const updatedConversation: Conversation = {
      ...conversation,
      updatedAt: timestamp,
      lastMessageId: message.id,
    }

    set((prev) => ({
      messages: {
        ...prev.messages,
        [conversationId]: [...(prev.messages[conversationId] ?? []), message],
      },
      conversations: upsertConversationInList(prev.conversations, updatedConversation),
    }))

    postBroadcastEvent({ type: "message:sent", conversationId, senderId })
    return message
  },

  createConversation: (participantIds: string[]) => {
    const conversation = storageCreateConversation(participantIds)
    const messages = getMessagesByConversationId(conversation.id)
    const currentState = get()
    const alreadyLoaded = currentState.conversations.some((item) => item.id === conversation.id)

    set((state) => ({
      conversations: upsertConversationInList(state.conversations, conversation),
      messages: {
        ...state.messages,
        [conversation.id]: messages,
      },
      activeConversationId: state.activeConversationId ?? conversation.id,
    }))

    if (!alreadyLoaded && messages.length === 0) {
      postBroadcastEvent({ type: "conversation:created", conversationId: conversation.id })
    }

    return conversation
  },

  markConversationRead: (conversationId: string, userId: string) => {
    const existingMessages = get().messages[conversationId] ?? []
    const hasUnread = existingMessages.some((message) => message.senderId !== userId && !message.readAt?.[userId])
    if (!hasUnread) return

    const updatedMessages = markConversationMessagesRead(conversationId, userId)
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: updatedMessages,
      },
    }))

    postBroadcastEvent({ type: "conversation:read", conversationId, userId })
  },

  handleExternalEvent: (event: MessagingBroadcastEvent) => {
    const currentUserId = get().initializedForUserId
    if (!currentUserId) return

    if (event.type === "typing") {
      if (event.userId === currentUserId) return
      set((state) => {
        const conversationTyping = { ...(state.typingIndicators[event.conversationId] ?? {}) }
        conversationTyping[event.userId] = Date.now() + TYPING_INDICATOR_TIMEOUT
        return {
          typingIndicators: {
            ...state.typingIndicators,
            [event.conversationId]: conversationTyping,
          },
        }
      })
      scheduleTypingClear(event.conversationId, event.userId)
      return
    }

    const conversation = getConversationById(event.conversationId)
    if (!conversation || !conversation.participantIds.includes(currentUserId)) {
      return
    }

    const refreshedMessages = getMessagesByConversationId(conversation.id)
    set((state) => ({
      conversations: upsertConversationInList(state.conversations, conversation),
      messages: {
        ...state.messages,
        [conversation.id]: refreshedMessages,
      },
    }))
  },

  pushTypingIndicator: (conversationId: string, userId: string) => {
    if (typeof window === "undefined") return

    set((state) => {
      const conversationTyping = { ...(state.typingIndicators[conversationId] ?? {}) }
      conversationTyping[userId] = Date.now() + TYPING_INDICATOR_TIMEOUT
      return {
        typingIndicators: {
          ...state.typingIndicators,
          [conversationId]: conversationTyping,
        },
      }
    })

    const key = `${conversationId}:${userId}`
    const existingTimer = typingTimers.get(key)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }
    const timerId = window.setTimeout(() => {
      typingTimers.delete(key)
      useMessagingStore.getState().clearTypingIndicator(conversationId, userId)
    }, TYPING_INDICATOR_TIMEOUT)
    typingTimers.set(key, timerId)

    postBroadcastEvent({ type: "typing", conversationId, userId, timestamp: new Date().toISOString() })
  },

  clearTypingIndicator: (conversationId: string, userId: string) => {
    if (typeof window !== "undefined") {
      const key = `${conversationId}:${userId}`
      const existingTimer = typingTimers.get(key)
      if (existingTimer) {
        window.clearTimeout(existingTimer)
        typingTimers.delete(key)
      }
    }

    set((state) => {
      const current = state.typingIndicators[conversationId]
      if (!current) return {}

      const updated = { ...current }
      delete updated[userId]

      const typingIndicators = { ...state.typingIndicators }
      if (Object.keys(updated).length === 0) {
        delete typingIndicators[conversationId]
      } else {
        typingIndicators[conversationId] = updated
      }

      return { typingIndicators }
    })
  },

  getConversationMessages: (conversationId: string) => {
    return get().messages[conversationId] ?? []
  },
}))

let broadcastChannel: BroadcastChannel | null = null

function ensureBroadcastChannel() {
  if (typeof window === "undefined") return null
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
    broadcastChannel.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as MessagingBroadcastEvent | undefined
      if (!data) return
      useMessagingStore.getState().handleExternalEvent(data)
    })
  }
  return broadcastChannel
}

function postBroadcastEvent(event: MessagingBroadcastEvent) {
  const channel = ensureBroadcastChannel()
  channel?.postMessage(event)
}

function scheduleTypingClear(conversationId: string, userId: string) {
  if (typeof window === "undefined") return
  const key = `${conversationId}:${userId}`
  const existingTimer = typingTimers.get(key)
  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }
  const timerId = window.setTimeout(() => {
    typingTimers.delete(key)
    useMessagingStore.getState().clearTypingIndicator(conversationId, userId)
  }, TYPING_INDICATOR_TIMEOUT)
  typingTimers.set(key, timerId)
}
