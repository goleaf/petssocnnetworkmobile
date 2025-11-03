"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { PollDisplay } from "@/components/groups/PollDisplay"
import {
  getGroupBySlug,
  getGroupPollById,
  canUserViewGroup,
  canUserViewGroupContent,
  deleteGroupPoll,
  canUserModerate,
} from "@/lib/storage"
import type { Group, GroupPoll } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

export default function GroupPollPage({
  params,
}: {
  params: Promise<{ slug: string; pollId: string }>
}) {
  const { slug, pollId } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [poll, setPoll] = useState<GroupPoll | null>(null)
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
    const foundPoll = getGroupPollById(pollId)
    if (!foundPoll || foundPoll.groupId !== foundGroup.id) {
      setIsLoading(false)
      router.push(`/groups/${foundGroup.slug}/polls`)
      return
    }

    setPoll(foundPoll)
    setIsLoading(false)
  }, [slug, pollId, user, isAuthenticated, router])

  const handleVoteChange = () => {
    // Refresh poll when vote changes
    if (pollId) {
      const updatedPoll = getGroupPollById(pollId)
      if (updatedPoll) {
        setPoll(updatedPoll)
      }
    }
  }

  const handleDelete = () => {
    if (!poll) return
    if (!confirm("Are you sure you want to delete this poll?")) return

    deleteGroupPoll(poll.id)
    router.push(`/groups/${group?.slug}/polls`)
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

  if (!group || !poll) {
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
              You must be logged in to view polls.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isOwner = user.id === poll.authorId
  const canModerate = canUserModerate(group.id, user.id)
  const canDelete = isOwner || canModerate

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <BackButton href={`/groups/${group.slug}/polls`}>
            Back to Polls
          </BackButton>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(isOwner || canModerate) && (
                  <>
                    {isOwner && (
                      <DropdownMenuItem asChild>
                        <Link href={`/groups/${group.slug}/polls/${poll.id}/edit`}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Poll
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Poll
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <PollDisplay poll={poll} onVoteChange={handleVoteChange} />
      </div>
    </div>
  )
}
