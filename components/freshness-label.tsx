"use client"

import type { FreshnessLabel } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface FreshnessLabelProps {
  label: FreshnessLabel
  className?: string
}

const FRESHNESS_CONFIG: Record<
  FreshnessLabel["reviewStatus"],
  { label: string; color: string; icon: string }
> = {
  fresh: {
    label: "Fresh",
    color: "bg-green-500",
    icon: "✅",
  },
  "review-due": {
    label: "Review Due",
    color: "bg-yellow-500",
    icon: "⏰",
  },
  stale: {
    label: "Stale",
    color: "bg-orange-500",
    icon: "⚠️",
  },
  "needs-update": {
    label: "Needs Update",
    color: "bg-red-500",
    icon: "🔴",
  },
}

export function FreshnessLabelDisplay({
  label,
  className,
}: FreshnessLabelProps) {
  const config = FRESHNESS_CONFIG[label.reviewStatus]

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <Badge className={`${config.color} text-white`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
      {label.lastExpertReviewDate && (
        <span className="text-xs text-gray-600">
          Last reviewed: {formatDate(label.lastExpertReviewDate)}
        </span>
      )}
      {label.daysSinceReview !== undefined && (
        <span className="text-xs text-gray-600">
          {label.daysSinceReview} days ago
        </span>
      )}
      {label.nextReviewDue && (
        <span className="text-xs text-gray-600">
          Next review due: {formatDate(label.nextReviewDue)}
        </span>
      )}
    </div>
  )
}

