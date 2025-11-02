"use client"

import { use } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { ResourceCreator, type ResourceFormValues } from "@/components/groups/ResourceCreator"
import {
  addGroupResource,
  canUserViewGroup,
  getGroupBySlug,
  isUserMemberOfGroup,
} from "@/lib/storage"
import type { Group, GroupResource } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { AlertCircle, Shield } from "lucide-react"
import { useTranslations } from "next-intl"

interface PageParams {
  slug: string
}

export default function CreateResourcePage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations("GroupResources.Create")

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundGroup = getGroupBySlug(slug)

    if (!foundGroup) {
      setIsLoading(false)
      router.push("/groups")
      return
    }

    if (isAuthenticated && user) {
      const canView = canUserViewGroup(foundGroup.id, user.id)
      if (!canView) {
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

  const handleSubmit = async (values: ResourceFormValues) => {
    if (!group || !user) return

    const timestamp = new Date().toISOString()
    const resource: GroupResource = {
      id: `resource-${Date.now()}`,
      groupId: group.id,
      title: values.title,
      description: values.description,
      url: values.type === "note" ? undefined : values.url,
      type: values.type,
      tags: values.tags.length > 0 ? values.tags : undefined,
      createdBy: user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    addGroupResource(resource)
    router.push(`/groups/${group.slug}?tab=resources`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
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
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("accessDeniedTitle")}</AlertTitle>
            <AlertDescription>{t("accessDeniedDescription")}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isMember = isUserMemberOfGroup(group.id, user.id)

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6">
            <BackButton href={`/groups/${group.slug}`}>
              {t("backToResources")}
            </BackButton>
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>{t("permissionDeniedTitle")}</AlertTitle>
            <AlertDescription>{t("permissionDeniedDescription")}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}?tab=resources`}>
            {t("backToResources")}
          </BackButton>
        </div>
        <ResourceCreator
          initialValues={{ type: "link" }}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/groups/${group.slug}?tab=resources`)}
        />
      </div>
    </div>
  )
}


