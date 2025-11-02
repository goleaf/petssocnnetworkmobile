"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, BookOpen, ExternalLink } from "lucide-react"
import type { WikiArticle } from "@/lib/types"
import { formatCategoryLabel } from "@/lib/utils/categories"

interface WikiCardPreviewProps {
  article: WikiArticle
  compact?: boolean
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

function getBreedBasicInfo(article: WikiArticle) {
  if (!article.breedData) return null
  
  const info: string[] = []
  
  if (article.breedData.sizeClass) {
    info.push(`Size: ${article.breedData.sizeClass.charAt(0).toUpperCase() + article.breedData.sizeClass.slice(1)}`)
  }
  
  if (article.breedData.lifeExpectancyYears) {
    info.push(`Lifespan: ${article.breedData.lifeExpectancyYears} years`)
  }
  
  if (article.breedData.originCountry) {
    info.push(`Origin: ${article.breedData.originCountry}`)
  }
  
  return info
}

function getHealthBasicInfo(article: WikiArticle) {
  if (!article.healthData) return null
  
  const info: string[] = []
  
  if (article.healthData.severity) {
    info.push(`Severity: ${article.healthData.severity}`)
  }
  
  if (article.healthData.commonSymptoms) {
    info.push(`Symptoms: ${article.healthData.commonSymptoms.slice(0, 2).join(", ")}`)
  }
  
  return info
}

function getPreviewText(article: WikiArticle): string {
  // Try to get first content block with text
  if (article.blocks && article.blocks.length > 0) {
    const firstTextBlock = article.blocks.find(
      (block) => block.type === "paragraph" || block.type === "text"
    )
    if (firstTextBlock && "content" in firstTextBlock) {
      const text = String(firstTextBlock.content || "")
      return text.length > 150 ? text.substring(0, 150) + "..." : text
    }
  }
  
  // Fallback to content field
  if (article.content) {
    const text = article.content.substring(0, 150)
    return text.length === 150 ? text + "..." : text
  }
  
  return "Learn more about this topic in our wiki."
}

export function WikiCardPreview({ article, compact = false, className }: WikiCardPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const breedInfo = getBreedBasicInfo(article)
  const healthInfo = getHealthBasicInfo(article)
  const previewText = getPreviewText(article)
  
  if (compact) {
    return (
      <Card className={`${className || ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {article.coverImage && (
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link
                  href={`/wiki/${article.slug}`}
                  className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
                >
                  {article.title}
                </Link>
                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${categoryColors[article.category] || "bg-gray-500"}`}
                >
                  {formatCategoryLabel(article.category)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {previewText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={`${className || ""}`}>
      {article.coverImage && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
          <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
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
      </CardHeader>
      <CardContent className="space-y-3">
        {(breedInfo || healthInfo) && (breedInfo || healthInfo)!.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(breedInfo || healthInfo)!.map((item, idx) => (
              <span key={idx} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {item}
              </span>
            ))}
          </div>
        )}
        
        <div className="space-y-2">
          <p className={`text-sm text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
            {previewText}
          </p>
          
          {previewText.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-center"
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
        
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/wiki/${article.slug}`}>
            Read full article
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

