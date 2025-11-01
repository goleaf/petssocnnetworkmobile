"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { X, Pin, Lock, Save, Loader2, AlertCircle, Reply } from "lucide-react"
import { Input as TagInput } from "@/components/ui/input"
import type { GroupTopic } from "@/lib/types"

interface TopicCreatorProps {
  groupId: string
  parentTopicId?: string
  initialData?: GroupTopic
  onSubmit: (topic: Omit<GroupTopic, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
  canPin?: boolean
  canLock?: boolean
  isReply?: boolean
}

export function TopicCreator({
  groupId,
  parentTopicId,
  initialData,
  onSubmit,
  onCancel,
  canPin = false,
  canLock = false,
  isReply = false,
}: TopicCreatorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    isPinned: initialData?.isPinned || false,
    isLocked: initialData?.isLocked || false,
    tags: initialData?.tags || [],
  })

  const [newTag, setNewTag] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "title":
        if (!value || value.trim().length === 0) {
          return "Title is required"
        }
        if (value.trim().length < 5) {
          return "Title must be at least 5 characters"
        }
        if (value.trim().length > 200) {
          return "Title must be less than 200 characters"
        }
        break
      case "content":
        if (!value || value.trim().length === 0) {
          return "Content is required"
        }
        if (value.trim().length < 10) {
          return "Content must be at least 10 characters"
        }
        break
    }
    return undefined
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleAddTag = () => {
    const normalized = newTag.trim()
    if (!normalized) return
    const exists = formData.tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())
    if (exists) return
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, normalized] }))
    setNewTag("")
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      if (key === "tags") return
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) {
        newErrors[key] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedTags = Array.from(
        new Set(formData.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
      )

      onSubmit({
        groupId,
        parentTopicId,
        authorId: initialData?.authorId || "",
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPinned: formData.isPinned,
        isLocked: formData.isLocked,
        status: formData.isLocked ? "locked" : "active",
        viewCount: initialData?.viewCount || 0,
        commentCount: initialData?.commentCount || 0,
        reactions: initialData?.reactions,
        tags: normalizedTags.length > 0 ? normalizedTags : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simplified reply form
  if (isReply && parentTopicId) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Reply className="h-4 w-4" />
              Reply to Topic
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-2">
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              placeholder="Write your reply here..."
              rows={6}
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Reply className="h-4 w-4 mr-2" />
                  Post Reply
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    )
  }

  // Full form for creating/editing topics
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Topic" : "Create New Topic"}</CardTitle>
          <CardDescription>
            {parentTopicId
              ? "Create a reply to this topic"
              : "Start a new discussion in the group"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter topic title"
              className={errors.title ? "border-destructive" : ""}
              disabled={!!parentTopicId}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              placeholder="Write your topic content here..."
              rows={10}
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <TagInput
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
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
          </div>

          {/* Options */}
          {(canPin || canLock) && (
            <div className="space-y-3 pt-4 border-t">
              {canPin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pin className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="pin" className="cursor-pointer">
                      Pin this topic
                    </Label>
                  </div>
                  <Switch
                    id="pin"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isPinned", checked)
                    }
                  />
                </div>
              )}
              {canLock && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="lock" className="cursor-pointer">
                      Lock this topic
                    </Label>
                  </div>
                  <Switch
                    id="lock"
                    checked={formData.isLocked}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isLocked", checked)
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
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
                  {initialData ? "Update Topic" : "Create Topic"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
