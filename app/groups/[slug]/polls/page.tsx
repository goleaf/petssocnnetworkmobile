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
  getGroupPollsByGroupId,
  canUserViewGroup,
  deleteGroupPoll,
} from "@/lib/storage"
import type { Group, GroupPoll } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Plus, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function GroupPollsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [polls, setPolls] = useState<GroupPoll[]>([])
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
    const groupPolls = getGroupPollsByGroupId(foundGroup.id)
    // Sort by creation date (newest first)
    const sortedPolls = groupPolls.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setPolls(sortedPolls)
    setIsLoading(false)
  }, [slug, user, isAuthenticated, router])

  const handleVoteChange = () => {
    // Refresh polls when vote changes
    if (group) {
      const updatedPolls = getGroupPollsByGroupId(group.id)
      setPolls(updatedPolls)
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
              You must be logged in to view group polls.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const isMember = require("@/lib/storage").isUserMemberOfGroup(group.id, user.id)
  const canCreate = isMember

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}`}>Back to Group</BackButton>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Polls</h1>
            <p className="text-muted-foreground">{group.name} polls</p>
          </div>
          {canCreate && (
            <Link href={`/groups/${group.slug}/polls/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Poll
              </Button>
            </Link>
          )}
        </div>

        {polls.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
              <p className="text-muted-foreground mb-4">
                {isMember
                  ? "Create a poll to gather opinions from group members!"
                  : "Join this group to see and create polls."}
              </p>
              {canCreate && (
                <Link href={`/groups/${group.slug}/polls/create`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Poll
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <PollDisplay key={poll.id} poll={poll} onVoteChange={handleVoteChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

