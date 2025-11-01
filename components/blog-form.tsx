"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FormActions } from "@/components/ui/form-actions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TagInput } from "@/components/ui/tag-input"
import { PrivacySelector } from "@/components/privacy-selector"
import { MarkdownEditor } from "@/components/markdown-editor"
import { MediaAttachmentsEditor } from "@/components/media-attachments-editor"
import { BrandAffiliationDisclosure } from "@/components/brand-affiliation-disclosure"
import type { BlogPost, BlogPostMedia, PrivacyLevel } from "@/lib/types"
import { normalizeCategoryList } from "@/lib/utils/categories"
import {
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Upload,
  Image as ImageIcon,
  Trash2,
  Globe,
  Users,
  Lock,
} from "lucide-react"

// Label with Tooltip Component
interface LabelWithTooltipProps {
  htmlFor?: string
  tooltip?: string
  required?: boolean
  children: React.ReactNode
}

function LabelWithTooltip({ htmlFor, tooltip, required, icon, children }: LabelWithTooltipProps & { icon?: any }) {
  const labelContent = (
    <Label htmlFor={htmlFor} required={required} icon={icon} className="flex items-center gap-1.5">
      {children}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Label>
  )

  return tooltip ? <TooltipProvider>{labelContent}</TooltipProvider> : labelContent
}

// Form Data Type
export interface BlogFormData {
  petId: string
  title: string
  content: string
  tags: string[]
  categories: string[]
  privacy: PrivacyLevel
  hashtags: string[]
  coverImage?: string
  media: BlogPostMedia
  brandAffiliation?: {
    disclosed: boolean
    organizationName?: string
    organizationType?: "brand" | "organization" | "sponsor" | "affiliate"
  }
}

interface BlogFormProps {
  mode: "create" | "edit"
  initialData?: Partial<BlogPost>
  pets: any[]
  onSubmit: (data: BlogFormData) => Promise<void> | void
  onCancel?: () => void
  onSaveDraft?: (data: BlogFormData) => void
  showDraftInfo?: boolean
  lastSaved?: string
}

// Validation errors type
interface ValidationErrors {
  [key: string]: string | undefined
}

// Minimum dimensions for blog cover images (16:9 aspect ratio)
const MIN_WIDTH = 1280
const MIN_HEIGHT = 720

