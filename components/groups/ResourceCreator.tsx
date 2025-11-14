"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ErrorText } from "@/components/ui/error-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, Loader2, Link as LinkIcon, FileText, StickyNote } from "lucide-react"
import type { GroupResource } from "@/lib/types"

interface ResourceCreatorProps {
  groupId: string
  initialData?: GroupResource
  onSubmit: (resource: Omit<GroupResource, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

export function ResourceCreator({
  groupId,
  initialData,
  onSubmit,
  onCancel,
}: ResourceCreatorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    url: initialData?.url || "",
    type: initialData?.type || "link" as "link" | "file" | "note",
    tags: initialData?.tags || [] as string[],
  })

  const [tagInput, setTagInput] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "title":
        if (!value || value.trim().length === 0) {
          return "Title is required"
        }
        if (value.trim().length < 3) {
          return "Title must be at least 3 characters"
        }
        if (value.trim().length > 100) {
          return "Title must be less than 100 characters"
        }
        break
      case "description":
        if (value && value.trim().length > 500) {
          return "Description must be less than 500 characters"
        }
        break
      case "url":
        if (formData.type === "link" && (!value || value.trim().length === 0)) {
          return "URL is required for link resources"
        }
        if (value && value.trim().length > 0) {
          try {
            new URL(value)
          } catch {
            return "Please enter a valid URL"
          }
        }
        break
    }
    return undefined
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }))
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}
    const titleError = validateField("title", formData.title)
    if (titleError) newErrors.title = titleError

    const descriptionError = validateField("description", formData.description)
    if (descriptionError) newErrors.description = descriptionError

    const urlError = validateField("url", formData.url)
    if (urlError) newErrors.url = urlError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      onSubmit({
        groupId,
        createdBy: initialData?.createdBy || "",
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        url: formData.url.trim() || undefined,
        type: formData.type,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "link":
        return <LinkIcon className="h-4 w-4" />
      case "file":
        return <FileText className="h-4 w-4" />
      case "note":
        return <StickyNote className="h-4 w-4" />
      default:
        return <LinkIcon className="h-4 w-4" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Resource" : "Create New Resource"}</CardTitle>
          <CardDescription>
            Share helpful resources with group members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              Resource Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleFieldChange("type", value as "link" | "file" | "note")}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Link
                  </div>
                </SelectItem>
                <SelectItem value="file">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File
                  </div>
                </SelectItem>
                <SelectItem value="note">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Note
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter resource title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <ErrorText className="text-sm">{errors.title}</ErrorText>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Describe this resource"
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <ErrorText className="text-sm">{errors.description}</ErrorText>}
            <p className="text-xs text-muted-foreground">
              {formData.description.length} / 500 characters
            </p>
          </div>

          {(formData.type === "link" || formData.type === "file") && (
            <div className="space-y-2">
              <Label htmlFor="url">
                URL {formData.type === "link" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleFieldChange("url", e.target.value)}
                placeholder="https://example.com"
                className={errors.url ? "border-destructive" : ""}
              />
              {errors.url && <ErrorText className="text-sm">{errors.url}</ErrorText>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag"
                disabled={formData.tags.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.tags.length} / 10 tags
            </p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {initialData ? "Update Resource" : "Create Resource"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
