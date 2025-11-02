"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink, Calendar } from "lucide-react"
import type { WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"
import { WikiCardPreview } from "@/components/wiki/wiki-card-preview"

interface EventWikiEmbedProps {
  eventType: string
  eventTags?: string[]
  className?: string
}

export function EventWikiEmbed({ eventType, eventTags = [], className }: EventWikiEmbedProps) {
  const relevantWikiSections = React.useMemo(() => {
    const allArticles = getWikiArticles()
    const relevant: WikiArticle[] = []
    
    // Match by event type
    const typeMatches: Record<string, string[]> = {
      vaccination: ["health", "care"],
      health_check: ["health", "care"],
      training: ["training", "behavior"],
      adoption: ["care", "breeds"],
      meetup: ["care", "training"],
      workshop: ["care", "training", "health"],
    }
    
    const categories = typeMatches[eventType.toLowerCase()] || ["care"]
    
    // Find articles matching categories
    categories.forEach((category) => {
      const matching = allArticles.filter(
        (article) =>
          article.category === category ||
          article.tags.some((tag) =>
            eventTags.some((et) => tag.toLowerCase().includes(et.toLowerCase()))
          )
      )
      matching.forEach((article) => {
        if (!relevant.find((r) => r.id === article.id)) {
          relevant.push(article)
        }
      })
    })
    
    // Special case: vaccination events → health/vaccine articles
    if (eventType.toLowerCase().includes("vaccin")) {
      const vaccineArticles = allArticles.filter(
        (article) =>
          article.category === "health" &&
          (article.title.toLowerCase().includes("vaccin") ||
            article.tags.some((tag) => tag.toLowerCase().includes("vaccin")))
      )
      vaccineArticles.forEach((article) => {
        if (!relevant.find((r) => r.id === article.id)) {
          relevant.unshift(article) // Prioritize vaccine articles
        }
      })
    }
    
    return relevant.slice(0, 3) // Top 3 relevant sections
  }, [eventType, eventTags])
  
  if (relevantWikiSections.length === 0) {
    return null
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Related Information
          </CardTitle>
          <Badge variant="secondary">Wiki</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Helpful resources related to this event
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {relevantWikiSections.map((article) => (
          <WikiCardPreview
            key={article.id}
            article={article}
            compact
          />
        ))}
        
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/wiki?related=${eventType}`}>
            <BookOpen className="h-4 w-4 mr-2" />
            Browse more related guides
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