export function BlogForm({ 
  mode, 
  initialData, 
  pets, 
  onSubmit, 
  onCancel,
  onSaveDraft,
  showDraftInfo = false,
  lastSaved,
}: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>({
    petId: initialData?.petId || (pets.length > 0 ? pets[0].id : ""),
    title: initialData?.title || "",
    content: initialData?.content || "",
    tags: initialData?.tags ? [...initialData.tags] : [],
    categories: initialData?.categories ? [...initialData.categories] : [],
    privacy: (initialData?.privacy || "public") as PrivacyLevel,
    hashtags: initialData?.hashtags ? [...initialData.hashtags] : [],
    coverImage: initialData?.coverImage || undefined,
    media: {
      images: initialData?.media?.images ? [...initialData.media.images] : [],
      videos: initialData?.media?.videos ? [...initialData.media.videos] : [],
      links: initialData?.media?.links ? initialData.media.links.map((link) => ({ ...link })) : [],
    },
    brandAffiliation: initialData?.brandAffiliation || {
      disclosed: false,
    },
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initialData?.coverImage || "")
  const [imageError, setImageError] = useState<string>("")
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Real-time validation
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "petId":
        if (!value || value.trim().length === 0) {
          return "Please select a pet"
        }
        break
      case "title":
        if (!value || value.trim().length === 0) {
          return "Post title is required"
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
          return "Post content is required"
        }
        if (value.trim().length < 50) {
          return "Content must be at least 50 characters"
        }
        break
    }
    return undefined
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
    if (message) setMessage(null)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    const petIdError = validateField("petId", formData.petId)
    if (petIdError) newErrors.petId = petIdError

    const titleError = validateField("title", formData.title)
    if (titleError) newErrors.title = titleError

    const contentError = validateField("content", formData.content)
    if (contentError) newErrors.content = contentError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file")
      return
    }

    setImageError("")
    const reader = new FileReader()

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      const img = new window.Image()
      img.onload = () => {
        const width = img.naturalWidth
        const height = img.naturalHeight

        setImageDimensions({ width, height })

        // Validate dimensions
        if (width < MIN_WIDTH || height < MIN_HEIGHT) {
          setImageError(
            `Image dimensions are too small. Minimum required: ${MIN_WIDTH}x${MIN_HEIGHT}px. Current: ${width}x${height}px`
          )
          setImagePreview("")
          setFormData((prev) => ({ ...prev, coverImage: undefined }))
          return
        }

        // Check if aspect ratio is approximately 16:9 (allow some tolerance)
        const aspectRatio = width / height
        const targetRatio = 16 / 9
        const tolerance = 0.1

        if (Math.abs(aspectRatio - targetRatio) > tolerance) {
          setImageError(
            `Image aspect ratio should be approximately 16:9 (width:height). Current ratio: ${aspectRatio.toFixed(2)}:1, recommended: 1.78:1`
          )
          // Still allow upload, but show warning
        } else {
          setImageError("")
        }

        setImagePreview(dataUrl)
        setFormData((prev) => ({ ...prev, coverImage: dataUrl }))
      }

      img.onerror = () => {
        setImageError("Failed to load image. Please try another file.")
      }

      img.src = dataUrl
    }

    reader.onerror = () => {
      setImageError("Failed to read file. Please try again.")
    }

    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, coverImage: undefined }))
    setImagePreview("")
    setImageDimensions(null)
    setImageError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Auto-save draft (only for create mode)
  useEffect(() => {
    if (mode === "create" && onSaveDraft && formData.title) {
      const timer = setTimeout(() => {
        onSaveDraft(formData)
      }, 2000) // Autosave after 2 seconds of inactivity

      return () => clearTimeout(timer)
    }
  }, [formData, mode, onSaveDraft])

  // Extract hashtags from content
  useEffect(() => {
    const hashtagMatches = formData.content.match(/#\w+/g) || []
    const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
    const manualHashtags = formData.hashtags || []
    const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]
    
    if (allHashtags.length !== formData.hashtags.length || 
        !allHashtags.every(tag => formData.hashtags.includes(tag))) {
      // Hashtags changed, but we'll let user manage manual hashtags separately
      // Auto-detected hashtags from content are handled in submit
    }
  }, [formData.content, formData.hashtags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const sanitizedCategories = normalizeCategoryList(formData.categories)
      const payload: BlogFormData = {
        ...formData,
        categories: sanitizedCategories,
      }
      await onSubmit(payload)
      setFormData((prev) => ({ ...prev, categories: sanitizedCategories }))
      setMessage({ 
        type: "success", 
        text: mode === "create" ? "Blog post created successfully!" : "Blog post updated successfully!" 
      })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : (mode === "create" ? "Failed to create post. Please try again." : "Failed to update post. Please try again.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPet = pets.find((p) => p.id === formData.petId)
  const privacyIcons = {
    public: Globe,
    "followers-only": Users,
    private: Lock,
  }
  const PrivacyIcon = privacyIcons[formData.privacy] || Globe

  return (
    <TooltipProvider delayDuration={300}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success/Error Message */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Draft Info */}
        {showDraftInfo && lastSaved && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Draft Auto-saved</AlertTitle>
            <AlertDescription>Last saved at {lastSaved}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeaderWithIcon
            title="Post Information"
            description="Basic details about your blog post"
            icon={FileText}
          />
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip 
                  htmlFor="petId" 
                  required
                  tooltip="Select which pet this blog post is about."
                >
                  Select Pet
                </LabelWithTooltip>
                <Select 
                  value={formData.petId} 
                  onValueChange={(value) => handleFieldChange("petId", value)}
                >
                  <SelectTrigger className={`h-10 w-full ${errors.petId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select a pet">
                      {selectedPet ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 flex-shrink-0">
                            <AvatarImage src={selectedPet.avatar || "/placeholder.svg"} alt={selectedPet.name} />
                            <AvatarFallback className="text-xs">{selectedPet.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{selectedPet.name}</span>
                        </div>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                            <AvatarFallback className="text-xs">{pet.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{pet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.petId && <p className="text-xs text-destructive">{errors.petId}</p>}
              </div>

              <div className="space-y-2">
                <LabelWithTooltip 
                  htmlFor="privacy"
                  tooltip="Control who can see your blog post. Public: anyone, Friends Only: your friends, Private: only you."
                >
                  Privacy
                </LabelWithTooltip>
                <PrivacySelector
                  value={formData.privacy}
                  onChange={(value) => handleFieldChange("privacy", value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="title" 
                required 
                tooltip="Enter a catchy title for your blog post. This will be displayed prominently."
              >
                Title
              </LabelWithTooltip>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Give your post a catchy title"
                className={`h-10 ${errors.title ? "border-destructive" : ""}`}
                required
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="coverImage"
                tooltip={`Upload a cover image for your blog post. Minimum dimensions: ${MIN_WIDTH}x${MIN_HEIGHT}px (16:9 aspect ratio recommended).`}
              >
                Cover Image
              </LabelWithTooltip>
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-input bg-muted">
                    <img src={imagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    {imageDimensions && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {imageDimensions.width} × {imageDimensions.height}px
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="coverImage"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="h-10 w-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Minimum: {MIN_WIDTH}×{MIN_HEIGHT}px (16:9 aspect ratio)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="coverImage"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              )}
              {imageError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
              {imageDimensions && !imageError && imageDimensions.width >= MIN_WIDTH && imageDimensions.height >= MIN_HEIGHT && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Image dimensions meet requirements ({imageDimensions.width}×{imageDimensions.height}px)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="content" 
                required
                tooltip="Write the main content of your blog post. You can use Markdown formatting for rich text. Minimum 50 characters required. Hashtags in content (#tag) will be automatically detected."
              >
                Content
              </LabelWithTooltip>
              <div className={`min-h-[400px] ${errors.content ? "border-destructive" : ""}`}>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => handleFieldChange("content", value)}
                  placeholder="Share your story... Use markdown for formatting. Add hashtags with #tag"
                />
              </div>
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
              <p className="text-xs text-muted-foreground">
                {formData.content.length} characters {formData.content.length < 50 && `(minimum 50 required)`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip
                  htmlFor="categories"
                  tooltip="Create or select categories to help organize your post. Categories power the blog filters."
                >
                  Categories
                </LabelWithTooltip>
                <TagInput
                  value={formData.categories.join(", ")}
                  onChange={(value) => {
                    const categories = normalizeCategoryList(
                      value
                        .split(",")
                        .map((category) => category.trim())
                        .filter((category) => category),
                    )
                    handleFieldChange("categories", categories)
                  }}
                  placeholder="Adventure, Training, Funny"
                />
              </div>

              <div className="space-y-2">
                <LabelWithTooltip 
                  htmlFor="tags"
                  tooltip="Add tags to help categorize your post. Separate multiple tags with commas. Tags help others discover your content."
                >
                  Tags
                </LabelWithTooltip>
                <TagInput
                  value={formData.tags.join(", ")}
                  onChange={(value) => {
                    const tags = value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag)
                    handleFieldChange("tags", tags)
                  }}
                  placeholder="adventure, training, funny"
                />
              </div>

              <div className="space-y-2">
                <LabelWithTooltip 
                  htmlFor="hashtags"
                  tooltip="Add hashtags manually. Hashtags in your content (#tag) will be automatically detected and combined with these. Separate multiple hashtags with commas."
                >
                  Hashtags
                </LabelWithTooltip>
                <TagInput
                  value={formData.hashtags.join(", ")}
                  onChange={(value) => {
                    const hashtags = value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag)
                    handleFieldChange("hashtags", hashtags)
                  }}
                  placeholder="dogs, puppylove, goldenretriever"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <LabelWithTooltip
                tooltip="Attach optional photos, videos, and helpful resources to give your audience more ways to engage with your story."
              >
                Rich Media Attachments
              </LabelWithTooltip>
              <MediaAttachmentsEditor
                className="mt-3"
                media={formData.media}
                onChange={(updatedMedia) => {
                  const clonedMedia: BlogPostMedia = {
                    images: [...updatedMedia.images],
                    videos: [...updatedMedia.videos],
                    links: updatedMedia.links.map((link) => ({ ...link })),
                  }
                  setFormData((prev) => ({ ...prev, media: clonedMedia }))
                  if (message) {
                    setMessage(null)
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Affiliation Disclosure */}
        {mode === "edit" && (
          <BrandAffiliationDisclosure
            value={formData.brandAffiliation || { disclosed: false }}
            onChange={(affiliation) => setFormData((prev) => ({ ...prev, brandAffiliation: affiliation }))}
            showReminder={true}
            className="mt-6"
          />
        )}

        {/* Submit Buttons */}
        <div className="mt-6 pt-6">
          <FormActions
            onCancel={onCancel}
            submitLabel={mode === "create" ? "Publish Post" : "Save Changes"}
            submittingLabel={mode === "create" ? "Publishing..." : "Saving..."}
            isSubmitting={isSubmitting}
            fullWidth
            align="right"
          />
        </div>
      </form>
    </TooltipProvider>
  )
}
