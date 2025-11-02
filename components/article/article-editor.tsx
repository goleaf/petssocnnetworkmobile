"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TipTapEditor } from "./tiptap-editor"
import { BreedInfoboxForm } from "@/components/wiki/breed-infobox-form"
import { HealthInfoboxForm } from "./health-infobox-form"
import { PlaceInfoboxForm } from "./place-infobox-form"
import { ProductInfoboxForm } from "./product-infobox-form"
import type { BreedInfoboxInput } from "@/lib/schemas/breed-infobox"
import type { HealthInfoboxInput } from "@/lib/schemas/health-infobox"
import type { PlaceInfoboxInput } from "@/lib/schemas/place-infobox"
import type { ProductInfoboxInput } from "@/lib/schemas/product-infobox"
import { autoSaveDraft } from "@/lib/drafts"
import { Save, Loader2 } from "lucide-react"
import type { JSONContent } from "@tiptap/react"
import { useAuth } from "@/lib/auth"

export type ArticleType = "Breed" | "Health" | "Place" | "Product"

interface ArticleEditorProps {
  mode: "create" | "edit"
  articleType: ArticleType
  initialTitle?: string
  initialContent?: JSONContent | string
  initialInfobox?: BreedInfoboxInput | HealthInfoboxInput | PlaceInfoboxInput | ProductInfoboxInput
  draftId?: string
  onSubmit: (data: {
    title: string
    content: JSONContent
    infobox: BreedInfoboxInput | HealthInfoboxInput | PlaceInfoboxInput | ProductInfoboxInput | null
  }) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function ArticleEditor({
  mode,
  articleType,
  initialTitle = "",
  initialContent = "",
  initialInfobox,
  draftId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ArticleEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [content, setContent] = useState<JSONContent>(
    typeof initialContent === "string" ? { type: "doc", content: [] } : (initialContent as JSONContent || { type: "doc", content: [] })
  )
  const [infoboxData, setInfoboxData] = useState<
    BreedInfoboxInput | HealthInfoboxInput | PlaceInfoboxInput | ProductInfoboxInput | null
  >(initialInfobox || null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()

  // Autosave functionality
  const handleAutosave = useCallback(async () => {
    if (!title.trim() || !content) return

    setIsSaving(true)

    try {
      // Auto-save to drafts
      if (!user) return

      const draft = {
        id: draftId || `article-draft-${Date.now()}`,
        userId: user.id,
        type: "wiki" as const,
        title,
        content: JSON.stringify(content),
        metadata: {
          articleType,
          infobox: infoboxData,
        },
        lastSaved: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      autoSaveDraft(draft)
      setLastSaved(new Date())
    } catch (error) {
      console.error("Autosave failed:", error)
    } finally {
      setIsSaving(false)
    }
  }, [title, content, infoboxData, articleType, draftId, user])

  // Debounced autosave
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setTimeout(() => {
      handleAutosave()
    }, 2000) // Autosave after 2 seconds of inactivity

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [title, content, infoboxData, handleAutosave])

  const handleSubmit = async () => {
    if (!title.trim() || !content) return

    await onSubmit({
      title: title.trim(),
      content,
      infobox: infoboxData,
    })
  }

  const renderInfoboxForm = () => {
    switch (articleType) {
      case "Breed":
        return (
          <BreedInfoboxForm
            initialData={infoboxData as BreedInfoboxInput}
            onChange={(data) => setInfoboxData(data)}
          />
        )
      case "Health":
        return (
          <HealthInfoboxForm
            initialData={infoboxData as HealthInfoboxInput}
            onChange={(data) => setInfoboxData(data)}
          />
        )
      case "Place":
        return (
          <PlaceInfoboxForm
            initialData={infoboxData as PlaceInfoboxInput}
            onChange={(data) => setInfoboxData(data)}
          />
        )
      case "Product":
        return (
          <ProductInfoboxForm
            initialData={infoboxData as ProductInfoboxInput}
            onChange={(data) => setInfoboxData(data)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="title" required>
              Article Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor with Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Article Content</CardTitle>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">
              <TipTapEditor
                content={content}
                onChange={(newContent) => setContent(newContent)}
                placeholder="Start writing your article..."
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg p-6 min-h-[400px]">
                <TipTapEditor
                  content={content}
                  editable={false}
                  placeholder=""
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Infobox Form */}
      {renderInfoboxForm()}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !content}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Create Article" : "Save Changes"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

