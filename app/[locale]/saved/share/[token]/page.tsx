"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSavedCollectionShare, getBlogPosts } from "@/lib/storage"
import type { BlogPost } from "@/lib/types"

export default function SavedSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [valid, setValid] = useState(false)
  const [name, setName] = useState("")
  const [items, setItems] = useState<BlogPost[]>([])

  useEffect(() => {
    const share = getSavedCollectionShare(token)
    if (!share) return
    setValid(true)
    setName(share.collectionName)
    const posts = getBlogPosts().filter((p) => share.postIds.includes(p.id))
    setItems(posts)
  }, [token])

  if (!valid) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <p className="text-center text-muted-foreground">This shared collection link is invalid or expired.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Collection: {name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.id} className="rounded border p-3">
                <Link href={`/blog/${p.id}`} className="font-medium hover:underline">{p.title || 'Untitled'}</Link>
                <div className="text-sm text-muted-foreground line-clamp-2">{p.content}</div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">No items in this collection.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

