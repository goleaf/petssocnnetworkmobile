"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Clock,
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileVideo,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Download,
  Search,
  Send,
  SlidersHorizontal,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  BellOff,
  Pin,
  Trash2,
  MoreVertical,
  Mic,
  Camera,
  MapPin,
  UserPlus,
} from "lucide-react"

import { useAuth } from "@/lib/auth"
import {
  addDirectMessage,
  createConversation,
  getDirectMessages,
  getDirectMessageById,
  getDirectMessagesByConversation,
  getUserConversations,
  getUsers,
  markConversationMessagesRead,
  setConversationArchiveState,
  updateConversation,
  setConversationUnreadCount,
  deleteConversation,
  replaceMessagesForConversation,
  blockUser,
  updateDirectMessage,
  deleteDirectMessageById,
  toggleFollow,
  getConversationById,
  isMessageStarred,
  starMessage,
  unstarMessage,
} from "@/lib/storage"
import { areUsersBlocked } from "@/lib/storage"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { extractFirstUrl, fetchLinkPreview, type LinkPreview } from "@/lib/link-preview"
import { createNotification } from "@/lib/notifications"
import {
  searchMessages,
  type MessageSearchFilters,
  type MessageSearchSort,
} from "@/lib/direct-messages"
import { useIsMdUp } from "@/lib/hooks/use-media-query"

const STORAGE_KEYS_TO_WATCH = ["pet_social_conversations", "pet_social_direct_messages", "pet_social_users"] as const
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_ATTACHMENT_COUNT = 10
const MAX_IMAGE_SIZE_AFTER_COMPRESSION = 2 * 1024 * 1024 // 2MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024 // 100MB
const MAX_VIDEO_DURATION_SECONDS = 5 * 60 // 5 minutes
const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const TYPING_INDICATOR_TIMEOUT = 4000

type PendingAttachment = {
  id: string
  name: string
  size: number
  mimeType: string
  type: MessageAttachmentType
  dataUrl: string
  caption?: string
  status?: "idle" | "uploading" | "ready" | "error"
  progress?: number
  cancelId?: number | null
}

