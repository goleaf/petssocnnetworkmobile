"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { ArticleEditor, type ArticleType } from "@/components/article/article-editor"
import { createArticle } from "@/lib/article-storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { JSONContent } from "@tiptap/core"

export default function CreateArticlePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [articleType, setArticleType] = useState<ArticleType>(
    (searchParams.get("type") as ArticleType) || "Breed"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const handleSubmit = async (data: {
    title: string
    content: JSONContent
    infobox: any
  }) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createArticle({
        title: data.title,
        type: articleType,
        contentJSON: data.content,
        infoboxJSON: data.infobox,
        createdById: user.id,
        status: "draft",
      })

      if (result.success && result.article) {
        router.push(`/article/${articleType.toLowerCase()}/${result.article.slug}`)
      } else {
        setError(result.error || "Failed to create article")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href="/" label="Back to Home" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create Article</CardTitle>
              <CardDescription>Create a new {articleType} article</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="articleType">Article Type</Label>
            <Select value={articleType} onValueChange={(value) => setArticleType(value as ArticleType)}>
              <SelectTrigger id="articleType" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breed">Breed</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Place">Place</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ArticleEditor
        mode="create"
        articleType={articleType}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/")}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

