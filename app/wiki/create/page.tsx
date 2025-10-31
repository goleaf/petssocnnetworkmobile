"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { WikiForm, type WikiFormData } from "@/components/wiki-form"
import { addWikiArticle, generateWikiSlug } from "@/lib/storage"
import { FileText } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function CreateWikiPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    setIsLoading(false)
  }, [user, router])

  const handleSubmit = async (formData: WikiFormData) => {
    if (!user) return

    const newArticle = {
      id: String(Date.now()),
      title: formData.title,
      slug: generateWikiSlug(formData.title),
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      species: formData.species && formData.species.length > 0 ? formData.species : undefined,
      content: formData.content,
      coverImage: formData.coverImage || undefined,
      authorId: user.id,
      views: 0,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addWikiArticle(newArticle)
    // Redirect to article page after successful creation
    setTimeout(() => {
      router.push(`/wiki/${newArticle.slug}`)
    }, 1000)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href="/wiki" label="Back to Wiki" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create Wiki Article</CardTitle>
              <CardDescription>Share your knowledge with the pet community</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <WikiForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/wiki")}
      />
    </div>
  )
}

