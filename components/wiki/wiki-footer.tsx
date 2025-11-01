"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getWikiArticles } from "@/lib/storage"
import type { WikiArticle } from "@/lib/types"
import { Link2, Network } from "lucide-react"

interface WikiFooterProps {
  article: WikiArticle
  maxRelated?: number
}

interface RelatedArticle {
  article: WikiArticle
  score: number
  sharedTags: string[]
}

/**
 * Get related articles based on tag overlap
 * Uses stable deterministic sorting for identical inputs
 */
function getRelatedArticles(
  currentArticle: WikiArticle,
  allArticles: WikiArticle[],
  maxResults: number = 5
): RelatedArticle[] {
  // Filter out current article and articles without tags
  const candidateArticles = allArticles.filter(
    (a) => a.id !== currentArticle.id && a.tags && a.tags.length > 0
  )

  // Score each article based on shared tags
  const scoredArticles: RelatedArticle[] = candidateArticles.map((article) => {
    const currentTags = new Set((currentArticle.tags || []).map((t) => t.toLowerCase()))
    const articleTags = new Set((article.tags || []).map((t) => t.toLowerCase()))
    
    const sharedTags: string[] = []
    currentTags.forEach((tag) => {
      if (articleTags.has(tag)) {
        sharedTags.push(tag)
      }
    })

    // Score: Number of shared tags + bonus for category match
    let score = sharedTags.length
    if (article.category === currentArticle.category) {
      score += 0.5
    }

    // Bonus for subcategory match
    if (article.subcategory && article.subcategory === currentArticle.subcategory) {
      score += 0.5
    }

    // Bonus for species overlap
    if (article.species && currentArticle.species) {
      const sharedSpecies = article.species.filter((s) =>
        currentArticle.species?.includes(s)
      )
      score += sharedSpecies.length * 0.3
    }

    return { article, score, sharedTags }
  })

  // Filter out articles with score 0 and sort by score (descending), then by title (ascending)
  const sorted = scoredArticles
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      // Primary sort: by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Secondary sort: by title (ascending) for stable deterministic results
      return a.article.title.localeCompare(b.article.title)
    })

  return sorted.slice(0, maxResults)
}

export function WikiFooter({ article, maxRelated = 5 }: WikiFooterProps) {
  const articles = getWikiArticles()

  const relatedArticles = useMemo(() => {
    return getRelatedArticles(article, articles, maxRelated)
  }, [article, articles, maxRelated])

  // Build link graph data
  const linkGraphData = useMemo(() => {
    if (!article.tags || article.tags.length === 0) return null

    // Find all articles that share at least one tag with the current article
    const nodes = new Map<string, { id: string; title: string; tags: string[] }>()
    const links: Array<{ source: string; target: string; sharedTags: string[] }> = []

    // Add current article as center node
    nodes.set(article.id, {
      id: article.id,
      title: article.title,
      tags: article.tags,
    })

    articles.forEach((a) => {
      if (a.id === article.id || !a.tags || a.tags.length === 0) return

      const sharedTags = article.tags!.filter((tag) =>
        a.tags!.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      )

      if (sharedTags.length > 0) {
        nodes.set(a.id, {
          id: a.id,
          title: a.title,
          tags: a.tags,
        })

        links.push({
          source: article.id,
          target: a.id,
          sharedTags,
        })
      }
    })

    return { nodes: Array.from(nodes.values()), links }
  }, [article, articles])

  const hasContent = relatedArticles.length > 0 || linkGraphData

  if (!hasContent) return null

  return (
    <div className="space-y-6 mt-12 border-t pt-8">
      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <CardTitle>Related Articles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedArticles.map(({ article: related, score, sharedTags }) => (
                <Link key={related.id} href={`/wiki/${related.slug}`}>
                  <div className="group p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <Badge variant="secondary" className="shrink-0">
                        {score.toFixed(1)} match
                      </Badge>
                    </div>
                    {sharedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sharedTags.slice(0, 5).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {sharedTags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{sharedTags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 capitalize">
                      {related.category}
                      {related.subcategory && ` • ${related.subcategory}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link Graph Visualization */}
      {linkGraphData && linkGraphData.links.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <CardTitle>Article Network</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This article is connected to {linkGraphData.nodes.length - 1} other article
                {linkGraphData.nodes.length - 1 !== 1 ? "s" : ""} through shared tags.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {linkGraphData.links.slice(0, 12).map((link, idx) => {
                  const targetArticle = articles.find((a) => a.id === link.target)
                  if (!targetArticle) return null

                  return (
                    <Link key={`${link.source}-${link.target}-${idx}`} href={`/wiki/${targetArticle.slug}`}>
                      <div className="group p-3 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all cursor-pointer">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {targetArticle.title}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {link.sharedTags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {link.sharedTags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{link.sharedTags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {linkGraphData.links.length > 12 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 12 of {linkGraphData.links.length} connections
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

