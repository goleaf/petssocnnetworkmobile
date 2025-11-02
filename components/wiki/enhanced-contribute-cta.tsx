"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Sparkles } from "lucide-react"
import type { BlogPost, WikiArticle } from "@/lib/types"
import { findRelevantWikiPages } from "@/lib/utils/wiki-matcher"

interface EnhancedContributeCTAProps {
  post: BlogPost
  className?: string
}

export function EnhancedContributeCTA({ post, className }: EnhancedContributeCTAProps) {
  const relevantPages = React.useMemo(() => {
    return findRelevantWikiPages(post)
  }, [post])
  
  if (relevantPages.length === 0) {
    return null
  }
  
  return (
    <Card className={`mt-4 border-primary/20 bg-primary/5 ${className || ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Contribute to this page</h4>
              <p className="text-sm text-muted-foreground">
                This post mentions topics that could benefit from wiki contributions. Help improve our community knowledge!
              </p>
            </div>
            
            <div className="space-y-2">
              {relevantPages.slice(0, 3).map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/wiki/${page.slug}`}
                      className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {page.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {page.category}
                      </Badge>
                      {page.views > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {page.views} views
                        </span>
                      )}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/wiki/${page.slug}?edit=true`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            
            {relevantPages.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{relevantPages.length - 3} more related pages
              </p>
            )}
            
            <Button asChild variant="default" size="sm" className="w-full">
              <Link href={`/wiki/create?relatedPost=${post.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create new wiki page
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

