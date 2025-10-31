"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addBlogPost, getPetsByOwnerId } from "@/lib/storage"
import type { BlogPost } from "@/lib/types"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { MarkdownEditor } from "@/components/markdown-editor"
import { PrivacySelector } from "@/components/privacy-selector"
import { saveDraft, deleteDraft, getDraftsByUserId } from "@/lib/drafts"
import type { PrivacyLevel, Draft } from "@/lib/types"

export default function CreateBlogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  const [formData, setFormData] = useState({
    petId: "",
    title: "",
    content: "",
    tags: "",
    privacy: "public" as PrivacyLevel,
    hashtags: "",
  })
  const [draftId, setDraftId] = useState<string>("")
  const [lastSaved, setLastSaved] = useState<string>("")
  const [existingDrafts, setExistingDrafts] = useState<Draft[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    const pets = getPetsByOwnerId(user.id)
    setMyPets(pets)
    if (pets.length > 0) {
      setFormData((prev) => ({ ...prev, petId: pets[0].id }))
    }

    const drafts = getDraftsByUserId(user.id, "blog")
    setExistingDrafts(drafts)

    const newDraftId = `draft_${Date.now()}`
    setDraftId(newDraftId)
  }, [user, router])

  useEffect(() => {
    if (!user || !draftId || !formData.title) return

    const timer = setTimeout(() => {
      const draft: Draft = {
        id: draftId,
        userId: user.id,
        type: "blog",
        title: formData.title,
        content: formData.content,
        metadata: {
          petId: formData.petId,
          tags: formData.tags,
          privacy: formData.privacy,
          hashtags: formData.hashtags,
        },
        lastSaved: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      saveDraft(draft)
      setLastSaved(new Date().toLocaleTimeString())
    }, 2000) // Autosave after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [formData, user, draftId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const hashtagMatches = formData.content.match(/#\w+/g) || []
    const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
    const manualHashtags = formData.hashtags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]

    const newPost: BlogPost = {
      id: String(Date.now()),
      petId: formData.petId,
      authorId: user.id,
      title: formData.title,
      content: formData.content,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      likes: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      privacy: formData.privacy,
      isDraft: false,
      hashtags: allHashtags,
    }

    addBlogPost(newPost)
    if (draftId) {
      deleteDraft(draftId)
    }
    router.push(`/blog/${newPost.id}`)
  }

  const loadDraft = (draft: Draft) => {
    setFormData({
      petId: draft.metadata?.petId || "",
      title: draft.title,
      content: draft.content,
      tags: draft.metadata?.tags || "",
      privacy: draft.metadata?.privacy || "public",
      hashtags: draft.metadata?.hashtags || "",
    })
    setDraftId(draft.id)
  }

  if (myPets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You need to add a pet before creating a blog post</p>
            <Link href="/dashboard/add-pet">
              <Button>Add Your First Pet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href="/blog">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blogs
        </Button>
      </Link>

      {existingDrafts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Continue from Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingDrafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{draft.title || "Untitled Draft"}</p>
                    <p className="text-sm text-muted-foreground">
                      Last saved: {new Date(draft.lastSaved).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadDraft(draft)}>
                      Load
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteDraft(draft.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create a Blog Post</CardTitle>
              <CardDescription>Share your pet{"'"}s story with the community</CardDescription>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4" />
                <span>Saved at {lastSaved}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="petId">Select Pet *</Label>
                <Select value={formData.petId} onValueChange={(value) => setFormData({ ...formData, petId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {myPets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Privacy</Label>
                <PrivacySelector
                  value={formData.privacy}
                  onChange={(value) => setFormData({ ...formData, privacy: value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your post a catchy title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Share your story... Use markdown for formatting. Add hashtags with #tag"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="adventure, training, funny (comma separated)"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="dogs, puppylove, goldenretriever (comma separated)"
              />
              <p className="text-xs text-muted-foreground">
                Hashtags in your content (#tag) will be automatically detected
              </p>
            </div>

            <Button type="submit" className="w-full">
              Publish Post
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
