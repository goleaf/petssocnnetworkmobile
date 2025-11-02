"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getWikiArticles,
  getWikiArticleById,
  getUserById,
  getDraftRevisions,
  markRevisionAsStable,
  getStableRevision,
} from "@/lib/storage"
import { canVerifyWikiRevision } from "@/lib/policy"
import { AlertTriangle, CheckCircle, Clock, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DiffViewer } from "@/components/diff-viewer"

export default function RevisionsPage() {
  const { user } = useAuth()
  const [draftRevisions, setDraftRevisions] = useState<any[]>([])
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null)
  const [selectedStableRevision, setSelectedStableRevision] = useState<any | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filters, setFilters] = useState({ category: "all" })
  const [currentPage, setCurrentPage] = useState(1)
  const [revisionSummary, setRevisionSummary] = useState("")

  const pageSize = 10

  useEffect(() => {
    loadRevisions()
  }, [filters, currentPage])

  const loadRevisions = () => {
    let drafts = getDraftRevisions()
    
    // Apply category filter
    if (filters.category !== "all") {
      const articles = getWikiArticles()
      drafts = drafts.filter(d => {
        const article = articles.find(a => a.id === d.articleId)
        return article?.category === filters.category
      })
    }

    // Sort by creation date (newest first)
    drafts = drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setDraftRevisions(drafts)
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleReview = (revision: any) => {
    setSelectedRevision(revision)
    setRevisionSummary("")
    
    // Get the article for this revision
    const article = getWikiArticleById(revision.articleId)
    setSelectedArticle(article)
    
    // Get stable revision for comparison
    const stable = getStableRevision(revision.articleId)
    setSelectedStableRevision(stable)
    
    setReviewDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedRevision || !user?.id || !selectedArticle) return
    
    setIsProcessing(true)
    
    const result = markRevisionAsStable(selectedArticle.id, selectedRevision.id, user.id)
    
    if (result.success) {
      setApproveDialogOpen(false)
      setReviewDialogOpen(false)
      loadRevisions()
      alert("Revision approved successfully!")
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
    
    setIsProcessing(false)
    setSelectedRevision(null)
    setSelectedArticle(null)
    setSelectedStableRevision(null)
  }

  const confirmApprove = () => {
    setApproveDialogOpen(true)
  }

  const getAuthorName = (authorId: string): string => {
    const author = getUserById(authorId)
    return author?.username || authorId
  }

  const canApprove = (revision: any): boolean => {
    if (!user) return false
    
    // Get the article to check category
    const article = getWikiArticleById(revision.articleId)
    
    // For health articles, need expert verification
    if (article?.category === "health") {
      return canVerifyWikiRevision(user, "health")
    }
    
    // For other categories, any logged-in user can approve
    return true
  }

  const calculateAge = (createdAt: string): number => {
    const now = new Date().getTime()
    const created = new Date(createdAt).getTime()
    return Math.floor((now - created) / (1000 * 60 * 60))
  }

  const totalPages = Math.ceil(draftRevisions.length / pageSize)
  const paginatedRevisions = draftRevisions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access revision review.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Revision Review</h1>
        <p className="text-muted-foreground">Review and approve wiki article revisions</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revisions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftRevisions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Articles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftRevisions.filter(d => {
                const article = getWikiArticleById(d.articleId)
                return article?.category === "health"
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Require expert review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Articles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftRevisions.filter(d => {
                const article = getWikiArticleById(d.articleId)
                return article?.category !== "health"
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">General review</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange({ category: value })}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="care">Care</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                  <SelectItem value="breeds">Breeds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revisions List */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Revisions</CardTitle>
          <CardDescription>
            {draftRevisions.length} revisions awaiting review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {draftRevisions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No draft revisions found</p>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedRevisions.map((revision) => {
                  const article = getWikiArticleById(revision.articleId)
                  const canUserApprove = canApprove(revision)
                  
                  return (
                    <div key={revision.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={article?.category === "health" ? "destructive" : "secondary"}>
                            {article?.category || "unknown"}
                          </Badge>
                          <span className="font-medium">{article?.title || "Unknown Article"}</span>
                          {article?.category === "health" && (
                            <Badge variant="outline">Requires Expert</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Author: @{getAuthorName(revision.authorId)}</div>
                          <div>Age: {calculateAge(revision.createdAt)} hours ago</div>
                          <div className="mt-2 line-clamp-2">
                            {revision.content.substring(0, 150)}...
                          </div>
                        </div>
                        {!canUserApprove && article?.category === "health" && (
                          <div className="text-sm text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Expert verification required
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(revision)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog with Diff Viewer */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Revision</DialogTitle>
            <DialogDescription>
              Compare draft revision with stable version
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedArticle && (
              <div>
                <Badge variant={selectedArticle.category === "health" ? "destructive" : "secondary"}>
                  {selectedArticle.category}
                </Badge>
                <h3 className="text-xl font-semibold mt-2">{selectedArticle.title}</h3>
              </div>
            )}
            
            {selectedStableRevision && selectedRevision && (
              <DiffViewer
                oldValue={selectedStableRevision.content}
                newValue={selectedRevision.content}
                leftTitle="Stable Version"
                rightTitle="Draft Revision"
                revisionSummary={revisionSummary}
                onSummaryChange={setRevisionSummary}
              />
            )}
            
            {!selectedStableRevision && selectedRevision && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No stable version exists yet. This is the first revision.</p>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedRevision.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={!canApprove(selectedRevision)}
            >
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Approval Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve and publish this revision?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

