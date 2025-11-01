"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FormActions } from "@/components/ui/form-actions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { WikiArticle } from "@/lib/types"
import {
  Save,
  Loader2,
  FileText,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Stethoscope,
  GraduationCap,
  Apple,
  Brain,
  Sparkles,
  Heart,
  CheckCircle,
} from "lucide-react"
import { MarkdownEditor } from "@/components/markdown-editor"
import { ANIMAL_TYPES } from "@/lib/animal-types"
import { BrandAffiliationDisclosure } from "@/components/brand-affiliation-disclosure"
import type { HealthArticleData, UrgencyLevel } from "@/lib/types"

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

// Array Tag Input Component
function ArrayTagInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
}) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue("")
    } else if (trimmed && value.includes(trimmed)) {
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        className={`
          flex flex-wrap gap-2 p-2 min-h-[44px] border rounded-md bg-background 
          focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
          ${error ? "border-destructive" : "border-input"}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1 text-sm font-medium">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// Form Data Type
export interface WikiFormData {
  title: string
  category: WikiArticle["category"]
  subcategory?: string
  species?: string[]
  content: string
  coverImage?: string
  tags?: string[]
  brandAffiliation?: {
    disclosed: boolean
    organizationName?: string
    organizationType?: "brand" | "organization" | "sponsor" | "affiliate"
  }
  healthData?: HealthArticleData // Health-specific fields
}

interface WikiFormProps {
  mode: "create" | "edit"
  initialData?: Partial<WikiArticle>
  onSubmit: (data: WikiFormData) => Promise<void> | void
  onCancel?: () => void
}

// Validation errors type
interface ValidationErrors {
  [key: string]: string | undefined
}

// Subcategories for each category
const subcategoriesByCategory: Record<string, { value: string; label: string }[]> = {
  care: [
    { value: "daily-care", label: "Daily Care" },
    { value: "grooming", label: "Grooming" },
    { value: "exercise", label: "Exercise" },
    { value: "housing", label: "Housing" },
  ],
  health: [
    { value: "general-health", label: "General Health" },
    { value: "preventive-care", label: "Preventive Care" },
    { value: "common-illnesses", label: "Common Illnesses" },
    { value: "emergency-care", label: "Emergency Care" },
  ],
  training: [
    { value: "basic-training", label: "Basic Training" },
    { value: "advanced-training", label: "Advanced Training" },
    { value: "puppy-training", label: "Puppy Training" },
    { value: "behavior-modification", label: "Behavior Modification" },
  ],
  nutrition: [
    { value: "feeding-basics", label: "Feeding Basics" },
    { value: "special-diets", label: "Special Diets" },
    { value: "treats-supplements", label: "Treats & Supplements" },
    { value: "weight-management", label: "Weight Management" },
  ],
  behavior: [
    { value: "understanding-behavior", label: "Understanding Behavior" },
    { value: "problem-behaviors", label: "Problem Behaviors" },
    { value: "socialization", label: "Socialization" },
    { value: "communication", label: "Communication" },
  ],
  breeds: [
    { value: "dog-breeds", label: "Dog Breeds" },
    { value: "cat-breeds", label: "Cat Breeds" },
    { value: "breed-selection", label: "Breed Selection" },
    { value: "mixed-breeds", label: "Mixed Breeds" },
  ],
}

// Species options from global animal types
const speciesOptions = ANIMAL_TYPES.map((animal) => ({
  value: animal.value,
  label: animal.label,
  icon: animal.lucideIcon,
  color: animal.color,
  bgColor: animal.bgColor,
}))

// Category icons
const categoryIcons: Record<string, any> = {
  care: Heart,
  health: Stethoscope,
  training: GraduationCap,
  nutrition: Apple,
  behavior: Brain,
  breeds: Sparkles,
}

export function WikiForm({ mode, initialData, onSubmit, onCancel }: WikiFormProps) {
  const [formData, setFormData] = useState<WikiFormData>({
    title: initialData?.title || "",
    category: initialData?.category || "care",
    subcategory: initialData?.subcategory || "",
    species: initialData?.species || [],
    content: initialData?.content || "",
    coverImage: initialData?.coverImage || "",
    tags: initialData?.tags || [],
    brandAffiliation: initialData?.revisions?.[initialData.revisions.length - 1]?.brandAffiliation || {
      disclosed: false,
    },
    healthData: initialData?.healthData || (initialData?.category === "health" ? {
      symptoms: [],
      urgency: "routine",
      riskFactors: [],
      diagnosisMethods: [],
      treatments: [],
      prevention: [],
    } : undefined),
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Real-time validation
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "title":
        if (!value || value.trim().length === 0) {
          return "Article title is required"
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
          return "Article content is required"
        }
        if (value.trim().length < 50) {
          return "Content must be at least 50 characters"
        }
        break
      case "category":
        if (!value) {
          return "Category is required"
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
    
    // Clear subcategory if category changes
    if (name === "category" && formData.subcategory) {
      const newSubcategory = ""
      setFormData((prev) => ({ ...prev, subcategory: newSubcategory }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    const titleError = validateField("title", formData.title)
    if (titleError) newErrors.title = titleError

    const contentError = validateField("content", formData.content)
    if (contentError) newErrors.content = contentError

    const categoryError = validateField("category", formData.category)
    if (categoryError) newErrors.category = categoryError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await onSubmit(formData)
      setMessage({ 
        type: "success", 
        text: mode === "create" ? "Wiki article created successfully!" : "Wiki article updated successfully!" 
      })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : (mode === "create" ? "Failed to create article. Please try again." : "Failed to update article. Please try again.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableSubcategories = subcategoriesByCategory[formData.category] || []
  const CategoryIcon = categoryIcons[formData.category] || BookOpen

  const toggleSpecies = (speciesValue: string) => {
    const currentSpecies = formData.species || []
    if (currentSpecies.includes(speciesValue)) {
      setFormData({
        ...formData,
        species: currentSpecies.filter((s) => s !== speciesValue),
      })
    } else {
      setFormData({
        ...formData,
        species: [...currentSpecies, speciesValue],
      })
    }
  }

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

        <Card>
          <CardHeaderWithIcon
            title="Article Information"
            description="Basic details about your wiki article"
            icon={FileText}
          />
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="title" 
                required 
                tooltip="Enter a clear and descriptive title for your wiki article. This will be displayed on the article page and in search results."
              >
                Article Title
              </LabelWithTooltip>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Enter article title (e.g., How to Train Your Puppy)"
                className={`h-10 ${errors.title ? "border-destructive" : ""}`}
                required
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithTooltip 
                  htmlFor="category" 
                  required
                  tooltip="Select the main category that best fits your article topic."
                >
                  Category
                </LabelWithTooltip>
                <Select
                  value={formData.category}
                  onValueChange={(value: WikiArticle["category"]) => handleFieldChange("category", value)}
                >
                  <SelectTrigger className={`h-10 w-full ${errors.category ? "border-destructive" : ""}`}>
                    <SelectValue>
                      {(() => {
                        const Icon = CategoryIcon
                        const categoryLabels = {
                          care: "Care",
                          health: "Health",
                          training: "Training",
                          nutrition: "Nutrition",
                          behavior: "Behavior",
                          breeds: "Breeds",
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{categoryLabels[formData.category]}</span>
                          </div>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="care">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Care</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="health">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Health</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="training">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Training</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nutrition">
                      <div className="flex items-center gap-2">
                        <Apple className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Nutrition</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="behavior">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Behavior</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="breeds">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Breeds</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              {availableSubcategories.length > 0 && (
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="subcategory"
                    tooltip="Select a subcategory to help categorize your article more specifically."
                  >
                    Subcategory
                  </LabelWithTooltip>
                  <Select
                    value={formData.subcategory || ""}
                    onValueChange={(value) => handleFieldChange("subcategory", value || undefined)}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select subcategory (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableSubcategories.map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="species"
                tooltip="Select which species this article applies to. Leave empty if it applies to all species."
              >
                Applicable Species
              </LabelWithTooltip>
              <div className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background">
                {speciesOptions.map((species) => {
                  const isSelected = formData.species?.includes(species.value) || false
                  const IconComponent = species.icon
                  return (
                    <button
                      key={species.value}
                      type="button"
                      onClick={() => toggleSpecies(species.value)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-md border transition-all
                        ${isSelected 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-input hover:border-primary/50 hover:bg-accent"
                        }
                      `}
                    >
                      {IconComponent && (
                        <IconComponent className={`h-4 w-4 ${species.color}`} />
                      )}
                      <span className="text-sm font-medium">{species.label}</span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  )
                })}
              </div>
              {formData.species && formData.species.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {formData.species.length} {formData.species.length === 1 ? "species" : "species"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="coverImage"
                tooltip="Enter a URL for a cover image. This image will be displayed at the top of your article."
              >
                Cover Image URL
              </LabelWithTooltip>
              <Input
                id="coverImage"
                type="url"
                value={formData.coverImage || ""}
                onChange={(e) => handleFieldChange("coverImage", e.target.value || undefined)}
                placeholder="https://example.com/image.jpg"
                className="h-10"
              />
              {formData.coverImage && (
                <div className="mt-2 rounded-md overflow-hidden border border-input">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="tags"
                tooltip="Add tags to help users discover related articles and build the article link graph."
              >
                Tags
              </LabelWithTooltip>
              <ArrayTagInput
                value={formData.tags || []}
                onChange={(value) => handleFieldChange("tags", value)}
                placeholder="Enter tags (e.g., beginner, training, health)"
              />
            </div>

            {/* Health-specific fields */}
            {formData.category === "health" && (
              <Card>
                <CardHeaderWithIcon
                  title="Health Information"
                  description="Provide detailed health information for this condition"
                  icon={Stethoscope}
                />
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="urgency"
                      required
                      tooltip="Select the urgency level for this health condition."
                    >
                      Urgency Level
                    </LabelWithTooltip>
                    <Select
                      value={formData.healthData?.urgency || "routine"}
                      onValueChange={(value: UrgencyLevel) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            urgency: value,
                            symptoms: prev.healthData?.symptoms || [],
                            riskFactors: prev.healthData?.riskFactors || [],
                            diagnosisMethods: prev.healthData?.diagnosisMethods || [],
                            treatments: prev.healthData?.treatments || [],
                            prevention: prev.healthData?.prevention || [],
                          } as HealthArticleData,
                        }))
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="routine">Routine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="symptoms"
                      required
                      tooltip="List the symptoms associated with this condition. Press Enter or comma to add each symptom."
                    >
                      Symptoms
                    </LabelWithTooltip>
                    <ArrayTagInput
                      value={formData.healthData?.symptoms || []}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            symptoms: value,
                            urgency: prev.healthData?.urgency || "routine",
                            riskFactors: prev.healthData?.riskFactors || [],
                            diagnosisMethods: prev.healthData?.diagnosisMethods || [],
                            treatments: prev.healthData?.treatments || [],
                            prevention: prev.healthData?.prevention || [],
                          } as HealthArticleData,
                        }))
                      }}
                      placeholder="Enter symptoms (e.g., vomiting, lethargy, loss of appetite)"
                    />
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="onsetAge"
                      tooltip="The typical age when this condition appears (e.g., '6 months', 'senior')."
                    >
                      Onset Age
                    </LabelWithTooltip>
                    <Input
                      id="onsetAge"
                      value={formData.healthData?.onsetAge || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            onsetAge: e.target.value,
                            symptoms: prev.healthData?.symptoms || [],
                            urgency: prev.healthData?.urgency || "routine",
                            riskFactors: prev.healthData?.riskFactors || [],
                            diagnosisMethods: prev.healthData?.diagnosisMethods || [],
                            treatments: prev.healthData?.treatments || [],
                            prevention: prev.healthData?.prevention || [],
                          } as HealthArticleData,
                        }))
                      }}
                      placeholder="e.g., 6 months, senior, 1-3 years"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="riskFactors"
                      tooltip="List risk factors that may contribute to this condition."
                    >
                      Risk Factors
                    </LabelWithTooltip>
                    <ArrayTagInput
                      value={formData.healthData?.riskFactors || []}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            riskFactors: value,
                            symptoms: prev.healthData?.symptoms || [],
                            urgency: prev.healthData?.urgency || "routine",
                            diagnosisMethods: prev.healthData?.diagnosisMethods || [],
                            treatments: prev.healthData?.treatments || [],
                            prevention: prev.healthData?.prevention || [],
                          } as HealthArticleData,
                        }))
                      }}
                      placeholder="Enter risk factors (e.g., age, breed, obesity)"
                    />
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="diagnosisMethods"
                      tooltip="List methods used to diagnose this condition."
                    >
                      Diagnosis Methods
                    </LabelWithTooltip>
                    <ArrayTagInput
                      value={formData.healthData?.diagnosisMethods || []}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            diagnosisMethods: value,
                            symptoms: prev.healthData?.symptoms || [],
                            urgency: prev.healthData?.urgency || "routine",
                            riskFactors: prev.healthData?.riskFactors || [],
                            treatments: prev.healthData?.treatments || [],
                            prevention: prev.healthData?.prevention || [],
                          } as HealthArticleData,
                        }))
                      }}
                      placeholder="Enter diagnosis methods (e.g., blood test, X-ray, physical exam)"
                    />
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="treatments"
                      tooltip="List treatment options for this condition."
                    >
                      Treatments
                    </LabelWithTooltip>
                    <ArrayTagInput
                      value={formData.healthData?.treatments || []}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            treatments: value,
                            symptoms: prev.healthData?.symptoms || [],
                            urgency: prev.healthData?.urgency || "routine",
                            riskFactors: prev.healthData?.riskFactors || [],
                            diagnosisMethods: prev.healthData?.diagnosisMethods || [],
                            prevention: prev.healthData?.prevention || [],
                          } as HealthArticleData,
                        }))
                      }}
                      placeholder="Enter treatments (e.g., medication, surgery, dietary changes)"
                    />
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="prevention"
                      tooltip="List prevention strategies for this condition."
                    >
                      Prevention
                    </LabelWithTooltip>
                    <ArrayTagInput
                      value={formData.healthData?.prevention || []}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          healthData: {
                            ...prev.healthData,
                            prevention: value,
                            symptoms: prev.healthData?.symptoms || [],
                            urgency: prev.healthData?.urgency || "routine",
                            riskFactors: prev.healthData?.riskFactors || [],
                            diagnosisMethods: prev.healthData?.diagnosisMethods || [],
                            treatments: prev.healthData?.treatments || [],
                          } as HealthArticleData,
                        }))
                      }}
                      placeholder="Enter prevention methods (e.g., vaccination, regular checkups, diet)"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="content" 
                required
                tooltip="Write the main content of your article. You can use Markdown formatting for rich text. Minimum 50 characters required."
              >
                Article Content
              </LabelWithTooltip>
              <div className={`min-h-[400px] ${errors.content ? "border-destructive" : ""}`}>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => handleFieldChange("content", value)}
                  placeholder="Write your article content here... You can use Markdown formatting."
                />
              </div>
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
              <p className="text-xs text-muted-foreground">
                {formData.content.length} characters {formData.content.length < 50 && `(minimum 50 required)`}
              </p>
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
            submitLabel={mode === "create" ? "Create Article" : "Save Changes"}
            submittingLabel={mode === "create" ? "Creating..." : "Saving..."}
            isSubmitting={isSubmitting}
            fullWidth
            align="right"
          />
        </div>
      </form>
    </TooltipProvider>
  )
}

