"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, ExternalLink } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/lib/auth"
import {
  getWatchEntriesByUserId,
  removeWatchEntry,
  updateWatchEntry,
  getBlogPostById,
  getWikiArticleById,
} from "@/lib/storage"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"
import type { WatchEntry } from "@/lib/types"

export default function WatchlistPage() {
  const { user } = useAuth()
  const [watchEntries, setWatchEntries] = useState<WatchEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const entries = getWatchEntriesByUserId(user.id)
      setWatchEntries(entries)
    }
    setIsLoading(false)
  }, [user])

  const handleToggleWatch = (entry: WatchEntry) => {
    if (entry.enabled) {
      updateWatchEntry(entry.id, { enabled: false })
    } else {
      updateWatchEntry(entry.id, { enabled: true })
    }
    
    const entries = getWatchEntriesByUserId(user?.id || "")
    setWatchEntries(entries)
  }

  const handleDeleteWatch = (entryId: string) => {
    removeWatchEntry(entryId)
    const entries = getWatchEntriesByUserId(user?.id || "")
    setWatchEntries(entries)
  }

  const getTitle = (entry: WatchEntry): string => {
    if (entry.targetType === "post") {
      const post = getBlogPostById(entry.targetId)
      return post?.title || "Unknown Post"
    } else if (entry.targetType === "wiki") {
      const article = getWikiArticleById(entry.targetId)
      return article?.title || "Unknown Article"
    }
    return "Unknown"
  }

  const getLink = (entry: WatchEntry): string => {
    if (entry.targetType === "post") {
      return `/blog/${entry.targetId}`
    } else if (entry.targetType === "wiki") {
      const article = getWikiArticleById(entry.targetId)
      return article ? `/wiki/${article.slug}` : "/wiki"
    }
    return "#"
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please log in to view your watchlist</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">My Watchlist</h1>
        <p className="text-muted-foreground">Manage items you&apos;re watching for updates</p>
      </div>

      {watchEntries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You&apos;re not watching any articles or posts yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the Watch button on blog posts or wiki articles to get notifications for updates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {watchEntries.map((entry) => (
            <Card key={entry.id} className={!entry.enabled ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={entry.targetType === "post" ? "default" : "secondary"}>
                        {entry.targetType === "post" ? "Blog Post" : "Wiki Article"}
                      </Badge>
                      {entry.enabled && <Badge variant="outline">Active</Badge>}
                      {!entry.enabled && <Badge variant="outline">Paused</Badge>}
                    </div>
                    <h3 className="font-semibold text-lg truncate">
                      <Link href={getLink(entry)} className="hover:underline">
                        {getTitle(entry)}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Watching:</span>
                      {entry.watchEvents.includes("update") && (
                        <Badge variant="outline" className="text-xs">
                          Updates
                        </Badge>
                      )}
                      {entry.watchEvents.includes("comment") && (
                        <Badge variant="outline" className="text-xs">
                          Comments
                        </Badge>
                      )}
                      {entry.watchEvents.includes("reaction") && (
                        <Badge variant="outline" className="text-xs">
                          Reactions
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Added {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant={entry.enabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleWatch(entry)}
                      >
                        {entry.enabled ? (
                          <>
                            <Bell className="h-4 w-4 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <BellOff className="h-4 w-4 mr-1" />
                            Paused
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={getLink(entry)}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteWatch(entry.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

