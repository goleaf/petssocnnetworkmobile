"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BadgeDisplay } from "@/components/badge-display"
import { RoleBadge } from "@/components/role-badge"
import { getFriendSuggestions } from "@/lib/friend-suggestions"
import { toggleFollow, getUserById } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { User } from "@/lib/types"
import { UserPlus, UserCheck } from "lucide-react"
import { getMutualConnectionsCount } from "@/lib/utils/mutuals"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

interface PeopleYouMayKnowProps {
  currentUser: User
  maxSuggestions?: number
  className?: string
}

export function PeopleYouMayKnow({
  currentUser,
  maxSuggestions = 4,
  className = "",
}: PeopleYouMayKnowProps) {
  const { user } = useAuth()
  const [followingIds, setFollowingIds] = useState<Set<string>>(
    new Set(currentUser.following ?? [])
  )
  const [localCurrentUser, setLocalCurrentUser] = useState<User>(currentUser)

  useEffect(() => {
    const updatedUser = getUserById(currentUser.id)
    if (updatedUser) {
      setLocalCurrentUser(updatedUser)
      setFollowingIds(new Set(updatedUser.following ?? []))
    }
  }, [currentUser.id])

  useStorageListener(["pet_social_users"], () => {
    const updatedUser = getUserById(currentUser.id)
    if (updatedUser) {
      setLocalCurrentUser(updatedUser)
      setFollowingIds(new Set(updatedUser.following ?? []))
    }
  })

  const suggestions = useMemo(() => {
    return getFriendSuggestions(localCurrentUser, { limit: maxSuggestions })
  }, [localCurrentUser, maxSuggestions])

  const handleFollow = (userId: string) => {
    if (!user) return

    const isCurrentlyFollowing = followingIds.has(userId)
    toggleFollow(user.id, userId)

    const newFollowing = new Set(followingIds)
    if (isCurrentlyFollowing) {
      newFollowing.delete(userId)
    } else {
      newFollowing.add(userId)
    }
    setFollowingIds(newFollowing)

    // Update auth state
    useAuth.setState((state) => {
      if (!state.user || state.user.id !== user.id) {
        return state
      }
      return {
        ...state,
        user: {
          ...state.user,
          following: Array.from(newFollowing),
        },
      }
    })
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">People you may know</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const suggestedUser = suggestion.user
            const isFollowing = followingIds.has(suggestedUser.id)
            const mutualsCount = getMutualConnectionsCount(localCurrentUser.id, suggestedUser.id)

            return (
              <div
                key={suggestedUser.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Link href={`/user/${suggestedUser.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={suggestedUser.avatar || "/placeholder.svg"}
                      alt={suggestedUser.fullName}
                    />
                    <AvatarFallback>{suggestedUser.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm truncate">{suggestedUser.fullName}</p>
                      <BadgeDisplay user={suggestedUser} size="sm" />
                      <RoleBadge role={suggestedUser.role} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{suggestedUser.username}</p>
                    {mutualsCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mutualsCount} mutual {mutualsCount === 1 ? "connection" : "connections"}
                      </p>
                    )}
                    {suggestion.reasons.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {suggestion.reasons[0]}
                      </p>
                    )}
                  </div>
                </Link>
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    handleFollow(suggestedUser.id)
                  }}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="flex-shrink-0"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

