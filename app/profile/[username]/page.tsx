"use client"

import { use } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getUsers, getPets, getBlogPosts, getActivities, updateUser } from "@/lib/storage"
import type { Activity as UserActivity, PrivacyLevel } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { MapPin, Calendar, Users, Heart, PawPrint, FileText, Lock, Activity as ActivityIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { formatCommentDate, formatDate } from "@/lib/utils/date"
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
  canViewProfileSection,
  canViewPet,
} from "@/lib/utils/privacy"
import { getPrivacyNotice } from "@/lib/utils/privacy-messages"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

const STORAGE_KEYS_TO_WATCH = ["pet_social_users", "pet_social_pets", "pet_social_blog_posts", "pet_social_activities"]

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(() => {
    setIsLoading(true)

    const allUsers = getUsers()
    const foundUser = allUsers.find((u) => u.username === username)
    const viewerId = currentUser?.id || null

    if (!foundUser || !canViewProfile(foundUser, viewerId)) {
      setUser(null)
      setPets([])
      setPosts([])
      setActivities([])
      setIsFollowing(false)
      setIsLoading(false)
      return
    }

    setUser(foundUser)
    setIsFollowing(viewerId ? foundUser.followers.includes(viewerId) : false)

    if (canViewUserPets(foundUser, viewerId)) {
      const visiblePets = getPets()
        .filter((p) => p.ownerId === foundUser.id)
        .filter((p) => canViewPet(p, foundUser, viewerId))
      setPets(visiblePets)
    } else {
      setPets([])
    }

    if (canViewUserPosts(foundUser, viewerId)) {
      const visiblePosts = getBlogPosts()
        .filter((p) => p.authorId === foundUser.id)
        .filter((p) => canViewPost(p, foundUser, viewerId))
        .slice(0, 6)
      setPosts(visiblePosts)
    } else {
      setPosts([])
    }

    if (canViewProfileSection("activity", foundUser, viewerId)) {
      const recentActivity = getActivities()
        .filter((activity) => activity.userId === foundUser.id)
        .slice(0, 10)
      setActivities(recentActivity)
    } else {
      setActivities([])
    }

    setIsLoading(false)
  }, [username, currentUser?.id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useStorageListener(STORAGE_KEYS_TO_WATCH, loadProfile)

  useEffect(() => {
    if (currentUser && user) {
      setIsFollowing(user.followers.includes(currentUser.id))
    }
  }, [currentUser, user])

  const handleFollow = () => {
    if (!currentUser || !user) return

    const isCurrentlyFollowing = user.followers.includes(currentUser.id)

    const updatedFollowers = isCurrentlyFollowing
      ? user.followers.filter((id) => id !== currentUser.id)
      : [...new Set([...user.followers, currentUser.id])]

    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter((id) => id !== user.id)
      : [...new Set([...currentUser.following, user.id])]

    updateUser(user.id, { followers: updatedFollowers })
    updateUser(currentUser.id, { following: updatedFollowing })

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

    setUser((prev: any) => (prev ? { ...prev, followers: updatedFollowers } : prev))
    setIsFollowing(!isCurrentlyFollowing)
    loadProfile()
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
  const canViewBasics = canViewProfileSection("basics", user, viewerId)
  const canViewStatistics = canViewProfileSection("statistics", user, viewerId)
  const canViewActivityLogs = canViewProfileSection("activity", user, viewerId)

const getPrivacyMessage = (scope: "pets" | "posts" | "followers" | "following") =>
  getPrivacyNotice({
    profileUser: user,
    scope,
    viewerId,
    canRequestAccess: canFollow,
  })

  const privacyLabelMap: Record<PrivacyLevel, string> = {
    public: "Public",
    "followers-only": "Followers Only",
    private: "Private",
  }

  const describeActivity = (activity: UserActivity) => {
    const targetLabels: Record<UserActivity["targetType"], string> = {
      user: "a community member",
      pet: "a pet profile",
      post: "a post",
      wiki: "a wiki article",
    }

    switch (activity.type) {
      case "follow":
        return `Followed ${targetLabels[activity.targetType]}`
      case "like":
        return `Liked ${targetLabels[activity.targetType]}`
      case "comment":
        return `Commented on ${targetLabels[activity.targetType]}`
      case "post":
        return activity.targetType === "post"
          ? "Published a new post"
          : `Shared a new ${targetLabels[activity.targetType]}`
      default:
        return "Recent activity"
    }
  }

  const formatTargetLabel = (type: UserActivity["targetType"]) => {
    switch (type) {
      case "user":
        return "User profile"
      case "pet":
        return "Pet profile"
      case "post":
        return "Post"
      case "wiki":
        return "Wiki article"
      default:
        return "Item"
    }
  }

  return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              {canViewBasics ? (
                <>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-muted">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  {canViewBasics ? (
                    <>
                      <h1 className="text-3xl font-bold">{user.fullName}</h1>
                      <p className="text-muted-foreground">@{user.username}</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold text-foreground">Profile basics are private</h2>
                      <p className="text-sm text-muted-foreground">
                        Follow to request access to @{user.username}{"'"}s profile details.
                      </p>
                    </>
                  )}
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
              {canViewBasics && user.bio && <p className="text-foreground">{user.bio}</p>}
              {canViewBasics ? (
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
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Basic profile details are hidden by the owner's privacy settings.</span>
                </div>
              )}
              {canViewStatistics ? (
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
                      <CardContent className="p-2 text-center space-y-2">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1 rounded-full bg-muted">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-muted-foreground">—</p>
                            <p className="text-[10px] font-medium text-muted-foreground">Pets</p>
                          </div>
                        </div>
                        <p className="text-[10px] leading-tight text-muted-foreground">{getPrivacyMessage("pets")}</p>
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
                      <CardContent className="p-2 text-center space-y-2">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-1 rounded-full bg-muted">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-muted-foreground">—</p>
                            <p className="text-[10px] font-medium text-muted-foreground">Posts</p>
                          </div>
                        </div>
                        <p className="text-[10px] leading-tight text-muted-foreground">{getPrivacyMessage("posts")}</p>
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
                              <p className="text-[9px] text-muted-foreground/70">
                                {user.followers.length} {user.followers.length === 1 ? "person" : "people"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card className="opacity-50 cursor-not-allowed h-full">
                      <CardContent className="p-2 text-center space-y-2">
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
                        <p className="text-[10px] leading-tight text-muted-foreground">{getPrivacyMessage("followers")}</p>
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
                              <p className="text-[9px] text-muted-foreground/70">
                                {user.following.length} {user.following.length === 1 ? "person" : "people"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card className="opacity-50 cursor-not-allowed h-full">
                      <CardContent className="p-2 text-center space-y-2">
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
                        <p className="text-[10px] leading-tight text-muted-foreground">{getPrivacyMessage("following")}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Profile statistics are hidden by the owner's privacy settings.</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pets" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="pets" className="mt-6">
          {!canViewPets ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">{getPrivacyMessage("pets")}</p>
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
                {pets.map((pet) => {
                  const ownerPrivacyFallback = (user.privacy?.sections?.pets ?? user.privacy?.pets ?? "public") as PrivacyLevel
                  const rawPrivacy = pet.privacy
                  const visibilitySetting =
                    rawPrivacy && typeof rawPrivacy === "object" && "visibility" in rawPrivacy
                      ? (rawPrivacy.visibility as PrivacyLevel)
                      : typeof rawPrivacy === "string"
                        ? (rawPrivacy as PrivacyLevel)
                        : ownerPrivacyFallback
                  const interactionSetting =
                    rawPrivacy && typeof rawPrivacy === "object" && "interactions" in rawPrivacy
                      ? (rawPrivacy.interactions as PrivacyLevel)
                      : typeof rawPrivacy === "string"
                        ? (rawPrivacy as PrivacyLevel)
                        : ownerPrivacyFallback

                  return (
                    <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                              <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{pet.name}</h3>
                                {pet.spayedNeutered && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Fixed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {pet.breed || pet.species}
                                {pet.age && ` • ${pet.age} ${pet.age === 1 ? "year" : "years"} old`}
                              </p>
                              {pet.bio && <p className="text-sm mt-2 line-clamp-2">{pet.bio}</p>}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  Visibility: {privacyLabelMap[visibilitySetting]}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  Interactions: {privacyLabelMap[interactionSetting]}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {pet.followers.length} {pet.followers.length === 1 ? "follower" : "followers"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
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
                <p className="text-muted-foreground">{getPrivacyMessage("posts")}</p>
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
        <TabsContent value="activity" className="mt-6">
          {!canViewActivityLogs ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">Recent activity is hidden by the owner's privacy settings.</p>
              </CardContent>
            </Card>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <ActivityIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">No recent activity yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm sm:text-base">{describeActivity(activity)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatCommentDate(activity.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTargetLabel(activity.targetType)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
