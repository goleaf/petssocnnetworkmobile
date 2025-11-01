"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryTabs, type TabItem } from "@/components/ui/category-tabs"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { getBlogPosts, getPets, getUsers } from "@/lib/storage"
import { formatCommentDate } from "@/lib/utils/date"
import { stripHtml } from "@/lib/utils/strip-html"
import { useAuth } from "@/lib/auth"
import { Search, Heart, FileText, Sparkles, Camera, GraduationCap, Gamepad2, Plane, ChevronLeft, ChevronRight, Clock, TrendingUp, Plus, User, BookOpen, X, PenTool } from "lucide-react"
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
  const categories: TabItem[] = [
    { value: "all", label: "All Posts", icon: FileText, color: "text-blue-500" },
    { value: "adventure", label: "Adventure", icon: Plane, color: "text-sky-500" },
    { value: "training", label: "Training", icon: GraduationCap, color: "text-amber-500" },
    { value: "funny", label: "Funny", icon: Sparkles, color: "text-pink-500" },
    { value: "photos", label: "Photos", icon: Camera, color: "text-purple-500" },
    { value: "playtime", label: "Playtime", icon: Gamepad2, color: "text-green-500" },
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Pet Blogs</h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Stories, adventures, and updates from our furry friends</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <div className="h-9 sm:h-10 rounded-md border bg-muted animate-pulse" />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[160px] md:w-[180px] h-9 sm:h-10 rounded-md border bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full flex flex-col overflow-hidden p-0 animate-pulse">
              <div className="aspect-video w-full bg-muted" />
              <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
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

  // Combine all categories with additional tabs
  const allCategories = [
    ...categories,
    ...(isAuthenticated
      ? [
          {
            value: "my-posts",
            label: "My Posts",
            icon: User,
            color: "text-indigo-500",
          },
        ]
      : []),
  ]

  // Get current category for display
  const currentCategory = allCategories.find((cat) => cat.value === selectedCategory) || allCategories[0]

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Pet Blogs</h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Stories, adventures, and updates from our furry friends</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="search"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer hover:text-foreground text-muted-foreground transition-colors"
              type="button"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] md:w-[180px]">
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

      {/* Mobile: Category Dropdown */}
      <div className="mb-4 sm:mb-6 md:hidden">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(() => {
                const CategoryIcon = currentCategory.icon
                return (
                  <div className="flex items-center gap-2">
                    {CategoryIcon && (
                      <CategoryIcon className={`h-4 w-4 flex-shrink-0 ${currentCategory.color || "text-muted-foreground"}`} />
                    )}
                    <span className="truncate">{currentCategory.label}</span>
                  </div>
                )
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allCategories.map((category) => {
              const CategoryIcon = category.icon
              return (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {CategoryIcon && (
                      <CategoryIcon className={`h-4 w-4 flex-shrink-0 ${category.color || "text-muted-foreground"}`} />
                    )}
                    <span>{category.label}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Category Tabs */}
      <div className="hidden md:block mb-6">
        <CategoryTabs
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          items={categories}
          className="w-full"
          defaultGridCols={{ mobile: 4, tablet: 4, desktop: 7 }}
          additionalTabs={
            isAuthenticated
              ? [
                  {
                    value: "my-posts",
                    label: "My Posts",
                    icon: User,
                    color: "text-indigo-500",
                  },
                ]
              : []
          }
        >
        {categories.map((category) => {
          const { posts: paginatedPosts, totalPages, currentPage: page, totalPosts } = getPaginatedPosts(category.value)
          
          return (
            <TabsContent key={category.value} value={category.value}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
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
                <Card className="border-dashed">
                  <CardContent className="p-12 md:p-16">
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-4 md:gap-6">
                      <div className="rounded-full bg-muted p-4 flex-shrink-0">
                        <PenTool className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground opacity-60" />
                      </div>
                      <div className="space-y-2 max-w-md text-center md:text-left">
                        <h3 className="text-xl md:text-2xl font-semibold text-foreground">No posts in this category yet</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Check back later or explore other categories to discover amazing pet stories!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6">
                  <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                    Showing {(page - 1) * POSTS_PER_PAGE + 1} to {Math.min(page * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="flex-1 sm:flex-initial"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
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
                            className="w-9 sm:w-10 h-8 sm:h-9 text-xs sm:text-sm"
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
                      className="flex-1 sm:flex-initial"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
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
                          <CreateButton size="lg" className="mt-4" iconType="plus">
                            Create Your First Post
                          </CreateButton>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6">
                      <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                        Showing {(page - 1) * POSTS_PER_PAGE + 1} to {Math.min(page * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="flex-1 sm:flex-initial"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
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
                                className="w-9 sm:w-10 h-8 sm:h-9 text-xs sm:text-sm"
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
                          className="flex-1 sm:flex-initial"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>
          )}
        </CategoryTabs>
      </div>

      {/* Mobile Content - Rendered based on selectedCategory */}
      <div className="md:hidden">
        {(() => {
          const { posts: paginatedPosts, totalPages, currentPage: page, totalPosts } = getPaginatedPosts(selectedCategory)

          return (
            <>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
                        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                              <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                              <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold">{pet?.name}</p>
                              <p className="text-xs text-muted-foreground">by {author?.fullName}</p>
                            </div>
                          </div>
                          <h3 className="font-semibold text-base sm:text-lg line-clamp-2 mb-2">{post.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{stripHtml(post.content)}</p>
                          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {post.likes.length}
                              </div>
                              <span>{formatCommentDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap mt-2 sm:mt-3">
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
                <Card className="border-dashed">
                  <CardContent className="p-8 sm:p-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="rounded-full bg-muted p-4 flex-shrink-0">
                        <PenTool className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground opacity-60" />
                      </div>
                      <div className="space-y-2 max-w-md text-center">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">No posts in this category yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Check back later or explore other categories to discover amazing pet stories!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                    Showing {(page - 1) * POSTS_PER_PAGE + 1} to {Math.min(page * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="flex-1 sm:flex-initial"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
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
                            className="w-9 sm:w-10 h-8 sm:h-9 text-xs sm:text-sm"
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
                      className="flex-1 sm:flex-initial"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
