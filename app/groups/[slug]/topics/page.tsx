"use client"

import { use } from "react"
import { useState, useEffect, useMemo } from "react"
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
  canUserViewGroupContent,
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
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
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

    const canViewContent = isAuthenticated && user
      ? canUserViewGroupContent(foundGroup.id, user.id)
      : canUserViewGroupContent(foundGroup.id)

    if (!canViewContent) {
      setIsLoading(false)
      router.push(`/groups/${foundGroup.slug}`)
      return
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

  const contextOptions = useMemo(() => {
    const tagMap = new Map<string, string>()
    topics.forEach((topic) => {
      topic.tags?.forEach((tag) => {
        const normalized = tag.toLowerCase()
        if (!tagMap.has(normalized)) {
          tagMap.set(normalized, tag)
        }
      })
    })
    return Array.from(tagMap, ([value, label]) => ({ value, label }))
  }, [topics])

  const filteredTopics = useMemo(() => {
    if (!selectedContext) return topics
    return topics.filter((topic) =>
      (topic.tags ?? []).some((tag) => tag.toLowerCase() === selectedContext),
    )
  }, [topics, selectedContext])

  const activeContextLabel = useMemo(() => {
    if (!selectedContext) return null
    const match = contextOptions.find((option) => option.value === selectedContext)
    return match?.label ?? selectedContext
  }, [contextOptions, selectedContext])

  useEffect(() => {
    if (!selectedContext) return
    if (!contextOptions.some((option) => option.value === selectedContext)) {
      setSelectedContext(null)
    }
  }, [contextOptions, selectedContext])

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
  const hasTopics = topics.length > 0
  const displayTopics = filteredTopics
  const showFilteredEmptyState = hasTopics && displayTopics.length === 0

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

        {contextOptions.length > 0 && (
          <div className="mb-6 rounded-lg border border-dashed border-muted bg-muted/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Conversation contexts</p>
                <p className="text-xs text-muted-foreground">
                  Filter discussions by their focus or topic.
                </p>
              </div>
              {selectedContext && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedContext(null)}>
                  Clear filter
                </Button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {contextOptions.map((option) => {
                const isActive = option.value === selectedContext
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      setSelectedContext((current) =>
                        current === option.value ? null : option.value,
                      )
                    }
                  >
                    #{option.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {!hasTopics ? (
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
        ) : showFilteredEmptyState ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No threads in this context</h3>
              <p className="text-muted-foreground mb-4">
                {activeContextLabel
                  ? `There aren't any discussions tagged #${activeContextLabel} yet.`
                  : "This filter doesn't match any discussions right now."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setSelectedContext(null)}>
                  Clear filter
                </Button>
                {canCreate && (
                  <Button onClick={() => router.push(`/groups/${group.slug}/topics/create`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Topic
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayTopics.map((topic) => {
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
