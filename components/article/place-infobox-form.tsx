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
import { HelpCircle, X, MapPin } from "lucide-react"
import { ErrorText } from "@/components/ui/error-text"
import { placeInfoboxSchema, type PlaceInfoboxInput } from "@/lib/schemas/place-infobox"
import { ZodIssue } from "zod"

interface PlaceInfoboxFormProps {
  initialData?: PlaceInfoboxInput
  onChange?: (data: PlaceInfoboxInput) => void
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

export function PlaceInfoboxForm({ initialData, onChange, errors }: PlaceInfoboxFormProps) {
  const [formData, setFormData] = useState<PlaceInfoboxInput>(() => ({
    placeName: initialData?.placeName || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    state: initialData?.state || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    amenities: initialData?.amenities || [],
    rules: initialData?.rules || [],
    hazards: initialData?.hazards || [],
    fenced: initialData?.fenced || false,
    smallDogArea: initialData?.smallDogArea || false,
    waterStation: initialData?.waterStation || false,
    parkingInfo: initialData?.parkingInfo || "",
    images: initialData?.images || [],
    wheelchairAccessible: initialData?.wheelchairAccessible || false,
    publicTransitAccess: initialData?.publicTransitAccess || false,
    hours: initialData?.hours || "",
  }))

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  React.useEffect(() => {
    onChange?.(formData)
    
    const result = placeInfoboxSchema.safeParse(formData)
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

  const handleFieldChange = (name: keyof PlaceInfoboxInput, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value)
    handleFieldChange(name as keyof PlaceInfoboxInput, numValue)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeaderWithIcon
          title="Place Information"
          description="Details about this location"
          icon={MapPin}
        />
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="placeName" required tooltip="The name of this place">
              Place Name
            </LabelWithTooltip>
            <Input
              id="placeName"
              value={formData.placeName || ""}
              onChange={(e) => handleFieldChange("placeName", e.target.value)}
              placeholder="e.g., Central Park Dog Run"
              className={`h-10 ${displayErrors.placeName ? "border-destructive" : ""}`}
            />
            {displayErrors.placeName && <ErrorText>{displayErrors.placeName}</ErrorText>}
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="address" required tooltip="Street address">
              Address
            </LabelWithTooltip>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              placeholder="e.g., 123 Main Street"
              className={`h-10 ${displayErrors.address ? "border-destructive" : ""}`}
            />
            {displayErrors.address && <ErrorText>{displayErrors.address}</ErrorText>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="city" required tooltip="City name">
                City
              </LabelWithTooltip>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                className={`h-10 ${displayErrors.city ? "border-destructive" : ""}`}
              />
              {displayErrors.city && <ErrorText>{displayErrors.city}</ErrorText>}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="state" tooltip="State or province">
                State/Province
              </LabelWithTooltip>
              <Input
                id="state"
                value={formData.state || ""}
                onChange={(e) => handleFieldChange("state", e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="country" required tooltip="Country name">
                Country
              </LabelWithTooltip>
              <Input
                id="country"
                value={formData.country || ""}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                className={`h-10 ${displayErrors.country ? "border-destructive" : ""}`}
              />
              {displayErrors.country && <ErrorText>{displayErrors.country}</ErrorText>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="latitude" required tooltip="Latitude coordinate">
                Latitude
              </LabelWithTooltip>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || 0}
                onChange={(e) => handleNumberChange("latitude", e.target.value)}
                className={`h-10 ${displayErrors.latitude ? "border-destructive" : ""}`}
              />
              {displayErrors.latitude && <ErrorText>{displayErrors.latitude}</ErrorText>}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="longitude" required tooltip="Longitude coordinate">
                Longitude
              </LabelWithTooltip>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || 0}
                onChange={(e) => handleNumberChange("longitude", e.target.value)}
                className={`h-10 ${displayErrors.longitude ? "border-destructive" : ""}`}
              />
              {displayErrors.longitude && <ErrorText>{displayErrors.longitude}</ErrorText>}
            </div>
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="amenities" tooltip="Available amenities at this place">
              Amenities
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.amenities || []}
              onChange={(value) => handleFieldChange("amenities", value)}
              placeholder="Add amenities"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="rules" tooltip="Rules and regulations">
              Rules
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.rules || []}
              onChange={(value) => handleFieldChange("rules", value)}
              placeholder="Add rules"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="hazards" tooltip="Potential hazards at this location">
              Hazards
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.hazards || []}
              onChange={(value) => handleFieldChange("hazards", value)}
              placeholder="Add hazards"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fenced"
                checked={formData.fenced || false}
                onCheckedChange={(checked) => handleFieldChange("fenced", checked)}
              />
              <Label htmlFor="fenced" className="cursor-pointer">Fenced Area</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="smallDogArea"
                checked={formData.smallDogArea || false}
                onCheckedChange={(checked) => handleFieldChange("smallDogArea", checked)}
              />
              <Label htmlFor="smallDogArea" className="cursor-pointer">Small Dog Area</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="waterStation"
                checked={formData.waterStation || false}
                onCheckedChange={(checked) => handleFieldChange("waterStation", checked)}
              />
              <Label htmlFor="waterStation" className="cursor-pointer">Water Station</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="wheelchairAccessible"
                checked={formData.wheelchairAccessible || false}
                onCheckedChange={(checked) => handleFieldChange("wheelchairAccessible", checked)}
              />
              <Label htmlFor="wheelchairAccessible" className="cursor-pointer">Wheelchair Accessible</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="publicTransitAccess"
                checked={formData.publicTransitAccess || false}
                onCheckedChange={(checked) => handleFieldChange("publicTransitAccess", checked)}
              />
              <Label htmlFor="publicTransitAccess" className="cursor-pointer">Public Transit Access</Label>
            </div>
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="parkingInfo" tooltip="Parking information">
              Parking Information
            </LabelWithTooltip>
            <Input
              id="parkingInfo"
              value={formData.parkingInfo || ""}
              onChange={(e) => handleFieldChange("parkingInfo", e.target.value)}
              placeholder="e.g., Street parking available"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="hours" tooltip="Operating hours">
              Hours
            </LabelWithTooltip>
            <Input
              id="hours"
              value={formData.hours || ""}
              onChange={(e) => handleFieldChange("hours", e.target.value)}
              placeholder="e.g., 6 AM - 10 PM"
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
