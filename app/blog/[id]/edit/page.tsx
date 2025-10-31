"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBlogPostById, getPetsByOwnerId, updateBlogPost } from "@/lib/storage"
import type { BlogPost, PrivacyLevel } from "@/lib/types"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    petId: "",
    title: "",
    content: "",
    tags: "",
    privacy: "public" as PrivacyLevel,
    hashtags: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

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
      content: loadedPost.content,
      tags: loadedPost.tags.join(", "),
      privacy: (loadedPost.privacy || "public") as PrivacyLevel,
      hashtags: loadedPost.hashtags?.join(", ") || "",
    })
    setIsLoading(false)
  }, [id, user, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post) return

    const hashtagMatches = formData.content.match(/#\w+/g) || []
    const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
    const manualHashtags = formData.hashtags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]

    const updatedPost: BlogPost = {
      ...post,
      petId: formData.petId,
      title: formData.title,
      content: formData.content,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      hashtags: allHashtags,
      privacy: formData.privacy,
      updatedAt: new Date().toISOString(),
    }

    updateBlogPost(updatedPost)
    router.push(`/blog/${post.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
      <Link href={`/blog/${post.id}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Post
        </Button>
      </Link>

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
                <Label htmlFor="privacy">Privacy *</Label>
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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your post a catchy title"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your story... Add hashtags with #tag"
                rows={10}
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="adventure, training, funny (comma separated)"
                className="h-10"
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
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Hashtags in your content (#tag) will be automatically detected
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href={`/blog/${post.id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

