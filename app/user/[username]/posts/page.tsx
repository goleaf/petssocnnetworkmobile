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
import { canViewUserPosts, canViewPost } from "@/lib/utils/privacy"

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
  const [tagFilter, setTagFilter] = useState<string>("")
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
    if (tagFilter) {
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
    setTagFilter("")
    setDateFrom("")
    setDateTo("")
    setSortBy("recent")
  }

  const hasActiveFilters = searchQuery || tagFilter || dateFrom || dateTo

  if (!user) return null

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPosts = canViewUserPosts(user, viewerId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{user.fullName}'s Posts</h1>
            <p className="text-muted-foreground">
              {canViewPosts 
                ? `${filteredAndSortedPosts.length} ${filteredAndSortedPosts.length === 1 ? "post" : "posts"}`
                : "Private"
              }
            </p>
          </div>
          {isOwnProfile && (
            <Link href="/blog/create">
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts by title, content, tags, hashtags, or pet name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full md:w-[180px]">
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
              className="w-full md:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Tag</label>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All tags</SelectItem>
                        {allTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
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
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">This user{"'"}s posts are private</p>
          </CardContent>
        </Card>
      ) : groupedPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No posts found matching your filters" : "No posts yet"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedPosts.map(([date, datePosts]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-3 pb-2 border-b">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">
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
                <Badge variant="secondary" className="ml-auto">
                  {datePosts.length} {datePosts.length === 1 ? "post" : "posts"}
                </Badge>
              </div>

              {/* Posts for this date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datePosts.map((post) => {
                  const pet = pets.find((p) => p.id === post.petId)
                  const isOwner = isOwnProfile && currentUser?.id === post.authorId

                  return (
                    <Card key={post.id} className="hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
                      {post.coverImage && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={post.coverImage || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {pet && (
                              <>
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                  <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{pet.name}</p>
                                  <p className="text-xs text-muted-foreground">
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
                      <CardContent className="flex-1 flex flex-col pt-0">
                        <Link href={`/blog/${post.id}`} className="flex-1 flex flex-col">
                          <h3 className="font-bold text-lg line-clamp-2 mb-2 hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {post.likes?.length || 0}
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
  )
}
