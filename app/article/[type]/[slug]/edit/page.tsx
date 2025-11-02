"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { ArticleEditor, type ArticleType } from "@/components/article/article-editor"
import { getArticleBySlug, updateArticle } from "@/lib/article-storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save } from "lucide-react"
import type { JSONContent } from "@tiptap/core"

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}) {
  const { type, slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [article, setArticle] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const loadArticle = async () => {
      try {
        const articleType = type.charAt(0).toUpperCase() + type.slice(1) as ArticleType
        const loadedArticle = await getArticleBySlug(slug, articleType)

        if (!loadedArticle) {
          router.push("/")
          return
        }

        // Check if user is the author
        if (loadedArticle.createdById !== user.id) {
          router.push(`/article/${type}/${slug}`)
          return
        }

        setArticle(loadedArticle)
      } catch (err) {
        console.error("Error loading article:", err)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    loadArticle()
  }, [slug, type, user, router])

  const handleSubmit = async (data: {
    title: string
    content: JSONContent
    infobox: any
  }) => {
    if (!user || !article) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateArticle(article.id, {
        title: data.title,
        contentJSON: data.content,
        infoboxJSON: data.infobox,
        authorId: user.id,
      })

      if (result.success && result.article) {
        router.push(`/article/${type}/${result.article.slug}`)
      } else {
        setError(result.error || "Failed to update article")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!article || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Article Not Found</AlertTitle>
              <AlertDescription>
                The article you're looking for doesn't exist or you don't have permission to edit it.
              </AlertDescription>
            </Alert>
            <BackButton href="/" label="Back to Home" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const articleType = type.charAt(0).toUpperCase() + type.slice(1) as ArticleType

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/article/${type}/${slug}`} label="Back to Article" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Edit Article</CardTitle>
              <CardDescription>Update your {articleType} article: {article.title}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ArticleEditor
        mode="edit"
        articleType={articleType}
        initialTitle={article.title}
        initialContent={article.contentJSON}
        initialInfobox={article.infoboxJSON}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/article/${type}/${slug}`)}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

