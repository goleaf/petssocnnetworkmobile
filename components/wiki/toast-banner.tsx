import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, Calendar } from "lucide-react"
import type { WikiArticle } from "@/lib/types"

interface ToastBannerProps {
  article: WikiArticle
  isLatest?: boolean
  lastReviewedDate?: string
}

export function ToastBanner({
  article,
  isLatest = false,
  lastReviewedDate,
}: ToastBannerProps) {
  const daysSinceUpdate = lastReviewedDate
    ? Math.floor(
        (Date.now() - new Date(lastReviewedDate).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null
  const isStale = daysSinceUpdate !== null && daysSinceUpdate > 365

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

      {lastReviewedDate && (
        <Alert variant={isStale ? "destructive" : "default"}>
          <Calendar className="h-4 w-4" />
          <AlertTitle>Health Review Status</AlertTitle>
          <AlertDescription>
            Last reviewed on{" "}
            {new Date(lastReviewedDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {isStale && (
              <span className="block mt-1 text-xs">
                ⚠️ This article has not been reviewed in over a year. Information may be outdated.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

