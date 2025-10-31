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
import { ArrowLeft, Search, UserPlus, UserMinus, Heart, Lock } from "lucide-react"
import Link from "next/link"
import { canViewFollowing } from "@/lib/utils/privacy"

export default function FollowingPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [following, setFollowing] = useState<User[]>([])
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
    if (canViewFollowing(fetchedUser, viewerId)) {
      // Get all following
      const allUsers = getUsers()
      const followingUsers = allUsers.filter((u) => fetchedUser.following.includes(u.id))
      setFollowing(followingUsers)
    } else {
      setFollowing([])
    }
  }, [params.username, router, currentUser])

  const handleFollow = (userId: string) => {
    if (!currentUser) return
    toggleFollow(currentUser.id, userId)
    // Refresh following list
    const allUsers = getUsers()
    const followingUsers = allUsers.filter((u) => user?.following.includes(u.id))
    setFollowing(followingUsers)
  }

  const filteredFollowing = following.filter(
    (followingUser) =>
      followingUser.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followingUser.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) return null

  const viewerId = currentUser?.id || null
  const canViewFollowingList = canViewFollowing(user, viewerId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/user/${user.username}`} label="Back to Profile" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6" />
              {user.fullName}'s Following {canViewFollowingList ? `(${following.length})` : "(Private)"}
            </CardTitle>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search following..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!canViewFollowingList ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>This user{"'"}s following list is private</p>
            </div>
          ) : filteredFollowing.length > 0 ? (
            <div className="space-y-4">
              {filteredFollowing.map((followingUser) => {
                const isFollowing = currentUser?.following.includes(followingUser.id)
                const isOwnProfile = currentUser?.id === followingUser.id

                return (
                  <div
                    key={followingUser.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-accent"
                  >
                    <Link href={`/user/${followingUser.username}`} className="flex items-center gap-4 flex-1">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={followingUser.avatar || "/placeholder.svg"} alt={followingUser.fullName} />
                        <AvatarFallback className="text-lg">{followingUser.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{followingUser.fullName}</h3>
                        <p className="text-sm text-muted-foreground">@{followingUser.username}</p>
                        {followingUser.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{followingUser.bio}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? "No users found matching your search" : "Not following anyone yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
