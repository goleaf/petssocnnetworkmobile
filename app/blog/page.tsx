"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { getBlogPosts, getPets, getUsers } from "@/lib/storage"
import { formatCommentDate } from "@/lib/utils/date"
import { stripHtml } from "@/lib/utils/strip-html"
import { slugifyCategory, formatCategoryLabel } from "@/lib/utils/categories"
import { useAuth } from "@/lib/auth"
import { Search, Heart, FileText, Sparkles, Camera, GraduationCap, Gamepad2, Plane, ChevronLeft, ChevronRight, Clock, TrendingUp, Plus, User, BookOpen, Tag } from "lucide-react"
import Link from "next/link"
import { canViewPost } from "@/lib/utils/privacy"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import type { BlogPost, Pet, User as UserType } from "@/lib/types"
import { PostContent } from "@/components/post/post-content"

const POSTS_PER_PAGE = 9
const STORAGE_KEYS_TO_WATCH = ["pet_social_blog_posts", "pet_social_users", "pet_social_pets"]

const CATEGORY_ICON_MAP: Record<string, any> = {
  adventure: Plane,
  training: GraduationCap,
  funny: Sparkles,
  photos: Camera,
  playtime: Gamepad2,
  care: Heart,
  favorites: Heart,
}

function getCategoryIcon(slug: string) {
  return CATEGORY_ICON_MAP[slug] || Tag
}

export default function BlogPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const { user, isAuthenticated } = useAuth()
  const [visiblePosts, setVisiblePosts] = useState<BlogPost[]>([])
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [allUsers, setAllUsers] = useState<UserType[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = useMemo(() => {
    const categoryMap = new Map<string, { label: string; count: number }>()

    visiblePosts.forEach((post) => {
      const postCategories = Array.isArray(post.categories) ? post.categories : []
      postCategories.forEach((category) => {
        const slug = slugifyCategory(category)
        if (!categoryMap.has(slug)) {
          categoryMap.set(slug, { label: formatCategoryLabel(category), count: 1 })
        } else {
          categoryMap.get(slug)!.count += 1
        }
      })
    })

    const dynamicCategories = Array.from(categoryMap.entries())
      .map(([value, data]) => ({
        value,
        label: data.label,
        icon: getCategoryIcon(value),
        count: data.count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const result = [
      { value: "all", label: "All Posts", icon: FileText, count: visiblePosts.length },
      ...dynamicCategories,
    ]

    if (isAuthenticated && user) {
      const myPostsCount = visiblePosts.filter((post) => post.authorId === user.id).length
      result.push({ value: "my-posts", label: "My Posts", icon: User, count: myPostsCount })
    }

    return result
  }, [visiblePosts, isAuthenticated, user])

  useEffect(() => {
    if (!categories.some((category) => category.value === selectedCategory)) {
      setSelectedCategory("all")
    }
  }, [categories, selectedCategory])

  const refreshData = useCallback(() => {
    const rawPosts = getBlogPosts()
    const petsData = getPets()
    const usersData = getUsers()
    const viewerId = user?.id || null

    const filteredPosts = rawPosts.filter((post) => {
      const author = usersData.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      return canViewPost(post, author, viewerId)
    })

    setVisiblePosts(filteredPosts)
    setAllPets(petsData)
    setAllUsers(usersData)
  }, [user?.id])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useStorageListener(STORAGE_KEYS_TO_WATCH, refreshData)

  // Filter by search only (category is handled separately in tabs)
  const searchFilteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return visiblePosts

    const query = searchQuery.toLowerCase().trim()
    return visiblePosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        (Array.isArray(post.tags) && post.tags.some((tag) => tag.toLowerCase().includes(query))) ||
        post.hashtags?.some((tag) => tag.toLowerCase().includes(query)) ||
        post.categories?.some((category) => category.toLowerCase().includes(query))
    )
  }, [visiblePosts, searchQuery])

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
        const postCategories = Array.isArray(post.categories) ? post.categories : []
        return postCategories.some((postCategory) => slugifyCategory(postCategory) === category)
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
  useEffect(() => {
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

  const renderPostCard = (post: BlogPost) => {
    const pet = allPets.find((candidate) => candidate.id === post.petId)
    const author = allUsers.find((candidate) => candidate.id === post.authorId)
    const previewImage = post.coverImage || post.media?.images?.[0]
    const postCategories = Array.isArray(post.categories) ? post.categories : []

    return (
      <Link key={post.id} href={`/blog/${post.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col overflow-hidden p-0">
          {previewImage && (
            <div className="aspect-video w-full overflow-hidden">
              <img src={previewImage} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                <AvatarFallback>{pet?.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{pet?.name}</p>
                <p className="text-xs text-muted-foreground">by {author?.fullName}</p>
              </div>
            </div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
            <div className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
              <PostContent content={post.content} post={post} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {post.likes.length}
                </div>
                <span>{formatCommentDate(post.createdAt)}</span>
              </div>
            </div>
            {postCategories.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-3">
                {postCategories.slice(0, 3).map((category) => {
                  const slug = slugifyCategory(category)
                  const Icon = getCategoryIcon(slug)
                  return (
                    <Badge key={`${post.id}-${slug}`} variant="outline" className="text-xs flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {formatCategoryLabel(category)}
                    </Badge>
                  )
                })}
              </div>
            )}
            {post.tags?.length ? (
              <div className={`flex gap-1 flex-wrap ${postCategories.length > 0 ? "mt-1" : "mt-3"}`}>
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={`${post.id}-tag-${tag}`} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Link>
    )
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
        <TabsList className="flex w-full flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              {typeof category.count === "number" && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {category.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const { posts: paginatedPosts, totalPages, currentPage: page, totalPosts } = getPaginatedPosts(category.value)
          const isMyPosts = category.value === "my-posts"

          if (isMyPosts && paginatedPosts.length === 0) {
            return (
              <TabsContent key={category.value} value={category.value}>
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
              </TabsContent>
            )
          }

          if (paginatedPosts.length === 0) {
            return (
              <TabsContent key={category.value} value={category.value}>
                <Card>
                  <CardContent className="p-12 text-center space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <div className="space-y-2">
                      <p className="text-muted-foreground font-medium">No posts in this category yet</p>
                      <p className="text-sm text-muted-foreground/80">Check back later or browse other categories</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          }

          return (
            <TabsContent key={category.value} value={category.value}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedPosts.map((post) => renderPostCard(post))}
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
            </TabsContent>
          )
        })}
      </Tabs>

    </div>
  )
}
