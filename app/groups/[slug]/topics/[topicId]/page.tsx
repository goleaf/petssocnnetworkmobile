"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { TopicThread } from "@/components/groups/TopicThread"
import { TopicCreator } from "@/components/groups/TopicCreator"
import {
  getGroupBySlug,
  getGroupTopicById,
  getGroupTopicsByParentId,
  canUserViewGroup,
  canUserCreateTopic,
  updateGroupTopic,
  addGroupTopic,
  deleteGroupTopic,
  isUserMemberOfGroup,
  canUserModerate,
} from "@/lib/storage"
import type { Group, GroupTopic } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Plus, MessageSquare, Pin, Lock, Reply } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function GroupTopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>
}) {
  const { slug, topicId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [topic, setTopic] = useState<GroupTopic | null>(null)
  const [replies, setReplies] = useState<GroupTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundGroup = getGroupBySlug(slug)
    if (!foundGroup) {
      setIsLoading(false)
      router.push("/groups")
      return
    }

    // Check visibility
    if (isAuthenticated && user) {
      if (!canUserViewGroup(foundGroup.id, user.id)) {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    } else {
      if (foundGroup.type === "secret") {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    }

    setGroup(foundGroup)
    const foundTopic = getGroupTopicById(topicId)
    if (!foundTopic || foundTopic.groupId !== foundGroup.id) {
      setIsLoading(false)
      router.push(`/groups/${foundGroup.slug}/topics`)
      return
    }

    setTopic(foundTopic)
    const topicReplies = getGroupTopicsByParentId(topicId)
    // Sort replies by creation date
    const sortedReplies = topicReplies.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    setReplies(sortedReplies)

    // Check if we should show reply form
    if (searchParams.get("reply") === "true") {
      setShowReplyForm(true)
    }

    setIsLoading(false)
  }, [slug, topicId, user, isAuthenticated, router, searchParams])

  const handleReply = (data: Omit<GroupTopic, "id" | "createdAt" | "updatedAt">) => {
    if (!user || !group || !topic) return

    const newReply: GroupTopic = {
      ...data,
      id: `topic-${Date.now()}`,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addGroupTopic(newReply)
    setReplies((prev) => [...prev, newReply].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ))
    setShowReplyForm(false)
    
    // Update parent topic comment count
    updateGroupTopic(topic.id, {
      commentCount: replies.length + 1,
    })
  }

  const handleDelete = (replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return

    deleteGroupTopic(replyId)
    setReplies((prev) => prev.filter((r) => r.id !== replyId))
    
    // Update parent topic comment count
    if (topic) {
      updateGroupTopic(topic.id, {
        commentCount: Math.max(0, topic.commentCount - 1),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!group || !topic) {
    return null
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be logged in to view topics.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isMember = isUserMemberOfGroup(group.id, user.id)
  const canCreate = isMember && canUserCreateTopic(group.id, user.id)
  const canModerate = canUserModerate(group.id, user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}/topics`}>
            Back to Topics
          </BackButton>
        </div>

        {/* Main Topic */}
        <TopicThread
          topic={topic}
          groupSlug={group.slug}
          replies={replies}
          onReply={() => setShowReplyForm(true)}
          onEdit={(topic) => {
            router.push(`/groups/${group.slug}/topics/${topic.id}/edit`)
          }}
          onDelete={handleDelete}
          canModerate={canModerate}
        />

        {/* Reply Form */}
        {showReplyForm && canCreate && !topic.isLocked && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <TopicCreator
                groupId={group.id}
                parentTopicId={topic.id}
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                isReply={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Reply Button */}
        {!showReplyForm && canCreate && !topic.isLocked && (
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setShowReplyForm(true)}>
              <Reply className="h-4 w-4 mr-2" />
              Reply to Topic
            </Button>
          </div>
        )}

        {topic.isLocked && (
          <Alert className="mt-6">
            <Lock className="h-4 w-4" />
            <AlertTitle>Topic Locked</AlertTitle>
            <AlertDescription>
              This topic has been locked by a moderator. No new replies can be added.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

