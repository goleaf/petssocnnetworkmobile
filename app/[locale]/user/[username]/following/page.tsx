"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { getUserByUsername, getUsers, toggleFollow } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { User } from "@/lib/types"
import { Search, UserPlus, UserMinus, Heart, Lock } from "lucide-react"
import Link from "next/link"
import { canSendFollowRequest, canViewFollowing, canViewProfile } from "@/lib/utils/privacy"
import { getPrivacyNotice } from "@/lib/utils/privacy-messages"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

const STORAGE_KEYS_TO_WATCH = ["pet_social_users"]

export default function FollowingPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [following, setFollowing] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const loadFollowing = useCallback(() => {
    const usernameParam = params.username as string
    const fetchedUser = getUserByUsername(usernameParam)

    if (!fetchedUser) {
      setUser(null)
      setFollowing([])
      router.push("/")
      return
    }

    const viewer = useAuth.getState().user
    const viewerId = viewer?.id || null

    if (!canViewProfile(fetchedUser, viewerId)) {
      setUser(null)
      setFollowing([])
      router.push("/")
      return
    }

    setUser(fetchedUser)

    if (canViewFollowing(fetchedUser, viewerId)) {
      const allUsers = getUsers()
      const followingUsers = allUsers.filter((u) => fetchedUser.following.includes(u.id))
      setFollowing(followingUsers)
    } else {
      setFollowing([])
    }
  }, [params.username, router])

  useEffect(() => {
    loadFollowing()
  }, [loadFollowing, currentUser?.id])

  useStorageListener(STORAGE_KEYS_TO_WATCH, loadFollowing)

  const handleFollow = (userId: string) => {
    if (!currentUser) return

    const isCurrentlyFollowing = currentUser.following.includes(userId)
    toggleFollow(currentUser.id, userId)

    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter((id) => id !== userId)
      : [...new Set([...currentUser.following, userId])]

    useAuth.setState((state) => {
      if (!state.user || state.user.id !== currentUser.id) {
        return state
      }
      return {
        ...state,
        user: {
          ...state.user,
          following: updatedFollowing,
        },
      }
    })

    loadFollowing()
  }

  const filteredFollowing = following.filter(
    (followingUser) =>
      followingUser.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followingUser.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) return null

  const viewerId = currentUser?.id || null
  const canViewFollowingList = canViewFollowing(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)
  const privacyMessage = getPrivacyNotice({
    profileUser: user,
    scope: "following",
    viewerId,
    canRequestAccess: canFollow,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        <BackButton href={`/user/${user.username}`} label="Back to Profile" />

        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm mt-4 sm:mt-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate">{user.fullName}'s Following</span>
                <span className="text-muted-foreground text-base sm:text-lg">
                  {canViewFollowingList ? `(${following.length})` : "(Hidden)"}
                </span>
              </CardTitle>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search following..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                disabled={!canViewFollowingList}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {!canViewFollowingList ? (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <Lock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base leading-relaxed">{privacyMessage}</p>
              </div>
            ) : filteredFollowing.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredFollowing.map((followingUser) => {
                  const isFollowing = currentUser?.following.includes(followingUser.id)
                  const isOwnProfile = currentUser?.id === followingUser.id

                  return (
                    <Card key={followingUser.id} className="hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <Link href={`/user/${followingUser.username}`} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex-shrink-0 ring-2 ring-primary/20">
                              <AvatarImage src={followingUser.avatar || "/placeholder.svg"} alt={followingUser.fullName} />
                              <AvatarFallback className="text-base sm:text-lg">{followingUser.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg md:text-xl truncate">{followingUser.fullName}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">@{followingUser.username}</p>
                              {followingUser.bio && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{followingUser.bio}</p>
                              )}
                              <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{followingUser.followers.length} followers</span>
                                <span>{followingUser.following.length} following</span>
                              </div>
                            </div>
                          </Link>
                          {currentUser && !isOwnProfile && (
                            <Button
                              onClick={() => handleFollow(followingUser.id)}
                              variant={isFollowing ? "outline" : "default"}
                              size="sm"
                              className="w-full sm:w-auto flex-shrink-0"
                            >
                              {isFollowing ? (
                                <>
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Unfollow</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Follow</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">{searchQuery ? "No users found matching your search" : "Not following anyone yet"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
