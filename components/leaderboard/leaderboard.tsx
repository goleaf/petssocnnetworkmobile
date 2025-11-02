"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import type { User } from "@/lib/types"
import { getUsers, getWikiArticles, getWikiRevisionsByArticleId } from "@/lib/storage"

interface LeaderboardEntry {
  userId: string
  user: User
  score: number
  articlesCreated: number
  articlesEdited: number
  rank: number
}

interface LeaderboardProps {
  period?: "week" | "month" | "all-time"
  limit?: number
  className?: string
}

function calculateContributorScore(userId: string, period?: "week" | "month" | "all-time"): number {
  const allArticles = getWikiArticles()
  
  // Get time filter
  const now = new Date()
  let cutoffDate: Date | null = null
  
  if (period === "week") {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === "month") {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  let score = 0
  
  // Articles created (10 points each)
  const articlesCreated = allArticles.filter((article) => {
    if (article.authorId !== userId) return false
    if (cutoffDate && new Date(article.createdAt) < cutoffDate) return false
    return true
  })
  score += articlesCreated.length * 10
  
  // Articles edited (5 points per edit)
  allArticles.forEach((article) => {
    const revisions = getWikiRevisionsByArticleId(article.id)
    const userRevisions = revisions.filter((rev) => {
      if (rev.authorId !== userId) return false
      if (cutoffDate && new Date(rev.createdAt) < cutoffDate) return false
      return true
    })
    score += userRevisions.length * 5
  })
  
  // Bonus points for quality (if article has high views/likes)
  articlesCreated.forEach((article) => {
    const popularity = (article.views || 0) + article.likes.length
    if (popularity > 100) score += 5
    if (popularity > 500) score += 10
    if (popularity > 1000) score += 20
  })
  
  return score
}

function getLeaderboard(
  period: "week" | "month" | "all-time" = "all-time",
  limit: number = 10
): LeaderboardEntry[] {
  const allUsers = getUsers()
  const entries: LeaderboardEntry[] = []
  
  allUsers.forEach((user) => {
    const score = calculateContributorScore(user.id, period)
    if (score === 0) return
    
    const allArticles = getWikiArticles()
    const articlesCreated = allArticles.filter((a) => a.authorId === user.id).length
    
    let articlesEdited = 0
    allArticles.forEach((article) => {
      const revisions = getWikiRevisionsByArticleId(article.id)
      const userRevisions = revisions.filter((r) => r.authorId === user.id)
      if (userRevisions.length > 0) articlesEdited++
    })
    
    entries.push({
      userId: user.id,
      user,
      score,
      articlesCreated,
      articlesEdited,
      rank: 0, // Will be set after sorting
    })
  })
  
  // Sort by score descending
  entries.sort((a, b) => b.score - a.score)
  
  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1
  })
  
  return entries.slice(0, limit)
}

function getRankIcon(rank: number) {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />
  } else if (rank === 2) {
    return <Medal className="h-5 w-5 text-gray-400" />
  } else if (rank === 3) {
    return <Award className="h-5 w-5 text-amber-600" />
  }
  return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
}

export function Leaderboard({ period = "all-time", limit = 10, className }: LeaderboardProps) {
  const entries = React.useMemo(() => {
    return getLeaderboard(period, limit)
  }, [period, limit])
  
  if (entries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Contributor Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No contributors yet. Be the first!
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Contributor Leaderboard
          </CardTitle>
          <Badge variant="secondary">
            {period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <Link
            key={entry.userId}
            href={`/user/${entry.user.username || entry.userId}`}
            className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
              <AvatarFallback>
                {entry.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-1">{entry.user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {entry.articlesCreated} created
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {entry.articlesEdited} edited
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{entry.score}</span>
              </div>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          </Link>
        ))}
        
        <div className="pt-2 border-t">
          <Link
            href="/leaderboard"
            className="text-sm text-primary hover:underline text-center block"
          >
            View full leaderboard →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

