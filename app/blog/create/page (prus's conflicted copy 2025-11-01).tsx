"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { CreateButton } from "@/components/ui/create-button"
import { BlogForm, type BlogFormData } from "@/components/blog-form"
import { addBlogPost } from "@/lib/storage"
import type { BlogPost } from "@/lib/types"
import { getPetsByOwnerId } from "@/lib/storage"
import { saveDraft, deleteDraft, getDraftsByUserId } from "@/lib/drafts"
import type { Draft } from "@/lib/types"
import { FileText, Save, FolderOpen } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"

export default function CreateBlogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draftId, setDraftId] = useState<string>("")
  const [lastSaved, setLastSaved] = useState<string>("")
  const [existingDrafts, setExistingDrafts] = useState<Draft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    const pets = getPetsByOwnerId(user.id)
    setMyPets(pets)
    const drafts = getDraftsByUserId(user.id, "blog")
    setExistingDrafts(drafts)
    setIsLoading(false)
  }, [user, router])

  const handleSaveDraft = (formData: BlogFormData) => {
    if (!user || !formData.title) return

    const draft: Draft = {
      id: draftId || `draft_${Date.now()}`,
      userId: user.id,
      type: "blog",
      title: formData.title,
      content: formData.content,
      metadata: {
        petId: formData.petId,
        tags: formData.tags.join(", "),
        privacy: formData.privacy,
        hashtags: formData.hashtags.join(", "),
        coverImage: formData.coverImage,
      },
      lastSaved: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    if (!draftId) {
      setDraftId(draft.id)
    }

    saveDraft(draft)
    setLastSaved(new Date().toLocaleTimeString())
  }

  const handleSubmit = async (formData: BlogFormData) => {
    if (!user) return

    // Extract hashtags from content
    const hashtagMatches = formData.content.match(/#\w+/g) || []
    const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
    const manualHashtags = formData.hashtags || []
    const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]

    const newPost: BlogPost = {
      id: String(Date.now()),
      petId: formData.petId,
      authorId: user.id,
      title: formData.title,
      content: formData.content,
      tags: formData.tags || [],
      likes: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      privacy: formData.privacy,
      isDraft: false,
      hashtags: allHashtags,
      coverImage: formData.coverImage,
    }

    addBlogPost(newPost)
    
    // Delete draft if exists
    if (draftId) {
      deleteDraft(draftId)
    }

    // Redirect to post page after a short delay to show success message
    setTimeout(() => {
      router.push(`/blog/${newPost.id}`)
    }, 1000)
  }

  const loadDraft = (draft: Draft) => {
    setSelectedDraft(draft)
    setDraftId(draft.id)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
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

  // Prepare initial data if draft is selected
  const initialData = selectedDraft ? {
    petId: selectedDraft.metadata?.petId || "",
    title: selectedDraft.title,
    content: selectedDraft.content,
    tags: selectedDraft.metadata?.tags?.split(",").map(t => t.trim()).filter(t => t) || [],
    privacy: selectedDraft.metadata?.privacy || "public",
    hashtags: selectedDraft.metadata?.hashtags?.split(",").map(t => t.trim()).filter(t => t) || [],
    coverImage: selectedDraft.metadata?.coverImage,
  } : undefined

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <BackButton href="/blog" label="Back to Blogs" />
        <Link href="/drafts">
          <Button variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            My Drafts
          </Button>
        </Link>
      </div>

      {existingDrafts.length > 0 && !selectedDraft && (
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create a Blog Post</CardTitle>
              <CardDescription>Share your pet{"'"}s story with the community</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <BlogForm
        mode="create"
        initialData={initialData as any}
        pets={myPets}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/blog")}
        onSaveDraft={handleSaveDraft}
        showDraftInfo={!!lastSaved}
        lastSaved={lastSaved}
      />
    </div>
  )
}
