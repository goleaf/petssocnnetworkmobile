"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FormActions } from "@/components/ui/form-actions"
import { X, Lock, Eye, EyeOff, Save, Loader2, AlertCircle, CheckCircle2, GraduationCap, Heart, HeartHandshake, UtensilsCrossed } from "lucide-react"
import type { Group, GroupType, GroupVisibilitySettings, GroupContentVisibility } from "@/lib/types"
import { getGroupCategories, updateGroup, generateGroupSlug, getDefaultGroupVisibility } from "@/lib/storage"
import { getAnimalConfigLucide } from "@/lib/animal-types"
import { Switch } from "@/components/ui/switch"

interface GroupSettingsProps {
  group: Group
  onSave: (updatedGroup: Group) => void
  onCancel: () => void
}

// Map category IDs to animal types or custom icons
const getCategoryIcon = (categoryId: string) => {
  // Map specific categories to animal types
  const categoryToAnimalMap: Record<string, string> = {
    "cat-dogs": "dog",
    "cat-cats": "cat",
    "cat-birds": "bird",
    "cat-small-pets": "rabbit",
  }
  
  const animalType = categoryToAnimalMap[categoryId]
  if (animalType) {
    return getAnimalConfigLucide(animalType)
  }
  
  // Map non-animal categories to icons
  const customIconMap: Record<string, { icon: any; color: string }> = {
    "cat-training": { icon: GraduationCap, color: "text-red-500" },
    "cat-health": { icon: Heart, color: "text-pink-500" },
    "cat-adoption": { icon: HeartHandshake, color: "text-orange-500" },
    "cat-nutrition": { icon: UtensilsCrossed, color: "text-cyan-500" },
  }
  
  return customIconMap[categoryId]
}

