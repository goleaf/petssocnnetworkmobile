"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Search,
  Send,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react"

import { useAuth } from "@/lib/auth"
import {
  addDirectMessage,
  getDirectMessages,
  getDirectMessageById,
  getDirectMessagesByConversation,
  getUserConversations,
  getUsers,
  markConversationMessagesRead,
  setConversationArchiveState,
} from "@/lib/storage"
import { getReadReceiptDetails } from "@/lib/messaging"
import type {
  Conversation,
  DirectMessage,
  MessageAttachment,
  MessageAttachmentType,
  MessageReadMap,
  User,
} from "@/lib/types"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  searchMessages,
  type MessageSearchFilters,
  type MessageSearchSort,
} from "@/lib/direct-messages"

const STORAGE_KEYS_TO_WATCH = ["pet_social_conversations", "pet_social_direct_messages", "pet_social_users"] as const
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_ATTACHMENT_COUNT = 5
const TYPING_INDICATOR_TIMEOUT = 4000

type PendingAttachment = {
  id: string
  name: string
  size: number
  mimeType: string
  type: MessageAttachmentType
  dataUrl: string
}

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function inferAttachmentType(mimeType: string | undefined, fallback?: MessageAttachmentType): MessageAttachmentType {
  if (fallback) return fallback
  if (!mimeType) return "document"
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  return "document"
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncate(text: string, max = 72) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 3)}...`
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightMatches(text: string, query: string): ReactNode {
  const tokens = query.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) {
    return text
  }

  const pattern = tokens.map((token) => escapeRegExp(token)).join("|")
  const regex = new RegExp(`(${pattern})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="rounded bg-primary/20 px-1 py-0.5 text-primary">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "")
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function formatTypingLabel(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return `${names[0]} is typing…`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
  return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing…`
}

function TypingIndicator({
  names,
  variant = "pill",
}: {
  names: string[]
  variant?: "pill" | "inline"
}) {
  if (names.length === 0) return null
  const label = formatTypingLabel(names)
  const dots = (
    <span className="flex items-center gap-[2px]">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.3s]" />
    </span>
  )

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-[0.7rem] text-primary">
        {dots}
        <span>{label}</span>
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-[2px]">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
      </span>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  )
}

function summarizeMessage(message: DirectMessage | undefined, currentUserId: string | undefined) {
  if (!message) return "No messages yet"
  if (message.content?.trim()) return message.content.trim()

  const attachmentCount = message.attachments?.length ?? 0
  if (attachmentCount > 0) {
    const senderPrefix = message.senderId === currentUserId ? "You sent" : "Sent"
    const firstType = message.attachments?.[0]?.type ?? "document"
    if (attachmentCount === 1) {
      const noun =
        firstType === "image"
          ? "an image"
          : firstType === "video"
            ? "a video"
            : "a document"
      return `${senderPrefix} ${noun}`
    }
    return `${senderPrefix} ${attachmentCount} attachments`
  }

  return "New message"
}

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [allMessages, setAllMessages] = useState<DirectMessage[]>([])
  const [usersById, setUsersById] = useState<Record<string, User>>({})
  const [newMessage, setNewMessage] = useState("")
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isProcessingAttachments, setIsProcessingAttachments] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchConversationFilter, setSearchConversationFilter] = useState<string>("all")
  const [searchSenderFilter, setSearchSenderFilter] = useState<string>("all")
  const [searchDateFrom, setSearchDateFrom] = useState("")
  const [searchDateTo, setSearchDateTo] = useState("")
  const [searchOnlyUnread, setSearchOnlyUnread] = useState(false)
  const [searchSort, setSearchSort] = useState<MessageSearchSort>("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [conversationListFilter, setConversationListFilter] = useState<"active" | "archived">("active")
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  const messageListRef = useRef<HTMLDivElement | null>(null)
  const selectedConversationRef = useRef<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutsRef = useRef<Map<string, number>>(new Map())
  const typingChannelRef = useRef<BroadcastChannel | null>(null)
  const previousConversationRef = useRef<string | null>(null)
  const [typingIndicators, setTypingIndicators] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    if (user) return
    if (typeof window !== "undefined") {
      typingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
    typingTimeoutsRef.current.clear()
    setTypingIndicators({})
  }, [user])

  const clearTypingIndicatorLocal = useCallback((conversationId: string, typingUserId: string) => {
    setTypingIndicators((prev) => {
      const conversationTyping = prev[conversationId]
      if (!conversationTyping || !(typingUserId in conversationTyping)) {
        return prev
      }

      const updatedConversationTyping = { ...conversationTyping }
      delete updatedConversationTyping[typingUserId]

      const next = { ...prev }
      if (Object.keys(updatedConversationTyping).length === 0) {
        delete next[conversationId]
      } else {
        next[conversationId] = updatedConversationTyping
      }
      return next
    })

    if (typeof window !== "undefined") {
      const key = `${conversationId}:${typingUserId}`
      const timeoutId = typingTimeoutsRef.current.get(key)
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        typingTimeoutsRef.current.delete(key)
      }
    }
  }, [])

  const registerTypingLocal = useCallback(
    (conversationId: string, typingUserId: string, expiresAt?: number) => {
      const now = Date.now()
      const expiry = expiresAt ?? now + TYPING_INDICATOR_TIMEOUT
      if (expiry <= now) {
        clearTypingIndicatorLocal(conversationId, typingUserId)
        return
      }

      setTypingIndicators((prev) => {
        const conversationTyping = { ...(prev[conversationId] ?? {}) }
        conversationTyping[typingUserId] = expiry
        return {
          ...prev,
          [conversationId]: conversationTyping,
        }
      })

      if (typeof window !== "undefined") {
        const key = `${conversationId}:${typingUserId}`
        const existingTimeout = typingTimeoutsRef.current.get(key)
        if (existingTimeout) {
          window.clearTimeout(existingTimeout)
        }
        const delay = Math.max(100, expiry - now)
        const timeoutId = window.setTimeout(() => {
          typingTimeoutsRef.current.delete(key)
          clearTypingIndicatorLocal(conversationId, typingUserId)
        }, delay)
        typingTimeoutsRef.current.set(key, timeoutId)
      }
    },
    [clearTypingIndicatorLocal],
  )

  const broadcastTypingEvent = useCallback((conversationId: string, typingUserId: string, expiresAt: number) => {
    typingChannelRef.current?.postMessage({
      type: "typing",
      conversationId,
      userId: typingUserId,
      expiresAt,
    })
  }, [])

  const broadcastClearEvent = useCallback((conversationId: string, typingUserId: string) => {
    typingChannelRef.current?.postMessage({
      type: "clear",
      conversationId,
      userId: typingUserId,
    })
  }, [])

  const resolveUser = useCallback(
    (id: string) => {
      return usersById[id]
    },
    [usersById],
  )

  const formatParticipantName = useCallback(
    (id: string) => {
      const participant = resolveUser(id)
      if (!participant) return "Unknown user"
      return participant.fullName || participant.username || "Unknown user"
    },
    [resolveUser],
  )

  const refreshData = useCallback(() => {
    if (!user) return

    const directory = getUsers().reduce<Record<string, User>>((acc, entry) => {
      acc[entry.id] = entry
      return acc
    }, {})
    setUsersById(directory)

    const updatedConversations = getUserConversations(user.id)
    setConversations(updatedConversations)
    const conversationIds = new Set(updatedConversations.map((conversation) => conversation.id))
    const scopedMessages = getDirectMessages().filter((message) => conversationIds.has(message.conversationId))
    setAllMessages(scopedMessages)

    const currentSelection = selectedConversationRef.current
    const selectionExists = currentSelection
      ? updatedConversations.some((conversation) => conversation.id === currentSelection)
      : false
    const nextSelection = selectionExists ? currentSelection : updatedConversations[0]?.id ?? null

    selectedConversationRef.current = nextSelection
    if (nextSelection !== currentSelection) {
      setSelectedConversationId(nextSelection)
    }

    if (nextSelection) {
      const updatedMessages = getDirectMessagesByConversation(nextSelection)
      setMessages(updatedMessages)
      markConversationMessagesRead(nextSelection, user.id)
    } else {
      setMessages([])
    }
  }, [user])

  const resetSearchFilters = useCallback(() => {
    setSearchQuery("")
    setSearchConversationFilter("all")
    setSearchSenderFilter("all")
    setSearchDateFrom("")
    setSearchDateTo("")
    setSearchOnlyUnread(false)
    setSearchSort("relevance")
  }, [])

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setConversations([])
      setAllMessages([])
      setMessages([])
      setSelectedConversationId(null)
      setUsersById({})
      resetSearchFilters()
      setShowFilters(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    refreshData()
    setIsLoading(false)
  }, [user, isAuthenticated, refreshData, resetSearchFilters])

  useStorageListener(STORAGE_KEYS_TO_WATCH as unknown as string[], refreshData)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
      return
    }

    const channel = new window.BroadcastChannel("pet-social-typing")
    typingChannelRef.current = channel

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; conversationId?: string; userId?: string; expiresAt?: number } | undefined
      if (!data || typeof data !== "object" || !data.conversationId || !data.userId) {
        return
      }
      if (data.userId === user?.id) {
        return
      }

      if (data.type === "typing") {
        registerTypingLocal(data.conversationId, data.userId, data.expiresAt)
      } else if (data.type === "clear") {
        clearTypingIndicatorLocal(data.conversationId, data.userId)
      }
    }

    channel.addEventListener("message", handleMessage)

    return () => {
      channel.removeEventListener("message", handleMessage)
      channel.close()
      typingChannelRef.current = null
    }
  }, [user?.id, registerTypingLocal, clearTypingIndicatorLocal])

  useEffect(() => {
    if (!user || !selectedConversationId) return
    const history = getDirectMessagesByConversation(selectedConversationId)
    setMessages(history)
    markConversationMessagesRead(selectedConversationId, user.id)
  }, [selectedConversationId, user])

  useEffect(() => {
    if (!user) return
    const previousConversationId = previousConversationRef.current
    if (previousConversationId && previousConversationId !== selectedConversationId) {
      clearTypingIndicatorLocal(previousConversationId, user.id)
      broadcastClearEvent(previousConversationId, user.id)
    }
    previousConversationRef.current = selectedConversationId
  }, [selectedConversationId, user, clearTypingIndicatorLocal, broadcastClearEvent])

  useEffect(() => {
    setTypingIndicators((prev) => {
      const validConversationIds = new Set(conversations.map((conversation) => conversation.id))
      const next: Record<string, Record<string, number>> = {}
      let changed = false

      for (const [conversationId, indicator] of Object.entries(prev)) {
        if (!validConversationIds.has(conversationId)) {
          changed = true
          continue
        }
        next[conversationId] = indicator
      }

      return changed ? next : prev
    })
  }, [conversations])

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current

    return () => {
      if (typeof window !== "undefined") {
        timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      }
      timeouts.clear()

      const activeConversationId = selectedConversationRef.current
      if (!user || !activeConversationId) return
      clearTypingIndicatorLocal(activeConversationId, user.id)
      broadcastClearEvent(activeConversationId, user.id)
    }
  }, [user, clearTypingIndicatorLocal, broadcastClearEvent])

  useEffect(() => {
    if (!messageListRef.current) return
    const container = messageListRef.current
    container.scrollTop = container.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!highlightedMessageId) return
    const container = messageListRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(`[data-message-id="${highlightedMessageId}"]`)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    const timeout = window.setTimeout(() => setHighlightedMessageId(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [highlightedMessageId, messages])

  const conversationSummaries = useMemo(() => {
    if (!user) return []
    return conversations.map((conversation) => {
      const participants = conversation.participantIds
        .filter((participantId) => participantId !== user.id)
        .map((participantId) => resolveUser(participantId))
        .filter(Boolean) as User[]

      const lastMessage =
        conversation.lastMessageId
          ? getDirectMessageById(conversation.lastMessageId)
          : undefined

      const fallbackLastMessage =
        lastMessage ??
        getDirectMessagesByConversation(conversation.id).slice(-1)[0]

      const hasUnread =
        fallbackLastMessage &&
        fallbackLastMessage.senderId !== user.id &&
        !fallbackLastMessage.readAt?.[user.id]

      return {
        conversation,
        participants,
        lastMessage: fallbackLastMessage,
        hasUnread: Boolean(hasUnread),
      }
    })
  }, [conversations, resolveUser, user])

  const archiveCounts = useMemo(() => {
    const active = conversationSummaries.filter((summary) => summary.conversation.isArchived !== true).length
    const archived = conversationSummaries.length - active
    return { active, archived }
  }, [conversationSummaries])

  const displayedSummaries = useMemo(
    () =>
      conversationSummaries.filter(({ conversation }) =>
        conversationListFilter === "archived" ? conversation.isArchived === true : conversation.isArchived !== true,
      ),
    [conversationListFilter, conversationSummaries],
  )

  const hasSearchFilters = useMemo(() => {
    return (
      searchQuery.trim().length > 0 ||
      searchConversationFilter !== "all" ||
      searchSenderFilter !== "all" ||
      searchDateFrom !== "" ||
      searchDateTo !== "" ||
      searchOnlyUnread
    )
  }, [searchConversationFilter, searchDateFrom, searchDateTo, searchOnlyUnread, searchQuery, searchSenderFilter])

  useEffect(() => {
    if (hasSearchFilters) return
    if (!user) return
    if (!selectedConversationId) {
      if (displayedSummaries.length > 0) {
        const nextConversationId = displayedSummaries[0].conversation.id
        selectedConversationRef.current = nextConversationId
        setSelectedConversationId(nextConversationId)
        const history = getDirectMessagesByConversation(nextConversationId)
        setMessages(history)
        markConversationMessagesRead(nextConversationId, user.id)
      }
      return
    }

    const isVisible = displayedSummaries.some(
      (summary) => summary.conversation.id === selectedConversationId,
    )
    if (!isVisible) {
      const fallbackConversationId = displayedSummaries[0]?.conversation.id ?? null
      selectedConversationRef.current = fallbackConversationId
      setSelectedConversationId(fallbackConversationId)
      if (fallbackConversationId) {
        const history = getDirectMessagesByConversation(fallbackConversationId)
        setMessages(history)
        markConversationMessagesRead(fallbackConversationId, user.id)
      } else {
        setMessages([])
      }
    }
  }, [displayedSummaries, hasSearchFilters, selectedConversationId, user])

  const activeConversation = useMemo(() => {
    if (!selectedConversationId) return null
    return conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
  }, [conversations, selectedConversationId])

  const activeParticipants = useMemo(() => {
    if (!activeConversation || !user) return []
    return activeConversation.participantIds
      .filter((participantId) => participantId !== user.id)
      .map((participantId) => resolveUser(participantId))
      .filter(Boolean) as User[]
  }, [activeConversation, resolveUser, user])

  const typingUserIdsForActiveConversation = useMemo(() => {
    if (!activeConversation || !user) return []
    const entry = typingIndicators[activeConversation.id]
    if (!entry) return []
    const now = Date.now()
    return Object.entries(entry)
      .filter(([typingUserId, expiresAt]) => typingUserId !== user.id && expiresAt > now)
      .map(([typingUserId]) => typingUserId)
  }, [activeConversation, typingIndicators, user])

  const typingUserNames = useMemo(() => {
    if (typingUserIdsForActiveConversation.length === 0) return []
    return typingUserIdsForActiveConversation
      .map((typingUserId) => resolveUser(typingUserId))
      .filter((participant): participant is User => Boolean(participant))
      .map((participant) => participant.fullName || participant.username || "Someone")
  }, [typingUserIdsForActiveConversation, resolveUser])

  const usersList = useMemo(() => Object.values(usersById), [usersById])

  const searchContext = useMemo(
    () => ({
      messages: allMessages,
      conversations,
      users: usersList,
      currentUserId: user?.id ?? "",
    }),
    [allMessages, conversations, usersList, user?.id],
  )

  const searchFilters = useMemo<MessageSearchFilters>(
    () => ({
      query: searchQuery,
      conversationIds: searchConversationFilter !== "all" ? [searchConversationFilter] : undefined,
      senderIds: searchSenderFilter !== "all" ? [searchSenderFilter] : undefined,
      startDate: searchDateFrom || undefined,
      endDate: searchDateTo || undefined,
      onlyUnread: searchOnlyUnread,
      sort: searchSort,
    }),
    [
      searchConversationFilter,
      searchDateFrom,
      searchDateTo,
      searchOnlyUnread,
      searchQuery,
      searchSenderFilter,
      searchSort,
    ],
  )

  const searchResults = useMemo(
    () => searchMessages(searchContext, searchFilters),
    [searchContext, searchFilters],
  )

  const searchSenderOptions = useMemo(() => {
    const senderMap = new Map<string, User>()
    if (user) {
      senderMap.set(user.id, user)
    }
    for (const message of allMessages) {
      const participant = usersById[message.senderId]
      if (participant) {
        senderMap.set(participant.id, participant)
      }
    }
    return Array.from(senderMap.values())
  }, [allMessages, usersById, user])

  const searchUnreadCount = useMemo(
    () => searchResults.filter((result) => result.isUnread).length,
    [searchResults],
  )

  const searchConversationCount = useMemo(() => {
    const ids = new Set<string>()
    searchResults.forEach((result) => ids.add(result.conversation.id))
    return ids.size
  }, [searchResults])

  const getConversationLabel = useCallback(
    (conversation: Conversation) => {
      if (!user) return "Conversation"
      if (conversation.title?.trim()) {
        return conversation.title.trim()
      }
      const others = conversation.participantIds
        .filter((participantId) => participantId !== user.id)
        .map((participantId) => resolveUser(participantId))
        .filter(Boolean) as User[]
      if (others.length === 0) {
        return "Direct Message"
      }
      return others.map((participant) => participant.fullName || participant.username).join(", ")
    },
    [resolveUser, user],
  )

  const handleSelectConversation = (conversationId: string, focusMessageId?: string) => {
    if (!user) return
    selectedConversationRef.current = conversationId
    setSelectedConversationId(conversationId)
    setHighlightedMessageId(focusMessageId ?? null)
    const history = getDirectMessagesByConversation(conversationId)
    setMessages(history)
    markConversationMessagesRead(conversationId, user.id)
    const membership = new Set(conversations.map((conversation) => conversation.id))
    const updatedAllMessages = getDirectMessages().filter((message) => membership.has(message.conversationId))
    setAllMessages(updatedAllMessages)
  }

  const handleToggleArchive = useCallback(
    (conversation: Conversation) => {
      if (!user) return
      const nextState = !(conversation.isArchived === true)
      setConversationArchiveState(conversation.id, nextState)
      const updatedConversations = getUserConversations(user.id)
      setConversations(updatedConversations)
      const membership = new Set(updatedConversations.map((item) => item.id))
      const updatedAllMessages = getDirectMessages().filter((message) => membership.has(message.conversationId))
      setAllMessages(updatedAllMessages)
      setConversationListFilter(nextState ? "archived" : "active")
    },
    [user, setConversationListFilter],
  )

  const handleAttachmentSelect = async (event: ChangeEvent<HTMLInputElement>, forcedType?: MessageAttachmentType) => {
    const { files } = event.target
    if (!files || files.length === 0) return
    setComposerError(null)

    const existingCount = pendingAttachments.length
    const availableSlots = MAX_ATTACHMENT_COUNT - existingCount
    if (availableSlots <= 0) {
      setComposerError(`You can attach up to ${MAX_ATTACHMENT_COUNT} files per message.`)
      event.target.value = ""
      return
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots)
    if (selectedFiles.length < files.length) {
      setComposerError(`Only the first ${availableSlots} files were attached.`)
    }

    setIsProcessingAttachments(true)

    const nextAttachments: PendingAttachment[] = []
    const errorMessages: string[] = []

    for (const file of selectedFiles) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        errorMessages.push(`"${file.name}" exceeds the ${formatFileSize(MAX_ATTACHMENT_SIZE)} limit.`)
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        const type = inferAttachmentType(file.type, forcedType)
        nextAttachments.push({
          id: generateId("attachment"),
          name: file.name,
          size: file.size,
          mimeType: file.type || (type === "image" ? "image/jpeg" : type === "video" ? "video/mp4" : "application/octet-stream"),
          type,
          dataUrl,
        })
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown error"
        errorMessages.push(`Could not attach "${file.name}": ${reason}`)
      }
    }

    if (nextAttachments.length > 0) {
      setPendingAttachments((prev) => [...prev, ...nextAttachments])
    }

    if (errorMessages.length > 0) {
      setComposerError(errorMessages.join(" "))
    }

    setIsProcessingAttachments(false)
    event.target.value = ""
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== attachmentId))
  }

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setNewMessage(value)

    if (!user || !activeConversation) return

    const trimmed = value.trim()
    if (!trimmed) {
      clearTypingIndicatorLocal(activeConversation.id, user.id)
      broadcastClearEvent(activeConversation.id, user.id)
      return
    }

    const expiry = Date.now() + TYPING_INDICATOR_TIMEOUT
    registerTypingLocal(activeConversation.id, user.id, expiry)
    broadcastTypingEvent(activeConversation.id, user.id, expiry)
  }

  const handleSendMessage = () => {
    if (!user || !activeConversation) return

    const trimmedMessage = newMessage.trim()
    if (!trimmedMessage && pendingAttachments.length === 0) {
      setComposerError("Add a message or include an attachment before sending.")
      return
    }

    setIsSending(true)
    setComposerError(null)

    try {
      const messageId = generateId("message")
      const timestamp = new Date().toISOString()
      const attachments: MessageAttachment[] = pendingAttachments.map((attachment) => ({
        id: generateId("attachment"),
        type: attachment.type,
        name: attachment.name,
        size: attachment.size,
        mimeType: attachment.mimeType,
        url: attachment.dataUrl,
        thumbnailUrl: attachment.type === "image" ? attachment.dataUrl : undefined,
      }))

      const readMap: MessageReadMap = {}
      for (const participantId of activeConversation.participantIds) {
        readMap[participantId] = participantId === user.id ? timestamp : null
      }

      addDirectMessage({
        id: messageId,
        conversationId: activeConversation.id,
        senderId: user.id,
        content: trimmedMessage,
        createdAt: timestamp,
        readAt: readMap,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      setNewMessage("")
      setPendingAttachments([])

      clearTypingIndicatorLocal(activeConversation.id, user.id)
      broadcastClearEvent(activeConversation.id, user.id)

      const updatedMessages = getDirectMessagesByConversation(activeConversation.id)
      setMessages(updatedMessages)
      markConversationMessagesRead(activeConversation.id, user.id)

      const updatedConversations = getUserConversations(user.id)
      setConversations(updatedConversations)
      const membership = new Set(updatedConversations.map((conversation) => conversation.id))
      const updatedAllMessages = getDirectMessages().filter((message) => membership.has(message.conversationId))
      setAllMessages(updatedAllMessages)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message."
      setComposerError(message)
    } finally {
      setIsSending(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="p-8 space-y-4 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="text-2xl font-semibold">Sign in to view your messages</h1>
              <p className="text-muted-foreground">
                Direct messages are available once you&apos;re signed in. Join the conversation with fellow pet lovers.
              </p>
              <div className="flex justify-center">
                <Link href="/">
                  <Button>Go to sign in</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Card className="overflow-hidden border">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
            <aside className="border-b md:border-b-0 md:border-r bg-muted/20">
              <div className="space-y-3 border-b p-4">
                <div>
                  <h1 className="text-xl font-semibold">Messages</h1>
                  <p className="text-sm text-muted-foreground">
                    Search across every thread and quickly jump into the right conversation.
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search messages or participants"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={showFilters || hasSearchFilters ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowFilters((prev) => !prev)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                  {hasSearchFilters && (
                    <Button variant="ghost" size="sm" onClick={resetSearchFilters}>
                      Clear search
                    </Button>
                  )}
                </div>
                {!hasSearchFilters && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={conversationListFilter === "active" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setConversationListFilter("active")}
                    >
                      Active ({archiveCounts.active})
                    </Button>
                    <Button
                      variant={conversationListFilter === "archived" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setConversationListFilter("archived")}
                    >
                      Archived ({archiveCounts.archived})
                    </Button>
                  </div>
                )}
                {(showFilters || hasSearchFilters) && (
                  <div className="space-y-3 rounded-md border bg-background/80 p-3 shadow-xs">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Conversation</Label>
                      <Select
                        value={searchConversationFilter}
                        onValueChange={(value) => setSearchConversationFilter(value)}
                      >
                        <SelectTrigger className="w-full justify-between">
                          <SelectValue placeholder="All conversations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All conversations</SelectItem>
                          {conversations.map((conversation) => (
                            <SelectItem key={conversation.id} value={conversation.id}>
                              {getConversationLabel(conversation)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Sender</Label>
                      <Select value={searchSenderFilter} onValueChange={(value) => setSearchSenderFilter(value)}>
                        <SelectTrigger className="w-full justify-between">
                          <SelectValue placeholder="All senders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All senders</SelectItem>
                          {searchSenderOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.id === user.id ? "You" : option.fullName || option.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="search-from" className="text-xs font-semibold uppercase text-muted-foreground">
                          From
                        </Label>
                        <Input
                          id="search-from"
                          type="date"
                          value={searchDateFrom}
                          onChange={(event) => setSearchDateFrom(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="search-to" className="text-xs font-semibold uppercase text-muted-foreground">
                          To
                        </Label>
                        <Input
                          id="search-to"
                          type="date"
                          value={searchDateTo}
                          onChange={(event) => setSearchDateTo(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Select value={searchSort} onValueChange={(value) => setSearchSort(value as MessageSearchSort)}>
                        <SelectTrigger className="w-full justify-between">
                          <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Sort: Relevance</SelectItem>
                          <SelectItem value="newest">Sort: Newest first</SelectItem>
                          <SelectItem value="oldest">Sort: Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="search-unread"
                          checked={searchOnlyUnread}
                          onCheckedChange={(checked) => setSearchOnlyUnread(checked)}
                        />
                        <Label htmlFor="search-unread" className="text-sm">
                          Unread only
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
                {hasSearchFilters && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{searchResults.length} match{searchResults.length === 1 ? "" : "es"}</span>
                    <span>•</span>
                    <span>
                      {searchConversationCount} conversation{searchConversationCount === 1 ? "" : "s"}
                    </span>
                    {searchUnreadCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{searchUnreadCount} unread</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {hasSearchFilters ? (
                  searchResults.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p>No messages match the current filters.</p>
                      <Button variant="ghost" size="sm" className="mt-3" onClick={resetSearchFilters}>
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {searchResults.map((result) => {
                        const sender = usersById[result.message.senderId]
                        const label = getConversationLabel(result.conversation)
                        const previewContent = result.message.content?.trim()
                          ? highlightMatches(truncate(result.message.content.trim(), 120), searchQuery)
                          : summarizeMessage(result.message, user.id)
                        const timestamp = formatDistanceToNow(new Date(result.message.createdAt), { addSuffix: true })
                        const isActive = result.conversation.id === selectedConversationId
                        const isArchived = result.conversation.isArchived === true

                        return (
                          <li key={result.message.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setConversationListFilter(isArchived ? "archived" : "active")
                                handleSelectConversation(result.conversation.id, result.message.id)
                              }}
                              className={cn(
                                "w-full flex items-start gap-3 px-4 py-3 transition-colors text-left",
                                isActive ? "bg-background" : "hover:bg-muted/40",
                              )}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={sender?.avatar} alt={sender?.fullName} />
                                <AvatarFallback>{sender?.fullName?.charAt(0) || sender?.username?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {sender?.fullName || sender?.username || "Unknown sender"}
                                    </span>
                                    {result.isUnread && <Badge variant="default">Unread</Badge>}
                                    {isArchived && (
                                      <Badge variant="outline" className="text-[10px] uppercase">
                                        Archived
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <div className="text-sm text-muted-foreground line-clamp-2">{previewContent}</div>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )
                ) : conversationSummaries.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No conversations yet.</p>
                    <p className="mt-2 text-sm">Start a chat from a pet profile or community page.</p>
                  </div>
                ) : displayedSummaries.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>
                      {conversationListFilter === "archived"
                        ? "Archived conversations will appear here once you archive a thread."
                        : "No conversations match this view."}
                    </p>
                    {conversationListFilter === "archived" && (
                      <p className="mt-2 text-sm">Select a conversation and use the archive action to move it here.</p>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y">
                    {displayedSummaries.map(({ conversation, participants, lastMessage, hasUnread }) => {
                      const isActive = conversation.id === selectedConversationId
                      const title = conversation.title?.trim()
                      const label =
                        title ||
                        (participants.length > 0
                          ? participants.map((participant) => participant.fullName).join(", ")
                          : "Conversation")
                      const previewSource =
                        conversation.snippet?.trim() || summarizeMessage(lastMessage, user.id) || "Start the chat"
                      const preview = truncate(previewSource)
                      const timestamp = lastMessage
                        ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
                        : ""
                      const avatarUser = participants[0]
                      const typingEntry = typingIndicators[conversation.id] ?? {}
                      const now = Date.now()
                      const typingNames = Object.entries(typingEntry)
                        .filter(([typingUserId, expiresAt]) => typingUserId !== user.id && expiresAt > now)
                        .map(([typingUserId]) => {
                          const participant = usersById[typingUserId]
                          return participant?.fullName || participant?.username || null
                        })
                        .filter((name): name is string => Boolean(name))
                      const unreadCount = conversation.unreadCounts?.[user.id] ?? (hasUnread ? 1 : 0)
                      const isArchived = conversation.isArchived === true

                      return (
                        <li key={conversation.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectConversation(conversation.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                              isActive ? "bg-background" : "hover:bg-muted/40",
                            )}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatarUser?.avatar} alt={avatarUser?.fullName} />
                              <AvatarFallback>
                                {avatarUser ? avatarUser.fullName.charAt(0) : "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "font-medium truncate",
                                      unreadCount > 0 && "text-primary",
                                    )}
                                  >
                                    {label}
                                  </span>
                                  {isArchived && (
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                      Archived
                                    </Badge>
                                  )}
                                </div>
                                {timestamp && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {timestamp}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {typingNames.length > 0 ? (
                                  <TypingIndicator names={typingNames} variant="inline" />
                                ) : (
                                  <p
                                    className={cn(
                                      "text-sm text-muted-foreground truncate",
                                      unreadCount > 0 && "text-foreground font-medium",
                                    )}
                                  >
                                    {preview}
                                  </p>
                                )}
                                {unreadCount > 0 && (
                                  <Badge variant="default" className="text-[10px] px-2 py-0.5">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </Badge>
                                )}
                              </div>
                              {conversation.tags && conversation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {conversation.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-[10px]">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <section className="flex flex-col min-h-[70vh]">
              {activeConversation ? (
                <>
                  <div className="border-b px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {activeParticipants.length > 0
                          ? activeParticipants.map((participant) => participant.fullName).join(", ")
                          : "Direct Message"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Share photos, videos, and files to keep everyone in the loop.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeParticipants.length > 1 && (
                        <Badge variant="outline">{activeParticipants.length + 1} participants</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleToggleArchive(activeConversation)}
                      >
                        {activeConversation.isArchived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                        {activeConversation.isArchived ? "Unarchive" : "Archive"}
                      </Button>
                    </div>
                  </div>

                  <div ref={messageListRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-muted/10">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                        <div>
                          <p className="font-medium">No messages yet</p>
                          <p className="text-sm mt-1">Start the conversation with your first update.</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = message.senderId === user.id
                        const sender = resolveUser(message.senderId)
                        const timestamp = formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })
                        const isHighlighted = highlightedMessageId === message.id
                        let readReceiptDisplay: ReactNode | null = null

                        if (isOwn && activeConversation) {
                          const otherParticipantIds = activeConversation.participantIds.filter(
                            (participantId) => participantId !== user.id,
                          )
                          if (otherParticipantIds.length > 0) {
                            const receiptDetails = getReadReceiptDetails(message, activeConversation.participantIds)

                            if (receiptDetails.readBy.length === 0) {
                              const waitingNames = receiptDetails.unreadBy.map((participantId) =>
                                formatParticipantName(participantId),
                              )
                              readReceiptDisplay = (
                                <span className="flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  <span>
                                    {waitingNames.length > 0 ? `Waiting on ${waitingNames.join(", ")}` : "Delivered"}
                                  </span>
                                </span>
                              )
                            } else {
                              const readNames = receiptDetails.readBy.map((entry) =>
                                formatParticipantName(entry.userId),
                              )
                              const visibleNames = readNames.slice(0, 2)
                              const extraCount = readNames.length - visibleNames.length
                              const nameLabel =
                                extraCount > 0
                                  ? `${visibleNames.join(", ")} +${extraCount}`
                                  : visibleNames.join(", ") || readNames[0]
                              const timeLabel =
                                receiptDetails.lastReadAt !== null
                                  ? formatDistanceToNow(new Date(receiptDetails.lastReadAt), { addSuffix: true })
                                  : null
                              const waitingNames = receiptDetails.unreadBy.map((participantId) =>
                                formatParticipantName(participantId),
                              )

                              readReceiptDisplay = (
                                <span className="flex flex-wrap items-center gap-1">
                                  <CheckCheck className="h-3 w-3" />
                                  <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                    <span>{`Seen by ${nameLabel}`}</span>
                                    {timeLabel ? <span className="opacity-80">• {timeLabel}</span> : null}
                                    {waitingNames.length > 0 ? (
                                      <span className="opacity-80">• Waiting on {waitingNames.join(", ")}</span>
                                    ) : null}
                                  </span>
                                </span>
                              )
                            }
                          }
                        }

                        return (
                          <div
                            key={message.id}
                            className={cn("flex gap-3", isOwn ? "justify-end" : "justify-start")}
                          >
                            {!isOwn && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sender?.avatar} alt={sender?.fullName} />
                                <AvatarFallback>{sender?.fullName?.charAt(0) ?? "P"}</AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              data-message-id={message.id}
                              className={cn(
                                "max-w-[85%] rounded-lg p-3 shadow-sm transition",
                                isOwn
                                  ? "bg-primary text-primary-foreground ml-auto"
                                  : "bg-background border",
                                isHighlighted &&
                                  (isOwn
                                    ? "ring-2 ring-offset-2 ring-offset-background ring-primary/60"
                                    : "border-primary/60 bg-primary/5")
                              )}
                            >
                              {message.content && (
                                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                              )}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className={cn("mt-3 space-y-3", message.content && "pt-3 border-t border-border/70")}>
                                  {message.attachments.map((attachment) => {
                                    if (attachment.type === "image") {
                                      return (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block overflow-hidden rounded-md border border-border/70"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={attachment.url}
                                            alt={attachment.name}
                                            className="max-h-60 w-full object-cover"
                                          />
                                        </a>
                                      )
                                    }

                                    if (attachment.type === "video") {
                                      return (
                                        <div key={attachment.id} className="rounded-md overflow-hidden border border-border/70">
                                          <video
                                            src={attachment.url}
                                            controls
                                            poster={attachment.thumbnailUrl}
                                            className="w-full max-h-60 bg-black"
                                          />
                                        </div>
                                      )
                                    }

                                    return (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          "flex items-center gap-3 rounded-md border border-border/70 px-3 py-2 text-sm",
                                          isOwn ? "bg-primary/20 text-primary-foreground" : "bg-muted/40 text-foreground",
                                        )}
                                      >
                                        <FileText className="h-4 w-4" />
                                        <div className="flex-1 min-w-0">
                                          <p className="truncate font-medium">{attachment.name}</p>
                                          <p className={cn("text-xs", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                            {formatFileSize(attachment.size)}
                                          </p>
                                        </div>
                                      </a>
                                    )
                                  })}
                                </div>
                              )}
                              <p
                                className={cn(
                                  "text-xs mt-2 flex items-center gap-1",
                                  isOwn ? "text-primary-foreground/80 justify-end" : "text-muted-foreground",
                                )}
                              >
                                {sender && !isOwn && <span>{sender.fullName.split(" ")[0]}</span>}
                                <span>{timestamp}</span>
                                {isOwn && readReceiptDisplay}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {typingUserNames.length > 0 && (
                    <div className="px-4 sm:px-6 pb-2">
                      <TypingIndicator names={typingUserNames} />
                    </div>
                  )}

                  <div className="border-t px-4 sm:px-6 py-4 space-y-4">
                    {pendingAttachments.length > 0 && (
                      <div className="rounded-md border border-dashed border-border/80 p-3">
                        <p className="text-sm font-medium mb-2">Attachments</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {pendingAttachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="relative rounded-md border border-border/70 bg-muted/20 p-3 text-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(attachment.id)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                                aria-label={`Remove ${attachment.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <p className="font-medium pr-6 truncate">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                              <p className="text-xs text-muted-foreground mt-1 capitalize">{attachment.type}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {composerError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Something went wrong</AlertTitle>
                        <AlertDescription>{composerError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isProcessingAttachments || pendingAttachments.length >= MAX_ATTACHMENT_COUNT}
                          aria-label="Attach image"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={isProcessingAttachments || pendingAttachments.length >= MAX_ATTACHMENT_COUNT}
                          aria-label="Attach video"
                        >
                          <Video className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingAttachments || pendingAttachments.length >= MAX_ATTACHMENT_COUNT}
                          aria-label="Attach file"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Textarea
                          value={newMessage}
                          onChange={handleMessageChange}
                          onBlur={() => {
                            if (user && activeConversation) {
                              clearTypingIndicatorLocal(activeConversation.id, user.id)
                              broadcastClearEvent(activeConversation.id, user.id)
                            }
                          }}
                          placeholder="Type a message..."
                          rows={3}
                          className="resize-none"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {pendingAttachments.length}/{MAX_ATTACHMENT_COUNT} attachments
                          </span>
                          {isProcessingAttachments && (
                            <span className="flex items-center gap-1">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Processing files...
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSending || isProcessingAttachments}
                        className="self-end"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleAttachmentSelect(event, "image")}
                    />
                    <Input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleAttachmentSelect(event, "video")}
                    />
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      multiple
                      className="hidden"
                      onChange={(event) => handleAttachmentSelect(event, "document")}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground px-8 py-12">
                  <div>
                    <p className="text-lg font-medium">No conversation selected</p>
                    <p className="text-sm mt-2">
                      Choose a chat from the left to start sharing photos, videos, or documents with your friends.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}
