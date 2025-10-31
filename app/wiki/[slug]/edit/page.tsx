"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { WikiForm, type WikiFormData } from "@/components/wiki-form"
import { getWikiArticleBySlug, updateWikiArticle, generateWikiSlug } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Save } from "lucide-react"

export default function EditWikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [article, setArticle] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchedArticle = getWikiArticleBySlug(slug)
    if (!fetchedArticle) {
      router.push("/wiki")
      return
    }

    // Check if user owns the article
    if (fetchedArticle.authorId !== user.id) {
      router.push(`/wiki/${slug}`)
      return
    }

    setArticle(fetchedArticle)
    setIsLoading(false)
  }, [slug, user, router])

  const handleSubmit = async (formData: WikiFormData) => {
    if (!user || !article) return

    // Generate new slug if title changed
    const newSlug = article.title !== formData.title ? generateWikiSlug(formData.title) : article.slug

    const updatedArticle = {
      ...article,
      title: formData.title,
      slug: newSlug,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      species: formData.species && formData.species.length > 0 ? formData.species : undefined,
      content: formData.content,
      coverImage: formData.coverImage || undefined,
      updatedAt: new Date().toISOString(),
    }

    updateWikiArticle(updatedArticle)
    
    // Redirect to article page with potentially new slug after a short delay to show success message
    setTimeout(() => {
      router.push(`/wiki/${updatedArticle.slug}`)
    }, 1000)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!article || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Article not found or you don't have permission to edit.</p>
            <BackButton href="/wiki" label="Back to Wiki" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/wiki/${slug}`} label="Back to Article" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Edit Wiki Article</CardTitle>
              <CardDescription>Update your article: {article.title}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <WikiForm
        mode="edit"
        initialData={article}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/wiki/${slug}`)}
      />
    </div>
  )
}

