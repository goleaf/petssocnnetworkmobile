"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { DeleteButton } from "@/components/ui/delete-button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MediaAttachmentsEditor } from "@/components/media-attachments-editor"
import { TagInput } from "@/components/ui/tag-input"
import { addBlogPost, getPetsByOwnerId } from "@/lib/storage"
import type { BlogPost, BlogPostMedia, PrivacyLevel, Draft } from "@/lib/types"
import { normalizeCategoryList } from "@/lib/utils/categories"
import { Save } from "lucide-react"
import Link from "next/link"
import { MarkdownEditor } from "@/components/markdown-editor"
import { PrivacySelector } from "@/components/privacy-selector"
import { saveDraft, deleteDraft, getDraftsByUserId } from "@/lib/drafts"

type CreateBlogFormState = {
  petId: string
  title: string
  content: string
  tags: string
  categories: string
  privacy: PrivacyLevel
  hashtags: string
  media: BlogPostMedia
}

export default function CreateBlogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  // Load last used privacy setting from localStorage
  const getLastPrivacy = (): PrivacyLevel => {
    if (typeof window === "undefined") return "public"
    const stored = localStorage.getItem("pet_social_last_post_privacy")
    if (stored === "public" || stored === "followers-only" || stored === "private") {
      return stored as PrivacyLevel
    }
    return "public"
  }

  const [formData, setFormData] = useState<CreateBlogFormState>({
    petId: "",
    title: "",
    content: "",
    tags: "",
    categories: "",
    privacy: getLastPrivacy(),
    hashtags: "",
    media: {
      images: [],
      videos: [],
      links: [],
    },
  })
  const [draftId, setDraftId] = useState<string>("")
  const [lastSaved, setLastSaved] = useState<string>("")
  const [existingDrafts, setExistingDrafts] = useState<Draft[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])

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

    // Load suggested tags
    setSuggestedTags(getSuggestedTags(10))
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
          categories: formData.categories,
          privacy: formData.privacy,
          hashtags: formData.hashtags,
          media: {
            images: [...formData.media.images],
            videos: [...formData.media.videos],
            links: formData.media.links.map((link) => ({ ...link })),
          },
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

    const categories = normalizeCategoryList(formData.categories)

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
      categories,
      likes: [],
      queueStatus: "draft", // New posts start as drafts
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      privacy: formData.privacy,
      isDraft: false,
      media: {
        images: [...formData.media.images],
        videos: [...formData.media.videos],
        links: formData.media.links.map((link) => ({ ...link })),
      },
      hashtags: allHashtags,
      disableWikiLinks: formData.disableWikiLinks || false,
    }

    addBlogPost(newPost)
    if (draftId) {
      deleteDraft(draftId)
    }
    router.push(`/blog/${newPost.id}`)
  }

  const loadDraft = (draft: Draft) => {
    const draftMedia = (draft.metadata?.media ?? {}) as Partial<BlogPostMedia>
    const draftImages = Array.isArray(draftMedia.images)
      ? draftMedia.images.filter((url): url is string => typeof url === "string" && url.trim().length > 0).map((url) => url.trim())
      : []
    const draftVideos = Array.isArray(draftMedia.videos)
      ? draftMedia.videos.filter((url): url is string => typeof url === "string" && url.trim().length > 0).map((url) => url.trim())
      : []
    const draftLinks = Array.isArray(draftMedia.links)
      ? draftMedia.links
          .map((link) => {
            if (!link || typeof link !== "object" || !("url" in link)) return null
            const rawUrl = typeof (link as { url?: unknown }).url === "string" ? (link as { url: string }).url.trim() : ""
            if (!rawUrl) return null
            const rawTitle = typeof (link as { title?: unknown }).title === "string" ? (link as { title: string }).title.trim() : undefined
            return rawTitle && rawTitle.length > 0 ? { url: rawUrl, title: rawTitle } : { url: rawUrl }
          })
          .filter((link): link is BlogPostMedia["links"][number] => link !== null)
      : []
    setFormData({
      petId: draft.metadata?.petId || "",
      title: draft.title,
      content: draft.content,
      tags: draft.metadata?.tags || "",
      categories: draft.metadata?.categories || "",
      privacy: draft.metadata?.privacy || "public",
      hashtags: draft.metadata?.hashtags || "",
      media: {
        images: draftImages,
        videos: draftVideos,
        links: draftLinks,
      },
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
              <CreateButton iconType="plus">Add Your First Pet</CreateButton>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href="/blog" label="Back to Blogs" />

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
                      <Save className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                    <DeleteButton size="sm" onClick={() => deleteDraft(draft.id)}>
                      Delete
                    </DeleteButton>
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
                <Label htmlFor="petId" required>
                  Select Pet
                </Label>
                <Select value={formData.petId} onValueChange={(value) => setFormData({ ...formData, petId: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a pet">
                      {(() => {
                        const selectedPet = myPets.find((p) => p.id === formData.petId)
                        return selectedPet ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarImage src={selectedPet.avatar || "/placeholder.svg"} alt={selectedPet.name} />
                              <AvatarFallback className="text-xs">{selectedPet.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedPet.name}</span>
                          </div>
                        ) : null
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {myPets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                            <AvatarFallback className="text-xs">{pet.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{pet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy</Label>
                <PrivacySelector
                  value={formData.privacy}
                  onChange={(value) => {
                    setFormData({ ...formData, privacy: value })
                    // Save to localStorage for next time
                    if (typeof window !== "undefined") {
                      localStorage.setItem("pet_social_last_post_privacy", value)
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" required>
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your post a catchy title"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" required description="Use markdown for formatting. Add hashtags with #tag">
                Content
              </Label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Share your story... Use markdown for formatting. Add hashtags with #tag"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories" description="Create or select categories to organize your post">
                Categories
              </Label>
              <TagInput
                value={formData.categories}
                onChange={(value) => setFormData({ ...formData, categories: value })}
                placeholder="Adventure, Training, Funny"
              />
              <p className="text-xs text-muted-foreground">
                Categories power the blog filters. Type a category and press Enter to add it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" description="Add tags to help categorize your post. Type a tag and press Enter to add it.">
                Tags
              </Label>
              <TagInput
                value={formData.tags}
                onChange={(value) => setFormData({ ...formData, tags: value })}
                placeholder="adventure, training, funny"
                suggestions={suggestedTags}
              />
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Trending:</span>
                  {suggestedTags.slice(0, 8).map((tag) => {
                    const currentTags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
                    if (currentTags.includes(tag)) return null
                    return (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        onClick={() => {
                          const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
                          if (!tags.includes(tag)) {
                            setFormData({ ...formData, tags: [...tags, tag].join(", ") })
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags" description="Hashtags in your content (#tag) will be automatically detected">
                Hashtags
              </Label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="dogs, puppylove, goldenretriever (comma separated)"
                className="h-11"
              />
            </div>

            <div className="border-t pt-4">
              <Label description="Optional photos, videos, and links to enrich your post.">
                Rich Media Attachments
              </Label>
              <MediaAttachmentsEditor
                className="mt-3"
                media={formData.media}
                onChange={(updatedMedia) =>
                  setFormData((prev) => ({
                    ...prev,
                    media: {
                      images: [...updatedMedia.images],
                      videos: [...updatedMedia.videos],
                      links: updatedMedia.links.map((link) => ({ ...link })),
                    },
                  }))
                }
              />
            </div>
            <CreateButton type="submit" className="w-full" iconType="send">
              Publish Post
            </CreateButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
