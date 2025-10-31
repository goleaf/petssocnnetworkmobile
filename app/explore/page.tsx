"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBlogPosts } from "@/lib/storage"
import Link from "next/link"
import { Hash, TrendingUp, Sparkles } from "lucide-react"

export default function ExplorePage() {
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])

  useEffect(() => {
    const posts = getBlogPosts()
    setRecentPosts(posts.slice(0, 10))

    // Calculate trending hashtags
    const hashtagCounts = new Map<string, number>()
    posts.forEach((post) => {
      post.hashtags?.forEach((tag) => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1)
      })
    })

    const trending = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    setTrendingHashtags(trending)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground">Discover trending topics and popular content</p>
      </div>

      <Tabs defaultValue="trending">
        <TabsList>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Sparkles className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Trending Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingHashtags.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No trending hashtags yet</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {trendingHashtags.map(({ tag, count }) => (
                    <Link key={tag} href={`/explore/hashtag/${tag}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tag}</span>
                        </div>
                        <Badge variant="secondary">{count} posts</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.hashtags?.slice(0, 5).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
