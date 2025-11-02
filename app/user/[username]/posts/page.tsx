"use client"

import { useState, useEffect, useMemo, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserByUsername, getBlogPosts, deleteBlogPost, getPets } from "@/lib/storage"
import { EditButton } from "@/components/ui/edit-button"
import { DeleteButton } from "@/components/ui/delete-button"
import {
  Search,
  Heart,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  MoreHorizontal,
  Filter,
  X,
  Lock,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { formatDate, formatCommentDate } from "@/lib/utils/date"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { canSendFollowRequest, canViewUserPosts, canViewPost } from "@/lib/utils/privacy"
import { getPrivacyNotice } from "@/lib/utils/privacy-messages"
import { PostContent } from "@/components/post/post-content"

type SortOption = "recent" | "popular" | "oldest"

export default function UserPostsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [showFilters, setShowFilters] = useState(false)
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  useEffect(() => {
    const fetchedUser = getUserByUsername(username)
    if (!fetchedUser) {
      router.push("/")
      return
    }

    setUser(fetchedUser)
    const viewerId = currentUser?.id || null

    if (canViewUserPosts(fetchedUser, viewerId)) {
      const allPosts = getBlogPosts()
        .filter((post) => post.authorId === fetchedUser.id)
        .filter((post) => canViewPost(post, fetchedUser, viewerId))
      
      setPosts(allPosts)
    } else {
      setPosts([])
    }

    setPets(getPets())
  }, [username, currentUser, router])

  // Get all unique tags from posts
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    posts.forEach((post) => {
      post.tags?.forEach((tag: string) => tags.add(tag))
      post.hashtags?.forEach((tag: string) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [posts])

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...posts]

    // Search filter - maximum search functionality
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
          post.hashtags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
          post.petId && pets.find((p) => p.id === post.petId)?.name?.toLowerCase().includes(query)
      )
    }

    // Tag filter
    if (tagFilter !== "all") {
      filtered = filtered.filter(
        (post) =>
          post.tags?.includes(tagFilter) || post.hashtags?.includes(tagFilter)
      )
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (post) => new Date(post.createdAt) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      filtered = filtered.filter(
        (post) => new Date(post.createdAt) <= new Date(dateTo)
      )
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    return filtered
  }, [posts, searchQuery, sortBy, tagFilter, dateFrom, dateTo, pets])

  // Group posts by date
  const groupedPosts = useMemo(() => {
    const groups: Record<string, any[]> = {}

    filteredAndSortedPosts.forEach((post) => {
      const date = formatDate(post.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(post)
    })

    // Sort dates in descending order
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
  }, [filteredAndSortedPosts])

  const handleDelete = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteBlogPost(postId)
      setPosts(posts.filter((p) => p.id !== postId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setTagFilter("all")
    setDateFrom("")
    setDateTo("")
    setSortBy("recent")
  }

  const hasActiveFilters = Boolean(
    searchQuery || dateFrom || dateTo || tagFilter !== "all",
  )

  if (!user) return null

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPosts = canViewUserPosts(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)
  const privacyMessage = getPrivacyNotice({
    profileUser: user,
    scope: "posts",
    viewerId,
    canRequestAccess: canFollow,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{user.fullName}'s Posts</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {canViewPosts 
                  ? `${filteredAndSortedPosts.length} ${filteredAndSortedPosts.length === 1 ? "post" : "posts"}`
                  : privacyMessage
                }
              </p>
            </div>
            {isOwnProfile && (
              <Link href="/blog/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            )}
          </div>

        {/* Search and Filters */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="shadow-md">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium">Filter by Tag</label>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tags</SelectItem>
                        {allTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium">From Date</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium">To Date</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Content */}
      {!canViewPosts ? (
        <Card className="shadow-md mt-6 sm:mt-8">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <Lock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{privacyMessage}</p>
          </CardContent>
        </Card>
      ) : groupedPosts.length === 0 ? (
        <Card className="shadow-md mt-6 sm:mt-8">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
            <p className="text-sm sm:text-base text-muted-foreground">
              {hasActiveFilters ? "No posts found matching your filters" : "No posts yet"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          {groupedPosts.map(([date, datePosts]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-3 pb-2 border-b">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold truncate">
                  {(() => {
                    const postDate = new Date(date)
                    const today = new Date()
                    const yesterday = new Date(today)
                    yesterday.setDate(yesterday.getDate() - 1)

                    if (postDate.toDateString() === today.toDateString()) {
                      return "Today"
                    } else if (postDate.toDateString() === yesterday.toDateString()) {
                      return "Yesterday"
                    } else {
                      return postDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    }
                  })()}
                </h2>
                <Badge variant="secondary" className="ml-auto text-xs sm:text-sm flex-shrink-0">
                  {datePosts.length} {datePosts.length === 1 ? "post" : "posts"}
                </Badge>
              </div>

              {/* Posts for this date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {datePosts.map((post) => {
                  const pet = pets.find((p) => p.id === post.petId)
                  const isOwner = isOwnProfile && currentUser?.id === post.authorId

                  return (
                    <Card key={post.id} className="hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:scale-[1.02] border-0 bg-card/50">
                      {post.coverImage && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={post.coverImage || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3 p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {pet && (
                              <>
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ring-2 ring-primary/20">
                                  <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                  <AvatarFallback className="text-xs sm:text-sm">{pet.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold truncate">{pet.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          {isOwner && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/blog/${post.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem onClick={() => handleDelete(post.id)} variant="destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col pt-0 p-4 sm:p-6">
                        <Link href={`/blog/${post.id}`} className="flex-1 flex flex-col">
                          <h3 className="font-bold text-base sm:text-lg md:text-xl line-clamp-2 mb-2 hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <div className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-3 flex-1 leading-relaxed">
                            <PostContent content={post.content} post={post} />
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{post.likes?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                          {(post.tags?.length > 0 || post.hashtags?.length > 0) && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {post.tags?.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {post.hashtags?.slice(0, 2).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
