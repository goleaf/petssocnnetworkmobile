"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Filter,
  Eye,
  BookOpen,
  Star,
  Send,
  Archive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  getBlogPosts,
  getUsers,
  getPets,
  getWikiArticles,
  updateBlogPost,
} from "@/lib/storage"
import type { BlogPost, BlogPostQueueStatus, WikiArticle } from "@/lib/types"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

const STORAGE_KEYS_TO_WATCH = ["pet_social_blog_posts", "pet_social_users", "pet_social_pets"]

type QueueTab = "draft" | "review" | "scheduled" | "published"

export default function BlogQueuePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<QueueTab>("draft")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"review" | "schedule" | "publish" | "reject" | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [featureOnHomepage, setFeatureOnHomepage] = useState(false)

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([])

  const refreshData = useCallback(() => {
    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    const allPets = getPets()
    const allWiki = getWikiArticles()
    
    setPosts(allPosts)
    setUsers(allUsers)
    setPets(allPets)
    setWikiArticles(allWiki)
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useStorageListener(STORAGE_KEYS_TO_WATCH, refreshData)

  const getPostsByStatus = useCallback((status: BlogPostQueueStatus | "all"): BlogPost[] => {
    let filtered = posts

    if (status !== "all") {
      filtered = filtered.filter((post) => {
        const postStatus = post.queueStatus || (post.isDraft ? "draft" : "published")
        return postStatus === status
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [posts, searchQuery])

  const draftPosts = useMemo(() => getPostsByStatus("draft"), [getPostsByStatus])
  const reviewPosts = useMemo(() => getPostsByStatus("review"), [getPostsByStatus])
  const scheduledPosts = useMemo(() => getPostsByStatus("scheduled"), [getPostsByStatus])
  const publishedPosts = useMemo(() => getPostsByStatus("published"), [getPostsByStatus])

  const handleAction = (
    post: BlogPost,
    action: "review" | "schedule" | "publish" | "reject"
  ) => {
    setSelectedPost(post)
    setActionType(action)
    setReviewNotes("")
    setFeatureOnHomepage(post.featuredOnHomepage || false)
    
    if (action === "schedule" && post.scheduledAt) {
      const date = new Date(post.scheduledAt)
      setScheduleDate(date.toISOString().split("T")[0])
      setScheduleTime(date.toTimeString().slice(0, 5))
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduleDate(tomorrow.toISOString().split("T")[0])
      setScheduleTime("09:00")
    }
    
    setActionDialogOpen(true)
  }

  const executeAction = () => {
    if (!selectedPost || !actionType || !user) return

    const updatedPost: BlogPost = {
      ...selectedPost,
      updatedAt: new Date().toISOString(),
    }

    switch (actionType) {
      case "review":
        updatedPost.queueStatus = "review"
        break
      case "schedule":
        if (scheduleDate && scheduleTime) {
          const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`)
          updatedPost.queueStatus = "scheduled"
          updatedPost.scheduledAt = scheduledDateTime.toISOString()
          updatedPost.reviewedBy = user.id
          updatedPost.reviewedAt = new Date().toISOString()
          updatedPost.reviewNotes = reviewNotes || undefined
          updatedPost.featuredOnHomepage = featureOnHomepage
        }
        break
      case "publish":
        updatedPost.queueStatus = "published"
        updatedPost.scheduledAt = new Date().toISOString()
        updatedPost.reviewedBy = user.id
        updatedPost.reviewedAt = new Date().toISOString()
        updatedPost.reviewNotes = reviewNotes || undefined
        updatedPost.featuredOnHomepage = featureOnHomepage
        break
      case "reject":
        updatedPost.queueStatus = "draft"
        updatedPost.reviewedBy = user.id
        updatedPost.reviewedAt = new Date().toISOString()
        updatedPost.reviewNotes = reviewNotes || undefined
        break
    }

    updateBlogPost(updatedPost)
    setActionDialogOpen(false)
    setSelectedPost(null)
    refreshData()
  }

  const getStatusBadge = (status: BlogPostQueueStatus) => {
    const variants: Record<BlogPostQueueStatus, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "outline",
      review: "secondary",
      scheduled: "default",
      published: "default",
    }
    const labels: Record<BlogPostQueueStatus, string> = {
      draft: "Draft",
      review: "In Review",
      scheduled: "Scheduled",
      published: "Published",
    }
    const icons: Record<BlogPostQueueStatus, any> = {
      draft: FileText,
      review: Clock,
      scheduled: Calendar,
      published: CheckCircle,
    }
    const Icon = icons[status]
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {labels[status]}
      </Badge>
    )
  }

  const renderPostCard = (post: BlogPost) => {
    const author = users.find((u) => u.id === post.authorId)
    const pet = pets.find((p) => p.id === post.petId)
    const status = post.queueStatus || (post.isDraft ? "draft" : "published")
    const relatedWikis = post.relatedWikiIds
      ? wikiArticles.filter((wiki) => post.relatedWikiIds?.includes(wiki.id))
      : []

    return (
      <Card key={post.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
                {getStatusBadge(status)}
                {post.featuredOnHomepage && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <span>By {author?.fullName || "Unknown"}</span>
                <span>•</span>
                <span>{pet?.name || "Unknown Pet"}</span>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.scheduledAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Scheduled: {formatDate(post.scheduledAt)}</span>
                </div>
              )}
              {relatedWikis.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {relatedWikis.map((wiki) => (
                      <Link key={wiki.id} href={`/wiki/${wiki.slug}`}>
                        <Badge variant="outline" className="text-xs">
                          {wiki.title}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPost(post)
                setPreviewDialogOpen(true)
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            {status === "draft" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAction(post, "review")}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {status === "review" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAction(post, "schedule")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAction(post, "publish")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(post, "reject")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {status === "scheduled" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAction(post, "publish")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTabContent = (status: QueueTab) => {
    let postsToShow: BlogPost[] = []
    switch (status) {
      case "draft":
        postsToShow = draftPosts
        break
      case "review":
        postsToShow = reviewPosts
        break
      case "scheduled":
        postsToShow = scheduledPosts
        break
      case "published":
        postsToShow = publishedPosts
        break
    }

    if (postsToShow.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No posts in {status === "draft" ? "drafts" : status === "review" ? "review" : status === "scheduled" ? "scheduled" : "published"} yet
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {postsToShow.map((post) => renderPostCard(post))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Blog Queue</h1>
        <p className="text-muted-foreground">Manage blog posts through the draft → review → schedule workflow</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QueueTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="draft">
            <FileText className="h-4 w-4 mr-2" />
            Drafts ({draftPosts.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            <Clock className="h-4 w-4 mr-2" />
            In Review ({reviewPosts.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled ({scheduledPosts.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            <CheckCircle className="h-4 w-4 mr-2" />
            Published ({publishedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draft" className="mt-6">
          {renderTabContent("draft")}
        </TabsContent>
        <TabsContent value="review" className="mt-6">
          {renderTabContent("review")}
        </TabsContent>
        <TabsContent value="scheduled" className="mt-6">
          {renderTabContent("scheduled")}
        </TabsContent>
        <TabsContent value="published" className="mt-6">
          {renderTabContent("published")}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Preview of blog post content
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              {selectedPost.relatedWikiIds && selectedPost.relatedWikiIds.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Related Wiki Articles:</h4>
                  <div className="flex flex-wrap gap-2">
                    {wikiArticles
                      .filter((wiki) => selectedPost.relatedWikiIds?.includes(wiki.id))
                      .map((wiki) => (
                        <Link key={wiki.id} href={`/wiki/${wiki.slug}`}>
                          <Badge variant="outline">{wiki.title}</Badge>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "review" && "Submit for Review"}
              {actionType === "schedule" && "Schedule Post"}
              {actionType === "publish" && "Publish Post"}
              {actionType === "reject" && "Reject Post"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "review" && "Submit this post for admin review"}
              {actionType === "schedule" && "Schedule this post for future publication"}
              {actionType === "publish" && "Publish this post immediately"}
              {actionType === "reject" && "Reject this post and send it back to draft"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(actionType === "schedule" || actionType === "publish") && (
              <>
                {actionType === "schedule" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-date">Date</Label>
                      <Input
                        id="schedule-date"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule-time">Time</Label>
                      <Input
                        id="schedule-time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="review-notes">Review Notes (optional)</Label>
                  <Textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this post..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="feature-homepage"
                    checked={featureOnHomepage}
                    onChange={(e) => setFeatureOnHomepage(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="feature-homepage" className="cursor-pointer">
                    Feature on homepage
                  </Label>
                </div>
              </>
            )}
            {(actionType === "reject" || actionType === "review") && (
              <div className="space-y-2">
                <Label htmlFor="review-notes">Notes (optional)</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={
                (actionType === "schedule" && (!scheduleDate || !scheduleTime)) ||
                !actionType
              }
            >
              {actionType === "review" && "Submit"}
              {actionType === "schedule" && "Schedule"}
              {actionType === "publish" && "Publish"}
              {actionType === "reject" && "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
