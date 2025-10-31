"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pin,
  Lock,
  MessageSquare,
  Eye,
  ChevronRight,
  Reply,
  Edit2,
  Trash2,
  MoreVertical,
  Shield,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { GroupTopic } from "@/lib/types"
import { getUserById } from "@/lib/storage"
import type { User } from "@/lib/types"
import { formatCommentDate } from "@/lib/utils/date"
import { useAuth } from "@/lib/auth"

interface TopicThreadProps {
  topic: GroupTopic
  groupSlug: string
  replies?: GroupTopic[]
  level?: number
  onReply?: (topicId: string) => void
  onEdit?: (topic: GroupTopic) => void
  onDelete?: (topicId: string) => void
  canModerate?: boolean
}

export function TopicThread({
  topic,
  groupSlug,
  replies = [],
  level = 0,
  onReply,
  onEdit,
  onDelete,
  canModerate = false,
}: TopicThreadProps) {
  const { user } = useAuth()
  const author = getUserById(topic.authorId) as User | undefined
  const isOwner = user?.id === topic.authorId
  const maxLevel = 3 // Maximum nesting depth

  if (!author) return null

  return (
    <div className={level > 0 ? "ml-8 mt-4 border-l-2 border-muted pl-4" : ""}>
      <Card className={`hover:shadow-md transition-shadow ${level > 0 ? "border-l-4 border-l-primary" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <Link href={`/user/${author.username}`}>
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 ring-primary transition-all">
                  <AvatarImage src={author.avatar} alt={author.fullName} />
                  <AvatarFallback>{author.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {level === 0 && topic.isPinned && (
                    <Badge variant="default" className="gap-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </Badge>
                  )}
                  {topic.isLocked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  )}
                  {level > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Reply
                    </Badge>
                  )}
                </div>

                {/* Title (only for top-level topics) */}
                {level === 0 && (
                  <Link href={`/groups/${groupSlug}/topics/${topic.id}`}>
                    <h3 className="font-semibold text-lg hover:underline mb-2">
                      {topic.title}
                    </h3>
                  </Link>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none mb-3">
                  <p className="whitespace-pre-wrap">{topic.content}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <Link href={`/user/${author.username}`}>
                    <span className="font-semibold hover:text-primary">
                      {author.fullName}
                    </span>
                  </Link>
                  <span>{formatCommentDate(topic.createdAt)}</span>
                  {level === 0 && (
                    <>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{topic.viewCount} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{topic.commentCount} comments</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {onReply && level < maxLevel && !topic.isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReply(topic.id)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  )}
                  {isOwner && onEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(topic)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {(isOwner || canModerate) && onDelete && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canModerate && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                // Toggle pin - future feature
                              }}
                              disabled
                            >
                              <Pin className="h-4 w-4 mr-2" />
                              {topic.isPinned ? "Unpin" : "Pin"} Topic
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Toggle lock - future feature
                              }}
                              disabled
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              {topic.isLocked ? "Unlock" : "Lock"} Topic
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {(isOwner || canModerate) && onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(topic.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {replies.length > 0 && level < maxLevel && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
            <TopicThread
              key={reply.id}
              topic={reply}
              groupSlug={groupSlug}
              level={level + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              canModerate={canModerate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

