"use client"

import { formatDistanceToNow } from "date-fns"
import type { Conversation, DirectMessage } from "@/lib/types"
import { getUserById } from "@/lib/storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useIsMdUp } from "@/lib/hooks/use-media-query"

interface ConversationListProps {
  conversations: Conversation[]
  messages: Record<string, DirectMessage[]>
  activeConversationId: string | null
  currentUserId: string
  typingIndicators?: Record<string, Record<string, number>>
  onSelect: (conversationId: string) => void
  className?: string
  showHeader?: boolean
  showCollapseButton?: boolean
  onCollapseToggle?: () => void
}

export function ConversationList({
  conversations,
  messages,
  activeConversationId,
  currentUserId,
  typingIndicators = {},
  onSelect,
  className,
  showHeader = true,
  showCollapseButton = false,
  onCollapseToggle,
}: ConversationListProps) {
  const isMdUp = useIsMdUp()
  if (conversations.length === 0) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground", className)}>
        No conversations yet. Start a private chat to get started.
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {showHeader && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Conversations</h2>
          {showCollapseButton && isMdUp && (
            <Button variant="ghost" size="icon" onClick={onCollapseToggle} aria-label="Collapse list">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <div className="divide-y">
        {conversations.map((conversation) => {
          const otherParticipantId = conversation.participantIds.find((id) => id !== currentUserId) ?? currentUserId
          const otherUser = getUserById(otherParticipantId)
          const conversationMessages = messages[conversation.id] ?? []
          const lastMessage = conversationMessages.at(-1)
          const unreadCount = conversationMessages.filter(
            (message) => message.senderId !== currentUserId && !message.readAt?.[currentUserId],
          ).length
          const typingMap = typingIndicators[conversation.id] ?? {}
          const activeTypingUsers = Object.entries(typingMap)
            .filter(([userId, expiresAt]) => userId !== currentUserId && expiresAt > Date.now())
            .map(([userId]) => userId)

          const previewPrefix =
            lastMessage && lastMessage.senderId === currentUserId
              ? "You: "
              : otherUser
                ? `${otherUser.fullName.split(" ")[0]}: `
                : ""
          const previewText = lastMessage ? `${previewPrefix}${lastMessage.content}` : "Start a conversation"
          const lastActivity = lastMessage ? lastMessage.createdAt : conversation.updatedAt
          const lastActivityLabel = formatDistanceToNow(new Date(lastActivity), { addSuffix: true })

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                activeConversationId === conversation.id && "bg-accent/80",
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar || "/placeholder.svg"} alt={otherUser?.fullName || "User"} />
                <AvatarFallback>{(otherUser?.fullName ?? "User").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{otherUser?.fullName ?? "Unknown user"}</p>
                  <span className="text-xs text-muted-foreground">{lastActivityLabel}</span>
                </div>
                {activeTypingUsers.length > 0 ? (
                  <p className="text-xs font-medium text-primary">Typing…</p>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-1">{previewText}</p>
                )}
              </div>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
