"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { BlogForm, type BlogFormData } from "@/components/blog-form"
import { getBlogPostById, getPetsByOwnerId, updateBlogPost } from "@/lib/storage"
import type { BlogPost } from "@/lib/types"
import { Save, FileText } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    }

    loadData()
  }, [id, user, router])

  const handleSubmit = async (formData: BlogFormData) => {
    if (!user || !post) return

    // Extract hashtags from content
    const hashtagMatches = formData.content.match(/#\w+/g) || []
    const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
    const manualHashtags = formData.hashtags || []
    const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]

    // Check if disclosure is missing and flag for moderation
    const disclosureMissing = formData.brandAffiliation && !formData.brandAffiliation.disclosed
    const brandAffiliation = formData.brandAffiliation ? {
      ...formData.brandAffiliation,
      lastEditDisclosure: formData.brandAffiliation.disclosed,
      disclosureMissing,
    } : undefined

    const updatedPost: BlogPost = {
      ...post,
      petId: formData.petId,
      title: formData.title,
      content: formData.content,
      coverImage: formData.coverImage || undefined,
      tags: formData.tags || [],
      categories: formData.categories || [],
      hashtags: allHashtags,
      privacy: formData.privacy,
      media: {
        images: [...formData.media.images],
        videos: [...formData.media.videos],
        links: formData.media.links.map((link) => ({ ...link })),
      },
      updatedAt: new Date().toISOString(),
      brandAffiliation,
    }

    updateBlogPost(updatedPost)

    // Redirect to post page after a short delay to show success message
    setTimeout(() => {
      router.push(`/blog/${post.id}`)
    }, 1000)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!post || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Post not found or you don't have permission to edit.</p>
            <BackButton href="/blog" label="Back to Blogs" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/blog/${post.id}`} label="Back to Post" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Edit Blog Post</CardTitle>
              <CardDescription>Update your pet{"'"}s story: {post.title}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <BlogForm
        mode="edit"
        initialData={post}
        pets={myPets}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/blog/${post.id}`)}
      />
    </div>
  )
}
