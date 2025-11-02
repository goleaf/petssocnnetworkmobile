"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, BookOpen, ExternalLink, MapPin } from "lucide-react"
import type { BlogPost } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"

interface LostFoundPlaybookProps {
  post: BlogPost
  location?: {
    city?: string
    state?: string
    country?: string
  }
  className?: string
}

export function LostFoundPlaybook({ post, location, className }: LostFoundPlaybookProps) {
  const playbookArticle = React.useMemo(() => {
    const allArticles = getWikiArticles()
    
    // Find "Lost & Found" or "Lost Pet" playbook article
    const playbook = allArticles.find(
      (article) =>
        (article.title.toLowerCase().includes("lost") &&
          article.title.toLowerCase().includes("found")) ||
        article.title.toLowerCase().includes("lost pet") ||
        article.slug.includes("lost-found") ||
        article.slug.includes("lost-pet")
    )
    
    return playbook || null
  }, [])
  
  const localizedOrgArticle = React.useMemo(() => {
    if (!location) return null
    
    const allArticles = getWikiArticles()
    
    // Find articles with location-specific organizations
    const locationKey = [
      location.city,
      location.state,
      location.country,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    
    const orgArticle = allArticles.find(
      (article) =>
        article.category === "care" &&
        (article.title.toLowerCase().includes("organization") ||
          article.title.toLowerCase().includes("shelter") ||
          article.title.toLowerCase().includes("rescue")) &&
        (article.content.toLowerCase().includes(locationKey) ||
          article.tags.some((tag) => tag.toLowerCase().includes(locationKey)))
    )
    
    return orgArticle || null
  }, [location])
  
  if (!playbookArticle && !localizedOrgArticle) {
    return null
  }
  
  return (
    <Card className={`border-orange-200 bg-orange-50/50 ${className || ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Lost & Found Resources
          </CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Help
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {playbookArticle && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  Lost Pet Playbook
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Step-by-step guide for finding your lost pet
                </p>
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link href={`/wiki/${playbookArticle.slug}`}>
                    Read Playbook
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {localizedOrgArticle && location && (
          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  Local Organizations
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {location.city && `${location.city}, `}
                  {location.state && `${location.state}, `}
                  {location.country}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/wiki/${localizedOrgArticle.slug}`}>
                    View Local Resources
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/wiki?category=care&tags=lost,found">
              Browse all Lost & Found guides
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

