"use client"

import { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPets, getBlogPosts, getUsers, getPetsByOwnerId } from "@/lib/storage"
import { Heart, MessageCircle, TrendingUp, Users, PawPrint, BookOpen, Plus } from "lucide-react"
import Link from "next/link"

export default function DashboardContent({ user }: { user: User }) {
  const [myPets, setMyPets] = useState<any[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [trendingPosts, setTrendingPosts] = useState<any[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])

  useEffect(() => {
    // Get user's pets
    const pets = getPetsByOwnerId(user.id)
    setMyPets(pets)

    // Get recent posts from followed users and pets
    const allPosts = getBlogPosts()
    const followedPosts = allPosts.filter((post) => {
      const pet = getPets().find((p) => p.id === post.petId)
      return pet && (user.following.includes(post.authorId) || pet.followers.includes(user.id))
    })
    setRecentPosts(followedPosts.slice(0, 5))

    // Get trending posts (most liked)
    const trending = [...allPosts].sort((a, b) => b.likes.length - a.likes.length).slice(0, 3)
    setTrendingPosts(trending)

    // Get suggested users (not following)
    const allUsers = getUsers()
    const suggested = allUsers.filter((u) => u.id !== user.id && !user.following.includes(u.id)).slice(0, 4)
    setSuggestedUsers(suggested)
  }, [user])

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Pets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Pets</CardTitle>
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
                    <Link key={pet.id} href={`/pet/${pet.id}`}>
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
                  <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You haven{"'"}t added any pets yet</p>
                  <Link href="/dashboard/add-pet">
                    <Button className="mt-4">Add Your First Pet</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts from Following */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
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
                              <span>{new Date(post.createdAt).toLocaleDateString("en-GB")}</span>
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
                <TrendingUp className="h-5 w-5" />
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
              <CardTitle>Suggested Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center justify-between">
                    <Link href={`/profile/${suggestedUser.username}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={suggestedUser.avatar || "/placeholder.svg"} alt={suggestedUser.fullName} />
                        <AvatarFallback>{suggestedUser.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{suggestedUser.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{suggestedUser.username}</p>
                      </div>
                    </Link>
                    <Button size="sm" variant="outline">
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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