export function GroupSettings({ group, onSave, onCancel }: GroupSettingsProps) {
  const categories = getGroupCategories()
  const resolveVisibility = (type: GroupType, visibility?: GroupVisibilitySettings): GroupVisibilitySettings => {
    if (type === "secret") {
      return { discoverable: false, content: "members" }
    }
    if (!visibility) {
      return getDefaultGroupVisibility(type)
    }
    return {
      discoverable: visibility.discoverable,
      content: visibility.content,
    }
  }
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    type: group.type,
    categoryId: group.categoryId,
    coverImage: group.coverImage || "",
    avatar: group.avatar || "",
    tags: group.tags || [],
    rules: group.rules || [],
    visibility: resolveVisibility(group.type, group.visibility),
  })

  const [newTag, setNewTag] = useState("")
  const [newRule, setNewRule] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "name":
        if (!value || value.trim().length === 0) {
          return "Group name is required"
        }
        if (value.trim().length < 3) {
          return "Group name must be at least 3 characters"
        }
        if (value.trim().length > 100) {
          return "Group name must be less than 100 characters"
        }
        break
      case "description":
        if (!value || value.trim().length === 0) {
          return "Description is required"
        }
        if (value.trim().length < 10) {
          return "Description must be at least 10 characters"
        }
        if (value.trim().length > 500) {
          return "Description must be less than 500 characters"
        }
        break
      case "categoryId":
        if (!value) {
          return "Category is required"
        }
        break
    }
    return undefined
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      const nextType = updated.type
      const shouldResetVisibility = name === "type"
      updated.visibility = resolveVisibility(
        nextType,
        shouldResetVisibility ? undefined : updated.visibility,
      )
      return updated
    })
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleVisibilityChange = <K extends keyof GroupVisibilitySettings>(
    name: K,
    value: GroupVisibilitySettings[K],
  ) => {
    setFormData((prev) => {
      const current = resolveVisibility(prev.type, prev.visibility)
      const updatedVisibility = resolveVisibility(prev.type, {
        ...current,
        [name]: value,
      })
      return { ...prev, visibility: updatedVisibility }
    })
  }

  const handleAddTag = () => {
    if (!newTag.trim() || formData.tags.includes(newTag.trim())) return
    const updatedTags = [...formData.tags, newTag.trim()]
    setFormData((prev) => ({ ...prev, tags: updatedTags }))
    setNewTag("")
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleAddRule = () => {
    if (!newRule.trim()) return
    const updatedRules = [...formData.rules, newRule.trim()]
    setFormData((prev) => ({ ...prev, rules: updatedRules }))
    setNewRule("")
  }

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) {
        newErrors[key] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setMessage({ type: "error", text: "Please fix the errors before saving" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const slug = generateGroupSlug(formData.name)
      const updatedGroup: Group = {
        ...group,
        name: formData.name.trim(),
        slug,
        description: formData.description.trim(),
        type: formData.type,
        categoryId: formData.categoryId,
        coverImage: formData.coverImage.trim() || undefined,
        avatar: formData.avatar.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        rules: formData.rules.length > 0 ? formData.rules : undefined,
        visibility: resolveVisibility(formData.type, formData.visibility),
        updatedAt: new Date().toISOString(),
      }

      updateGroup(group.id, updatedGroup)
      onSave(updatedGroup)
      setMessage({ type: "success", text: "Group settings saved successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save group settings. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = () => {
    switch (formData.type) {
      case "closed":
        return <Lock className="h-4 w-4" />
      case "secret":
        return <EyeOff className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getTypeDescription = () => {
    switch (formData.type) {
      case "open":
        return "Anyone can view and join this group"
      case "closed":
        return "Anyone can view this group, but members must request to join"
      case "secret":
        return "This group is hidden from search and discovery. Only members can see it"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your group's basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Enter group name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Describe what your group is about"
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleFieldChange("categoryId", value)}
              >
                <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const iconConfig = getCategoryIcon(category.id)
                    const IconComponent = iconConfig?.icon
                    
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {IconComponent && (
                            <IconComponent className={`h-4 w-4 ${iconConfig.color || "text-muted-foreground"}`} />
                          )}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Group Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleFieldChange("type", value as GroupType)}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getTypeIcon()}
                      <span className="capitalize">{formData.type}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Open</div>
                        <div className="text-xs text-muted-foreground">
                          Anyone can view and join
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="closed">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Closed</div>
                        <div className="text-xs text-muted-foreground">
                          Visible, approval required
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="secret">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Secret</div>
                        <div className="text-xs text-muted-foreground">
                          Hidden, invite-only
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{getTypeDescription()}</p>
            </div>
          </div>
      </CardContent>
    </Card>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility &amp; Discovery</CardTitle>
          <CardDescription>Choose how your group appears and who can browse content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <Label>Discoverability</Label>
              <p className="text-sm text-muted-foreground">
                Allow this group to appear in search results and recommendations.
              </p>
              {formData.type === "secret" && (
                <p className="text-xs text-muted-foreground">
                  Secret groups are hidden from discovery for non-members.
                </p>
              )}
            </div>
            <Switch
              checked={formData.visibility.discoverable}
              onCheckedChange={(checked) => handleVisibilityChange("discoverable", checked)}
              disabled={isSubmitting || formData.type === "secret"}
              aria-label="Toggle group discoverability"
            />
          </div>

          <div className="space-y-2">
            <Label>Content Visibility</Label>
            <Select
              value={formData.visibility.content}
              onValueChange={(value) =>
                handleVisibilityChange("content", value as GroupContentVisibility)
              }
              disabled={isSubmitting || formData.type === "secret"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who can view content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex flex-col">
                    <span className="font-medium">Everyone</span>
                    <span className="text-xs text-muted-foreground">
                      Allow non-members to preview discussions before joining.
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="members">
                  <div className="flex flex-col">
                    <span className="font-medium">Members only</span>
                    <span className="text-xs text-muted-foreground">
                      Require membership to view posts, topics, and resources.
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.type === "secret" && (
              <p className="text-xs text-muted-foreground">
                Secret groups always keep their content restricted to members.
              </p>
            )}
            {formData.type !== "secret" && formData.visibility.content === "members" && (
              <p className="text-xs text-muted-foreground">
                Non-members will see a join prompt instead of full content.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>Set your group's cover image and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              value={formData.coverImage}
              onChange={(e) => handleFieldChange("coverImage", e.target.value)}
              placeholder="/path/to/cover-image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              URL to your group's cover image (recommended: 1200x400px)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={formData.avatar}
              onChange={(e) => handleFieldChange("avatar", e.target.value)}
              placeholder="/path/to/avatar.png"
            />
            <p className="text-xs text-muted-foreground">
              URL to your group's avatar (recommended: 200x200px)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Add tags to help people discover your group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
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
            <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Group Rules</CardTitle>
          <CardDescription>Set guidelines for your group members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Enter a rule"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddRule()
                }
              }}
            />
            <Button type="button" onClick={handleAddRule} variant="outline">
              Add
            </Button>
          </div>
          {formData.rules.length > 0 && (
            <ol className="list-decimal list-inside space-y-2">
              {formData.rules.map((rule, index) => (
                <li key={index} className="flex items-start justify-between gap-2">
                  <span>{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        align="right"
      />
    </form>
  )
}
