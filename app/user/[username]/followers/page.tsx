"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { getUserByUsername, getUsers, toggleFollow } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { User } from "@/lib/types"
import { ArrowLeft, Search, UserPlus, UserMinus, UsersIcon, Lock } from "lucide-react"
import Link from "next/link"
import { canViewFollowers } from "@/lib/utils/privacy"

export default function FollowersPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [followers, setFollowers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const username = params.username as string
    const fetchedUser = getUserByUsername(username)

    if (!fetchedUser) {
      router.push("/")
      return
    }

    setUser(fetchedUser)

    const viewerId = currentUser?.id || null
    if (canViewFollowers(fetchedUser, viewerId)) {
      // Get all followers
      const allUsers = getUsers()
      const followerUsers = allUsers.filter((u) => fetchedUser.followers.includes(u.id))
      setFollowers(followerUsers)
    } else {
      setFollowers([])
    }
  }, [params.username, router, currentUser])

  const handleFollow = (userId: string) => {
    if (!currentUser) return
    toggleFollow(currentUser.id, userId)
    // Refresh followers list
    const allUsers = getUsers()
    const followerUsers = allUsers.filter((u) => user?.followers.includes(u.id))
    setFollowers(followerUsers)
  }

  const filteredFollowers = followers.filter(
    (follower) =>
      follower.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      follower.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) return null

  const viewerId = currentUser?.id || null
  const canViewFollowersList = canViewFollowers(user, viewerId)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        <BackButton href={`/user/${user.username}`} label="Back to Profile" />

        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm mt-4 sm:mt-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl">
                <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate">{user.fullName}'s Followers</span>
                <span className="text-muted-foreground text-base sm:text-lg">
                  {canViewFollowersList ? `(${followers.length})` : "(Private)"}
                </span>
              </CardTitle>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search followers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {!canViewFollowersList ? (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <Lock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">This user{"'"}s followers list is private</p>
              </div>
            ) : filteredFollowers.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredFollowers.map((follower) => {
                  const isFollowing = currentUser?.following.includes(follower.id)
                  const isOwnProfile = currentUser?.id === follower.id

                  return (
                    <Card key={follower.id} className="hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <Link href={`/user/${follower.username}`} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex-shrink-0 ring-2 ring-primary/20">
                              <AvatarImage src={follower.avatar || "/placeholder.svg"} alt={follower.fullName} />
                              <AvatarFallback className="text-base sm:text-lg">{follower.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg md:text-xl truncate">{follower.fullName}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">@{follower.username}</p>
                              {follower.bio && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{follower.bio}</p>
                              )}
                              <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{follower.followers.length} followers</span>
                                <span>{follower.following.length} following</span>
                              </div>
                            </div>
                          </Link>
                          {currentUser && !isOwnProfile && (
                            <Button
                              onClick={() => handleFollow(follower.id)}
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
                <UsersIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">{searchQuery ? "No followers found matching your search" : "No followers yet"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
