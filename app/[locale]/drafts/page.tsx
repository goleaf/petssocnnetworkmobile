"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/ui/delete-button"
import { getDraftsByUserId, deleteDraft } from "@/lib/drafts"
import { addBlogPost } from "@/lib/storage"
import type { BlogPost, BlogPostMedia } from "@/lib/types"
import type { Draft } from "@/lib/types"
import { FileText, Trash2, Clock } from "lucide-react"
import Link from "next/link"

export default function DraftsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    const userDrafts = getDraftsByUserId(user.id)
    setDrafts(userDrafts)
  }, [user, router])

  const handleDelete = (id: string) => {
    deleteDraft(id)
    setDrafts(drafts.filter((d) => d.id !== id))
  }

  if (!user) return null

  const publishFeedDraft = (draft: Draft) => {
    if (!user) return
    const m = draft.metadata || {}
    const now = new Date().toISOString()
    const post: BlogPost = {
      id: String(Date.now()),
      petId: m.petId || "",
      authorId: user.id,
      title: draft.title || draft.content.substring(0, 50) || "Untitled",
      content: draft.content || "",
      language: user.displayPreferences?.primaryLanguage,
      tags: [],
      categories: [],
      likes: [],
      createdAt: now,
      updatedAt: now,
      privacy: m.privacy || "public",
      hashtags: [],
      media: {
        images: Array.isArray(m.media?.images) ? m.media.images : [],
        videos: [],
        links: [],
        captions: m.media?.captions || {},
      },
      taggedPetIds: m.taggedPetIds || [],
      placeId: m.placeId || undefined,
      feeling: m.feeling,
      activity: m.activity,
      poll: m.poll || undefined,
    }
    addBlogPost(post)
    deleteDraft(draft.id)
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
    router.push(`/blog/${post.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Drafts</h1>
        <p className="text-muted-foreground mt-2">Continue working on your saved drafts</p>
      </div>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No drafts yet</p>
            <Link href="/blog/create">
              <Button>Create a Blog Post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{draft.title || "Untitled Draft"}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last saved: {new Date(draft.lastSaved).toLocaleString("en-GB")}</span>
                      </div>
                      <span className="capitalize">{draft.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {draft.type === "feed" ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => {
                          try { localStorage.setItem('compose_draft_id', draft.id) } catch {}
                          router.push('/')
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => publishFeedDraft(draft)}>
                          Publish
                        </Button>
                        <DeleteButton size="sm" onClick={() => handleDelete(draft.id)} showIcon={true} />
                      </>
                    ) : (
                      <>
                        <Link href={draft.type === "blog" ? "/blog/create" : "/wiki/create"}>
                          <Button variant="outline" size="sm">
                            Continue
                          </Button>
                        </Link>
                        <DeleteButton size="sm" onClick={() => handleDelete(draft.id)} showIcon={true} />
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">{draft.content || "No content yet..."}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
