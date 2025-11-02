"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CommentThread } from "./comment-thread"
import { CommentForm } from "./comment-form"
import { PollDisplay } from "./poll-display"
import { WatchButton } from "./watch-button"
import { Plus, MessageSquare } from "lucide-react"
import type { TalkPage as TalkPageType, CommentThread as CommentThreadType } from "@/lib/types/discussion"
import {
  getCommentThreadsByTalkPageId,
  createCommentThread,
  getPollsByTalkPageId,
} from "@/lib/storage-discussion"
import { useAuth } from "@/lib/auth"

interface TalkPageProps {
  talkPage: TalkPageType
  articleTitle: string
}

export function TalkPage({ talkPage, articleTitle }: TalkPageProps) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<CommentThreadType[]>([])
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [polls, setPolls] = useState(getPollsByTalkPageId(talkPage.id))

  useEffect(() => {
    loadThreads()
  }, [talkPage.id])

  const loadThreads = () => {
    const loadedThreads = getCommentThreadsByTalkPageId(talkPage.id)
    setThreads(loadedThreads)
  }

  const handleNewThread = (content: string, title?: string) => {
    if (!user) return

    createCommentThread({
      talkPageId: talkPage.id,
      authorId: user.id,
      content,
      title,
    })

    loadThreads()
    setShowCommentForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Talk: {articleTitle}</h1>
          <p className="text-muted-foreground mt-1">
            Discussion page for {articleTitle}
          </p>
        </div>
        <WatchButton articleId={talkPage.articleId} articleType={talkPage.articleType} />
      </div>

      {polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollDisplay key={poll.id} poll={poll} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussion Threads ({threads.length})
        </h2>
        {user && (
          <Button onClick={() => setShowCommentForm(!showCommentForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        )}
      </div>

      {showCommentForm && user && (
        <Card>
          <CardHeader>
            <CardTitle>Start a New Discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <CommentForm
              onSubmit={handleNewThread}
              onCancel={() => setShowCommentForm(false)}
              allowTitle
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {threads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No discussion threads yet. Start the conversation!
            </CardContent>
          </Card>
        ) : (
          threads.map((thread) => (
            <CommentThread key={thread.id} thread={thread} />
          ))
        )}
      </div>
    </div>
  )
}

