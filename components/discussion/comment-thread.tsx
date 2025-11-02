"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CommentForm } from "./comment-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Reply, Pin, Lock, CheckCircle2 } from "lucide-react"
import type { CommentThread as CommentThreadType } from "@/lib/types/discussion"
import {
  getRepliesToThread,
  createCommentThread,
  updateCommentThread,
} from "@/lib/storage-discussion"
import { useAuth } from "@/lib/auth"
import { parseMentions, renderMentions } from "@/lib/utils/mentions"

interface CommentThreadProps {
  thread: CommentThreadType
  depth?: number
}

export function CommentThread({ thread, depth = 0 }: CommentThreadProps) {
  const { user } = useAuth()
  const [replies, setReplies] = useState<CommentThreadType[]>([])
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isResolved, setIsResolved] = useState(thread.isResolved || false)

  useEffect(() => {
    loadReplies()
  }, [thread.id])

  const loadReplies = () => {
    const loadedReplies = getRepliesToThread(thread.id)
    setReplies(loadedReplies)
  }

  const handleReply = (content: string) => {
    if (!user) return

    createCommentThread({
      talkPageId: thread.talkPageId,
      authorId: user.id,
      content,
      parentThreadId: thread.id,
    })

    loadReplies()
    setShowReplyForm(false)
  }

  const handleResolve = () => {
    if (!user) return

    const newResolvedState = !isResolved
    setIsResolved(newResolvedState)

    updateCommentThread(thread.id, {
      isResolved: newResolvedState,
      resolvedBy: newResolvedState ? user.id : undefined,
      resolvedAt: newResolvedState ? new Date().toISOString() : undefined,
    })
  }

  const mentions = parseMentions(thread.content)
  const renderedContent = renderMentions(thread.content, mentions)

  return (
    <Card className={isResolved ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar>
              <AvatarFallback>
                {thread.authorId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {thread.title && (
                <h3 className="font-semibold text-lg mb-1">{thread.title}</h3>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>User {thread.authorId.slice(0, 8)}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                {thread.isPinned && (
                  <>
                    <span>•</span>
                    <Pin className="w-4 h-4" />
                  </>
                )}
                {thread.isLocked && (
                  <>
                    <span>•</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
                {isResolved && (
                  <>
                    <span>•</span>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Resolved</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {user && user.id === thread.authorId && !thread.isResolved && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              className="ml-2"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {!thread.isLocked && user && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          </div>
        )}

        {showReplyForm && user && (
          <div className="ml-8 border-l-2 border-muted pl-4">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write a reply..."
            />
          </div>
        )}

        {replies.length > 0 && depth < 5 && (
          <div className="ml-8 space-y-4 border-l-2 border-muted pl-4">
            {replies.map((reply) => (
              <CommentThread key={reply.id} thread={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

