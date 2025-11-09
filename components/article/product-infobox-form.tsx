"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, X, Package } from "lucide-react"
import { ErrorText } from "@/components/ui/error-text"
import { productInfoboxSchema, type ProductInfoboxInput } from "@/lib/schemas/product-infobox"
import { ZodIssue } from "zod"
import { useUnitSystem } from "@/lib/i18n/hooks"

interface ProductInfoboxFormProps {
  initialData?: ProductInfoboxInput
  onChange?: (data: ProductInfoboxInput) => void
  errors?: Record<string, string>
}

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

export function ProductInfoboxForm({ initialData, onChange, errors }: ProductInfoboxFormProps) {
  const unitSystem = useUnitSystem()
  const [formData, setFormData] = useState<ProductInfoboxInput>(() => ({
    productName: initialData?.productName || "",
    brand: initialData?.brand || "",
    category: initialData?.category || "other",
    shortDescription: initialData?.shortDescription || "",
    price: initialData?.price || undefined,
    currency: initialData?.currency || "USD",
    inStock: initialData?.inStock ?? true,
    availability: initialData?.availability || undefined,
    rating: initialData?.rating || undefined,
    reviewCount: initialData?.reviewCount || undefined,
    suitableForSpecies: initialData?.suitableForSpecies || [],
    size: initialData?.size || "",
    weight: initialData?.weight || "",
    material: initialData?.material || [],
    images: initialData?.images || [],
    safetyCertifications: initialData?.safetyCertifications || [],
    purchaseLinks: initialData?.purchaseLinks || [],
    tags: initialData?.tags || [],
  }))

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  React.useEffect(() => {
    onChange?.(formData)
    
    const result = productInfoboxSchema.safeParse(formData)
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

  const displayErrors = errors || validationErrors

  const handleFieldChange = (name: keyof ProductInfoboxInput, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: string) => {
    const numValue = value === "" ? undefined : Number(value)
    handleFieldChange(name as keyof ProductInfoboxInput, numValue)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeaderWithIcon
          title="Product Information"
          description="Details about this product"
          icon={Package}
        />
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="productName" required tooltip="The name of the product">
              Product Name
            </LabelWithTooltip>
            <Input
              id="productName"
              value={formData.productName || ""}
              onChange={(e) => handleFieldChange("productName", e.target.value)}
              placeholder="e.g., Interactive Puzzle Toy"
              className={`h-10 ${displayErrors.productName ? "border-destructive" : ""}`}
            />
            {displayErrors.productName && <ErrorText>{displayErrors.productName}</ErrorText>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="brand" tooltip="Product brand name">
                Brand
              </LabelWithTooltip>
              <Input
                id="brand"
                value={formData.brand || ""}
                onChange={(e) => handleFieldChange("brand", e.target.value)}
                placeholder="e.g., Brand Name"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="category" required tooltip="Product category">
                Category
              </LabelWithTooltip>
              <Select
                value={formData.category || "other"}
                onValueChange={(value: any) => handleFieldChange("category", value)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="toys">Toys</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="shortDescription" tooltip="Brief product description">
              Short Description
            </LabelWithTooltip>
            <Input
              id="shortDescription"
              value={formData.shortDescription || ""}
              onChange={(e) => handleFieldChange("shortDescription", e.target.value)}
              placeholder="Brief description"
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="price" tooltip="Product price">
                Price
              </LabelWithTooltip>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) => handleNumberChange("price", e.target.value)}
                placeholder="0.00"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="currency" tooltip="Currency code">
                Currency
              </LabelWithTooltip>
              <Input
                id="currency"
                value={formData.currency || "USD"}
                onChange={(e) => handleFieldChange("currency", e.target.value)}
                placeholder="USD"
                maxLength={3}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="availability" tooltip="Product availability">
                Availability
              </LabelWithTooltip>
              <Select
                value={formData.availability ?? "__none"}
                onValueChange={(value: any) =>
                  handleFieldChange("availability", value === "__none" ? undefined : value)
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  <SelectItem value="readily-available">Readily Available</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="rating" tooltip="Average rating (0-5)">
                Rating
              </LabelWithTooltip>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating || ""}
                onChange={(e) => handleNumberChange("rating", e.target.value)}
                placeholder="0.0"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="reviewCount" tooltip="Number of reviews">
                Review Count
              </LabelWithTooltip>
              <Input
                id="reviewCount"
                type="number"
                min="0"
                value={formData.reviewCount || ""}
                onChange={(e) => handleNumberChange("reviewCount", e.target.value)}
                placeholder="0"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="suitableForSpecies" tooltip="Species this product is suitable for">
              Suitable For Species
            </LabelWithTooltip>
            <ArrayTagInput
              value={(formData.suitableForSpecies || []).map(s => s.toString())}
              onChange={(value) => handleFieldChange("suitableForSpecies", value)}
              placeholder="Add species"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="size" tooltip="Product size">
                Size
              </LabelWithTooltip>
              <Input
                id="size"
                value={formData.size || ""}
                onChange={(e) => handleFieldChange("size", e.target.value)}
                placeholder="e.g., Large"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="weight" tooltip="Product weight. If you enter only a number, we’ll add your preferred unit.">
                Weight
              </LabelWithTooltip>
              <Input
                id="weight"
                value={formData.weight || ""}
                onChange={(e) => handleFieldChange("weight", e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value.trim()
                  if (!val) return
                  const numeric = Number(val)
                  const containsUnit = /[a-zA-Z]/.test(val)
                  if (!Number.isNaN(numeric) && !containsUnit) {
                    const suffix = unitSystem === "imperial" ? " lbs" : " kg"
                    handleFieldChange("weight", `${numeric}${suffix}`)
                  }
                }}
                placeholder={unitSystem === "imperial" ? "e.g., 2.5 lbs" : "e.g., 1.1 kg"}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Tip: enter a number and we’ll add {unitSystem === "imperial" ? "lbs" : "kg"} for you.</p>
            </div>
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="material" tooltip="Materials used in the product">
              Materials
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.material || []}
              onChange={(value) => handleFieldChange("material", value)}
              placeholder="Add materials"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="safetyCertifications" tooltip="Safety certifications">
              Safety Certifications
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.safetyCertifications || []}
              onChange={(value) => handleFieldChange("safetyCertifications", value)}
              placeholder="Add certifications"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="tags" tooltip="Search tags">
              Tags
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.tags || []}
              onChange={(value) => handleFieldChange("tags", value)}
              placeholder="Add tags"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={formData.inStock ?? true}
              onCheckedChange={(checked) => handleFieldChange("inStock", checked)}
            />
            <Label htmlFor="inStock" className="cursor-pointer">In Stock</Label>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
