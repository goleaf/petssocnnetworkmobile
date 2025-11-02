"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink, TrendingUp } from "lucide-react"
import type { Group, WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"
import { WikiCardPreview } from "@/components/wiki/wiki-card-preview"

interface WikiSectionDisplayProps {
  group: Group
  className?: string
}

export function WikiSectionDisplay({ group, className }: WikiSectionDisplayProps) {
  const topWikiSections = React.useMemo(() => {
    const allArticles = getWikiArticles()
    
    // Filter articles by group category/topic
    let relevantArticles = allArticles
    
    // Match by group category
    if (group.categoryId) {
      // You may need to map categoryId to wiki categories
      // For now, we'll use a simple matching approach
      relevantArticles = allArticles.filter((article) => {
        // Match by group type/category
        if (group.type === "breed" && article.type === "breed") {
          return true
        }
        if (group.type === "health" && article.category === "health") {
          return true
        }
        if (group.type === "care" && article.category === "care") {
          return true
        }
        return false
      })
    }
    
    // Sort by views and likes
    const sorted = relevantArticles.sort((a, b) => {
      const aScore = (a.views || 0) + a.likes.length
      const bScore = (b.views || 0) + b.likes.length
      return bScore - aScore
    })
    
    return sorted.slice(0, 6) // Top 6 sections
  }, [group])
  
  if (topWikiSections.length === 0) {
    return null
  }
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Top Wiki Sections</h3>
        </div>
        <Badge variant="secondary">
          <TrendingUp className="h-3 w-3 mr-1" />
          Popular
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topWikiSections.map((article) => (
          <WikiCardPreview
            key={article.id}
            article={article}
            compact
            className="h-full"
          />
        ))}
      </div>
      
      <Button asChild variant="outline" className="w-full mt-4">
        <Link href={`/wiki?group=${group.id}`}>
          View all wiki sections for this group
          <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

