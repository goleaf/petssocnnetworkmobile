"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorText } from "@/components/ui/error-text"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, X, HelpCircle, Sparkles } from "lucide-react"
import { breedInfoboxSchema, type BreedInfoboxInput } from "@/lib/schemas/breed-infobox"
import { useUnitSystem } from "@/lib/i18n/hooks"
import { useLocale } from "next-intl"
import { convertWeight, formatWeight } from "@/lib/i18n/formatting"
import { ZodError, ZodIssue } from "zod"

const UNSPECIFIED_SELECT_VALUE = "__unspecified"

interface BreedInfoboxFormProps {
  initialData?: BreedInfoboxInput
  onChange?: (data: BreedInfoboxInput) => void
  errors?: Record<string, string>
}

// Array Tag Input Component for tags
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
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}

// Label with tooltip component
function LabelWithTooltip({ htmlFor, tooltip, required, children }: {
  htmlFor?: string
  tooltip?: string
  required?: boolean
  children: React.ReactNode
}) {
  const labelContent = (
    <Label htmlFor={htmlFor} required={required} className="flex items-center gap-1.5">
      {children}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
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

export function BreedInfoboxForm({ initialData, onChange, errors }: BreedInfoboxFormProps) {
  const unitSystem = useUnitSystem()
  const locale = useLocale()
  const [formData, setFormData] = useState<BreedInfoboxInput>(() => ({
    species: initialData?.species || "dog",
    officialName: initialData?.officialName || "",
    aliases: initialData?.aliases || [],
    originCountry: initialData?.originCountry || "",
    sizeClass: initialData?.sizeClass || undefined,
    maleAvgWeightKg: initialData?.maleAvgWeightKg || undefined,
    femaleAvgWeightKg: initialData?.femaleAvgWeightKg || undefined,
    lifeExpectancyYears: initialData?.lifeExpectancyYears || undefined,
    coatType: initialData?.coatType || "",
    colorVariants: initialData?.colorVariants || [],
    activityNeeds: initialData?.activityNeeds || undefined,
    trainability: initialData?.trainability || undefined,
    shedding: initialData?.shedding || undefined,
    groomingFrequency: initialData?.groomingFrequency || undefined,
    temperamentTags: initialData?.temperamentTags || [],
    commonHealthRisks: initialData?.commonHealthRisks || [],
    careLevel: initialData?.careLevel || undefined,
    images: initialData?.images || [],
  }))

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Update parent when form data changes
  React.useEffect(() => {
    onChange?.(formData)
    
    // Validate on change
    const result = breedInfoboxSchema.safeParse(formData)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((issue: ZodIssue) => {
        const path = issue.path.join(".")
        newErrors[path] = issue.message
      })
      setValidationErrors(newErrors)
    } else {
      setValidationErrors({})
    }
  }, [formData, onChange])

  // Use external errors if provided
  const displayErrors = errors || validationErrors

  const handleFieldChange = (name: keyof BreedInfoboxInput, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: string) => {
    const numValue = value === "" ? undefined : Number(value)
    setFormData((prev) => ({ ...prev, [name]: numValue }))
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeaderWithIcon
          title="Breed Information"
          description="Detailed information about this breed"
          icon={Sparkles}
        />
        <CardContent className="space-y-6">
          {/* Species */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="species" required tooltip="Select the species this breed belongs to">
              Species
            </LabelWithTooltip>
            <Select
              value={formData.species || "dog"}
              onValueChange={(value: any) => handleFieldChange("species", value)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="hamster">Hamster</SelectItem>
                <SelectItem value="fish">Fish</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {displayErrors.species && <ErrorText>{displayErrors.species}</ErrorText>}
          </div>

          {/* Official Name */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="officialName" required tooltip="The official/recognized name of this breed">
              Official Name
            </LabelWithTooltip>
            <Input
              id="officialName"
              value={formData.officialName || ""}
              onChange={(e) => handleFieldChange("officialName", e.target.value)}
              placeholder="e.g., Golden Retriever"
              className={`h-10 ${displayErrors.officialName ? "border-destructive" : ""}`}
            />
            {displayErrors.officialName && <ErrorText>{displayErrors.officialName}</ErrorText>}
          </div>

          {/* Aliases */}
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="aliases"
              tooltip="Other names this breed is known by (e.g., Goldie, Golden)"
            >
              Aliases
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.aliases || []}
              onChange={(value) => handleFieldChange("aliases", value)}
              placeholder="Add alternative names"
            />
          </div>

          {/* Origin Country */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="originCountry" tooltip="The country or region where this breed originated">
              Origin Country
            </LabelWithTooltip>
            <Input
              id="originCountry"
              value={formData.originCountry || ""}
              onChange={(e) => handleFieldChange("originCountry", e.target.value)}
              placeholder="e.g., United Kingdom, Scotland"
              className="h-10"
            />
          </div>

          {/* Size Class and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="sizeClass" tooltip="General size classification">
                Size Class
              </LabelWithTooltip>
              <Select
                value={formData.sizeClass ?? UNSPECIFIED_SELECT_VALUE}
                onValueChange={(value: any) =>
                  handleFieldChange(
                    "sizeClass",
                    value === UNSPECIFIED_SELECT_VALUE ? undefined : value,
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Not specified</SelectItem>
                  <SelectItem value="toy">Toy</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="giant">Giant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="maleAvgWeightKg" tooltip="Average weight of adult males in kilograms">
                Male Avg Weight (kg)
              </LabelWithTooltip>
              <Input
                id="maleAvgWeightKg"
                type="number"
                step="0.1"
                value={formData.maleAvgWeightKg || ""}
                onChange={(e) => handleNumberChange("maleAvgWeightKg", e.target.value)}
                placeholder="e.g., 32"
                className="h-10"
              />
              {typeof formData.maleAvgWeightKg === 'number' && unitSystem === 'imperial' && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formatWeight(convertWeight(formData.maleAvgWeightKg, 'metric', 'imperial'), 'imperial', locale)}
                </p>
              )}
              {displayErrors.maleAvgWeightKg && <ErrorText>{displayErrors.maleAvgWeightKg}</ErrorText>}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="femaleAvgWeightKg" tooltip="Average weight of adult females in kilograms">
                Female Avg Weight (kg)
              </LabelWithTooltip>
              <Input
                id="femaleAvgWeightKg"
                type="number"
                step="0.1"
                value={formData.femaleAvgWeightKg || ""}
                onChange={(e) => handleNumberChange("femaleAvgWeightKg", e.target.value)}
                placeholder="e.g., 28"
                className="h-10"
              />
              {typeof formData.femaleAvgWeightKg === 'number' && unitSystem === 'imperial' && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formatWeight(convertWeight(formData.femaleAvgWeightKg, 'metric', 'imperial'), 'imperial', locale)}
                </p>
              )}
              {displayErrors.femaleAvgWeightKg && <ErrorText>{displayErrors.femaleAvgWeightKg}</ErrorText>}
            </div>
          </div>

          {/* Life Expectancy */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="lifeExpectancyYears" tooltip="Average lifespan in years">
              Life Expectancy (years)
            </LabelWithTooltip>
            <Input
              id="lifeExpectancyYears"
              type="number"
              step="0.5"
              value={formData.lifeExpectancyYears || ""}
              onChange={(e) => handleNumberChange("lifeExpectancyYears", e.target.value)}
              placeholder="e.g., 12"
              className="h-10"
            />
          </div>

          {/* Coat Type */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="coatType" tooltip="Type of coat (e.g., short, long, curly, double coat)">
              Coat Type
            </LabelWithTooltip>
            <Input
              id="coatType"
              value={formData.coatType || ""}
              onChange={(e) => handleFieldChange("coatType", e.target.value)}
              placeholder="e.g., Double coat, medium length"
              className="h-10"
            />
          </div>

          {/* Color Variants */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="colorVariants" tooltip="Common color variations of this breed">
              Color Variants
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.colorVariants || []}
              onChange={(value) => handleFieldChange("colorVariants", value)}
              placeholder="e.g., Golden, Cream, Dark Golden"
            />
          </div>

          {/* Activity Needs and Trainability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="activityNeeds" tooltip="Activity level required (1 = very low, 5 = very high)">
                Activity Needs (1-5)
              </LabelWithTooltip>
              <Select
                value={
                  formData.activityNeeds != null
                    ? formData.activityNeeds.toString()
                    : UNSPECIFIED_SELECT_VALUE
                }
                onValueChange={(value: any) =>
                  handleFieldChange(
                    "activityNeeds",
                    value === UNSPECIFIED_SELECT_VALUE ? undefined : Number(value),
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Not specified</SelectItem>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="trainability" tooltip="Ease of training (1 = very difficult, 5 = very easy)">
                Trainability (1-5)
              </LabelWithTooltip>
              <Select
                value={
                  formData.trainability != null
                    ? formData.trainability.toString()
                    : UNSPECIFIED_SELECT_VALUE
                }
                onValueChange={(value: any) =>
                  handleFieldChange(
                    "trainability",
                    value === UNSPECIFIED_SELECT_VALUE ? undefined : Number(value),
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Not specified</SelectItem>
                  <SelectItem value="1">1 - Very Difficult</SelectItem>
                  <SelectItem value="2">2 - Difficult</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Easy</SelectItem>
                  <SelectItem value="5">5 - Very Easy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shedding and Grooming */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="shedding" tooltip="Amount of shedding">
                Shedding
              </LabelWithTooltip>
              <Select
                value={formData.shedding ?? UNSPECIFIED_SELECT_VALUE}
                onValueChange={(value: any) =>
                  handleFieldChange(
                    "shedding",
                    value === UNSPECIFIED_SELECT_VALUE ? undefined : value,
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Not specified</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="groomingFrequency" tooltip="Recommended grooming frequency">
                Grooming Frequency
              </LabelWithTooltip>
              <Select
                value={formData.groomingFrequency ?? UNSPECIFIED_SELECT_VALUE}
                onValueChange={(value: any) =>
                  handleFieldChange(
                    "groomingFrequency",
                    value === UNSPECIFIED_SELECT_VALUE ? undefined : value,
                  )
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Not specified</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Temperament Tags */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="temperamentTags" tooltip="Common temperament traits of this breed">
              Temperament Tags
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.temperamentTags || []}
              onChange={(value) => handleFieldChange("temperamentTags", value)}
              placeholder="e.g., Friendly, Intelligent, Gentle"
            />
          </div>

          {/* Common Health Risks */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="commonHealthRisks" tooltip="Known health conditions to watch for">
              Common Health Risks
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.commonHealthRisks || []}
              onChange={(value) => handleFieldChange("commonHealthRisks", value)}
              placeholder="e.g., Hip Dysplasia, Obesity"
            />
          </div>

          {/* Care Level */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="careLevel" tooltip="Recommended experience level for owners">
              Care Level
            </LabelWithTooltip>
            <Select
              value={formData.careLevel ?? UNSPECIFIED_SELECT_VALUE}
              onValueChange={(value: any) =>
                handleFieldChange("careLevel", value === UNSPECIFIED_SELECT_VALUE ? undefined : value)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Not specified</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="images" tooltip="URLs to images of this breed">
              Images
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.images || []}
              onChange={(value) => handleFieldChange("images", value)}
              placeholder="https://example.com/image.jpg"
              error={displayErrors.images}
            />
            {displayErrors.images && <ErrorText>{displayErrors.images}</ErrorText>}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
