"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { ModerationPanel } from "@/components/groups/ModerationPanel"
import {
  getGroupBySlug,
  canUserViewGroup,
  canUserModerate,
} from "@/lib/storage"
import type { Group } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function GroupModerationPage({
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

      // Check if user can moderate (required for moderation page)
      if (!canUserModerate(foundGroup.id, user.id)) {
        setIsLoading(false)
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

  if (!user || !isAuthenticated || !canUserModerate(group.id, user.id)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be a moderator or administrator to access moderation tools.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}`} />
        </div>
        <ModerationPanel group={group} currentUserId={user.id} />
      </div>
    </div>
  )
}

