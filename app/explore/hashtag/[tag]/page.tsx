"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBlogPosts } from "@/lib/storage"
import Link from "next/link"
import { Hash, ArrowLeft } from "lucide-react"
import type { BlogPost } from "@/lib/types"

export default function HashtagPage() {
  const params = useParams()
  const tag = params.tag as string
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const allPosts = getBlogPosts()
    const filtered = allPosts.filter((post) => post.hashtags?.includes(tag))
    setPosts(filtered)
  }, [tag])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href="/explore">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Hash className="h-8 w-8" />
          <h1 className="text-3xl font-bold">{tag}</h1>
        </div>
        <p className="text-muted-foreground">{posts.length} posts with this hashtag</p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No posts found with this hashtag</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.hashtags?.map((hashtag) => (
                      <Badge key={hashtag} variant={hashtag === tag ? "default" : "outline"} className="text-xs">
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
