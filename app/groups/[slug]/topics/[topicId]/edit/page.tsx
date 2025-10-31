"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { TopicCreator } from "@/components/groups/TopicCreator"
import {
  getGroupBySlug,
  getGroupTopicById,
  canUserViewGroup,
  updateGroupTopic,
  canUserModerate,
} from "@/lib/storage"
import type { Group, GroupTopic } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

export default function EditTopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>
}) {
  const { slug, topicId } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [topic, setTopic] = useState<GroupTopic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadData = async () => {
      if (!user || !isAuthenticated) {
        setIsLoading(false)
        router.push("/groups")
        return
      }

      setIsLoading(true)

      const foundGroup = getGroupBySlug(slug)
      if (!foundGroup) {
        setIsLoading(false)
        router.push("/groups")
        return
      }

      // Check visibility
      if (!canUserViewGroup(foundGroup.id, user.id)) {
        setIsLoading(false)
        router.push("/groups")
        return
      }

      setGroup(foundGroup)
      const foundTopic = getGroupTopicById(topicId)
      if (!foundTopic || foundTopic.groupId !== foundGroup.id) {
        setIsLoading(false)
        router.push(`/groups/${foundGroup.slug}/topics`)
        return
      }

      // Check if user owns the topic or is a moderator
      const isOwner = foundTopic.authorId === user.id
      const canModerate = canUserModerate(foundGroup.id, user.id)
      if (!isOwner && !canModerate) {
        setIsLoading(false)
        router.push(`/groups/${foundGroup.slug}/topics/${topicId}`)
        return
      }

      setTopic(foundTopic)
      setIsLoading(false)
    }

    loadData()
  }, [slug, topicId, user, isAuthenticated, router])

  const handleSubmit = (data: Omit<GroupTopic, "id" | "createdAt" | "updatedAt">) => {
    if (!user || !group || !topic) return

    updateGroupTopic(topic.id, {
      title: data.title.trim(),
      content: data.content.trim(),
      isPinned: data.isPinned,
      isLocked: data.isLocked,
      status: data.isLocked ? "locked" : "active",
      tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
    })

    router.push(`/groups/${group.slug}/topics/${topic.id}`)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!group || !topic || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Topic Not Found</AlertTitle>
            <AlertDescription>
              The topic you're looking for doesn't exist or you don't have permission to edit it.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isOwner = topic.authorId === user.id
  const canModerate = canUserModerate(group.id, user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}/topics/${topic.id}`}>
            Back to Topic
          </BackButton>
        </div>

        <TopicCreator
          groupId={group.id}
          initialData={topic}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/groups/${group.slug}/topics/${topic.id}`)}
          canPin={canModerate}
          canLock={canModerate}
        />
      </div>
    </div>
  )
}