function VoiceMessagePlayer({ url, name }: { url: string; name?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [earMode, setEarMode] = useState(false)

  // Deterministic waveform bars based on name/url hash
  const bars = useMemo(() => {
    const seedStr = name || url
    let seed = 0
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
    const rand = () => ((seed = (1103515245 * seed + 12345) % 0x80000000) / 0x80000000)
    return Array.from({ length: 48 }, () => 8 + Math.floor(rand() * 24))
  }, [name, url])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrent(el.currentTime)
    const onLoaded = () => setDuration(el.duration || 0)
    el.addEventListener("play", onPlay)
    el.addEventListener("pause", onPause)
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("loadedmetadata", onLoaded)
    const onOrient = (e: any) => {
      // Heuristic: when phone held upright (beta > 60) and relatively stable, enable ear mode
      const beta = e?.beta || 0
      setEarMode(beta > 60)
    }
    try {
      window.addEventListener('deviceorientation', onOrient)
    } catch {}
    return () => {
      el.removeEventListener("play", onPlay)
      el.removeEventListener("pause", onPause)
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("loadedmetadata", onLoaded)
      try { window.removeEventListener('deviceorientation', onOrient) } catch {}
    }
  }, [])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  }

  const setRate = (r: number) => {
    const el = audioRef.current
    if (!el) return
    setSpeed(r)
    el.playbackRate = r
  }

  const pct = duration > 0 ? Math.min(1, current / duration) : 0
  const filledBars = Math.floor(pct * bars.length)

  return (
    <div className="w-full max-w-[300px] rounded-md border border-border/70 bg-muted/40 p-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggle} className="rounded-full bg-background p-2">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="flex items-end gap-[2px] h-10">
            {bars.map((h, i) => (
              <span key={i} className={cn("w-[3px] rounded-sm", i < filledBars ? "bg-primary" : "bg-muted-foreground/30")}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{formatDuration(current)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
        <div className="ml-2 flex flex-col items-center gap-1">
          {[1, 1.5, 2].map((r) => (
            <button key={r} type="button" onClick={() => setRate(r)} className={cn("rounded px-1 text-[10px]", speed === r ? "bg-primary text-primary-foreground" : "bg-background")}>{r}x</button>
          ))}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        className="hidden"
        playsInline
        onPlay={async () => {
          // Attempt to route audio to earpiece if available
          const el: any = audioRef.current
          if (!el || typeof el.setSinkId !== 'function') return
          if (!earMode) return
          try {
            const devices = await navigator.mediaDevices?.enumerateDevices?.()
            const outputs = (devices || []).filter((d) => d.kind === 'audiooutput')
            const earpiece = outputs.find((d) => /earpiece/i.test(d.label)) || outputs[0]
            if (earpiece && earpiece.deviceId) {
              await el.setSinkId(earpiece.deviceId)
            }
          } catch {}
        }}
      />
    </div>
  )
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

// Inbox timestamp rules:
// - Today: short relative (e.g., "5m ago", "2h ago")
// - Yesterday: "Yesterday"
// - This week (Mon-Sun of this week): weekday (e.g., "Mon")
// - Older: "MMM d" (e.g., "Dec 15")
function formatInboxTimestamp(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ""
  const now = new Date()

  const ms = now.getTime() - d.getTime()
  const oneMinute = 60 * 1000
  const oneHour = 60 * oneMinute
  const oneDay = 24 * oneHour

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfToday.getDate() - 1)

  if (d >= startOfToday) {
    if (ms < oneMinute) return "now"
    if (ms < oneHour) return `${Math.floor(ms / oneMinute)}m ago`
    return `${Math.floor(ms / oneHour)}h ago`
  }
  if (d >= startOfYesterday) return "Yesterday"

  const dayIdx = d.getDay() // 0-6
  const nowIdx = now.getDay()
  // Find Monday of this week (assuming week starts Monday for label spec)
  const mondayThisWeek = new Date(now)
  const deltaToMonday = (nowIdx + 6) % 7 // days since Monday
  mondayThisWeek.setDate(now.getDate() - deltaToMonday)
  mondayThisWeek.setHours(0, 0, 0, 0)
  if (d >= mondayThisWeek) {
    return d.toLocaleDateString(undefined, { weekday: "short" })
  }

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

  function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00"
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m)
  const ss = String(sec).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function renderMessageContent(text: string) {
  // Linkify URLs and style mentions
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  const parts: Array<string | JSX.Element> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const pushMentions = (chunk: string) => {
    // Replace @mentions with styled spans/links
    const mentionPattern = /(^|\s)@([a-zA-Z0-9_]{2,})/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = mentionPattern.exec(chunk)) !== null) {
      const [full, leading, username] = m
      const start = m.index
      if (start > last) parts.push(chunk.slice(last, start))
      parts.push(leading)
      // Link to user profile; keep explicit blue styling per spec
      parts.push(
        <Link key={`m-${start}-${username}`} href={`/user/${username}`} className="text-blue-600 underline">
          @{username}
        </Link>,
      )
      last = start + full.length
    }
    if (last < chunk.length) parts.push(chunk.slice(last))
  }

  while ((match = urlPattern.exec(text)) !== null) {
    const matchText = match[0]
    const index = match.index
    if (index > lastIndex) pushMentions(text.slice(lastIndex, index))
    const href = normalizeUrl(matchText)
    parts.push(
      <a
        key={`u-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600 break-words"
      >
        {matchText}
      </a>,
    )
    lastIndex = index + matchText.length
  }
  if (lastIndex < text.length) pushMentions(text.slice(lastIndex))

  return <>{parts}</>
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

function highlightMatchesYellow(text: string, query: string): ReactNode {
  const tokens = query.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return text
  const pattern = tokens.map((t) => escapeRegExp(t)).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-1 py-0.5 text-foreground">
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

async function compressImage(file: File, maxBytes = MAX_IMAGE_SIZE_AFTER_COMPRESSION): Promise<{ dataUrl: string; size: number }> {
  const imgUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = (e) => reject(e)
      i.src = imgUrl
    })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    // Target roughly HD-ish max dimensions while preserving aspect
    const maxW = 1920
    const maxH = 1920
    let { width, height } = img
    const ratio = Math.min(maxW / width, maxH / height, 1)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.92
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    // Reduce quality iteratively to meet maxBytes (min 0.5)
    while (dataUrl.length * 0.75 > maxBytes && quality > 0.5) {
      quality -= 0.07
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    const b64len = dataUrl.length - 'data:image/jpeg;base64,'.length
    const size = Math.floor(b64len * 0.75)
    return { dataUrl, size }
  } finally {
    URL.revokeObjectURL(imgUrl)
  }
}

async function getVideoDuration(file: File): Promise<number> {
  return await new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      const d = isNaN(v.duration) ? 0 : v.duration
      URL.revokeObjectURL(url)
      resolve(d)
    }
    v.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
    v.src = url
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
  const isMdUp = useIsMdUp()
  const { user, isAuthenticated } = useAuth()
  const [isListCollapsedMdUp, setIsListCollapsedMdUp] = useState(false)
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
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null)
  const [linkPreviewDismissed, setLinkPreviewDismissed] = useState(false)
  const QUICK_REACTIONS = ['❤️','👍','😂','😮','😢','😡']
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const swipeStartXRef = useRef<number | null>(null)
  const swipeConsumedRef = useRef<boolean>(false)
  const [replyTarget, setReplyTarget] = useState<DirectMessage | null>(null)
  const [editedHistoryFor, setEditedHistoryFor] = useState<string | null>(null)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; accuracy?: number; address?: string } | null>(null)
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false)
  const [isForwardPickerOpen, setIsForwardPickerOpen] = useState(false)
  const [forwardSource, setForwardSource] = useState<DirectMessage | null>(null)
  const [editingTarget, setEditingTarget] = useState<DirectMessage | null>(null)
  const [deleteMenuFor, setDeleteMenuFor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchConversationFilter, setSearchConversationFilter] = useState<string>("all")
  const [searchSenderFilter, setSearchSenderFilter] = useState<string>("all")
  const [searchDateFrom, setSearchDateFrom] = useState("")
  const [searchDateTo, setSearchDateTo] = useState("")
  const [searchOnlyUnread, setSearchOnlyUnread] = useState(false)
  const [searchSort, setSearchSort] = useState<MessageSearchSort>("relevance")
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'text' | 'media' | 'links' | 'files'>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [conversationListFilter, setConversationListFilter] = useState<"active" | "archived">("active")
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  const messageListRef = useRef<HTMLDivElement | null>(null)
  const selectedConversationRef = useRef<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutsRef = useRef<Map<string, number>>(new Map())
  const typingChannelRef = useRef<BroadcastChannel | null>(null)
  const previousConversationRef = useRef<string | null>(null)
  const [typingIndicators, setTypingIndicators] = useState<Record<string, Record<string, number>>>({})
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [videoDurations, setVideoDurations] = useState<Record<string, string>>({})
  const [imageLightbox, setImageLightbox] = useState<{
    open: boolean
    images: string[]
    index: number
    zoom: boolean
  }>({ open: false, images: [], index: 0, zoom: false })
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordLocked, setRecordLocked] = useState(false)
  const [recordCancel, setRecordCancel] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [recordLevels, setRecordLevels] = useState<number[]>(Array.from({ length: 32 }, () => 10))
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<Blob[]>([])
  const recordStartXYRef = useRef<{ x: number; y: number } | null>(null)
  const recordTimerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

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

  function formatPresence(lastSeen?: string | null): string {
    if (!lastSeen) return "Offline"
    const t = new Date(lastSeen).getTime()
    if (!Number.isFinite(t)) return "Offline"
    const delta = Date.now() - t
    if (delta < 2 * 60 * 1000) return "Active now"
    if (delta < 24 * 60 * 60 * 1000) {
      const mins = Math.round(delta / (60 * 1000))
      if (mins < 60) return `Active ${mins}m ago`
      const hrs = Math.round(mins / 60)
      return `Active ${hrs}h ago`
    }
    return "Offline"
  }

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
    const nextSelection = selectionExists
      ? currentSelection
      : isMdUp
        ? updatedConversations[0]?.id ?? null
        : null

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
  }, [user, isMdUp])

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

  // Handle deep-link from Starred Messages (or others)
  useEffect(() => {
    if (!user) return
    try {
      const raw = localStorage.getItem('pet_social_jump_to_message')
      if (!raw) return
      localStorage.removeItem('pet_social_jump_to_message')
      const { conversationId, messageId } = JSON.parse(raw) as { conversationId: string; messageId: string }
      if (!conversationId || !messageId) return
      setConversationListFilter('active')
      handleSelectConversation(conversationId, messageId)
    } catch {}
  }, [user])

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
    // Pinned to top; then recent activity
    .sort((a, b) => {
      const aPinned = a.conversation.pinned === true ? 1 : 0
      const bPinned = b.conversation.pinned === true ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      const at = new Date(a.conversation.updatedAt).getTime()
      const bt = new Date(b.conversation.updatedAt).getTime()
      return bt - at
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

    // On mobile, prefer showing the list and do not auto-select.
    if (!isMdUp) {
      if (!selectedConversationId) return
      const isVisible = displayedSummaries.some(
        (summary) => summary.conversation.id === selectedConversationId,
      )
      if (!isVisible) {
        selectedConversationRef.current = null
        setSelectedConversationId(null)
        setMessages([])
      }
      return
    }

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
  }, [displayedSummaries, hasSearchFilters, selectedConversationId, user, isMdUp])

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

  const filteredSearchResults = useMemo(() => {
    if (searchTypeFilter === 'all') return searchResults
    return searchResults.filter((r) => {
      const atts = r.message.attachments || []
      if (searchTypeFilter === 'text') return Boolean(r.message.content?.trim())
      if (searchTypeFilter === 'media') return atts.some((a) => a.type === 'image' || a.type === 'video')
      if (searchTypeFilter === 'links') return atts.some((a) => a.type === 'link')
      if (searchTypeFilter === 'files') return atts.some((a) => a.type === 'document' || (a.mimeType || '').startsWith('audio/'))
      return true
    })
  }, [searchResults, searchTypeFilter])

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
    () => filteredSearchResults.filter((result) => result.isUnread).length,
    [filteredSearchResults],
  )

  const searchConversationCount = useMemo(() => {
    const ids = new Set<string>()
    filteredSearchResults.forEach((result) => ids.add(result.conversation.id))
    return ids.size
  }, [filteredSearchResults])

  // In-conversation matches and navigation
  const inConversationMatches = useMemo(() => {
    if (!selectedConversationId || !searchQuery.trim()) return [] as string[]
    return filteredSearchResults
      .filter((r) => r.conversation.id === selectedConversationId)
      .map((r) => r.message.id)
  }, [filteredSearchResults, selectedConversationId, searchQuery])
  const [inConvMatchIndex, setInConvMatchIndex] = useState(0)
  useEffect(() => { setInConvMatchIndex(0) }, [selectedConversationId, searchQuery, searchConversationFilter])
  const activeMatchId = inConversationMatches[inConvMatchIndex] || null
  useEffect(() => {
    if (activeMatchId) {
      setHighlightedMessageId(activeMatchId)
      const el = messageListRef.current?.querySelector<HTMLElement>(`[data-message-id="${activeMatchId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeMatchId])

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
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    setComposerError(null)

    const existingCount = pendingAttachments.length
    const availableSlots = MAX_ATTACHMENT_COUNT - existingCount
    if (availableSlots <= 0) {
      setComposerError(`You can attach up to ${MAX_ATTACHMENT_COUNT} items.`)
      event.target.value = ""
      return
    }

    const selectedFiles = files.slice(0, availableSlots)
    if (selectedFiles.length < files.length) {
      setComposerError(`Only the first ${availableSlots} items were attached.`)
    }

    setIsProcessingAttachments(true)
    const nextAttachments: PendingAttachment[] = []
    const errorMessages: string[] = []

    for (const file of selectedFiles) {
      try {
        const type = inferAttachmentType(file.type, forcedType)
        if (type === 'image') {
          const { dataUrl, size } = await compressImage(file)
          nextAttachments.push({
            id: generateId('attachment'),
            name: file.name,
            size,
            mimeType: 'image/jpeg',
            type,
            dataUrl,
            status: 'ready',
            progress: 100,
            cancelId: null,
          })
        } else if (type === 'video') {
          const duration = await getVideoDuration(file)
          if (file.size > MAX_VIDEO_SIZE_BYTES) {
            errorMessages.push(`"${file.name}" exceeds the 100MB video limit.`)
            continue
          }
          if (duration > MAX_VIDEO_DURATION_SECONDS) {
            errorMessages.push(`"${file.name}" is longer than 5 minutes.`)
            continue
          }
          const objectUrl = URL.createObjectURL(file)
          const id = generateId('attachment')
          const pending: PendingAttachment = {
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'video/mp4',
            type,
            dataUrl: objectUrl,
            status: 'uploading',
            progress: 0,
            cancelId: null,
          }
          nextAttachments.push(pending)
          const cancelId = window.setInterval(() => {
            setPendingAttachments((prev) => {
              const idx = prev.findIndex((p) => p.id === id)
              if (idx === -1) return prev
              const copy = [...prev]
              const cur = copy[idx]
              if (cur.status !== 'uploading') {
                window.clearInterval(cancelId)
                return prev
              }
              const nextProg = Math.min(100, (cur.progress || 0) + 8)
              copy[idx] = { ...cur, progress: nextProg }
              if (nextProg >= 100) {
                window.clearInterval(cancelId)
                copy[idx] = { ...copy[idx], status: 'ready' }
              }
              return copy
            })
          }, 120)
          pending.cancelId = cancelId
        } else {
          // documents and others
          if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
            errorMessages.push(`"${file.name}" exceeds the 50MB limit.`)
            continue
          }
          const objectUrl = URL.createObjectURL(file)
          const id = generateId('attachment')
          const pending: PendingAttachment = {
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            type,
            dataUrl: objectUrl,
            status: 'uploading',
            progress: 0,
            cancelId: null,
          }
          nextAttachments.push(pending)
          const cancelId = window.setInterval(() => {
            setPendingAttachments((prev) => {
              const idx = prev.findIndex((p) => p.id === id)
              if (idx === -1) return prev
              const copy = [...prev]
              const cur = copy[idx]
              if (cur.status !== 'uploading') {
                window.clearInterval(cancelId)
                return prev
              }
              const nextProg = Math.min(100, (cur.progress || 0) + 12)
              copy[idx] = { ...cur, progress: nextProg }
              if (nextProg >= 100) {
                window.clearInterval(cancelId)
                copy[idx] = { ...copy[idx], status: 'ready' }
              }
              return copy
            })
          }, 120)
          pending.cancelId = cancelId
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error'
        errorMessages.push(`Could not attach "${file.name}": ${reason}`)
      }
    }

    if (nextAttachments.length > 0) {
      setPendingAttachments((prev) => [...prev, ...nextAttachments])
    }
    if (errorMessages.length > 0) {
      setComposerError(errorMessages.join(' '))
    }
    setIsProcessingAttachments(false)
    event.target.value = ''
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => {
      const att = prev.find((p) => p.id === attachmentId)
      if (att?.cancelId) window.clearInterval(att.cancelId)
      if (att && att.type === 'video' && att.dataUrl?.startsWith('blob:')) {
        try { URL.revokeObjectURL(att.dataUrl) } catch {}
      }
      return prev.filter((item) => item.id !== attachmentId)
    })
  }

  const handleCancelUpload = (attachmentId: string) => {
    setPendingAttachments((prev) => {
      const att = prev.find((p) => p.id === attachmentId)
      if (!att) return prev
      if (att.cancelId) window.clearInterval(att.cancelId)
      if (att.type === 'video' && att.dataUrl?.startsWith('blob:')) {
        try { URL.revokeObjectURL(att.dataUrl) } catch {}
      }
      return prev.filter((p) => p.id !== attachmentId)
    })
  }

  async function startVoiceRecording() {
    try {
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
        setComposerError('Microphone not available in this browser')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr
      recordChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data) }
      mr.start()

      // Audio visualization
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = source
      const buffer = new Uint8Array(analyser.frequencyBinCount)
      const updateLevels = () => {
        analyser.getByteTimeDomainData(buffer)
        // Compute approximate waveform heights
        const step = Math.floor(buffer.length / 32)
        const levels: number[] = []
        for (let i = 0; i < 32; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) {
            const v = buffer[i * step + j] - 128
            sum += Math.abs(v)
          }
          const avg = sum / step
          levels.push(8 + Math.min(30, Math.floor((avg / 128) * 30)))
        }
        setRecordLevels(levels)
        rafRef.current = window.requestAnimationFrame(updateLevels)
      }
      rafRef.current = window.requestAnimationFrame(updateLevels)

      // Timer
      setRecordDuration(0)
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current)
      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((d) => {
          if (d + 1 >= MAX_VIDEO_DURATION_SECONDS) { // reuse 5 min cap
            finalizeVoiceRecording(true)
            return d
          }
          return d + 1
        })
      }, 1000)

      setIsRecording(true)
      setRecordLocked(false)
      setRecordCancel(false)
    } catch (e) {
      setComposerError('Microphone permission denied')
    }
  }

  function cleanupRecordingNodes() {
    if (rafRef.current) { window.cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (recordTimerRef.current) { window.clearInterval(recordTimerRef.current); recordTimerRef.current = null }
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    analyserRef.current = null
    try { sourceRef.current?.disconnect() } catch {}
    sourceRef.current = null
    // stop tracks
    const mr = mediaRecorderRef.current
    const stream = mr?.stream
    if (stream) stream.getTracks().forEach((t) => { try { t.stop() } catch {} })
  }

  function cancelVoiceRecording() {
    try { mediaRecorderRef.current?.stop() } catch {}
    cleanupRecordingNodes()
    setIsRecording(false)
    setRecordLocked(false)
    setRecordCancel(false)
    setRecordDuration(0)
  }

  function finalizeVoiceRecording(sendOnRelease: boolean) {
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.onstop = () => {
      cleanupRecordingNodes()
      const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      const att: PendingAttachment = {
        id: generateId('attachment'),
        name: `voice-message-${new Date().toISOString()}.webm`,
        size: blob.size,
        mimeType: 'audio/webm',
        type: 'document',
        dataUrl: url,
        status: 'ready',
        progress: 100,
        cancelId: null,
      }
      setPendingAttachments((prev) => [...prev, att])
      setIsRecording(false)
      setRecordLocked(false)
      setRecordCancel(false)
      setRecordDuration(0)
      if (sendOnRelease) {
        // Send immediately
        setTimeout(() => handleSendMessage(), 0)
      }
    }
    try { mr.stop() } catch {}
  }

  const MIC_LOCK_THRESHOLD_PX = 60
  const MIC_CANCEL_THRESHOLD_PX = 60

  function onMicPressStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const point = 'touches' in e && e.touches.length ? e.touches[0] : ('clientX' in e ? e as React.MouseEvent : null)
    const x = point ? (point as any).clientX : 0
    const y = point ? (point as any).clientY : 0
    recordStartXYRef.current = { x, y }
    startVoiceRecording()
    const move = (ev: MouseEvent | TouchEvent) => {
      const start = recordStartXYRef.current
      if (!start) return
      const pt = (ev as TouchEvent).touches && (ev as TouchEvent).touches.length ? (ev as TouchEvent).touches[0] : (ev as MouseEvent)
      const dx = (pt as any).clientX - start.x
      const dy = (pt as any).clientY - start.y
      if (dy < -MIC_LOCK_THRESHOLD_PX) {
        setRecordLocked(true)
        setRecordCancel(false)
      } else if (dx < -MIC_CANCEL_THRESHOLD_PX) {
        setRecordCancel(true)
      } else {
        setRecordCancel(false)
        setRecordLocked(false)
      }
    }
    const end = (ev: MouseEvent | TouchEvent) => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('touchmove', move as any)
      document.removeEventListener('mouseup', end)
      document.removeEventListener('touchend', end as any)
      if (!isRecording) return
      if (recordCancel) {
        cancelVoiceRecording()
      } else if (recordLocked) {
        // keep recording until user taps stop
      } else {
        finalizeVoiceRecording(true)
      }
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('touchmove', move as any, { passive: false })
    document.addEventListener('mouseup', end)
    document.addEventListener('touchend', end as any)
  }

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setNewMessage(value)
    // Auto-detect link and fetch preview asynchronously
    if (!linkPreviewDismissed) {
      const url = extractFirstUrl(value)
      if (url) {
        fetchLinkPreview(url).then((preview) => {
          if (preview && extractFirstUrl(newMessage || '') === url) {
            setLinkPreview(preview)
          }
        })
      } else {
        setLinkPreview(null)
      }
    }

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
    if (editingTarget) {
      // Save edit
      const original = getDirectMessageById(editingTarget.id)
      const newText = trimmedMessage
      if (!original) { setEditingTarget(null); return }
      if (newText === original.content) { setEditingTarget(null); setNewMessage(''); return }
      const now = new Date().toISOString()
      const history = original.editHistory ? [...original.editHistory] : []
      history.push({ content: original.content, editedAt: now })
      updateDirectMessage(original.id, { content: newText, editedAt: now, editHistory: history } as any)
      setEditingTarget(null)
      setNewMessage('')
      // Notify recipients if major changes
      const oldLen = (original.content || '').length
      const newLen = newText.length
      const major = Math.abs(newLen - oldLen) > 20 || (!original.content?.includes(newText) && !newText.includes(original.content || ''))
      if (major) {
        try {
          const conv = getConversationById(original.conversationId)
          const recipients = conv?.participantIds.filter((id) => id !== user.id) || []
          recipients.forEach((rid) => {
            createNotification({
              userId: rid,
              type: 'message',
              actorId: user.id,
              message: 'Message edited',
              targetId: original.id,
              targetType: 'user',
              channels: ['in_app'],
            })
          })
        } catch {}
      }
      setMessages(getDirectMessagesByConversation(activeConversation.id))
      return
    }

    if (!trimmedMessage && pendingAttachments.length === 0) {
      setComposerError("Add a message or include an attachment before sending.")
      return
    }

    setIsSending(true)
    setComposerError(null)

    try {
      const messageId = generateId("message")
      const timestamp = new Date().toISOString()
      // Only allow sending when all media are ready
      const notReady = pendingAttachments.some((a) => a.status === 'uploading')
      if (notReady) {
        setComposerError('Please wait for uploads to finish before sending.')
        setIsSending(false)
        return
      }
      const attachments: MessageAttachment[] = pendingAttachments.map((attachment) => ({
        id: generateId("attachment"),
        type: attachment.type,
        name: attachment.name,
        size: attachment.size,
        mimeType: attachment.mimeType,
        url: attachment.dataUrl,
        thumbnailUrl: attachment.type === "image" ? attachment.dataUrl : undefined,
        caption: attachment.caption,
      }))
      // Add link preview if present and not dismissed
      if (linkPreview && !linkPreviewDismissed) {
        attachments.push({
          id: generateId('attachment'),
          type: 'link',
          name: linkPreview.title || linkPreview.url,
          size: 0,
          mimeType: 'text/html',
          url: linkPreview.url,
          thumbnailUrl: linkPreview.image || undefined,
          caption: undefined,
          siteName: linkPreview.siteName || undefined,
          faviconUrl: linkPreview.favicon || undefined,
          description: linkPreview.description || undefined,
        })
      }

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
        repliedToId: replyTarget?.id,
      })

      setNewMessage("")
      setPendingAttachments([])
      setLinkPreview(null)
      setLinkPreviewDismissed(false)
      setReplyTarget(null)

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

      // Optimistic delivery pipeline: simulate server processing
      const recipientIds = activeConversation.participantIds.filter((id) => id !== user.id)
      const anyBlocked = recipientIds.some((rid) => areUsersBlocked(user.id, rid))
      const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false
      const anyOnline = recipientIds.some((rid) => {
        const r = usersById[rid]
        if (!r?.lastSeen) return false
        const last = new Date(r.lastSeen).getTime()
        return Number.isFinite(last) && Date.now() - last < 2 * 60 * 1000
      })

      // after a short delay, either fail or mark sent/delivered
      window.setTimeout(() => {
        if (anyBlocked || isOffline) {
          updateDirectMessage(messageId, { status: "failed" as any })
          const m = getDirectMessagesByConversation(activeConversation.id)
          setMessages(m)
          return
        }
        // mark as sent
        updateDirectMessage(messageId, { status: "sent" as any })
        // delivered shortly after if recipient appears online
        if (anyOnline) {
          window.setTimeout(() => {
            updateDirectMessage(messageId, { status: "delivered" as any })
            const m = getDirectMessagesByConversation(activeConversation.id)
            setMessages(m)
          }, 500)
        } else {
          const m = getDirectMessagesByConversation(activeConversation.id)
          setMessages(m)
        }
      }, 400)

      // Start live location broadcast for any live-location attachments
      const liveAttIds = attachments
        .filter((a) => a.type === 'live-location')
        .map((a) => ({ id: a.id, expiresAt: a.expiresAt, lat: a.lat, lon: a.lon }))

      if (liveAttIds.length > 0 && 'geolocation' in navigator) {
        for (const entry of liveAttIds) {
          const attId = entry.id
          const expires = entry.expiresAt ? new Date(entry.expiresAt).getTime() : Date.now() + 15 * 60000
          try {
            const watchId = navigator.geolocation.watchPosition((pos) => {
              const point = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() }
              try {
                const key = `pet_social_live_${attId}`
                const raw = localStorage.getItem(key)
                const data = raw ? JSON.parse(raw) as { points: any[]; expiresAt: number } : { points: [], expiresAt: expires }
                data.points.push(point)
                localStorage.setItem(key, JSON.stringify(data))
                try {
                  const bc = new BroadcastChannel('pet-social-live-location')
                  bc.postMessage({ type: 'live:update', attId, point })
                  bc.close()
                } catch {}
              } catch {}
            }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 })
            const interval = window.setInterval(() => {
              if (Date.now() > expires) {
                try { navigator.geolocation.clearWatch(watchId) } catch {}
                window.clearInterval(interval)
                try {
                  const key = `pet_social_live_${attId}`
                  const raw = localStorage.getItem(key)
                  if (raw) {
                    const data = JSON.parse(raw)
                    data.expiresAt = expires
                    localStorage.setItem(key, JSON.stringify(data))
                  }
                } catch {}
              }
            }, 10000)
          } catch {}
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message."
      setComposerError(message)
    } finally {
      setIsSending(false)
    }
  }

  function mapEmbedSrc(lat: number, lon: number, zoom = 15) {
    const bbox = `${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function onMessagePressStart(messageId: string) {
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => setReactionPickerFor(messageId), 450)
  }
  function onMessagePressEnd() {
    clearLongPressTimer()
  }

  function onMessageTouchStart(e: React.TouchEvent, messageId: string) {
    onMessagePressStart(messageId)
    if (e.touches.length === 1) {
      swipeStartXRef.current = e.touches[0].clientX
      swipeConsumedRef.current = false
    }
  }
  function onMessageTouchMove(e: React.TouchEvent, message: DirectMessage) {
    const start = swipeStartXRef.current
    if (start == null || swipeConsumedRef.current) return
    const dx = e.touches[0].clientX - start
    if (dx > 40) {
      // Trigger reply via swipe right
      swipeConsumedRef.current = true
      clearLongPressTimer()
      setReactionPickerFor(null)
      setReplyTarget(message)
    }
  }
  function onMessageTouchEnd() {
    swipeStartXRef.current = null
    swipeConsumedRef.current = false
    onMessagePressEnd()
  }

  function scrollToMessage(messageId: string) {
    setHighlightedMessageId(messageId)
    const container = messageListRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleDeleteForMe(message: DirectMessage) {
    if (!user) return
    const existing = getDirectMessageById(message.id)
    if (!existing) { setDeleteMenuFor(null); return }
    const list = new Set(existing.deletedFor || [])
    list.add(user.id)
    updateDirectMessage(message.id, { deletedFor: Array.from(list) } as any)
    setDeleteMenuFor(null)
    if (selectedConversationId) setMessages(getDirectMessagesByConversation(selectedConversationId))
  }

  function handleDeleteForEveryone(message: DirectMessage) {
    if (!user) return
    const ageMs = Date.now() - new Date(message.createdAt).getTime()
    if (message.senderId !== user.id || ageMs > DELETE_EVERYONE_WINDOW_MS) { setDeleteMenuFor(null); return }
    // Remove media
    try {
      (message.attachments || []).forEach((a) => {
        if (a.url?.startsWith('blob:')) { try { URL.revokeObjectURL(a.url) } catch {} }
      })
    } catch {}
    updateDirectMessage(message.id, {
      content: '',
      attachments: [],
      deletedForEveryone: true,
      deletedBy: user.id,
      deletedAt: new Date().toISOString(),
    } as any)
    setDeleteMenuFor(null)
    if (selectedConversationId) setMessages(getDirectMessagesByConversation(selectedConversationId))
  }

  function toggleReaction(messageId: string, emoji: string) {
    const msg = getDirectMessageById(messageId)
    if (!msg || !user) return
    const current = msg.reactions || {}
    const users = new Set(current[emoji] || [])
    if (users.has(user.id)) users.delete(user.id)
    else users.add(user.id)
    const updated = { ...current, [emoji]: Array.from(users) }
    // Remove empty arrays
    Object.keys(updated).forEach((k) => {
      if ((updated[k] || []).length === 0) delete (updated as any)[k]
    })
    updateDirectMessage(messageId, { reactions: updated } as any)
    // refresh visible list
    if (selectedConversationId) setMessages(getDirectMessagesByConversation(selectedConversationId))
    setReactionPickerFor(null)
  }

  function openForwardPicker(message: DirectMessage) {
    setForwardSource(message)
    setIsForwardPickerOpen(true)
  }

  const EDIT_WINDOW_MS = 15 * 60 * 1000
  const DELETE_EVERYONE_WINDOW_MS = 60 * 60 * 1000

  const handleDeleteFailed = (messageId: string, conversationId: string) => {
    deleteDirectMessageById(messageId)
    const updated = getDirectMessagesByConversation(conversationId)
    setMessages(updated)
  }

  const retryFailedMessage = (messageId: string, conversationId: string) => {
    const convo = conversations.find((c) => c.id === conversationId)
    if (!user || !convo) return
    const recipientIds = convo.participantIds.filter((id) => id !== user.id)
    const anyBlocked = recipientIds.some((rid) => areUsersBlocked(user.id, rid))
    const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false
    const anyOnline = recipientIds.some((rid) => {
      const r = usersById[rid]
      if (!r?.lastSeen) return false
      const last = new Date(r.lastSeen).getTime()
      return Number.isFinite(last) && Date.now() - last < 2 * 60 * 1000
    })

    // reset to sending state
    updateDirectMessage(messageId, { status: undefined as any })
    setMessages(getDirectMessagesByConversation(conversationId))

    window.setTimeout(() => {
      if (anyBlocked || isOffline) {
        updateDirectMessage(messageId, { status: "failed" as any })
        setMessages(getDirectMessagesByConversation(conversationId))
        return
      }
      updateDirectMessage(messageId, { status: "sent" as any })
      if (anyOnline) {
        window.setTimeout(() => {
          updateDirectMessage(messageId, { status: "delivered" as any })
          setMessages(getDirectMessagesByConversation(conversationId))
        }, 500)
      } else {
        setMessages(getDirectMessagesByConversation(conversationId))
      }
    }, 300)
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
          <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr] xl:grid-cols-[420px_1fr]">
            <aside
              className={cn(
                "border-b md:border-b-0 md:border-r bg-muted/20",
                !isMdUp && selectedConversationId ? "hidden" : "block",
                isMdUp && isListCollapsedMdUp ? "md:hidden" : "",
              )}
            >
              <div className="space-y-3 border-b p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-semibold">Messages</h1>
                    <p className="text-sm text-muted-foreground">
                      Search across every thread and quickly jump into the right conversation.
                    </p>
                  </div>
                  {isMdUp && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Collapse list"
                      onClick={() => setIsListCollapsedMdUp(true)}
                      className="mt-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
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
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Type</Label>
                      <Select value={searchTypeFilter} onValueChange={(value) => setSearchTypeFilter(value as any)}>
                        <SelectTrigger className="w-full justify-between">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="links">Links</SelectItem>
                          <SelectItem value="files">Files</SelectItem>
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
                  filteredSearchResults.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p>No messages match the current filters.</p>
                      <Button variant="ghost" size="sm" className="mt-3" onClick={resetSearchFilters}>
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {filteredSearchResults.map((result) => {
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
                      const preview = truncate(previewSource, 60)
                      const timestamp = lastMessage
                        ? formatInboxTimestamp(lastMessage.createdAt)
                        : formatInboxTimestamp(conversation.updatedAt)
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
                      const isPinned = conversation.pinned === true
                      const isDirect = conversation.participantIds.length === 2
                      const isOnline = Boolean(
                        isDirect && avatarUser?.lastSeen && Date.now() - new Date(avatarUser.lastSeen).getTime() < 5 * 60 * 1000,
                      )

                      const isOutgoing = lastMessage?.senderId === user.id
                      const receipt = lastMessage
                        ? getReadReceiptDetails(lastMessage, conversation.participantIds)
                        : null
                      const outgoingStatusIcon = (() => {
                        if (!lastMessage || !isOutgoing) return null
                        const status = (lastMessage.status as any) || ""
                        if (status === "read" || receipt?.isFullyRead) {
                          return <CheckCheck className="h-4 w-4 text-primary" aria-label="Read" />
                        }
                        if (status === "delivered") {
                          return <Check className="h-4 w-4 text-muted-foreground" aria-label="Delivered" />
                        }
                        if (status === "failed") {
                          return <AlertCircle className="h-4 w-4 text-red-500" aria-label="Failed" />
                        }
                        // fallback: show spinner briefly for just-sent messages
                        const created = new Date(lastMessage.createdAt).getTime()
                        if (Date.now() - created < 5000) {
                          return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Sending" />
                        }
                        return <Check className="h-4 w-4 text-muted-foreground" aria-label="Sent" />
                      })()

                      const handleMarkUnread = () => {
                        if (!user) return
                        setConversationUnreadCount(conversation.id, user.id, Math.max(1, unreadCount || 1))
                        // Refresh local state to reflect badge immediately
                        const updatedConversations = getUserConversations(user.id)
                        setConversations(updatedConversations)
                      }

                      const handleArchive = () => {
                        setConversationArchiveState(conversation.id, true)
                        if (selectedConversationId === conversation.id) {
                          setSelectedConversationId(null)
                          setMessages([])
                        }
                        if (user) {
                          const updatedConversations = getUserConversations(user.id)
                          setConversations(updatedConversations)
                        }
                      }

                      const handleMuteToggle = () => {
                        updateConversation(conversation.id, { muted: !conversation.muted })
                        if (user) {
                          const updatedConversations = getUserConversations(user.id)
                          setConversations(updatedConversations)
                        }
                      }

                      const handleDelete = () => {
                        if (!confirm("Delete this conversation? This cannot be undone.")) return
                        deleteConversation(conversation.id)
                        if (selectedConversationId === conversation.id) {
                          setSelectedConversationId(null)
                          setMessages([])
                        }
                        if (user) {
                          const updatedConversations = getUserConversations(user.id)
                          setConversations(updatedConversations)
                        }
                      }

                      return (
                        <li key={conversation.id} className="relative">
                          <SwipeableRow
                            onClick={() => handleSelectConversation(conversation.id)}
                            leftActions={
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMarkUnread() }}
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                                aria-label="Mark as unread"
                              >
                                <span>Unread</span>
                              </button>
                            }
                            rightActions={
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMuteToggle() }}
                                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-2 text-xs font-medium"
                                  aria-label={conversation.muted ? "Unmute" : "Mute"}
                                >
                                  <BellOff className="h-4 w-4" />
                                  <span className="hidden sm:inline">{conversation.muted ? "Unmute" : "Mute"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleArchive() }}
                                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-2 text-xs font-medium"
                                  aria-label="Archive"
                                >
                                  <Archive className="h-4 w-4" />
                                  <span className="hidden sm:inline">Archive</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDelete() }}
                                  className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-2 text-xs font-medium text-destructive-foreground"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            }
                            className={cn(isActive ? "bg-background" : "hover:bg-muted/40")}
                          >
                            <div className="w-full flex items-center gap-3 px-4 py-3 text-left">
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={avatarUser?.avatar} alt={avatarUser?.fullName} />
                                  <AvatarFallback>
                                    {avatarUser ? avatarUser.fullName.charAt(0) : "P"}
                                  </AvatarFallback>
                                </Avatar>
                                {isOnline && (
                                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={cn(
                                        "font-medium truncate",
                                        unreadCount > 0 && "text-primary",
                                      )}
                                    >
                                      {label}
                                    </span>
                                    {avatarUser?.username && (
                                      <span className="truncate text-xs text-muted-foreground">@{avatarUser.username}</span>
                                    )}
                                    {isPinned && (
                                      <Pin className="h-3.5 w-3.5 text-muted-foreground" aria-label="Pinned" />
                                    )}
                                    {isArchived && (
                                      <Badge variant="outline" className="text-[10px] uppercase">
                                        Archived
                                      </Badge>
                                    )}
                                  </div>
                                  {timestamp && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  {typingNames.length > 0 ? (
                                    <TypingIndicator names={typingNames} variant="inline" />
                                  ) : (
                                    <p
                                      className={cn(
                                        "text-sm text-muted-foreground truncate inline-flex items-center gap-1",
                                        unreadCount > 0 && "text-foreground font-medium",
                                      )}
                                    >
                                      {isOutgoing && outgoingStatusIcon}
                                      <span className="truncate">{preview}</span>
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
                            </div>
                          </SwipeableRow>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <section
              className={cn(
                "flex flex-col min-h-[70vh]",
                !isMdUp && !selectedConversationId ? "hidden" : "flex",
              )}
            >
              {activeConversation ? (
                <>
                  {/* Mobile thread header with back button */}
                  {!isMdUp && (
                    <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Back"
                        onClick={() => {
                          selectedConversationRef.current = null
                          setSelectedConversationId(null)
                        }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      {(() => {
                        const contact = activeParticipants[0]
                        const label =
                          activeParticipants.length > 0
                            ? activeParticipants.map((p) => p.fullName).join(", ")
                            : "Direct Message"
                        return (
                          <div className="flex items-center gap-3 min-w-0">
                            <Link href={contact?.username ? `/user/${contact.username}` : "#"} className="shrink-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={contact?.avatar} alt={contact?.fullName} />
                                <AvatarFallback>{contact?.fullName?.charAt(0) ?? "U"}</AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="min-w-0">
                              <Link href={contact?.username ? `/user/${contact.username}` : "#"}>
                                <p className="text-sm font-medium truncate">{label}</p>
                              </Link>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact ? formatPresence(contact.lastSeen) : ""}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  <div className="border-b px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {isMdUp && isListCollapsedMdUp && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Show list"
                          onClick={() => setIsListCollapsedMdUp(false)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                      {(() => {
                        const contact = activeParticipants[0]
                        const label =
                          activeParticipants.length > 0
                            ? activeParticipants.map((p) => p.fullName).join(", ")
                            : "Direct Message"
                        return (
                          <div className="flex items-center gap-3 min-w-0">
                            <Link href={contact?.username ? `/user/${contact.username}` : "#"} className="shrink-0">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={contact?.avatar} alt={contact?.fullName} />
                                <AvatarFallback>{contact?.fullName?.charAt(0) ?? "U"}</AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="min-w-0">
                              <Link href={contact?.username ? `/user/${contact.username}` : "#"}>
                                <h2 className="text-base font-semibold truncate">{label}</h2>
                              </Link>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact ? formatPresence(contact.lastSeen) : ""}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Search in conversation"
                        onClick={() => { setShowFilters(true); setSearchConversationFilter(activeConversation.id) }}
                      >
                        <Search className="h-5 w-5" />
                      </Button>
                      {searchQuery.trim() && searchConversationFilter === activeConversation.id && (
                        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{inConversationMatches.length} match{inConversationMatches.length === 1 ? '' : 'es'}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setInConvMatchIndex((i) => (i - 1 + inConversationMatches.length) % Math.max(1, inConversationMatches.length))} disabled={inConversationMatches.length === 0}>
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setInConvMatchIndex((i) => (i + 1) % Math.max(1, inConversationMatches.length))} disabled={inConversationMatches.length === 0}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Conversation menu">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => handleToggleArchive(activeConversation)}>
                            {activeConversation.isArchived ? "Unarchive" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              updateConversation(activeConversation.id, { muted: !activeConversation.muted })
                              const updatedConversations = getUserConversations(user.id)
                              setConversations(updatedConversations)
                            }}
                          >
                            {activeConversation.muted ? "Unmute" : "Mute"}
                          </DropdownMenuItem>
                          {activeParticipants.length === 1 && (
                            <DropdownMenuItem
                              onClick={() => {
                                const target = activeParticipants[0]
                                if (target) blockUser(user.id, target.id)
                              }}
                            >
                              Block
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setShowFilters(true)
                              setSearchConversationFilter(activeConversation.id)
                            }}
                          >
                            Search in conversation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const contact = activeParticipants[0]
                              if (contact?.username) window.location.href = `/user/${contact.username}`
                            }}
                          >
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm("Clear all messages in this conversation?")) {
                                replaceMessagesForConversation(activeConversation.id, [])
                                const updatedMessages = getDirectMessagesByConversation(activeConversation.id)
                                setMessages(updatedMessages)
                              }
                            }}
                          >
                            Clear history
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div
                    ref={messageListRef}
                    className={cn(
                      "flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-muted/10",
                      // Reserve space for sticky composer on mobile so last message isn't hidden
                      !isMdUp ? "pb-28" : "",
                    )}
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                        <div>
                          <p className="font-medium">No messages yet</p>
                          <p className="text-sm mt-1">Start the conversation with your first update.</p>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        // Build grouped view with date headers and contiguous sender groups
                        type Item =
                          | { type: "date"; id: string; label: string }
                          | { type: "message"; id: string; msg: DirectMessage; firstInGroup: boolean; lastInGroup: boolean }
                        const items: Item[] = []
                        let lastDateKey: string | null = null
                        for (let i = 0; i < messages.length; i++) {
                          const m = messages[i]
                          const dateObj = new Date(m.createdAt)
                          const dateKey = dateObj.toDateString()
                          if (dateKey !== lastDateKey) {
                            const today = new Date()
                            const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString()
                            const yest = new Date(today)
                            yest.setDate(today.getDate() - 1)
                            const yestKey = yest.toDateString()
                            const label = dateKey === todayKey ? "Today" : dateKey === yestKey ? "Yesterday" : dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                            items.push({ type: "date", id: `date-${dateKey}`, label })
                            lastDateKey = dateKey
                          }
                          const prev = messages[i - 1]
                          const next = messages[i + 1]
                          const firstInGroup = !prev || prev.senderId !== m.senderId
                          const lastInGroup = !next || next.senderId !== m.senderId
                          items.push({ type: "message", id: m.id, msg: m, firstInGroup, lastInGroup })
                        }
                        return items.map((item) => {
                          if (item.type === "date") {
                            return (
                              <div key={item.id} className="py-2 text-center">
                                <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                  {item.label}
                                </span>
                              </div>
                            )
                          }
                          const message = item.msg
                          const isOwn = message.senderId === user.id
                          const sender = resolveUser(message.senderId)
                          const created = new Date(message.createdAt)
                          const timestamp = formatDistanceToNow(created, { addSuffix: true })
                          const absoluteTs = format(created, "PP p")
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

                          // Skip messages deleted for current user
                          if ((message.deletedFor || []).includes(user.id)) {
                            return null
                          }
                          return (
                            <div key={message.id} className={cn("flex gap-2 sm:gap-3", isOwn ? "justify-end" : "justify-start")}>
                              {!isOwn && (
                                <div className="w-8">
                                  {item.firstInGroup ? (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={sender?.avatar} alt={sender?.fullName} />
                                      <AvatarFallback>{sender?.fullName?.charAt(0) ?? "P"}</AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <span className="block h-8 w-8" />
                                  )}
                                </div>
                              )}
                              <div
                                data-message-id={message.id}
                                title={absoluteTs}
                                onTouchStart={(ev) => { setHighlightedMessageId(message.id); window.setTimeout(() => setHighlightedMessageId((prev) => (prev === message.id ? null : prev)), 1500); onMessageTouchStart(ev, message.id) }}
                                onTouchMove={(ev) => onMessageTouchMove(ev, message)}
                                onTouchEnd={onMessageTouchEnd}
                                onMouseDown={() => onMessagePressStart(message.id)}
                                onMouseUp={onMessagePressEnd}
                                onMouseLeave={onMessagePressEnd}
                                className={cn(
                                  "group relative max-w-[70%] rounded-[18px] p-3 shadow-sm transition break-words",
                                  isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground",
                                  isHighlighted && (isOwn ? "ring-2 ring-offset-2 ring-offset-background ring-primary/60" : "outline outline-1 outline-primary/60"),
                                )}
                              >
                                {reactionPickerFor === message.id && (
                                  <div className={cn("absolute -top-8 left-0 right-0 mx-auto flex w-max items-center gap-1 rounded-full border bg-background px-2 py-1 shadow")}
                                       onClick={(e) => e.stopPropagation()}>
                                    {QUICK_REACTIONS.map((emo) => (
                                      <button key={emo} className="text-lg hover:scale-110 transition" onClick={() => toggleReaction(message.id, emo)}>{emo}</button>
                                    ))}
                                    <button className="ml-2 text-xs underline" onClick={() => { setReplyTarget(message); setReactionPickerFor(null) }}>Reply</button>
                                    <button className="ml-2 text-xs underline" onClick={() => { openForwardPicker(message); setReactionPickerFor(null) }}>Forward</button>
                                    {message.senderId === user.id && (Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS) && (
                                      <button className="ml-2 text-xs underline" onClick={() => { setEditingTarget(message); setNewMessage(message.content || ''); setReactionPickerFor(null) }}>Edit</button>
                                    )}
                                    <button className="ml-2 text-xs underline" onClick={() => { setDeleteMenuFor(message.id); setReactionPickerFor(null) }}>Delete</button>
                                    {user && (
                                      isMessageStarred(user.id, message.id) ? (
                                        <button className="ml-2 text-xs underline" onClick={() => { unstarMessage(user.id, message.id); setReactionPickerFor(null) }}>Unstar</button>
                                      ) : (
                                        <button className="ml-2 text-xs underline" onClick={() => { starMessage(user.id, message.id); setReactionPickerFor(null) }}>Star</button>
                                      )
                                    )}
                                  </div>
                                )}
                                {deleteMenuFor === message.id && (
                                  <div className="absolute -top-10 right-0 z-50 flex items-center gap-2 rounded-md border bg-background px-2 py-1 shadow" onClick={(e) => e.stopPropagation()}>
                                    <button className="text-xs underline" onClick={() => handleDeleteForMe(message)}>Delete for Me</button>
                                    {message.senderId === user.id && (Date.now() - new Date(message.createdAt).getTime() < DELETE_EVERYONE_WINDOW_MS) && (
                                      <button className="text-xs underline text-destructive" onClick={() => handleDeleteForEveryone(message)}>Delete for Everyone</button>
                                    )}
                                    <button className="text-xs" onClick={() => setDeleteMenuFor(null)}>Close</button>
                                  </div>
                                )}
                                {item.lastInGroup && (
                                  <span
                                    className={cn(
                                      "absolute bottom-0 h-3 w-3 rotate-45",
                                      isOwn ? "right-[-6px] bg-primary" : "left-[-6px] bg-muted",
                                    )}
                                    aria-hidden
                                  />
                                )}
                              {/* Deleted message (for everyone) tombstone */}
                              {message.deletedForEveryone && (
                                <div className={cn("text-xs italic", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>{message.deletedBy === user.id ? 'You deleted this message' : `${formatParticipantName(message.deletedBy || '')} deleted this message`}</div>
                              )}
                              {/* Forwarded label */}
                              {message.forwardedFromId && (
                                <div className={cn("-mt-1 mb-1 text-[10px] uppercase tracking-wide", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>Forwarded</div>
                              )}
                              {/* Quoted reply (one level) */}
                              {message.repliedToId && (() => {
                                const original = messages.find((m) => m.id === message.repliedToId)
                                if (!original) return null
                                const hasMedia = original.attachments && original.attachments.length > 0
                                return (
                                  <button type="button" onClick={() => scrollToMessage(original.id)} className={cn("mb-2 flex w-full items-center gap-2 rounded-md border px-2 py-1 text-left", isOwn ? "bg-primary/10 border-primary/20" : "bg-background/60")}
                                    title="View original">
                                    <div className="w-1.5 rounded bg-muted-foreground/60 h-8" />
                                    <div className="min-w-0">
                                      <div className="text-xs text-muted-foreground">{formatParticipantName(original.senderId)}</div>
                                      <div className="text-xs truncate">{hasMedia ? (original.attachments![0].type === 'image' ? 'Photo' : original.attachments![0].type === 'video' ? 'Video' : original.attachments![0].type === 'document' ? 'Document' : original.attachments![0].type === 'link' ? 'Link' : 'Attachment') : (original.content || '')}</div>
                                    </div>
                                  </button>
                                )
                              })()}

                              {!message.deletedForEveryone && message.content && (
                                <div className="whitespace-pre-wrap break-words text-sm">
                                  {activeMatchId === message.id && searchQuery.trim()
                                    ? highlightMatchesYellow(message.content, searchQuery)
                                    : renderMessageContent(message.content)}
                                </div>
                              )}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className={cn("mt-3 space-y-3", message.content && "pt-3 border-t border-border/70")}>
                                    {(() => {
                                      const images = message.attachments!.filter((a) => a.type === "image")
                                      const others = message.attachments!.filter((a) => a.type !== "image")

                                      const renderImage = (a: MessageAttachment, idx: number, grid = false) => {
                                        const isGif = (a.mimeType || a.name || "").toLowerCase().includes("gif")
                                        const imgEl = (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={a.url}
                                            alt={a.name}
                                            className={cn("h-full w-full object-cover", isGif ? "" : "cursor-zoom-in")}
                                            loading="lazy"
                                            onClick={() => {
                                              if (isGif) return
                                              const all = images.map((im) => im.url)
                                              const startIndex = images.findIndex((im) => im.id === a.id)
                                              setImageLightbox({ open: true, images: all, index: Math.max(0, startIndex), zoom: false })
                                            }}
                                          />
                                        )
                                        return (
                                          <div key={a.id} className={cn(grid ? "aspect-square overflow-hidden" : "overflow-hidden rounded-md border border-border/70")} style={!grid ? { maxWidth: 300, maxHeight: 400 } : undefined}>
                                            {imgEl}
                                          </div>
                                        )
                                      }

                                      const renderVideo = (a: MessageAttachment) => {
                                        const durationLabel = videoDurations[a.id]
                                        const isPlaying = playingVideoId === a.id
                                        return (
                                          <div key={a.id} className="relative overflow-hidden rounded-md border border-border/70" style={{ maxWidth: 300 }}>
                                            {isPlaying ? (
                                              <video src={a.url} className="w-full max-h-[400px] bg-black" autoPlay controls onEnded={() => setPlayingVideoId(null)} />
                                            ) : (
                                              <button type="button" className="relative block w-full" onClick={() => setPlayingVideoId(a.id)}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={a.thumbnailUrl || "/placeholder.svg"} alt={a.name} className="max-h-[400px] w-full object-cover bg-black" />
                                                <span className="absolute inset-0 grid place-items-center">
                                                  <span className="rounded-full bg-black/60 p-3 text-white"><Play className="h-6 w-6" /></span>
                                                </span>
                                                {durationLabel && (
                                                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">{durationLabel}</span>
                                                )}
                                                <video src={a.url} className="hidden" preload="metadata" onLoadedMetadata={(e) => {
                                                  const el = e.currentTarget
                                                  const dur = isNaN(el.duration) ? 0 : el.duration
                                                  const label = formatDuration(dur)
                                                  setVideoDurations((prev) => ({ ...prev, [a.id]: label }))
                                                }} />
                                              </button>
                                            )}
                                          </div>
                                        )
                                      }

                                      const renderDocument = (a: MessageAttachment) => {
                                        // Non-file attachment types handled here for unified rendering
                                        if (a.type === 'link') {
                                          const site = a.siteName || (a.url ? new URL(a.url).hostname : '')
                                          return (
                                            <div key={a.id} className="overflow-hidden rounded-md border border-border/70" style={{ maxWidth: 360 }}>
                                              {a.thumbnailUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={a.thumbnailUrl} alt={a.name} className="w-full max-h-56 object-cover" />
                                              )}
                                              <div className="p-3">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {a.faviconUrl && (
                                                      // eslint-disable-next-line @next/next/no-img-element
                                                      <img src={a.faviconUrl} alt="favicon" className="h-4 w-4 rounded" />
                                                    )}
                                                    <span className="truncate">{site}</span>
                                                  </div>
                                                </div>
                                                <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
                                                  <div className="font-semibold line-clamp-2">{a.name}</div>
                                                  {a.description && (
                                                    <div className="text-sm text-muted-foreground line-clamp-2">{a.description}</div>
                                                  )}
                                                </a>
                                              </div>
                                            </div>
                                          )
                                        }

                                        if (a.type === 'contact') {
                                          const profileUrl = a.username ? `/user/${a.username}` : '#'
                                          const contact = a.userId ? usersById[a.userId] : undefined
                                          const isSelf = user?.id && a.userId === user.id
                                          const isFollowing = user?.id && a.userId ? (getUsers().find(u => u.id === user.id)?.following || []).includes(a.userId) : false
                                          return (
                                            <div key={a.id} className="flex items-center gap-3 rounded-md border border-border/70 p-3" style={{ maxWidth: 360 }}>
                                              <Avatar className="h-12 w-12">
                                                <AvatarImage src={a.avatar || '/placeholder.svg'} alt={a.fullName || a.username || 'User'} />
                                                <AvatarFallback>{(a.fullName || a.username || 'U').charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div className="min-w-0 flex-1">
                                                <div className="font-semibold truncate">{a.fullName || contact?.fullName || 'User'}</div>
                                                <div className="text-xs text-muted-foreground truncate">@{a.username}</div>
                                                {typeof a.followersCount === 'number' && (
                                                  <div className="text-xs text-muted-foreground">{a.followersCount} followers</div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {!isSelf && a.userId && user && (
                                                  <Button
                                                    size="sm"
                                                    variant={isFollowing ? 'secondary' : 'default'}
                                                    onClick={() => {
                                                      toggleFollow(user.id, a.userId!)
                                                      const directory = getUsers().reduce<Record<string, User>>((acc, entry) => { acc[entry.id] = entry; return acc }, {})
                                                      setUsersById(directory)
                                                    }}
                                                  >
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                  </Button>
                                                )}
                                                <Link href={profileUrl} className="text-xs underline">View Profile</Link>
                                              </div>
                                            </div>
                                          )
                                        }

                                        if (a.type === 'location' || a.type === 'live-location') {
                                          const lat = a.lat || 0
                                          const lon = a.lon || 0
                                          const urlApple = `maps://?q=${lat},${lon}`
                                          const urlGoogle = `https://maps.google.com/?q=${lat},${lon}`
                                          const meKey = user?.id ? `pet_social_last_location_${user.id}` : null
                                          let distanceLabel: string | null = null
                                          try {
                                            const raw = meKey ? localStorage.getItem(meKey) : null
                                            if (raw) {
                                              const me = JSON.parse(raw) as { lat: number; lon: number }
                                              const d = haversine({ lat, lon }, me)
                                              const km = d / 1000
                                              distanceLabel = km < 1 ? `${Math.round(d)} m away` : `${km.toFixed(1)} km away`
                                            }
                                          } catch {}
                                          const live = a.type === 'live-location'
                                          const ttlLabel = live && a.expiresAt ? (() => {
                                            const diff = new Date(a.expiresAt).getTime() - Date.now()
                                            if (diff <= 0) return 'Expired'
                                            const mins = Math.round(diff / 60000)
                                            if (mins < 60) return `${mins} min left`
                                            const hrs = Math.round(mins / 60)
                                            return `${hrs} hr left`
                                          })() : null
                                          if (live) {
                                            return (
                                              <LiveLocationCard key={a.id} attachment={a} urlApple={urlApple} urlGoogle={urlGoogle} ttlLabel={ttlLabel || undefined} defaultDistanceLabel={distanceLabel || undefined} />
                                            )
                                          }
                                          return (
                                            <div key={a.id} className="overflow-hidden rounded-md border border-border/70" style={{ maxWidth: 360 }}>
                                              <iframe src={mapEmbedSrc(lat, lon)} className="w-full h-56 bg-background" />
                                              <div className="p-3 space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <div className="text-sm font-medium">{a.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`}</div>
                                                </div>
                                                {distanceLabel && (
                                                  <div className="text-xs text-muted-foreground">{distanceLabel}</div>
                                                )}
                                                <div className="flex items-center gap-3 pt-1">
                                                  <a href={urlApple} className="text-xs underline" target="_blank" rel="noopener noreferrer">Open in Apple Maps</a>
                                                  <a href={urlGoogle} className="text-xs underline" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        }

                                        // Default: file/document and audio card
                                        const mime = (a.mimeType || "").toLowerCase()
                                        const name = (a.name || "").toLowerCase()
                                        let Icon = FileIcon
                                        if (mime.includes("pdf") || name.endsWith(".pdf")) Icon = FileText
                                        else if (mime.includes("zip") || name.endsWith(".zip")) Icon = FileArchive
                                        else if (mime.startsWith("image/") || name.match(/\.(png|jpg|jpeg|gif|webp)$/)) Icon = FileImage
                                        else if (mime.startsWith("video/") || name.match(/\.(mp4|mov|webm|mkv)$/)) Icon = FileVideo
                                        else if (mime.startsWith("audio/") || name.match(/\.(mp3|wav|m4a|ogg)$/)) Icon = FileAudio

                                        const isAudio = mime.startsWith("audio/") || name.match(/\.(mp3|wav|m4a|ogg)$/)
                                        if (isAudio) {
                                          return <VoiceMessagePlayer key={a.id} url={a.url} name={a.name} />
                                        }

                                        return (
                                          <div key={a.id} className="space-y-2" style={{ maxWidth: 300 }}>
                                            {(mime.includes('pdf') || name.endsWith('.pdf')) && (
                                              <div className="overflow-hidden rounded-md border border-border/70">
                                                <iframe src={`${a.url}#page=1&view=FitH`} className="w-full h-56 bg-background" />
                                              </div>
                                            )}
                                            <div className={cn("flex items-center gap-3 rounded-md border border-border/70 px-3 py-2 text-sm", isOwn ? "bg-primary/20" : "bg-muted/50")}
                                            >
                                              <Icon className="h-4 w-4" />
                                              <div className="flex-1 min-w-0">
                                                <p className="truncate font-medium">{a.name}</p>
                                                <p className={cn("text-xs", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>{formatFileSize(a.size)}</p>
                                              </div>
                                              <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs underline inline-flex items-center gap-1">Open</a>
                                              <a href={a.url} download className="ml-2 text-xs underline inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />
                                                Download
                                              </a>
                                            </div>
                                          </div>
                                        )
                                      }

                                      const blocks: React.ReactElement[] = []
                                      if (images.length > 0) {
                                        if (images.length === 1) {
                                          blocks.push(<div key={`images-${message.id}`} className="w-full" style={{ maxWidth: 300 }}>{renderImage(images[0], 0)}</div>)
                                        } else {
                                          blocks.push(
                                            <div key={`images-${message.id}`} className="grid grid-cols-2 gap-1" style={{ maxWidth: 300 }}>
                                              {images.slice(0, 4).map((img, i) => renderImage(img, i, true))}
                                            </div>,
                                          )
                                        }
                                      }

                                      for (const a of others) {
                                        if (a.type === "video") blocks.push(renderVideo(a))
                                        else blocks.push(renderDocument(a))
                                      }

                                      return blocks
                                    })()}
                                  </div>
                                )}
                              
                                {/* Hover/long-press timestamp + edited indicator */}
                                <div className={cn(
                                  "pointer-events-none absolute -bottom-5 right-0 rounded bg-muted/90 px-2 py-0.5 text-[10px] text-foreground shadow transition-opacity",
                                  highlightedMessageId === message.id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                )}
                                >
                                  <span>{absoluteTs}</span>
                                  {Boolean((message as any).editedAt) && <span className="ml-1 opacity-80">• Edited</span>}
                                </div>
                                {message.editedAt && (
                                  <div className={cn("mt-1 text-[10px] text-muted-foreground", isOwn ? "text-primary-foreground/80" : "")}
                                       onClick={(e) => { e.stopPropagation(); setEditedHistoryFor(message.id) }}>
                                    <button className="underline">Edited</button>
                                  </div>
                                )}
                                {/* Status icons bottom-right for own messages */}
                                {isOwn && (
                                  <div className="absolute bottom-1 right-2 text-[11px]">
                                    {(() => {
                                      const status = (message.status as any) || null
                                      const ageMs = Date.now() - created.getTime()
                                      const isSending = !status && ageMs < 5000
                                      if ((status === "read")) {
                                        return <span className="inline-flex items-center gap-1 text-blue-500"><CheckCheck className="h-3.5 w-3.5" /></span>
                                      }
                                      if (status === "delivered") {
                                        return <span className="inline-flex items-center gap-1 text-muted-foreground"><CheckCheck className="h-3.5 w-3.5" /></span>
                                      }
                                      if (status === "sent") {
                                        return <span className="inline-flex items-center gap-1 text-muted-foreground"><Check className="h-3.5 w-3.5" /></span>
                                      }
                                      if (status === "failed") {
                                        return (
                                          <span className="inline-flex items-center gap-1 text-red-500">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <button
                                              type="button"
                                              className="ml-1 text-[10px] underline"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                retryFailedMessage(message.id, message.conversationId)
                                              }}
                                            >Retry</button>
                                            <button
                                              type="button"
                                              className="ml-2 text-[10px] underline"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteFailed(message.id, message.conversationId)
                                              }}
                                            >Delete</button>
                                          </span>
                                        )
                                      }
                                      if (isSending) {
                                        return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /></span>
                                      }
                                      return <span className="inline-flex items-center gap-1 text-muted-foreground"><Check className="h-3.5 w-3.5" /></span>
                                    })()}
                                  </div>
                                )}
                              </div>
                              {/* Reactions row for this message */}
                              {(() => {
                                const reactions = message.reactions || {}
                                const entries = Object.entries(reactions).filter(([, arr]) => (arr || []).length > 0)
                                if (entries.length === 0) return null
                                return (
                                  <div className={cn("mt-1 flex gap-2", isOwn ? "justify-end" : "justify-start")}
                                       onClick={(e) => e.stopPropagation()}>
                                    {entries.map(([emo, userIds]) => (
                                      <ReactionPill key={`${message.id}-${emo}`} emoji={emo} userIds={userIds} usersById={usersById} onToggle={() => toggleReaction(message.id, emo)} />
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })
                      })()
                    )}
                    {/* Reaction rows are rendered inline beneath each message bubble (see above) */}
                  </div>
                  {typingUserNames.length > 0 && (
                    <div className="px-4 sm:px-6 pb-2">
                      <TypingIndicator names={typingUserNames} />
                    </div>
                  )}

                  <div className="border-t px-3 sm:px-6 py-3 space-y-3 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
                    {replyTarget && (
                      <div className="rounded-md border bg-muted/30 p-2 flex items-start gap-2">
                        <div className="w-1.5 rounded bg-primary h-10 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-muted-foreground">Replying to {formatParticipantName(replyTarget.senderId)}</div>
                          <div className="text-sm truncate">
                            {replyTarget.attachments && replyTarget.attachments.length > 0 ? (
                              <span className="text-muted-foreground">{replyTarget.attachments[0].type === 'image' ? 'Photo' : replyTarget.attachments[0].type === 'video' ? 'Video' : replyTarget.attachments[0].type === 'document' ? 'Document' : replyTarget.attachments[0].type === 'link' ? 'Link' : 'Attachment'}</span>
                            ) : (
                              summarizeMessage(replyTarget, user.id)
                            )}
                          </div>
                        </div>
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setReplyTarget(null)} aria-label="Cancel reply">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {editingTarget && (
                      <div className="rounded-md border bg-muted/30 p-2 flex items-center justify-between gap-2">
                        <div className="text-sm">Editing your message</div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingTarget(null); setNewMessage('') }}>Cancel</Button>
                          <Button size="sm" onClick={() => handleSendMessage()}>Save</Button>
                        </div>
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className="rounded-md border border-dashed border-border/80 p-3">
                        <p className="text-sm font-medium mb-2">Attachments</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {pendingAttachments.map((att) => (
                            <div key={att.id} className="relative rounded-md border border-border/70 bg-muted/20 p-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
                                aria-label={`Remove ${att.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              {att.mimeType?.startsWith('audio/') ? (
                                <div>
                                  <VoiceMessagePlayer url={att.dataUrl} name={att.name} />
                                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>Voice message</span>
                                    <button
                                      type="button"
                                      className="underline"
                                      onClick={() => {
                                        handleRemoveAttachment(att.id)
                                        // Immediately start a new recording flow
                                        startVoiceRecording()
                                      }}
                                    >Re-record</button>
                                  </div>
                                </div>
                              ) : att.type === 'image' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={att.dataUrl} alt={att.name} className="h-36 w-full rounded object-cover" />
                              ) : att.type === 'video' ? (
                                <div className="relative h-36 w-full rounded bg-black">
                                  <div className="absolute inset-0 grid place-items-center">
                                    <Play className="h-7 w-7 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-36 w-full rounded bg-background grid place-items-center text-muted-foreground">
                                  <FileText className="h-6 w-6" />
                                </div>
                              )}
                              <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                                <span className="truncate" title={att.name}>{att.name}</span>
                                <span>{formatFileSize(att.size)}</span>
                              </div>
                              {att.type === 'image' && (
                                <div className="mt-2">
                                  <Input
                                    value={att.caption || ''}
                                    maxLength={200}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      setPendingAttachments((prev) => prev.map((p) => p.id === att.id ? { ...p, caption: value } : p))
                                    }}
                                    placeholder="Add a caption (optional)"
                                    className="h-8 text-xs"
                                  />
                                </div>
                              )}
                              {att.status === 'uploading' && (
                                <div className="mt-2">
                                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                                    <div className="h-full bg-primary" style={{ width: `${att.progress || 0}%` }} />
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{Math.floor(att.progress || 0)}%</span>
                                    <button type="button" className="underline" onClick={() => handleCancelUpload(att.id)}>Cancel</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {linkPreview && !linkPreviewDismissed && (
                      <div className="rounded-md border overflow-hidden">
                        {linkPreview.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={linkPreview.image} alt={linkPreview.title || linkPreview.url} className="w-full max-h-56 object-cover" />
                        )}
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {linkPreview.favicon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={linkPreview.favicon} alt="favicon" className="h-4 w-4 rounded" />
                              )}
                              <span className="truncate">{linkPreview.siteName || new URL(linkPreview.url).hostname}</span>
                            </div>
                            <button type="button" aria-label="Remove preview" className="text-muted-foreground hover:text-foreground" onClick={() => setLinkPreviewDismissed(true)}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
                            <div className="font-semibold line-clamp-2">{linkPreview.title || linkPreview.url}</div>
                            {linkPreview.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2">{linkPreview.description}</div>
                            )}
                          </a>
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

                    <div className="flex items-center gap-2">
                      <EmojiPicker onPick={(emoji) => setNewMessage((prev) => prev + emoji)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={isProcessingAttachments || pendingAttachments.length >= MAX_ATTACHMENT_COUNT}
                        aria-label="Attach photos/videos"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingAttachments || pendingAttachments.length >= MAX_ATTACHMENT_COUNT}
                        aria-label="Attach documents"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isProcessingAttachments || pendingAttachments.length >= MAX_ATTACHMENT_COUNT}
                            aria-label="Camera"
                          >
                            <Camera className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>Take photo</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>Record video</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsLocationPickerOpen(true)}
                        aria-label="Share location"
                      >
                        <MapPin className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsContactPickerOpen(true)}
                        aria-label="Share profile"
                      >
                        <UserPlus className="h-5 w-5" />
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={handleMessageChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        onBlur={() => {
                          if (user && activeConversation) {
                            clearTypingIndicatorLocal(activeConversation.id, user.id)
                            broadcastClearEvent(activeConversation.id, user.id)
                          }
                        }}
                        placeholder="Message..."
                        className="flex-1"
                      />
                      {isRecording ? (
                        <div className="flex-1">
                          <div className="rounded-md border px-3 py-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Recording voice message</span>
                              <span>{formatDuration(recordDuration)}</span>
                            </div>
                            <div className="mt-2 flex items-end gap-[3px] h-16">
                              {recordLevels.map((h, i) => (
                                <span key={i} className={cn("w-[3px] rounded-sm", recordCancel ? "bg-red-500" : "bg-primary")} style={{ height: `${h}px` }} />
                              ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Slide up to lock • Slide left to cancel</span>
                              {recordLocked && (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="secondary" onClick={() => finalizeVoiceRecording(false)}>Stop</Button>
                                  <Button size="sm" variant="ghost" onClick={cancelVoiceRecording}>Cancel</Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : newMessage.trim().length > 0 ? (
                        <Button type="button" onClick={handleSendMessage} disabled={isSending || isProcessingAttachments}>
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
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Voice message"
                          onMouseDown={onMicPressStart}
                          onTouchStart={onMicPressStart}
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pendingAttachments.length}/{MAX_ATTACHMENT_COUNT} attachments</span>
                      {isProcessingAttachments && (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Processing files...
                        </span>
                      )}
                    </div>
                    <Input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleAttachmentSelect(event)}
                    />
                    <Input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={(event) => handleAttachmentSelect(event, "image")}
                    />
                    <Input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      capture
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
        {isLocationPickerOpen && (
          <LocationPicker
            onClose={() => setIsLocationPickerOpen(false)}
            onSendCurrent={(loc) => {
              setIsLocationPickerOpen(false)
              try { if (user) localStorage.setItem(`pet_social_last_location_${user.id}`, JSON.stringify({ lat: loc.lat, lon: loc.lon })) } catch {}
              setPendingAttachments((prev) => [
                ...prev,
                {
                  id: generateId('attachment'),
                  name: 'Current location',
                  size: 0,
                  mimeType: 'application/json',
                  type: 'location',
                  dataUrl: mapEmbedSrc(loc.lat, loc.lon),
                  status: 'ready',
                  progress: 100,
                  lat: loc.lat,
                  lon: loc.lon,
                  accuracy: loc.accuracy,
                  caption: loc.address,
                } as any,
              ])
            }}
            onShareLive={(loc, durationMinutes) => {
              setIsLocationPickerOpen(false)
              try { if (user) localStorage.setItem(`pet_social_last_location_${user.id}`, JSON.stringify({ lat: loc.lat, lon: loc.lon })) } catch {}
              const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString()
              setPendingAttachments((prev) => [
                ...prev,
                {
                  id: generateId('attachment'),
                  name: 'Live location',
                  size: 0,
                  mimeType: 'application/json',
                  type: 'live-location',
                  dataUrl: mapEmbedSrc(loc.lat, loc.lon),
                  status: 'ready',
                  progress: 100,
                  lat: loc.lat,
                  lon: loc.lon,
                  accuracy: loc.accuracy,
                  caption: loc.address,
                  live: true,
                  expiresAt,
                } as any,
              ])
            }}
          />
        )}
        {isContactPickerOpen && (
          <ContactPicker
            onClose={() => setIsContactPickerOpen(false)}
            onPick={(u) => {
              setIsContactPickerOpen(false)
              // build contact attachment
              setPendingAttachments((prev) => [
                ...prev,
                {
                  id: generateId('attachment'),
                  name: u.fullName || u.username,
                  size: 0,
                  mimeType: 'application/json',
                  type: 'contact',
                  dataUrl: '',
                  status: 'ready',
                  progress: 100,
                  userId: u.id,
                  username: u.username,
                  fullName: u.fullName,
                  avatar: u.avatar,
                  followersCount: (u.followers || []).length,
                } as any,
              ])
            }}
          />
        )}
        {isForwardPickerOpen && forwardSource && (
          <ForwardPicker
            source={forwardSource}
            conversations={conversations}
            users={Object.values(usersById)}
            currentUser={user}
            onClose={() => { setIsForwardPickerOpen(false); setForwardSource(null) }}
            onForward={(targets, comment) => {
              // spam prevention: limit 5 forwards per message per user
              const key = `pet_social_forward_count_${user.id}_${forwardSource.id}`
              let count = 0
              try { count = parseInt(localStorage.getItem(key) || '0', 10) || 0 } catch {}
              if (count >= 5 || count + targets.length > 5) {
                setComposerError('Forward limit reached for this message (5)')
                setIsForwardPickerOpen(false)
                setForwardSource(null)
                return
              }
              const newCount = count + targets.length
              try { localStorage.setItem(key, String(newCount)) } catch {}

              const attCopy = (forwardSource.attachments || []).map((a) => ({ ...a }))
              let content = (comment || '').trim()
              if ((forwardSource.content || '').trim()) {
                content = content ? `${content}\n\n${forwardSource.content}` : forwardSource.content
              }
              const timestamp = new Date().toISOString()
              for (const target of targets) {
                const conv = target.type === 'conversation'
                  ? target.conversation
                  : createConversation([user.id, target.user.id])

                const readMap: MessageReadMap = {}
                for (const pid of conv.participantIds) readMap[pid] = pid === user.id ? timestamp : null
                addDirectMessage({
                  id: generateId('message'),
                  conversationId: conv.id,
                  senderId: user.id,
                  content,
                  createdAt: timestamp,
                  readAt: readMap,
                  attachments: attCopy.length > 0 ? attCopy : undefined,
                  forwardedFromId: forwardSource.id,
                })
              }
              setIsForwardPickerOpen(false)
              setForwardSource(null)
              // Refresh current conversation view
              const updated = getDirectMessagesByConversation(selectedConversationId || '')
              setMessages(updated)
            }}
          />
        )}
        {imageLightbox.open && (
          <div className="fixed inset-0 z-50 bg-black/90">
            <button
              type="button"
              className="absolute top-3 right-3 text-white p-2"
              aria-label="Close"
              onClick={() => setImageLightbox({ open: false, images: [], index: 0, zoom: false })}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="h-full w-full flex items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageLightbox.images[imageLightbox.index]}
                alt="Media"
                onClick={() => setImageLightbox((s) => ({ ...s, zoom: !s.zoom }))}
                className={cn(
                  "object-contain transition-transform cursor-zoom-in",
                  imageLightbox.zoom ? "scale-150 cursor-zoom-out" : "scale-100",
                )}
                style={{ maxHeight: "92vh", maxWidth: "92vw" }}
              />
            </div>
            {imageLightbox.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white"
                  aria-label="Previous"
                  onClick={() => setImageLightbox((s) => ({ ...s, index: (s.index - 1 + s.images.length) % s.images.length, zoom: false }))}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white"
                  aria-label="Next"
                  onClick={() => setImageLightbox((s) => ({ ...s, index: (s.index + 1) % s.images.length, zoom: false }))}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        )}
        {editedHistoryFor && (() => {
          const msg = messages.find((m) => m.id === editedHistoryFor)
          if (!msg) return null
          const items = (msg.editHistory || [])
          return (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => setEditedHistoryFor(null)} />
              <div className="absolute inset-x-0 top-1/3 mx-auto w-[min(92vw,560px)] rounded-lg border bg-background shadow-lg">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="font-semibold">Edit History</div>
                  <button onClick={() => setEditedHistoryFor(null)} aria-label="Close"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-4 space-y-3 max-h-[50vh] overflow-auto">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No previous versions</div>
                  ) : (
                    items.slice().reverse().map((h, idx) => (
                      <div key={idx} className="rounded-md border p-2">
                        <div className="text-xs text-muted-foreground mb-1">{format(new Date(h.editedAt), 'PP p')}</div>
                        <div className="text-sm whitespace-pre-wrap break-words">{h.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// Lightweight swipeable row for mobile actions
function SwipeableRow({
  children,
  leftActions,
  rightActions,
  onClick,
  className,
}: {
  children: React.ReactNode
  leftActions?: React.ReactNode
  rightActions?: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef<number | null>(null)
  const currentXRef = useRef<number>(0)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const reset = () => {
    setOffset(0)
    currentXRef.current = 0
    startXRef.current = null
    setDragging(false)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    startXRef.current = e.touches[0].clientX
    setDragging(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current == null) return
    const dx = e.touches[0].clientX - startXRef.current
    currentXRef.current = dx
    // Limit swipe distance
    const max = 160
    const bounded = Math.max(-max, Math.min(max, dx))
    setOffset(bounded)
  }
  const onTouchEnd = () => {
    const dx = currentXRef.current
    const threshold = 56
    if (dx > threshold && leftActions) {
      // Snap open left
      setOffset(120)
    } else if (dx < -threshold && rightActions) {
      // Snap open right
      setOffset(-180)
    } else {
      reset()
    }
    setDragging(false)
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Action backgrounds */}
      {leftActions && (
        <div className="absolute inset-y-0 left-0 z-0 flex items-center pl-4">
          {leftActions}
        </div>
      )}
      {rightActions && (
        <div className="absolute inset-y-0 right-0 z-0 flex items-center gap-2 pr-4">
          {rightActions}
        </div>
      )}

      {/* Foreground content */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (Math.abs(offset) > 10) {
            // If open, close instead of triggering click
            reset()
            return
          }
          onClick?.()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick?.()
        }}
        className={cn("relative z-10 touch-pan-y select-none transition-transform", className)}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={reset}
      >
        {children}
      </div>
    </div>
  )
}

function LocationPicker({
  onClose,
  onSendCurrent,
  onShareLive,
}: {
  onClose: () => void
  onSendCurrent: (loc: { lat: number; lon: number; accuracy?: number; address?: string }) => void
  onShareLive: (loc: { lat: number; lon: number; accuracy?: number; address?: string }, durationMinutes: number) => void
}) {
  const [loc, setLoc] = useState<{ lat: number; lon: number; accuracy?: number; address?: string } | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!active) return
          setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy })
        },
        () => { if (active) setError('Unable to get current location') },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    } else {
      setError('Geolocation not supported')
    }
    return () => { active = false }
  }, [])

  const doSearch = async () => {
    setError(null)
    setResults([])
    const q = query.trim()
    if (!q) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`)
      if (!res.ok) throw new Error('Search failed')
      const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>
      setResults(data)
    } catch (e) {
      setError('Search unavailable')
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(92vw,800px)] rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Share Location</div>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
            <div>
              <div className="rounded-md overflow-hidden border">
                {loc ? (
                  <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${(loc.lon - 0.01)}%2C${(loc.lat - 0.01)}%2C${(loc.lon + 0.01)}%2C${(loc.lat + 0.01)}&layer=mapnik&marker=${loc.lat}%2C${loc.lon}`} className="w-full h-72 bg-muted" />
                ) : (
                  <div className="w-full h-72 grid place-items-center text-muted-foreground">Locating…</div>
                )}
              </div>
              {loc?.accuracy && (
                <div className="mt-1 text-xs text-muted-foreground">Accuracy: ±{Math.round(loc.accuracy)} m</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Search places</div>
              <div className="flex items-center gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search address or place" />
                <Button onClick={doSearch} variant="secondary" size="sm">Search</Button>
              </div>
              {error && <div className="text-xs text-destructive">{error}</div>}
              {results.length > 0 && (
                <div className="max-h-48 overflow-auto rounded border">
                  {results.map((r, i) => (
                    <button key={`${r.lat}-${r.lon}-${i}`} onClick={() => setLoc({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), address: r.display_name })} className="block w-full px-3 py-2 text-left hover:bg-accent">
                      <div className="text-sm font-medium truncate">{r.display_name}</div>
                      <div className="text-xs text-muted-foreground">{parseFloat(r.lat).toFixed(5)}, {parseFloat(r.lon).toFixed(5)}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">Or move the map in the preview and tap Use Current below (uses GPS position).</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="text-xs text-muted-foreground">Share options</div>
            <div className="flex items-center gap-2">
              <Button disabled={!loc} onClick={() => loc && onSendCurrent(loc)}>
                Send Current Location
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!loc} variant="secondary">Share Live Location</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!loc} onClick={() => loc && onShareLive(loc, 15)}>For 15 minutes</DropdownMenuItem>
                  <DropdownMenuItem disabled={!loc} onClick={() => loc && onShareLive(loc, 60)}>For 1 hour</DropdownMenuItem>
                  <DropdownMenuItem disabled={!loc} onClick={() => loc && onShareLive(loc, 8 * 60)}>For 8 hours</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveLocationCard({ attachment, urlApple, urlGoogle, ttlLabel, defaultDistanceLabel }: { attachment: MessageAttachment; urlApple: string; urlGoogle: string; ttlLabel?: string; defaultDistanceLabel?: string }) {
  const [point, setPoint] = useState<{ lat: number; lon: number }>({ lat: attachment.lat || 0, lon: attachment.lon || 0 })
  const [moved, setMoved] = useState<number>(0)
  const [distanceLabel, setDistanceLabel] = useState<string | undefined>(defaultDistanceLabel)

  useEffect(() => {
    const key = `pet_social_live_${attachment.id}`
    const updateFromStorage = () => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return
        const data = JSON.parse(raw) as { points: Array<{ lat: number; lon: number; ts: number }>; expiresAt?: number }
        if (data.points && data.points.length > 0) {
          const last = data.points[data.points.length - 1]
          const first = data.points[0]
          setPoint({ lat: last.lat, lon: last.lon })
          const d = haversine({ lat: first.lat, lon: first.lon }, { lat: last.lat, lon: last.lon })
          setMoved(d)
        }
      } catch {}
    }
    updateFromStorage()
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('pet-social-live-location')
      const onMsg = (ev: MessageEvent) => {
        const data = ev.data as any
        if (data?.type === 'live:update' && data.attId === attachment.id && data.point) {
          setPoint({ lat: data.point.lat, lon: data.point.lon })
          // moved recomputed from storage periodically
        }
      }
      bc.addEventListener('message', onMsg)
      const id = window.setInterval(updateFromStorage, 5000)
      return () => { bc?.removeEventListener('message', onMsg); bc?.close(); window.clearInterval(id) }
    } catch {
      const id = window.setInterval(updateFromStorage, 5000)
      return () => window.clearInterval(id)
    }
  }, [attachment.id])

  const movedLabel = moved > 0 ? (moved < 1000 ? `${Math.round(moved)} m moved` : `${(moved/1000).toFixed(1)} km moved`) : undefined
  const lat = point.lat
  const lon = point.lon

  return (
    <div className="overflow-hidden rounded-md border border-border/70" style={{ maxWidth: 360 }}>
      <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${(lon - 0.01)}%2C${(lat - 0.01)}%2C${(lon + 0.01)}%2C${(lat + 0.01)}&layer=mapnik&marker=${lat}%2C${lon}`} className="w-full h-56 bg-background" />
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{attachment.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`}</div>
          <span className="text-[10px] rounded bg-red-500/10 px-2 py-0.5 text-red-600 font-semibold">LIVE</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {defaultDistanceLabel && <span>{defaultDistanceLabel}</span>}
          {movedLabel && <span>• {movedLabel}</span>}
          {ttlLabel && <span className="ml-auto">{ttlLabel}</span>}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <a href={urlApple} className="text-xs underline" target="_blank" rel="noopener noreferrer">Open in Apple Maps</a>
          <a href={urlGoogle} className="text-xs underline" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
        </div>
      </div>
    </div>
  )
}

function ContactPicker({ onClose, onPick }: { onClose: () => void; onPick: (u: User) => void }) {
  const [q, setQ] = useState('')
  const [list, setList] = useState<User[]>([])
  useEffect(() => {
    setList(getUsers())
  }, [])
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return list.slice(0, 50)
    return list.filter(u => (u.username?.toLowerCase().includes(term) || u.fullName?.toLowerCase().includes(term))).slice(0, 50)
  }, [q, list])
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(92vw,720px)] rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Share Profile</div>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user by name or @username" />
          <div className="max-h-[50vh] overflow-auto divide-y rounded border">
            {filtered.map((u) => (
              <button key={u.id} onClick={() => onPick(u)} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent">
                <Avatar className="h-8 w-8"><AvatarImage src={u.avatar || '/placeholder.svg'} alt={u.fullName} /><AvatarFallback>{u.fullName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">@{u.username} • {(u.followers || []).length} followers</div>
                </div>
                <div className="ml-auto text-xs underline">Select</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">No users match your search</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReactionPill({ emoji, userIds, usersById, onToggle }: { emoji: string; userIds: string[]; usersById: Record<string, User>; onToggle: () => void }) {
  const [open, setOpen] = useState(false)
  const names = userIds.map((id) => usersById[id]?.fullName || usersById[id]?.username || 'Someone')
  const youIndex = userIds.findIndex((id) => usersById[id]?.id === usersById[usersById[id]?.id]?.id) // placeholder no-op
  const count = userIds.length
  return (
    <div className="relative">
      <button className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs shadow" onClick={() => setOpen((o) => !o)}>
        <span>{emoji}</span>
        <span>{count}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-64 rounded-md border bg-background p-2 shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">{emoji} Reactions</div>
            <button className="text-xs underline" onClick={() => { onToggle(); setOpen(false) }}>Toggle mine</button>
          </div>
          <div className="space-y-1 max-h-56 overflow-auto">
            {userIds.map((id) => {
              const u = usersById[id]
              if (!u) return null
              return (
                <div key={id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6"><AvatarImage src={u.avatar || '/placeholder.svg'} alt={u.fullName} /><AvatarFallback>{u.fullName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                  <div className="text-sm truncate">{u.fullName || u.username}</div>
                </div>
              )
            })}
            {userIds.length === 0 && <div className="text-xs text-muted-foreground">No reactions</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function ForwardPicker({
  source,
  conversations,
  users,
  currentUser,
  onClose,
  onForward,
}: {
  source: DirectMessage
  conversations: Conversation[]
  users: User[]
  currentUser: User
  onClose: () => void
  onForward: (targets: Array<{ type: 'user'; user: User } | { type: 'conversation'; conversation: Conversation }>, comment: string) => void
}) {
  const [q, setQ] = useState('')
  const [comment, setComment] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectedConvs, setSelectedConvs] = useState<Set<string>>(new Set())

  const isGroupConv = (c: Conversation) => (c.participantIds?.length || 0) > 2 || c.type === 'group'

  const userChoices = useMemo(() => {
    const term = q.trim().toLowerCase()
    return users
      .filter((u) => u.id !== currentUser.id)
      .filter((u) => !term || u.username.toLowerCase().includes(term) || (u.fullName || '').toLowerCase().includes(term))
      .slice(0, 50)
  }, [q, users, currentUser.id])

  const groupConvs = useMemo(() => {
    const term = q.trim().toLowerCase()
    return conversations
      .filter(isGroupConv)
      .filter((c) => !term || (c.title || '').toLowerCase().includes(term))
      .slice(0, 50)
  }, [q, conversations])

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleConv = (id: string) => {
    setSelectedConvs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const submit = () => {
    const targets: Array<{ type: 'user'; user: User } | { type: 'conversation'; conversation: Conversation }> = []
    for (const uid of selectedUsers) {
      const u = users.find((x) => x.id === uid)
      if (u) targets.push({ type: 'user', user: u })
    }
    for (const cid of selectedConvs) {
      const c = conversations.find((x) => x.id === cid)
      if (c) targets.push({ type: 'conversation', conversation: c })
    }
    if (targets.length === 0) return
    onForward(targets, comment)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(92vw,900px)] rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Forward Message</div>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">People</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
              <div className="max-h-60 overflow-auto rounded border divide-y">
                {userChoices.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2">
                    <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleUser(u.id)} />
                    <Avatar className="h-8 w-8"><AvatarImage src={u.avatar || '/placeholder.svg'} alt={u.fullName} /><AvatarFallback>{u.fullName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                    </div>
                  </label>
                ))}
                {userChoices.length === 0 && <div className="p-4 text-sm text-muted-foreground">No matching people</div>}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Group Chats</div>
              <div className="max-h-72 overflow-auto rounded border divide-y">
                {groupConvs.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2">
                    <input type="checkbox" checked={selectedConvs.has(c.id)} onChange={() => toggleConv(c.id)} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.title || 'Group conversation'}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.participantIds.length} participants</div>
                    </div>
                  </label>
                ))}
                {groupConvs.length === 0 && <div className="p-4 text-sm text-muted-foreground">No matching group chats</div>}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Add a comment (optional)</Label>
            <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Say something about this…" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={selectedUsers.size + selectedConvs.size === 0}>Forward</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
