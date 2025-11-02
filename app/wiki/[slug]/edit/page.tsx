"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { WikiForm, type WikiFormData } from "@/components/wiki-form"
import { getWikiArticleBySlug, updateWikiArticle, generateWikiSlug, addWikiRevision } from "@/lib/storage"
import { getPermissionResult } from "@/lib/policy"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Save } from "lucide-react"

export default function EditWikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [article, setArticle] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissionError, setPermissionError] = useState<string | null>(null)

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

    // Check permission using centralized policy
    const permissionResult = getPermissionResult("edit_wiki", {
      user,
      resource: { type: "wiki", ...fetchedArticle },
    })

    if (!permissionResult.allowed) {
      setPermissionError(permissionResult.reason || "Permission denied")
      router.push(`/wiki/${slug}`)
      return
    }

    setArticle(fetchedArticle)
    setIsLoading(false)
  }, [slug, user, router])

  const handleSubmit = async (formData: WikiFormData) => {
    if (!user || !article) return

    // Generate new slug if title changed and check for conflicts
    let newSlug = article.title !== formData.title ? generateWikiSlug(formData.title) : article.slug
    
    // If slug changed, check for conflicts
    if (newSlug !== article.slug) {
      let baseSlug = newSlug
      let counter = 1
      while (getWikiArticleBySlug(newSlug) && newSlug !== article.slug) {
        newSlug = `${baseSlug}-${counter}`
        counter++
      }
    }

    // Check if disclosure is missing and flag for moderation
    const disclosureMissing = formData.brandAffiliation && !formData.brandAffiliation.disclosed
    const brandAffiliation = formData.brandAffiliation ? {
      ...formData.brandAffiliation,
      disclosureMissing,
    } : undefined

    const updatedArticle = {
      ...article,
      title: formData.title,
      slug: newSlug,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      species: formData.species && formData.species.length > 0 ? formData.species : undefined,
      content: formData.content,
      coverImage: formData.coverImage || undefined,
      tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
      updatedAt: new Date().toISOString(),
      brandAffiliation,
      healthData: formData.category === "health" && formData.healthData ? formData.healthData : undefined,
    }

    // Create revision for every edit
    const revisionId = `revision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // For health articles, revisions are always drafts unless user can publish stable
    // For non-health articles, use draft if disclosure missing, otherwise stable
    const isHealthArticle = formData.category === "health"
    const canPublishStable = isHealthArticle ? canPublishStableHealthRevision(user.id) : true
    const revisionStatus = disclosureMissing || (isHealthArticle && !canPublishStable) ? "draft" : "stable"
    
    addWikiRevision({
      id: revisionId,
      articleId: article.id,
      content: formData.content,
      status: revisionStatus,
      authorId: user.id,
      reasonForChange: formData.reasonForChange,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      brandAffiliation,
      healthData: isHealthArticle && formData.healthData ? formData.healthData : undefined,
    })
    
    // Update article to reference this revision
    updatedArticle.currentRevisionId = revisionId
    
    // For health articles, only update stableRevisionId if expert published as stable
    if (isHealthArticle && canPublishStable && revisionStatus === "stable") {
      updatedArticle.stableRevisionId = revisionId
      updatedArticle.approvedAt = new Date().toISOString()
    } else if (!isHealthArticle && revisionStatus === "stable") {
      updatedArticle.stableRevisionId = revisionId
      updatedArticle.approvedAt = new Date().toISOString()
    }
    
    if (!updatedArticle.revisions) {
      updatedArticle.revisions = []
    }
    updatedArticle.revisions.push({
      id: revisionId,
      articleId: article.id,
      content: formData.content,
      status: revisionStatus,
      authorId: user.id,
      reasonForChange: formData.reasonForChange,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      brandAffiliation,
      healthData: isHealthArticle && formData.healthData ? formData.healthData : undefined,
    })

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
            {permissionError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Permission Denied</AlertTitle>
                <AlertDescription>{permissionError}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-muted-foreground mb-4">Article not found or you don't have permission to edit.</p>
            )}
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

