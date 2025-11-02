"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle2, Circle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface Series {
  id: string
  title: string
  description?: string
  posts: SeriesPost[]
  authorId: string
  createdAt: string
  updatedAt: string
}

export interface SeriesPost {
  postId: string
  title: string
  slug: string
  order: number
  publishedAt: string
  isPublished: boolean
}

interface SeriesCardProps {
  series: Series
  currentPostId?: string
  className?: string
}

export function SeriesCard({ series, currentPostId, className }: SeriesCardProps) {
  const publishedPosts = series.posts.filter((p) => p.isPublished)
  const totalPosts = series.posts.length
  const currentPost = series.posts.find((p) => p.postId === currentPostId)
  const progress = totalPosts > 0 ? (publishedPosts.length / totalPosts) * 100 : 0

  const sortedPosts = [...series.posts].sort((a, b) => a.order - b.order)

  return (
    <Card className={cn("border-2", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1">{series.title}</CardTitle>
            {series.description && (
              <p className="text-sm text-muted-foreground">{series.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            Series
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {publishedPosts.length} of {totalPosts} published
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Posts in this series
          </p>
          <div className="space-y-2">
            {sortedPosts.map((post, index) => {
              const isActive = post.postId === currentPostId
              const isPublished = post.isPublished
              const Icon = isPublished ? CheckCircle2 : Circle

              return (
                <Link
                  key={post.postId}
                  href={isPublished ? `/blog/${post.postId}` : "#"}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    isActive
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : isPublished
                      ? "border-border hover:border-primary/50 hover:bg-accent"
                      : "border-border opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex-shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                  </div>
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isPublished ? "text-green-600" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      isActive && "font-semibold text-primary",
                      isPublished && !isActive && "text-foreground",
                      !isPublished && "text-muted-foreground"
                    )}
                  >
                    {post.title}
                  </span>
                  {isPublished && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

