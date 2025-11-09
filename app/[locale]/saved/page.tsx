"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getBlogPosts } from "@/lib/storage"
import {
  getSavedPostIds,
  getSavedCollectionsByUser,
  ensureDefaultSavedCollection,
  createSavedCollection,
  renameSavedCollection,
  deleteSavedCollection,
  addPostToSavedCollection,
  removePostFromSavedCollection,
  movePostsBetweenCollections,
  createSavedCollectionShare,
} from "@/lib/storage"
import type { SavedCollection, BlogPost } from "@/lib/types"
import { formatDate } from "@/lib/utils/date"

export default function SavedPostsPage() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<SavedCollection[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filterType, setFilterType] = useState<'all'|'photo'|'video'|'text'>('all')
  const [authorFilter, setAuthorFilter] = useState<string>("")

  useEffect(() => {
    if (!user) return
    ensureDefaultSavedCollection(user.id)
    setCollections(getSavedCollectionsByUser(user.id))
  }, [user?.id])

  const posts = useMemo(() => getBlogPosts(), [])
  const savedIds = useMemo(() => user ? new Set(getSavedPostIds(user.id)) : new Set<string>(), [user?.id])
  const activeCollection = useMemo(() => (activeId ? collections.find((c) => c.id === activeId) : collections[0]), [collections, activeId])
  const visiblePosts = useMemo(() => {
    if (!activeCollection) return [] as BlogPost[]
    let list = posts.filter((p) => activeCollection.postIds.includes(p.id))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((p) => `${p.title} ${p.content}`.toLowerCase().includes(q))
    }
    if (filterType !== 'all') {
      list = list.filter((p) => {
        const hasVideo = Boolean(p.media?.videos?.length)
        const hasImage = Boolean(p.media?.images?.length)
        if (filterType === 'video') return hasVideo
        if (filterType === 'photo') return hasImage && !hasVideo
        return !hasImage && !hasVideo
      })
    }
    if (authorFilter.trim()) {
      list = list.filter((p) => p.authorId === authorFilter)
    }
    return list
  }, [activeCollection, posts, query, filterType, authorFilter])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <p className="text-center text-muted-foreground">Sign in to view your saved posts.</p>
      </div>
    )
  }

  const createCollection = () => {
    const name = window.prompt("Collection name", "New Collection")
    if (!name) return
    createSavedCollection(user.id, name)
    setCollections(getSavedCollectionsByUser(user.id))
  }
  const renameCollection = (id: string) => {
    const col = collections.find((c) => c.id === id)
    if (!col) return
    const name = window.prompt("Rename collection", col.name)
    if (!name) return
    renameSavedCollection(user.id, id, name)
    setCollections(getSavedCollectionsByUser(user.id))
  }
  const deleteCollection = (id: string) => {
    if (!window.confirm("Delete collection?")) return
    deleteSavedCollection(user.id, id)
    const next = getSavedCollectionsByUser(user.id)
    setCollections(next)
    setActiveId(next[0]?.id || null)
  }
  const exportCollection = (id: string) => {
    const share = createSavedCollectionShare(user.id, id, 24)
    if (!share) return
    const url = `${window.location.origin}/saved/share/${share.token}`
    navigator.clipboard?.writeText(url).catch(() => {})
    window.alert("Shareable link copied to clipboard (valid for 24h). Use the browser print dialog to export to PDF.")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">Saved Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button size="sm" onClick={createCollection} className="w-full">New Collection</Button>
            <div className="space-y-1">
              {collections.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded border px-2 py-1 cursor-pointer hover:bg-accent" onClick={() => setActiveId(c.id)}>
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.postIds.length} saved</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); renameCollection(c.id) }}>Rename</Button>
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); exportCollection(c.id) }}>Share</Button>
                    {collections.length > 1 && (
                      <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteCollection(c.id) }}>Delete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Saved Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Input placeholder="Search saved posts..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-64" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
                <option value="all">All types</option>
                <option value="photo">Photos</option>
                <option value="video">Videos</option>
                <option value="text">Text only</option>
              </select>
              <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="">All authors</option>
                {Array.from(new Set((activeCollection?.postIds||[]).map((id) => posts.find(p => p.id===id)?.authorId).filter(Boolean) as string[])).map((aid) => (
                  <option key={aid} value={aid}>{aid}</option>
                ))}
              </select>
            </div>

            {activeCollection ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visiblePosts.map((p) => (
                  <div key={p.id} className="rounded border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/blog/${p.id}`} className="font-medium hover:underline">{p.title || 'Untitled'}</Link>
                      <Badge variant="outline" className="text-xs">{formatDate(p.createdAt)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{p.content}</div>
                    <div className="mt-2 flex items-center gap-2">
                      {collections.filter((c) => c.id !== activeCollection.id).map((c) => (
                        <Button key={c.id} variant="outline" size="xs" onClick={() => movePostsBetweenCollections(user.id, activeCollection.id, c.id, [p.id])}>Move to {c.name}</Button>
                      ))}
                      <Button variant="ghost" size="xs" onClick={() => removePostFromSavedCollection(user.id, activeCollection.id, p.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
                {visiblePosts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No saved items match your filters.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No collections yet. Create one to organize your saved posts.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
