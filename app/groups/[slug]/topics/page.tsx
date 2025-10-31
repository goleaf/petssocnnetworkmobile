"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { TopicThread } from "@/components/groups/TopicThread"
import {
  getGroupBySlug,
  getGroupTopicsByGroupId,
  getGroupTopicsByParentId,
  canUserViewGroup,
  canUserCreateTopic,
  deleteGroupTopic,
  updateGroupTopic,
} from "@/lib/storage"
import type { Group, GroupTopic } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Plus, MessageSquare, Pin } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function GroupTopicsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [topics, setTopics] = useState<GroupTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    const allTopics = getGroupTopicsByGroupId(foundGroup.id)
    // Filter only top-level topics (no parentTopicId)
    const topLevelTopics = allTopics.filter((t) => !t.parentTopicId)
    // Sort: pinned first, then by creation date
    const sortedTopics = topLevelTopics.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })
    setTopics(sortedTopics)
    setIsLoading(false)
  }, [slug, user, isAuthenticated, router])

  const handleDelete = (topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic?")) return

    deleteGroupTopic(topicId)
    
    // Update local state
    setTopics((prev) => prev.filter((t) => t.id !== topicId))
    
    // Also remove any replies
    const replies = getGroupTopicsByParentId(topicId)
    replies.forEach((reply) => deleteGroupTopic(reply.id))
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

  if (!group) {
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
              You must be logged in to view group topics.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isMember = isAuthenticated && user
    ? require("@/lib/storage").isUserMemberOfGroup(group.id, user.id)
    : false
  const canCreate = isMember && canUserCreateTopic(group.id, user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}`}>Back to Group</BackButton>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Topics</h1>
            <p className="text-muted-foreground">{group.name} discussions</p>
          </div>
          {canCreate && (
            <Link href={`/groups/${group.slug}/topics/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </Link>
          )}
        </div>

        {topics.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
              <p className="text-muted-foreground mb-4">
                {isMember
                  ? "Be the first to start a discussion!"
                  : "Join this group to see and create topics."}
              </p>
              {canCreate && (
                <Link href={`/groups/${group.slug}/topics/create`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Topic
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => {
              const replies = getGroupTopicsByParentId(topic.id)
              const canModerate = isMember
                ? require("@/lib/storage").canUserModerate(group.id, user.id)
                : false

              return (
                <TopicThread
                  key={topic.id}
                  topic={topic}
                  groupSlug={group.slug}
                  replies={replies}
                  onReply={(topicId) => {
                    router.push(`/groups/${group.slug}/topics/${topicId}?reply=true`)
                  }}
                  onEdit={(topic) => {
                    router.push(`/groups/${group.slug}/topics/${topic.id}/edit`)
                  }}
                  onDelete={handleDelete}
                  canModerate={canModerate}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

