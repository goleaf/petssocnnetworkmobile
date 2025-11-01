"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { GroupForm, type GroupFormData } from "@/components/groups/GroupForm"
import { useAuth } from "@/lib/auth"
import { addGroup, addGroupMember, generateGroupSlug, getGroupBySlug } from "@/lib/storage"
import type { Group, GroupMember } from "@/lib/types"
import { Users } from "lucide-react"

export default function CreateGroupPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push("/groups")
      return
    }

    setIsLoading(false)
  }, [user, isAuthenticated, router])

  const handleSubmit = async (formData: GroupFormData) => {
    if (!user) return

    setIsSubmitting(true)

    try {
      // Generate slug from name and check for duplicates
      let slug = generateGroupSlug(formData.name)
      let baseSlug = slug
      let counter = 1
      
      // Check if slug exists and append number if needed
      while (getGroupBySlug(slug)) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Create the group
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: formData.name.trim(),
        slug,
        description: formData.description.trim(),
        type: formData.type,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        ownerId: user.id,
        coverImage: formData.coverImage?.trim() || undefined,
        avatar: formData.avatar?.trim() || undefined,
        memberCount: 1, // Creator is the first member
        topicCount: 0,
        postCount: 0,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        rules: formData.rules.length > 0 ? formData.rules : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add group to storage
      addGroup(newGroup)

      // Add creator as owner/member
      const creatorMember: GroupMember = {
        id: `member-${Date.now()}`,
        groupId: newGroup.id,
        userId: user.id,
        role: "owner",
        joinedAt: new Date().toISOString(),
        permissions: {
          canPost: true,
          canComment: true,
          canCreateTopic: true,
          canCreatePoll: true,
          canCreateEvent: true,
          canModerate: true,
          canManageMembers: true,
          canManageSettings: true,
        },
      }

      addGroupMember(creatorMember)

      // Redirect to the new group page
      router.push(`/groups/${newGroup.slug}`)
    } catch (error) {
      console.error("Error creating group:", error)
      setIsSubmitting(false)
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

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <BackButton href="/groups">Back to Groups</BackButton>
        </div>

        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl">Create New Group</CardTitle>
                <CardDescription>
                  Start a new community for pet owners to share and connect
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <GroupForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/groups")}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  )
}

