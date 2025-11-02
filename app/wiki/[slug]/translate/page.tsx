"use client"

import { use, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getWikiArticleBySlug,
  getWikiTranslationsByArticleId,
  createWikiTranslation,
  updateWikiTranslation,
  getUserById,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import {
  Copy,
  Eye,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Languages,
  Diff,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import ReactDiffViewer from "react-diff-viewer-continued"
import type { WikiTranslation, TranslationStatus } from "@/lib/types"
import {
  getTranslationProgress,
  isTranslationIncomplete,
  generateDiff,
  getBaseLanguage,
} from "@/lib/utils/translations"
import { cn } from "@/lib/utils"

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
]

const STATUS_COLORS: Record<TranslationStatus, string> = {
  draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  review: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  outdated: "bg-red-500/10 text-red-600 dark:text-red-400",
}

const STATUS_ICONS: Record<TranslationStatus, typeof CheckCircle2> = {
  draft: Clock,
  published: CheckCircle2,
  review: AlertCircle,
  outdated: XCircle,
}

export default function WikiTranslatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: articleSlug } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [article, setArticle] = useState<any | null>(null)
  const [translations, setTranslations] = useState<WikiTranslation[]>([])
  const [selectedLang, setSelectedLang] = useState<string>(
    searchParams.get("lang") || "",
  )
  const [selectedTranslation, setSelectedTranslation] =
    useState<WikiTranslation | null>(null)
  const [viewMode, setViewMode] = useState<"editor" | "side-by-side" | "diff">("editor")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [slug, setSlug] = useState("")
  const [status, setStatus] = useState<TranslationStatus>("draft")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadedArticle = getWikiArticleBySlug(articleSlug)
    if (!loadedArticle) {
      router.push("/wiki")
      return
    }

    setArticle(loadedArticle)
    const articleTranslations = getWikiTranslationsByArticleId(loadedArticle.id)
    setTranslations(articleTranslations)

    // If lang param is provided, try to load that translation
    const langParam = searchParams.get("lang")
    if (langParam) {
      setSelectedLang(langParam)
      const translation = articleTranslations.find((t) => t.languageCode === langParam)
      if (translation) {
        setSelectedTranslation(translation)
        setTitle(translation.title || "")
        setContent(translation.content || "")
        setSlug(translation.slug || "")
        setStatus(translation.status)
      } else {
        // Create new translation placeholder
        setTitle("")
        setContent("")
        setSlug("")
        setStatus("draft")
      }
    }

    setIsLoading(false)
  }, [slug, searchParams, router])

  const handleCopyBaseText = () => {
    if (!article) return
    setTitle(article.title)
    setContent(article.content)
  }

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLang(langCode)
    const translation = translations.find((t) => t.languageCode === langCode)
    if (translation) {
      setSelectedTranslation(translation)
      setTitle(translation.title || "")
      setContent(translation.content || "")
      setSlug(translation.slug || "")
      setStatus(translation.status)
    } else {
      setSelectedTranslation(null)
      setTitle("")
      setContent("")
      setSlug("")
      setStatus("draft")
    }
    setViewMode("editor")
    router.push(`/wiki/${slug}/translate?lang=${langCode}`)
  }

  // Generate slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    // Auto-generate slug if empty
    if (!slug && newTitle) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSave = async () => {
    if (!article || !user || !selectedLang) return

    setIsSaving(true)

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300))

    const baseLang = getBaseLanguage(article)
    if (selectedLang === baseLang) {
      setIsSaving(false)
      return
    }

    const translationData: WikiTranslation = {
      id: selectedTranslation?.id || `trans-${Date.now()}`,
      articleId: article.id,
      languageCode: selectedLang,
      slug: slug || undefined,
      title: title || undefined,
      content: content || undefined,
      status,
      translatorId: user.id,
      baseVersion: article.updatedAt,
      createdAt: selectedTranslation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (selectedTranslation) {
      updateWikiTranslation(translationData)
    } else {
      createWikiTranslation(translationData)
    }

    // Refresh translations list
    const updatedTranslations = getWikiTranslationsByArticleId(article.id)
    setTranslations(updatedTranslations)
    setSelectedTranslation(translationData)

    setIsSaving(false)
  }

  if (isLoading || !article) {
    return <LoadingSpinner fullScreen />
  }

  const baseLang = getBaseLanguage(article)
  const progress = selectedTranslation
    ? getTranslationProgress(article, selectedTranslation)
    : 0
  const isIncomplete = selectedTranslation
    ? isTranslationIncomplete(article, selectedTranslation)
    : true

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/wiki/${slug}`} label="Back to Article" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translate: {article.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="language-select">Target Language</Label>
              <Select value={selectedLang} onValueChange={handleLanguageSelect}>
                <SelectTrigger id="language-select" className="w-[200px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.filter((lang) => lang.code !== baseLang).map(
                    (lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {selectedLang && (
                <Badge variant="secondary">
                  Base: {SUPPORTED_LANGUAGES.find((l) => l.code === baseLang)?.name || baseLang}
                </Badge>
              )}
            </div>

            {selectedLang && (
              <>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyBaseText}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Base Text
                  </Button>
                  {selectedTranslation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDiff(!showDiff)}
                    >
                      <Diff className="h-4 w-4 mr-2" />
                      {showDiff ? "Hide" : "Show"} Diff View
                    </Button>
                  )}
                </div>

                {selectedTranslation && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Progress:</span>
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    {isIncomplete && (
                      <Badge variant="outline" className="text-yellow-600">
                        Incomplete
                      </Badge>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedLang && (
        <>
          {viewMode === "side-by-side" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Side-by-Side Translation</span>
                  <Badge className={STATUS_COLORS[status]}>
                    {(() => {
                      const Icon = STATUS_ICONS[status]
                      return <Icon className="h-3 w-3 mr-1" />
                    })()}
                    {status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === baseLang)?.name || baseLang} (Base)
                      </Label>
                      <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold mb-2">{article.title}</h3>
                        <div className="text-sm whitespace-pre-wrap">{article.content}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name || selectedLang} (Translation)
                      </Label>
                      <div className="mt-2 p-4 border rounded-lg bg-background">
                        <Input
                          value={title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder={article.title}
                          className="mb-2 font-semibold"
                        />
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={article.content}
                          className="min-h-[300px] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "diff" && selectedTranslation && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Diff View</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactDiffViewer
                  oldValue={article.content}
                  newValue={content || article.content}
                  splitView={true}
                  leftTitle="Base Language"
                  rightTitle={`Translation (${SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name || selectedLang})`}
                />
              </CardContent>
            </Card>
          )}

          {viewMode === "editor" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Translation Editor</span>
                  <Badge className={STATUS_COLORS[status]}>
                    {(() => {
                      const Icon = STATUS_ICONS[status]
                      return <Icon className="h-3 w-3 mr-1" />
                    })()}
                    {status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="translation-slug">Slug (URL-friendly identifier)</Label>
                  <Input
                    id="translation-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={article.slug}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Custom slug for this translation. If empty, will be generated from title.
                  </p>
                </div>

                <div>
                  <Label htmlFor="translation-title">Title</Label>
                  <Input
                    id="translation-title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder={article.title}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="translation-content">Content</Label>
                  <Textarea
                    id="translation-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={article.content}
                    className="mt-1 min-h-[400px] font-mono text-sm"
                    rows={20}
                  />
                </div>

                <div>
                  <Label htmlFor="translation-status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as TranslationStatus)}>
                    <SelectTrigger id="translation-status" className="w-[200px] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Draft
                        </div>
                      </SelectItem>
                      <SelectItem value="review">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Review
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Published
                        </div>
                      </SelectItem>
                      <SelectItem value="outdated">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Outdated
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {status === "draft" && "Work in progress, not visible to users"}
                    {status === "review" && "Awaiting review before publication"}
                    {status === "published" && "Live and visible to users"}
                    {status === "outdated" && "Needs update due to base article changes"}
                  </p>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Translation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Translator</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {translations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No translations yet
                  </TableCell>
                </TableRow>
              ) : (
                translations.map((translation) => {
                  const lang = SUPPORTED_LANGUAGES.find(
                    (l) => l.code === translation.languageCode,
                  )
                  const translator = translation.translatorId
                    ? getUserById(translation.translatorId)
                    : null
                  const progress = getTranslationProgress(article, translation)

                  return (
                    <TableRow
                      key={translation.id}
                      className={cn(
                        selectedTranslation?.id === translation.id && "bg-muted",
                      )}
                    >
                      <TableCell className="font-medium">
                        {lang?.name || translation.languageCode}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {translation.slug || article.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[translation.status]}
                        >
                          {(() => {
                            const Icon = STATUS_ICONS[translation.status]
                            return <Icon className="h-3 w-3 mr-1" />
                          })()}
                          {translation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                              role="progressbar"
                              aria-valuenow={progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {translator ? translator.fullName : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {new Date(translation.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLanguageSelect(translation.languageCode)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

