"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Award, BookOpen, Edit, Sparkles, TrendingUp } from "lucide-react"
import type { User } from "@/lib/types"
import { getWikiArticles, getWikiRevisionsByArticleId } from "@/lib/storage"

interface ContributorBadgeProps {
  userId: string
  className?: string
}

interface ContributionStats {
  articlesCreated: number
  articlesEdited: number
  totalContributions: number
  topCategories: string[]
  level: "bronze" | "silver" | "gold" | "platinum"
}

function getContributionStats(userId: string): ContributionStats {
  const allArticles = getWikiArticles()
  
  // Count articles created by user
  const articlesCreated = allArticles.filter((a) => a.authorId === userId).length
  
  // Count revisions (edits) by user
  let articlesEdited = 0
  const categories = new Set<string>()
  
  allArticles.forEach((article) => {
    const revisions = getWikiRevisionsByArticleId(article.id)
    const userRevisions = revisions.filter((r) => r.authorId === userId)
    
    if (userRevisions.length > 0) {
      articlesEdited++
      if (article.category) {
        categories.add(article.category)
      }
    }
  })
  
  const totalContributions = articlesCreated + articlesEdited
  
  // Determine level
  let level: ContributionStats["level"] = "bronze"
  if (totalContributions >= 100) {
    level = "platinum"
  } else if (totalContributions >= 50) {
    level = "gold"
  } else if (totalContributions >= 20) {
    level = "silver"
  }
  
  return {
    articlesCreated,
    articlesEdited,
    totalContributions,
    topCategories: Array.from(categories).slice(0, 3),
    level,
  }
}

function getLevelConfig(level: ContributionStats["level"]) {
  const configs = {
    bronze: {
      color: "bg-amber-100 text-amber-800 border-amber-300",
      icon: BookOpen,
      label: "Contributor",
    },
    silver: {
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: Edit,
      label: "Editor",
    },
    gold: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: TrendingUp,
      label: "Expert",
    },
    platinum: {
      color: "bg-purple-100 text-purple-800 border-purple-300",
      icon: Award,
      label: "Master",
    },
  }
  return configs[level]
}

export function ContributorBadge({ userId, className }: ContributorBadgeProps) {
  const stats = React.useMemo(() => {
    return getContributionStats(userId)
  }, [userId])
  
  if (stats.totalContributions === 0) {
    return null
  }
  
  const config = getLevelConfig(stats.level)
  const Icon = config.icon
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/user/${userId}/contributions`}>
            <Badge
              variant="outline"
              className={`${config.color} ${className || ""} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{config.label} Contributor</p>
            <p className="text-xs text-muted-foreground">
              {stats.articlesCreated} articles created
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.articlesEdited} articles edited
            </p>
            {stats.topCategories.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Top categories: {stats.topCategories.join(", ")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ContributorBadgesDisplayProps {
  userId: string
  showStats?: boolean
  className?: string
}

export function ContributorBadgesDisplay({
  userId,
  showStats = false,
  className,
}: ContributorBadgesDisplayProps) {
  const stats = React.useMemo(() => {
    return getContributionStats(userId)
  }, [userId])
  
  if (stats.totalContributions === 0) {
    return null
  }
  
  const config = getLevelConfig(stats.level)
  const Icon = config.icon
  
  return (
    <div className={`space-y-3 ${className || ""}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={config.color}>
          <Icon className="h-4 w-4 mr-1" />
          {config.label} Contributor
        </Badge>
        {stats.topCategories.length > 0 && (
          <div className="flex gap-1">
            {stats.topCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {showStats && (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 rounded-md bg-muted">
            <p className="font-semibold">{stats.articlesCreated}</p>
            <p className="text-xs text-muted-foreground">Created</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted">
            <p className="font-semibold">{stats.articlesEdited}</p>
            <p className="text-xs text-muted-foreground">Edited</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted">
            <p className="font-semibold">{stats.totalContributions}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      )}
    </div>
  )
}

