"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Calendar, RefreshCw, User } from "lucide-react"
import type { WikiArticle } from "@/lib/types"
import { isStaleContent, getUserById, getCurrentUser, requestReReview } from "@/lib/storage"
import { toast } from "sonner"

interface ToastBannerProps {
  article: WikiArticle
  isLatest?: boolean
  lastReviewedDate?: string
  expertReviewerId?: string
}

export function ToastBanner({
  article,
  isLatest = false,
  lastReviewedDate,
  expertReviewerId,
}: ToastBannerProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUserId(user?.id || null)
  }, [])
  
  // Use healthData.lastReviewedDate if available, otherwise fall back to prop
  const reviewDate = article.healthData?.lastReviewedDate || lastReviewedDate
  const reviewerId = article.healthData?.expertReviewer || expertReviewerId
  
  // Check if review is stale (>12 months)
  const isStale = reviewDate ? isStaleContent(reviewDate) : false
  
  // Get reviewer information
  const reviewer = reviewerId ? getUserById(reviewerId) : null
  
  const handleRequestReReview = async () => {
    if (!currentUserId) {
      toast.error("Please log in to request a re-review")
      return
    }
    
    setIsRequesting(true)
    try {
      const result = requestReReview({
        articleId: article.id,
        requestedBy: currentUserId,
      })
      
      if (result.success) {
        toast.success("Re-review request submitted successfully")
      } else {
        toast.error(result.error || "Failed to submit re-review request")
      }
    } catch (error) {
      toast.error("An error occurred while submitting the request")
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-3 mb-6">
      {!isLatest && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Version Notice</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            <span>You are viewing the stable version of this article.</span>
            <Badge variant="outline" className="ml-auto">
              Stable
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {isLatest && (
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Latest Version</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            This is the most recent version of this article.
          </AlertDescription>
        </Alert>
      )}

      {reviewDate && (
        <Alert variant={isStale ? "destructive" : "default"}>
          <Calendar className="h-4 w-4" />
          <AlertTitle>Health Review Status</AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span>Last reviewed on</span>
              <Badge variant={isStale ? "destructive" : "secondary"} className="gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(reviewDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Badge>
              {reviewer && (
                <Badge variant={isStale ? "destructive" : "secondary"} className="gap-1">
                  <User className="h-3 w-3" />
                  {reviewer.fullName || reviewer.username || "Unknown Reviewer"}
                </Badge>
              )}
            </div>
            
            {isStale && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  ⚠️ This article has not been reviewed in over 12 months. Information may be outdated.
                </p>
                {currentUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestReReview}
                    disabled={isRequesting}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRequesting ? "animate-spin" : ""}`} />
                    {isRequesting ? "Requesting..." : "Request Re-Review"}
                  </Button>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

