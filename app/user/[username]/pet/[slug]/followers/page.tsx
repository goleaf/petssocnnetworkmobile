"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { getPetByUsernameAndSlug, getUserById, getUsers, toggleFollow } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { Pet, User } from "@/lib/types"
import { Search, UserPlus, UserMinus, Heart, Users } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

export default function PetFollowersPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [followers, setFollowers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setIsLoading(true)
    const fetchedPet = getPetByUsernameAndSlug(username, slug)

    if (!fetchedPet) {
      router.push(`/user/${username}`)
      return
    }

    setPet(fetchedPet)
    const fetchedOwner = getUserById(fetchedPet.ownerId)
    setOwner(fetchedOwner)

    // Get all followers (users who follow the pet)
    const allUsers = getUsers()
    const followerUsers = allUsers.filter((u) => fetchedPet.followers.includes(u.id))
    setFollowers(followerUsers)
    setIsLoading(false)
  }, [username, slug, router])

  const handleFollow = (userId: string) => {
    if (!currentUser) return
    toggleFollow(currentUser.id, userId)
    // Refresh followers list
    const allUsers = getUsers()
    const followerUsers = allUsers.filter((u) => pet?.followers.includes(u.id))
    setFollowers(followerUsers)
  }

  const filteredFollowers = followers.filter(
    (follower) =>
      follower.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      follower.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !owner) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Pet not found</p>
            <BackButton href={`/user/${username}`} label="Back to Profile" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={getPetUrlFromPet(pet, username)} label={`Back to ${pet.name}'s Profile`} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{pet.name}'s Followers ({followers.length})</CardTitle>
              <CardDescription>People who follow {pet.name}</CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
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
                  <div key={follower.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors">
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
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? "No followers found matching your search" : `${pet.name} doesn't have any followers yet`}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}





