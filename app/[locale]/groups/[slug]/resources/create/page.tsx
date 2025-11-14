"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { ResourceCreator } from "@/components/groups/ResourceCreator"
import {
  getGroupBySlug,
  canUserViewGroup,
  addGroupResource,
  isUserMemberOfGroup,
} from "@/lib/storage"
import type { Group, GroupResource } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

export default function CreateResourcePage({
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
      if (foundGroup.type === "secret") {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    }

    setGroup(foundGroup)
    setIsLoading(false)
  }, [slug, user, isAuthenticated, router])

  const handleSubmit = (data: Omit<GroupResource, "id" | "createdAt" | "updatedAt">) => {
    if (!user || !group) return

    const newResource: GroupResource = {
      ...data,
      id: `resource-${Date.now()}`,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addGroupResource(newResource)
    router.push(`/groups/${group.slug}?tab=resources`)
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
              You must be logged in to create resources.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isMember = isUserMemberOfGroup(group.id, user.id)

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <BackButton href={`/groups/${group.slug}?tab=resources`}>
              Back to Resources
            </BackButton>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
              You must be a member of this group to create resources.
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
          <BackButton href={`/groups/${group.slug}?tab=resources`}>
            Back to Resources
          </BackButton>
        </div>

        <ResourceCreator
          groupId={group.id}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/groups/${group.slug}?tab=resources`)}
        />
      </div>
    </div>
  )
}
