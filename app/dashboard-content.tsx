"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { Badge } from "@/components/ui/badge"
import { getPets, getBlogPosts, getUsers, getPetsByOwnerId } from "@/lib/storage"
import { Heart, MessageCircle, TrendingUp, Users, PawPrint, BookOpen, Plus, UserPlus, CalendarClock } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { getFriendSuggestions, type FriendSuggestion } from "@/lib/friend-suggestions"
import { canViewPost } from "@/lib/utils/privacy"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import { CompactStatBlock } from "@/components/profile-stats"

const STORAGE_KEYS_TO_WATCH = ["pet_social_blog_posts", "pet_social_users", "pet_social_pets"]

export default function DashboardContent({ user }: { user: User }) {
  const [myPets, setMyPets] = useState<any[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [trendingPosts, setTrendingPosts] = useState<any[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<FriendSuggestion[]>([])

  const refreshData = useCallback(() => {
    const ownedPets = getPetsByOwnerId(user.id)
    setMyPets(ownedPets)

    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    const allPets = getPets()
    const viewerId = user.id

    const followedPosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false

      const pet = allPets.find((candidatePet) => candidatePet.id === post.petId)
      const isFollowingUser = user.following?.includes(post.authorId) ?? false
      const isFollowingPet = pet?.followers?.includes(user.id) ?? false

      if (!isFollowingUser && !isFollowingPet) return false

      return canViewPost(post, author, viewerId)
    })
    setRecentPosts(followedPosts.slice(0, 5))

    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      return canViewPost(post, author, viewerId)
    })

    const trending = [...visiblePosts].sort((a, b) => {
      const aLikes = a.reactions
        ? Object.values(a.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : a.likes.length
      const bLikes = b.reactions
        ? Object.values(b.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : b.likes.length
      return bLikes - aLikes
    })
    setTrendingPosts(trending.slice(0, 3))

    const suggestions = getFriendSuggestions(user, { limit: 4 })
    setSuggestedUsers(suggestions)
  }, [user])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useStorageListener(STORAGE_KEYS_TO_WATCH, refreshData)

  const stats = [
    {
      title: "My Pets",
      value: myPets.length,
      icon: PawPrint,
      color: "text-blue-500",
    },
    {
      title: "Following",
      value: user.following.length,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Followers",
      value: user.followers.length,
      icon: Heart,
      color: "text-red-500",
    },
    {
      title: "Total Posts",
      value: getBlogPosts().filter((p) => p.authorId === user.id).length,
      icon: BookOpen,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user.fullName}!</h1>
        <p className="text-muted-foreground">Here{"'"}s what{"'"}s happening in your pet community</p>
      </div>

      {/* Prominent Add Pet CTA */}
      <div className="mb-6">
        <Link href="/dashboard/add-pet">
          <CreateButton iconType="paw" size="lg" className="w-full sm:w-auto px-6 py-6 text-base">
            Add Pet
          </CreateButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-8">
        <CompactStatBlock
          label="My Pets"
          value={stats.find((s) => s.title === "My Pets")?.value || 0}
          icon={PawPrint}
          href="/dashboard/add-pet"
        />
        <CompactStatBlock
          label="Following"
          value={stats.find((s) => s.title === "Following")?.value || 0}
          icon={Users}
          href={`/user/${user.username}/following`}
        />
        <CompactStatBlock
          label="Followers"
          value={stats.find((s) => s.title === "Followers")?.value || 0}
          icon={Heart}
          href={`/user/${user.username}/followers`}
        />
        <CompactStatBlock
          label="Total Posts"
          value={stats.find((s) => s.title === "Total Posts")?.value || 0}
          icon={BookOpen}
          href="/blog"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Pets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <PawPrint className="h-4 w-4 text-blue-500" />
                </div>
                My Pets
              </CardTitle>
              <Link href="/dashboard/add-pet">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pet
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myPets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPets.map((pet) => (
                    <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                          <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{pet.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{pet.breed || pet.species}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          {pet.followers.length}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <img src="/man-and-cat.png" alt="Add your first pet" className="h-32 w-auto mx-auto mb-4 rounded-md" />
                  <p className="text-base text-foreground font-medium">Add your first furry friend!</p>
                  <p className="text-sm mt-1">Share your pet's profile with the community.</p>
                  <Link href="/dashboard/add-pet">
                    <CreateButton iconType="paw" size="lg" className="mt-4 px-6 py-6 text-base">
                      Add Pet
                    </CreateButton>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts from Following */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </div>
                Recent Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => {
                    const pet = getPets().find((p) => p.id === post.petId)
                    const author = getUsers().find((u) => u.id === post.authorId)
                    return (
                      <Link key={post.id} href={`/blog/${post.id}`}>
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                            <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{pet?.name}</p>
                              <span className="text-muted-foreground text-xs">•</span>
                              <p className="text-muted-foreground text-xs">{author?.fullName}</p>
                            </div>
                            <p className="font-medium line-clamp-1">{post.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.likes.length}
                              </div>
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent posts from accounts you follow</p>
                  <p className="text-sm mt-2">Start following users and pets to see their posts here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
                Trending Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingPosts.map((post) => {
                  const pet = getPets().find((p) => p.id === post.petId)
                  return (
                    <Link key={post.id} href={`/blog/${post.id}`}>
                      <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        {post.coverImage && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={post.coverImage || "/placeholder.svg"}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold line-clamp-2">{post.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">By {pet?.name}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 fill-current text-red-500" />
                              {post.likes.length} likes
                            </div>
                            <div className="flex gap-1">
                              {post.tags.slice(0, 2).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                Suggested Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestedUsers.length > 0 ? (
                <div className="space-y-4">
                  {suggestedUsers.map((suggestion) => (
                    <div key={suggestion.user.id} className="flex items-center justify-between gap-3">
                      <Link href={`/profile/${suggestion.user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={suggestion.user.avatar || "/placeholder.svg"} alt={suggestion.user.fullName} />
                          <AvatarFallback>{suggestion.user.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{suggestion.user.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">@{suggestion.user.username}</p>
                          {suggestion.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {suggestion.reasons.slice(0, 2).map((reason) => (
                                <Badge
                                  key={`${suggestion.user.id}-${reason}`}
                                  variant="secondary"
                                  className="text-[11px] font-normal"
                                >
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No suggestions available</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                </div>
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/schedule">
                <Button variant="ghost" className="w-full justify-start">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Schedule Posts
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse All Blogs
                </Button>
              </Link>
              <Link href="/wiki">
                <Button variant="ghost" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Pet Care Wiki
                </Button>
              </Link>
              <Link href={`/profile/${user.username}`}>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
