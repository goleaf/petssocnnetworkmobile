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
import { X, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, GraduationCap, Heart, HeartHandshake, UtensilsCrossed } from "lucide-react"
import type { GroupType, GroupCategory } from "@/lib/types"
import { getGroupCategories } from "@/lib/storage"
import { getAnimalConfigLucide } from "@/lib/animal-types"

export interface GroupFormData {
  name: string
  description: string
  type: GroupType
  categoryId: string
  subcategoryId?: string
  coverImage?: string
  avatar?: string
  tags: string[]
  rules: string[]
}

interface GroupFormProps {
  onSubmit: (data: GroupFormData) => void
  onCancel: () => void
  initialData?: Partial<GroupFormData>
  isLoading?: boolean
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

export function GroupForm({ onSubmit, onCancel, initialData, isLoading = false }: GroupFormProps) {
  const [categories, setCategories] = useState<GroupCategory[]>([])
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCategories(getGroupCategories())
    }
  }, [])
  const [formData, setFormData] = useState<GroupFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "open",
    categoryId: initialData?.categoryId || "",
    subcategoryId: initialData?.subcategoryId,
    coverImage: initialData?.coverImage || "",
    avatar: initialData?.avatar || "",
    tags: initialData?.tags || [],
    rules: initialData?.rules || [],
  })

  const [newTag, setNewTag] = useState("")
  const [newRule, setNewRule] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Get current category's subcategories
  const currentCategory = categories.find((cat) => cat.id === formData.categoryId)
  const subcategories = currentCategory?.subcategories || []

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
      // Clear subcategory if category changes
      if (name === "categoryId" && value !== prev.categoryId) {
        updated.subcategoryId = undefined
      }
      return updated
    })
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
    setMessage(null)
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
      if (key !== "subcategoryId" && key !== "coverImage" && key !== "avatar" && key !== "tags" && key !== "rules") {
        const error = validateField(key, formData[key as keyof typeof formData])
        if (error) {
          newErrors[key] = error
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setMessage({ type: "error", text: "Please fix the errors before submitting" })
      return
    }

    setMessage(null)
    onSubmit(formData)
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
          <CardDescription>Set up your group's basic information</CardDescription>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
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

            {formData.categoryId && subcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategoryId">Subcategory (Optional)</Label>
                <Select
                  value={formData.subcategoryId || ""}
                  onValueChange={(value) => handleFieldChange("subcategoryId", value || undefined)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">
                Group Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleFieldChange("type", value as GroupType)}
                disabled={isLoading}
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

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>Set your group's cover image and avatar (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              value={formData.coverImage}
              onChange={(e) => handleFieldChange("coverImage", e.target.value)}
              placeholder="/path/to/cover-image.jpg"
              disabled={isLoading}
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
              disabled={isLoading}
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
          <CardDescription>Add tags to help people discover your group (optional)</CardDescription>
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
              disabled={isLoading}
            />
            <Button type="button" onClick={handleAddTag} variant="outline" disabled={isLoading}>
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
                    disabled={isLoading}
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
          <CardDescription>Set guidelines for your group members (optional)</CardDescription>
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
              disabled={isLoading}
            />
            <Button type="button" onClick={handleAddRule} variant="outline" disabled={isLoading}>
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
                    disabled={isLoading}
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
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Group"
          )}
        </Button>
      </div>
    </form>
  )
}

