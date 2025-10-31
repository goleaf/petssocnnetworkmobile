"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { TopicCreator } from "@/components/groups/TopicCreator"
import {
  getGroupBySlug,
  canUserViewGroup,
  canUserCreateTopic,
  addGroupTopic,
  isUserMemberOfGroup,
  canUserModerate,
} from "@/lib/storage"
import type { Group, GroupTopic } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

export default function CreateTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
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
      setIsLoading(false)
      router.push("/groups")
      return
    }

    setGroup(foundGroup)
    setIsLoading(false)
  }, [slug, user, isAuthenticated, router])

  const handleSubmit = (data: Omit<GroupTopic, "id" | "createdAt" | "updatedAt">) => {
    if (!user || !group) return

    const newTopic: GroupTopic = {
      ...data,
      id: `topic-${Date.now()}`,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addGroupTopic(newTopic)
    router.push(`/groups/${group.slug}/topics/${newTopic.id}`)
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
              You must be logged in to create topics.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isMember = isUserMemberOfGroup(group.id, user.id)
  const canCreate = isMember && canUserCreateTopic(group.id, user.id)
  const canModerate = canUserModerate(group.id, user.id)

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <BackButton href={`/groups/${group.slug}/topics`}>
              Back to Topics
            </BackButton>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
              {!isMember
                ? "You must be a member of this group to create topics."
                : "You don't have permission to create topics in this group."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}/topics`}>
            Back to Topics
          </BackButton>
        </div>

        <TopicCreator
          groupId={group.id}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/groups/${group.slug}/topics`)}
          canPin={canModerate}
          canLock={canModerate}
        />
      </div>
    </div>
  )
}

