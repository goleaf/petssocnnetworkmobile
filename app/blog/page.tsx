"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getBlogPosts, getPets, getUsers } from "@/lib/storage"
import { formatCommentDate } from "@/lib/utils/date"
import { stripHtml } from "@/lib/utils/strip-html"
import { useAuth } from "@/lib/auth"
import { Search, Heart, FileText, Sparkles, Camera, GraduationCap, Gamepad2, Plane, ChevronLeft, ChevronRight, Clock, TrendingUp, Plus, User, BookOpen } from "lucide-react"
import Link from "next/link"

const POSTS_PER_PAGE = 9

export default function BlogPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const { user, isAuthenticated } = useAuth()
  const posts = getBlogPosts()
  const pets = getPets()
  const users = getUsers()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Define categories based on common tags
  const categories = [
    { value: "all", label: "All Posts", icon: FileText },
    { value: "adventure", label: "Adventure", icon: Plane },
    { value: "training", label: "Training", icon: GraduationCap },
    { value: "funny", label: "Funny", icon: Sparkles },
    { value: "photos", label: "Photos", icon: Camera },
    { value: "playtime", label: "Playtime", icon: Gamepad2 },
  ]

  // Category mapping - maps tags to categories
  const categoryTagMap: Record<string, string[]> = {
    adventure: ["adventure", "beach", "hiking", "outdoor", "travel", "trip", "journey"],
    training: ["training", "tricks", "obedience", "learning", "teach", "lesson"],
    funny: ["funny", "cute", "silly", "hilarious", "adorable", "comedy"],
    photos: ["photo", "photography", "picture", "image", "gallery"],
    playtime: ["play", "playtime", "games", "toys", "fun", "activity"],
  }

  const getCategoryForPost = (post: typeof posts[0]): string | null => {
    const postTags = post.tags.map((tag) => tag.toLowerCase())
    
    // Check which category matches the post tags
    for (const [category, tags] of Object.entries(categoryTagMap)) {
      if (tags.some((tag) => postTags.includes(tag))) {
        return category
      }
    }
    
    return null
  }

  // Filter by search only (category is handled separately in tabs)
  const searchFilteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts

    const query = searchQuery.toLowerCase().trim()
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        post.hashtags?.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [posts, searchQuery])

  const getPostsByCategory = (category: string) => {
    let filtered = searchFilteredPosts

    // Apply category filter
    if (category === "my-posts") {
      // Filter to show only current user's posts
      filtered = filtered.filter((post) => {
        return post.authorId === user?.id
      })
    } else if (category !== "all") {
      filtered = filtered.filter((post) => {
        const postCategory = getCategoryForPost(post)
        return postCategory === category
      })
    }

    // Sort
    if (sortBy === "recent") {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (sortBy === "popular") {
      filtered = [...filtered].sort((a, b) => b.likes.length - a.likes.length)
    }

    return filtered
  }

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, selectedCategory])

  // Reset page when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const getPaginatedPosts = (category: string) => {
    const allPosts = getPostsByCategory(category)
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    const endIndex = startIndex + POSTS_PER_PAGE
    return {
      posts: allPosts.slice(startIndex, endIndex),
      totalPages,
      currentPage,
      totalPosts: allPosts.length,
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Pet Blogs</h1>
          <p className="text-muted-foreground text-lg">Stories, adventures, and updates from our furry friends</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-[180px] h-9 rounded-md border bg-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full flex flex-col overflow-hidden p-0 animate-pulse">
              <div className="aspect-video w-full bg-muted" />
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-3 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pet Blogs</h1>
        <p className="text-muted-foreground text-lg">Stories, adventures, and updates from our furry friends</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue>
              {(() => {
                const sortIcons = {
                  recent: Clock,
                  popular: TrendingUp,
                }
                const sortLabels = {
                  recent: "Most Recent",
                  popular: "Most Popular",
                }
                const Icon = sortIcons[sortBy as keyof typeof sortIcons] || Clock
                return (
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{sortLabels[sortBy as keyof typeof sortLabels] || sortBy}</span>
                  </div>
                )
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>Most Recent</span>
              </div>
            </SelectItem>
            <SelectItem value="popular">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>Most Popular</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
          {isAuthenticated && (
            <TabsTrigger value="my-posts" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Posts</span>
            </TabsTrigger>
          )}
        </TabsList>

        {categories.map((category) => {
          const { posts: paginatedPosts, totalPages, currentPage: page, totalPosts } = getPaginatedPosts(category.value)
          
          return (
            <TabsContent key={category.value} value={category.value}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedPosts.map((post) => {
          const pet = pets.find((p) => p.id === post.petId)
          const author = users.find((u) => u.id === post.authorId)
          return (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col overflow-hidden p-0">
                {post.coverImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={post.coverImage || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                      <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{pet?.name}</p>
                      <p className="text-xs text-muted-foreground">by {author?.fullName}</p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{stripHtml(post.content)}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likes.length}
                      </div>
                                  <span>{formatCommentDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
              </div>
              
              {paginatedPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No blog posts found in this category
                  </CardContent>
                </Card>
              ) : totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * POSTS_PER_PAGE + 1} to {Math.min(page * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          )
        })}

        {isAuthenticated && (
          <TabsContent value="my-posts">
            {(() => {
              const { posts: paginatedPosts, totalPages, currentPage: page, totalPosts } = getPaginatedPosts("my-posts")
              
              if (paginatedPosts.length === 0) {
                return (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-muted p-6">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold">Start Writing Your Story</h3>
                          <p className="text-muted-foreground max-w-md">
                            Share your pet&apos;s adventures, tips, and memorable moments with the community. Your first blog post is just a click away!
                          </p>
                        </div>
                        <Link href="/blog/create">
                          <Button size="lg" className="mt-4">
                            <Plus className="h-5 w-5 mr-2" />
                            Create Your First Post
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {paginatedPosts.map((post) => {
                      const pet = pets.find((p) => p.id === post.petId)
                      const author = users.find((u) => u.id === post.authorId)
                      return (
                        <Link key={post.id} href={`/blog/${post.id}`}>
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col overflow-hidden p-0">
                            {post.coverImage && (
                              <div className="aspect-video w-full overflow-hidden">
                                <img
                                  src={post.coverImage || "/placeholder.svg"}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <CardContent className="p-4 flex-1 flex flex-col">
                              <div className="flex items-center gap-2 mb-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                                  <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold">{pet?.name}</p>
                                  <p className="text-xs text-muted-foreground">by {author?.fullName}</p>
                                </div>
                              </div>
                              <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{stripHtml(post.content)}</p>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" />
                                    {post.likes.length}
                                  </div>
                                  <span>{formatCommentDate(post.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-wrap mt-3">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * POSTS_PER_PAGE + 1} to {Math.min(page * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (page <= 3) {
                              pageNum = i + 1
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = page - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
