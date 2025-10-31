"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUserByUsername, getUsers, toggleFollow } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { User } from "@/lib/types"
import { ArrowLeft, Search, UserPlus, UserMinus, UsersIcon } from "lucide-react"
import Link from "next/link"

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

    // Get all followers
    const allUsers = getUsers()
    const followerUsers = allUsers.filter((u) => fetchedUser.followers.includes(u.id))
    setFollowers(followerUsers)
  }, [params.username, router])

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href={`/user/${user.username}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              {user.fullName}'s Followers ({followers.length})
            </CardTitle>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredFollowers.length > 0 ? (
            <div className="space-y-4">
              {filteredFollowers.map((follower) => {
                const isFollowing = currentUser?.following.includes(follower.id)
                const isOwnProfile = currentUser?.id === follower.id

                return (
                  <div key={follower.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-accent">
                    <Link href={`/user/${follower.username}`} className="flex items-center gap-4 flex-1">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={follower.avatar || "/placeholder.svg"} alt={follower.fullName} />
                        <AvatarFallback className="text-lg">{follower.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{follower.fullName}</h3>
                        <p className="text-sm text-muted-foreground">@{follower.username}</p>
                        {follower.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{follower.bio}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
              <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? "No followers found matching your search" : "No followers yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
