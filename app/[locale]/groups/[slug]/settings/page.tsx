"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { GroupSettings } from "@/components/groups/GroupSettings"
import { BackButton } from "@/components/ui/back-button"
import {
  getGroupBySlug,
  canUserManageSettings,
  canUserViewGroup,
} from "@/lib/storage"
import type { Group } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

export default function GroupSettingsPage({
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

      // Check permissions
      if (!canUserManageSettings(foundGroup.id, user.id)) {
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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be logged in to access group settings.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!canUserManageSettings(group.id, user.id)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
              Only group owners and administrators can manage group settings.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <BackButton href={`/groups/${group.slug}`}>Back to Group</BackButton>
          </div>
        </div>
      </div>
    )
  }

  const handleSave = (updatedGroup: Group) => {
    setGroup(updatedGroup)
    router.push(`/groups/${updatedGroup.slug}`)
  }

  const handleCancel = () => {
    router.push(`/groups/${group.slug}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}`}>Back to Group</BackButton>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupSettings
              group={group}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

