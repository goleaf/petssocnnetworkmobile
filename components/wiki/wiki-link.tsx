"use client"

import * as React from "react"
import Link from "next/link"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import type { WikiArticle } from "@/lib/types"
import { formatCategoryLabel } from "@/lib/utils/categories"
import { BookOpen } from "lucide-react"

interface WikiLinkProps {
  article: WikiArticle
  children: React.ReactNode
  className?: string
}

const categoryColors: Record<WikiArticle["category"], string> = {
  care: "bg-blue-500",
  health: "bg-red-500",
  training: "bg-purple-500",
  nutrition: "bg-green-500",
  behavior: "bg-orange-500",
  breeds: "bg-pink-500",
}

export function WikiLink({ article, children, className }: WikiLinkProps) {
  // Get a preview snippet from the content (first 150 characters)
  const previewText = article.content
    .replace(/#{1,6}\s+/g, "") // Remove markdown headers
    .replace(/\*\*/g, "") // Remove bold markers
    .replace(/\*/g, "") // Remove italic markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links, keep text
    .trim()
    .substring(0, 150)
    .replace(/\s+\S*$/, "") // Remove partial last word
    + (article.content.length > 150 ? "..." : "")

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          href={`/wiki/${article.slug}`}
          className={`text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors ${className || ""}`}
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" side="top" align="start">
        <div className="space-y-3">
          {/* Thumbnail */}
          {article.coverImage && (
            <div className="relative w-full h-32 overflow-hidden rounded-t-md">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="px-4 pb-4 space-y-2">
            {/* Title and Type */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm leading-tight line-clamp-2">{article.title}</h4>
                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`text-xs ${categoryColors[article.category] || "bg-gray-500"}`}
                >
                  {formatCategoryLabel(article.category)}
                </Badge>
                {article.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {article.subcategory}
                  </Badge>
                )}
                {article.species && article.species.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {article.species.join(", ")}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Preview */}
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
              {previewText}
            </p>
            
            {/* View count */}
            <div className="text-xs text-muted-foreground pt-1 border-t">
              {article.views} {article.views === 1 ? "view" : "views"}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

