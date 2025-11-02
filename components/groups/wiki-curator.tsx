"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Edit, Plus, Shield, X } from "lucide-react"
import type { Group, WikiArticle } from "@/lib/types"
import { getWikiArticles, updateGroup } from "@/lib/storage"
import { useAuth } from "@/lib/auth"

interface WikiCuratorProps {
  group: Group
  className?: string
}

export function WikiCurator({ group, className }: WikiCuratorProps) {
  const { user } = useAuth()
  const [selectedArticles, setSelectedArticles] = useState<string[]>(
    group.curatedWikiIds || []
  )
  
  const isModerator = React.useMemo(() => {
    if (!user) return false
    return group.moderators?.includes(user.id) || group.creatorId === user.id
  }, [user, group])
  
  const availableArticles = React.useMemo(() => {
    const allArticles = getWikiArticles()
    
    // Filter articles relevant to group
    return allArticles.filter((article) => {
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
  }, [group])
  
  const handleToggleArticle = (articleId: string) => {
    const newSelection = selectedArticles.includes(articleId)
      ? selectedArticles.filter((id) => id !== articleId)
      : [...selectedArticles, articleId]
    
    setSelectedArticles(newSelection)
    
    // Update group
    updateGroup({
      ...group,
      curatedWikiIds: newSelection,
    })
  }
  
  if (!isModerator) {
    return null
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Curate Wiki Sections
          </CardTitle>
          <Badge variant="secondary">Moderator</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Select wiki articles to feature prominently in this group
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableArticles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No relevant wiki articles found.
            </p>
          ) : (
            availableArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedArticles.includes(article.id)}
                  onCheckedChange={() => handleToggleArticle(article.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/wiki/${article.slug}`}
                    className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                  >
                    {article.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    {article.views > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {article.views} views
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/wiki/${article.slug}?edit=true`}>
                    <Edit className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2 pt-2 border-t">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/wiki/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New Article
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <BookOpen className="h-4 w-4 mr-2" />
            {selectedArticles.length} Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

