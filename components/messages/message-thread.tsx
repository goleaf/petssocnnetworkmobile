"use client"

import { useEffect, useMemo, useRef } from "react"
import { format, formatDistanceToNow } from "date-fns"
import type { Conversation, DirectMessage } from "@/lib/types"
import { getUserById } from "@/lib/storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MessageThreadProps {
  conversation: Conversation | null
  messages: DirectMessage[]
  currentUserId: string
  typingUserIds: string[]
}

export function MessageThread({ conversation, messages, currentUserId, typingUserIds }: MessageThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const otherParticipantId = useMemo(
    () => conversation?.participantIds.find((id) => id !== currentUserId),
    [conversation, currentUserId],
  )
  const otherParticipant = otherParticipantId ? getUserById(otherParticipantId) : null

  useEffect(() => {
    if (!containerRef.current) return
    const node = containerRef.current
    node.scrollTop = node.scrollHeight
  }, [messages.length, conversation?.id, typingUserIds.join(",")])

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
        <h2 className="text-xl font-semibold">Select a conversation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose an existing chat or start a new one to begin messaging instantly.
        </p>
      </div>
    )
  }

  const typingNames = typingUserIds
    .map((userId) => getUserById(userId)?.fullName?.split(" ")[0] ?? "Someone")
    .filter(Boolean)

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <Avatar className="h-11 w-11">
          <AvatarImage src={otherParticipant?.avatar || "/placeholder.svg"} alt={otherParticipant?.fullName || "User"} />
          <AvatarFallback>{(otherParticipant?.fullName ?? "User").charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{otherParticipant?.fullName ?? "Private conversation"}</h2>
          <p className="text-sm text-muted-foreground">
            {otherParticipant?.username ? `@${otherParticipant.username}` : "Private chat"}
          </p>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId
          const sender = getUserById(message.senderId)
          const readValue = otherParticipantId ? message.readAt?.[otherParticipantId] : null
          const readTimestamp =
            isOwnMessage && typeof readValue === "string"
              ? formatDistanceToNow(new Date(readValue), { addSuffix: true })
              : null

          return (
            <div
              key={message.id}
              className={cn("flex gap-3", isOwnMessage ? "justify-end" : "justify-start")}
              aria-live="polite"
            >
              {!isOwnMessage && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.fullName || "User"} />
                  <AvatarFallback>{(sender?.fullName ?? "User").charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[75%] space-y-1", isOwnMessage && "items-end text-right")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm shadow-sm backdrop-blur",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 text-[11px] text-muted-foreground",
                    isOwnMessage && "justify-end",
                  )}
                >
                  <span>{format(new Date(message.createdAt), "p")}</span>
                  {isOwnMessage && (readTimestamp ? <span>Seen {readTimestamp}</span> : <span>Sent</span>)}
                </div>
              </div>
            </div>
          )
        })}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span>{typingNames.length === 1 ? `${typingNames[0]} is typing…` : "Multiple people are typing…"}</span>
          </div>
        )}
      </div>
    </div>
  )
}
