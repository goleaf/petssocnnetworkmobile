"use client"

import { useState, useEffect } from "react"
import { getOfflineReads, getCachedArticle } from "@/lib/offline-cache"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import type { OfflineRead, BlogPost, WikiArticle } from "@/lib/types"

interface LastReadArticlesProps {
  maxItems?: number
  className?: string
}

export function LastReadArticles({ maxItems = 5, className }: LastReadArticlesProps) {
  const [reads, setReads] = useState<OfflineRead[]>([])
  const [articles, setArticles] = useState<(BlogPost | WikiArticle)[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadLastRead() {
      try {
        const offlineReads = await getOfflineReads()
        const recentReads = offlineReads.slice(0, maxItems)
        setReads(recentReads)

        // Load article data for each read
        const articlePromises = recentReads.map(async (read) => {
          const article = await getCachedArticle(read.articleId, read.articleType)
          return article
        })

        const loadedArticles = (await Promise.all(articlePromises)).filter(
          (article): article is BlogPost | WikiArticle => article !== null
        )

        setArticles(loadedArticles)
      } catch (error) {
        console.error("Failed to load last read articles:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLastRead()
  }, [maxItems])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Last Read Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (articles.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Last Read Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recently read articles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Last Read Articles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {articles.map((article, index) => {
          const read = reads[index]
          const title = "title" in article ? article.title : article.title
          const isWiki = "category" in article
          const url = isWiki ? `/wiki/${article.slug}` : `/blog/${article.id}`

          return (
            <Link
              key={article.id}
              href={url}
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {isWiki ? "Wiki" : "Blog"}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(read.readAt)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

