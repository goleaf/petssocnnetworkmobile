"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TagInput } from "@/components/ui/tag-input"
import { getBlogPostById, getPetsByOwnerId, updateBlogPost } from "@/lib/storage"
import type { BlogPost, PrivacyLevel } from "@/lib/types"
import { Save, X } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import RichTextEditor from "reactjs-tiptap-editor"
import { BaseKit } from "reactjs-tiptap-editor"
import "reactjs-tiptap-editor/style.css"

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState("")

  const [formData, setFormData] = useState({
    petId: "",
    title: "",
    tags: "",
    privacy: "public" as PrivacyLevel,
    hashtags: "",
  })

  const extensions = [
    BaseKit.configure({
      placeholder: {
        showOnlyCurrent: true,
      },
      characterCount: {
        limit: 50000,
      },
    }),
  ]

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        router.push("/")
        return
      }

      setIsLoading(true)

      // Simulate a small delay to show spinner
      await new Promise((resolve) => setTimeout(resolve, 300))

      const loadedPost = getBlogPostById(id)
      if (!loadedPost) {
        router.push("/feed")
        return
      }

      // Check if user owns the post
      if (loadedPost.authorId !== user.id) {
        router.push(`/blog/${id}`)
        return
      }

      setPost(loadedPost)
      const pets = getPetsByOwnerId(user.id)
      setMyPets(pets)

      setFormData({
        petId: loadedPost.petId,
        title: loadedPost.title,
        tags: loadedPost.tags.join(", "),
        privacy: (loadedPost.privacy || "public") as PrivacyLevel,
        hashtags: loadedPost.hashtags?.join(", ") || "",
      })

      setContent(loadedPost.content)
      setIsLoading(false)
    }

    loadData()
  }, [id, user, router])

  const handleTagsChange = useCallback((e: any) => {
    const tagify = e.detail.tagify
    const tagsArray = tagify.value.map((tag: any) => tag.value).join(", ")
    setFormData((prev) => ({ ...prev, tags: tagsArray }))
  }, [])

  const handleHashtagsChange = useCallback((e: any) => {
    const tagify = e.detail.tagify
    const tagsArray = tagify.value.map((tag: any) => tag.value).join(", ")
    setFormData((prev) => ({ ...prev, hashtags: tagsArray }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post || isSaving) return

    setIsSaving(true)

    try {
      // Extract hashtags from content
      const hashtagMatches = content.match(/#\w+/g) || []
      const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
      
      // Get manual hashtags from tagify
      const manualHashtags = formData.hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      
      const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]

      // Get tags from tagify
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      const updatedPost: BlogPost = {
        ...post,
        petId: formData.petId,
        title: formData.title,
        content: content,
        tags: tags,
        hashtags: allHashtags,
        privacy: formData.privacy,
        updatedAt: new Date().toISOString(),
      }

      updateBlogPost(updatedPost)
      router.push(`/blog/${post.id}`)
    } catch (error) {
      console.error("Error updating post:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Post not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/blog/${post.id}`} label="Back to Post" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Blog Post</CardTitle>
              <CardDescription>Update your pet{"'"}s story</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="petId" required>
                  Select Pet
                </Label>
                <Select value={formData.petId} onValueChange={(value) => setFormData({ ...formData, petId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pet" />
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
                <Label htmlFor="privacy" required>
                  Privacy
                </Label>
                <Select
                  value={formData.privacy}
                  onValueChange={(value: PrivacyLevel) => setFormData({ ...formData, privacy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="followers-only">Followers Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label htmlFor="content" required description="Write your story with rich text formatting">
                Content
              </Label>
              <div className="border border-input rounded-md overflow-hidden bg-background">
                <RichTextEditor
                  content={content}
                  output="html"
                  onChangeContent={setContent}
                  extensions={extensions}
                  minHeight="300px"
                  contentClass="min-h-[300px] p-4 prose prose-sm max-w-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" description="Add tags separated by commas">
                Tags
              </Label>
              <div className="border border-input rounded-md bg-background">
                <Tags
                  tagifyRef={tagifyRef}
                  whitelist={[]}
                  placeholder="adventure, training, funny"
                  settings={{
                    duplicates: false,
                    maxTags: 20,
                    trim: true,
                  }}
                  defaultValue={formData.tags}
                  onChange={handleTagsChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags" description="Hashtags in your content (#tag) will be automatically detected">
                Hashtags
              </Label>
              <div className="border border-input rounded-md bg-background">
                <Tags
                  tagifyRef={hashtagRef}
                  whitelist={[]}
                  placeholder="dogs, puppylove, goldenretriever"
                  settings={{
                    duplicates: false,
                    maxTags: 20,
                    trim: true,
                  }}
                  defaultValue={formData.hashtags}
                  onChange={handleHashtagsChange}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Link href={`/blog/${post.id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isSaving || !formData.title.trim() || !content.trim()}>
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
