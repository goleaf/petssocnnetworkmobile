"use client"

import { use } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getUsers, getPets, getBlogPosts, updateUser } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { MapPin, Calendar, Users, Heart, PawPrint, FileText, Lock } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useState, useEffect } from "react"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import {
  canViewProfile,
  canViewUserPosts,
  canViewUserPets,
  canViewFollowers,
  canViewFollowing,
  canViewProfileField,
  canSendFollowRequest,
  canViewPost,
} from "@/lib/utils/privacy"

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load data only on client side to prevent hydration mismatch
    const foundUser = getUsers().find((u) => u.username === username)
    if (foundUser) {
      const viewerId = currentUser?.id || null
      
      // Check if viewer can see profile
      if (!canViewProfile(foundUser, viewerId)) {
        setIsLoading(false)
        return
      }
      
      setUser(foundUser)
      
      // Filter pets and posts based on privacy
      if (canViewUserPets(foundUser, viewerId)) {
        const allPets = getPets().filter((p) => p.ownerId === foundUser.id)
        setPets(allPets)
      } else {
        setPets([])
      }
      
      if (canViewUserPosts(foundUser, viewerId)) {
        const allPosts = getBlogPosts()
          .filter((p) => p.authorId === foundUser.id)
          .filter((p) => canViewPost(p, foundUser, viewerId))
        setPosts(allPosts.slice(0, 6))
      } else {
        setPosts([])
      }
      
      if (currentUser) {
        setIsFollowing(foundUser.followers.includes(currentUser.id))
      }
    }
    setIsLoading(false)
  }, [username, currentUser])

  useEffect(() => {
    if (currentUser && user) {
      setIsFollowing(user.followers.includes(currentUser.id))
    }
  }, [currentUser, user])

  const handleFollow = () => {
    if (!currentUser || !user) return

    const updatedUser = { ...user }
    const updatedCurrentUser = { ...currentUser }

    if (isFollowing) {
      updatedUser.followers = updatedUser.followers.filter((id) => id !== currentUser.id)
      updatedCurrentUser.following = updatedCurrentUser.following.filter((id) => id !== user.id)
    } else {
      updatedUser.followers.push(currentUser.id)
      updatedCurrentUser.following.push(user.id)
    }

    updateUser(updatedUser)
    updateUser(updatedCurrentUser)
    setUser(updatedUser)
    setIsFollowing(!isFollowing)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">User not found or profile is private</p>
            <p className="text-muted-foreground">
              This profile may not exist or you don{"'"}t have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)
  const canViewPosts = canViewUserPosts(user, viewerId)
  const canViewFollowersList = canViewFollowers(user, viewerId)
  const canViewFollowingList = canViewFollowing(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)

  return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
              <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                {currentUser && currentUser.id !== user.id && (
                  <>
                    {isFollowing ? (
                      <Button onClick={handleFollow} variant="outline">
                        Unfollow
                      </Button>
                    ) : canFollow ? (
                      <Button onClick={handleFollow} variant="default">
                        Follow
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
              {user.bio && <p className="text-foreground">{user.bio}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {user.location && canViewProfileField("location", user, viewerId) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(user.joinedAt)}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {canViewPets ? (
                  <Link href={`/profile/${user.username}/pets`}>
                    <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full">
                      <CardContent className="p-2 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <PawPrint className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {pets.length}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground">
                              {pets.length === 1 ? "Pet" : "Pets"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="opacity-50 cursor-not-allowed h-full">
                    <CardContent className="p-2 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="p-1 rounded-full bg-muted">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-muted-foreground">—</p>
                          <p className="text-[10px] font-medium text-muted-foreground">Pets</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {canViewPosts ? (
                  <Link href={`/profile/${user.username}/posts`}>
                    <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full">
                      <CardContent className="p-2 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <FileText className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {posts.length}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground">Posts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="opacity-50 cursor-not-allowed h-full">
                    <CardContent className="p-2 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="p-1 rounded-full bg-muted">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-muted-foreground">—</p>
                          <p className="text-[10px] font-medium text-muted-foreground">Posts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {canViewFollowersList ? (
                  <Link href={`/user/${user.username}/followers`}>
                    <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full">
                      <CardContent className="p-2 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Users className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {user.followers.length}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground">
                              {user.followers.length === 1 ? "Follower" : "Followers"}
                            </p>
                            <p className="text-[9px] text-muted-foreground/70">{user.followers.length} {user.followers.length === 1 ? "person" : "people"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="opacity-50 cursor-not-allowed h-full">
                    <CardContent className="p-2 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="p-1 rounded-full bg-muted">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                          <div>
                            <p className="text-base font-bold text-muted-foreground">—</p>
                            <p className="text-[10px] font-medium text-muted-foreground">Followers</p>
                            <p className="text-[9px] text-muted-foreground/70">— people</p>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {canViewFollowingList ? (
                  <Link href={`/user/${user.username}/following`}>
                    <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full">
                      <CardContent className="p-2 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Heart className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {user.following.length}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground">Following</p>
                            <p className="text-[9px] text-muted-foreground/70">{user.following.length} {user.following.length === 1 ? "person" : "people"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="opacity-50 cursor-not-allowed h-full">
                    <CardContent className="p-2 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="p-1 rounded-full bg-muted">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                          <div>
                            <p className="text-base font-bold text-muted-foreground">—</p>
                            <p className="text-[10px] font-medium text-muted-foreground">Following</p>
                            <p className="text-[9px] text-muted-foreground/70">— people</p>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pets" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="pets" className="mt-6">
          {!canViewPets ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">This user{"'"}s pets are private</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentUser && currentUser.id === user.id && (
                <div className="mb-6 flex justify-end">
                  <Link href={`/profile/${user.username}/add-pet`}>
                    <Button className="gap-2">
                      <PawPrint className="h-4 w-4" />
                      Add New Pet
                    </Button>
                  </Link>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((pet) => (
                  <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                            <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg">{pet.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {pet.breed || pet.species}
                              {pet.age && ` • ${pet.age} ${pet.age === 1 ? "year" : "years"} old`}
                            </p>
                            {pet.bio && <p className="text-sm mt-2 line-clamp-2">{pet.bio}</p>}
                            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {pet.followers.length} {pet.followers.length === 1 ? "follower" : "followers"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              {pets.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <PawPrint className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">No pets yet</p>
                    {currentUser && currentUser.id === user.id && (
                      <Link href={`/profile/${user.username}/add-pet`}>
                        <Button className="mt-4">
                          <PawPrint className="h-4 w-4 mr-2" />
                          Add Your First Pet
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          {!canViewPosts ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">This user{"'"}s posts are private</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => {
                  const pet = pets.find((p) => p.id === post.petId)
                  return (
                    <Link key={post.id} href={`/blog/${post.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        {post.coverImage && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            <img
                              src={post.coverImage || "/placeholder.svg"}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            By {pet?.name} • {formatDate(post.createdAt)}
                          </p>
                          <p className="text-sm mt-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {post.likes.length}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              {posts.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">No posts yet</CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
