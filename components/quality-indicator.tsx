"use client"

import type { ArticleQualityLevel } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface QualityIndicatorProps {
  level: ArticleQualityLevel
  score?: number
  className?: string
}

const QUALITY_CONFIG: Record<
  ArticleQualityLevel,
  { label: string; color: string; description: string }
> = {
  stub: {
    label: "Stub",
    color: "bg-gray-500",
    description: "Basic article, needs expansion",
  },
  start: {
    label: "Start",
    color: "bg-yellow-500",
    description: "Article with basic information",
  },
  b: {
    label: "B",
    color: "bg-blue-500",
    description: "Good quality article",
  },
  a: {
    label: "A",
    color: "bg-green-500",
    description: "High quality article",
  },
  featured: {
    label: "Featured",
    color: "bg-purple-500",
    description: "Featured quality article",
  },
}

export function QualityIndicator({
  level,
  score,
  className,
}: QualityIndicatorProps) {
  const config = QUALITY_CONFIG[level]

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Badge
        className={`${config.color} text-white`}
        title={config.description}
      >
        {config.label}
      </Badge>
      {score !== undefined && (
        <span className="text-sm text-gray-600" title="Quality Score">
          {score}/100
        </span>
      )}
    </div>
  )
}

