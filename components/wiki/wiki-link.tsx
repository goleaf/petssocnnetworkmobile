"use client"

import * as React from "react"
import Link from "next/link"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { WikiArticle } from "@/lib/types"
import { formatCategoryLabel } from "@/lib/utils/categories"
import { BookOpen, ExternalLink } from "lucide-react"

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

// Helper to extract basic info from breed data
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
  
  if (article.breedData.coatType) {
    info.push(`Coat: ${article.breedData.coatType}`)
  }
  
  return info
}

// Helper to extract basic info from health data
function getHealthBasicInfo(article: WikiArticle) {
  const healthData = (article as any).healthData
  if (!healthData) return null
  
  const info: string[] = []
  
  if (healthData.urgency) {
    const urgency = healthData.urgency.charAt(0).toUpperCase() + healthData.urgency.slice(1)
    info.push(`Severity: ${urgency}`)
  }
  
  if (healthData.symptoms && healthData.symptoms.length > 0) {
    const symptomsDisplay = healthData.symptoms.length > 2 
      ? `${healthData.symptoms.slice(0, 2).join(", ")}, +${healthData.symptoms.length - 2}`
      : healthData.symptoms.join(", ")
    info.push(`Symptoms: ${symptomsDisplay}`)
  }
  
  if (healthData.onsetAge) {
    info.push(`Onset: ${healthData.onsetAge}`)
  }
  
  return info
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

  // Get breed-specific or health-specific basic info if available
  const breedInfo = getBreedBasicInfo(article)
  const healthInfo = getHealthBasicInfo(article)

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
      <HoverCardContent className="w-96 p-0" side="top" align="start">
        <div className="space-y-3">
          {/* Thumbnail */}
          {article.coverImage && (
            <div className="relative w-full h-40 overflow-hidden rounded-t-md">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="px-4 pb-4 space-y-3">
            {/* Title and Type */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-base leading-tight">{article.title}</h4>
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
            
            {/* Basic Info for Breeds/Conditions */}
            {(breedInfo || healthInfo) && (breedInfo || healthInfo)!.length > 0 && (
              <div className="flex flex-wrap gap-2 py-1">
                {(breedInfo || healthInfo)!.map((item, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {item}
                  </span>
                ))}
              </div>
            )}
            
            {/* Preview */}
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {previewText}
            </p>
            
            {/* Read More Button */}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/wiki/${article.slug}`}>
                Read more
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

