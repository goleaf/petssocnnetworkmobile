"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, X, Stethoscope } from "lucide-react"
import { ErrorText } from "@/components/ui/error-text"
import { healthInfoboxSchema, type HealthInfoboxInput } from "@/lib/schemas/health-infobox"
import { ZodIssue } from "zod"

interface HealthInfoboxFormProps {
  initialData?: HealthInfoboxInput
  onChange?: (data: HealthInfoboxInput) => void
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

export function HealthInfoboxForm({ initialData, onChange, errors }: HealthInfoboxFormProps) {
  const [formData, setFormData] = useState<HealthInfoboxInput>(() => ({
    conditionName: initialData?.conditionName || "",
    urgency: initialData?.urgency || "routine",
    symptoms: initialData?.symptoms || [],
    onsetAge: initialData?.onsetAge || "",
    commonInSpecies: initialData?.commonInSpecies || [],
    riskFactors: initialData?.riskFactors || [],
    diagnosisMethods: initialData?.diagnosisMethods || [],
    treatments: initialData?.treatments || [],
    prevention: initialData?.prevention || [],
    lastReviewedDate: initialData?.lastReviewedDate || "",
    expertReviewer: initialData?.expertReviewer || "",
    relatedConditions: initialData?.relatedConditions || [],
    severityLevel: initialData?.severityLevel || undefined,
  }))

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  React.useEffect(() => {
    onChange?.(formData)
    
    const result = healthInfoboxSchema.safeParse(formData)
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

  const handleFieldChange = (name: keyof HealthInfoboxInput, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeaderWithIcon
          title="Health Information"
          description="Details about this health condition"
          icon={Stethoscope}
        />
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <LabelWithTooltip htmlFor="conditionName" required tooltip="The name of the health condition">
              Condition Name
            </LabelWithTooltip>
            <Input
              id="conditionName"
              value={formData.conditionName || ""}
              onChange={(e) => handleFieldChange("conditionName", e.target.value)}
              placeholder="e.g., Canine Parvovirus"
              className={`h-10 ${displayErrors.conditionName ? "border-destructive" : ""}`}
            />
            {displayErrors.conditionName && <ErrorText>{displayErrors.conditionName}</ErrorText>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="urgency" required tooltip="How urgent this condition is">
                Urgency Level
              </LabelWithTooltip>
              <Select
                value={formData.urgency || "routine"}
                onValueChange={(value: any) => handleFieldChange("urgency", value)}
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
              <LabelWithTooltip htmlFor="severityLevel" tooltip="Severity of the condition">
                Severity Level
              </LabelWithTooltip>
              <Select
                value={formData.severityLevel ?? "__none"}
                onValueChange={(value: any) =>
                  handleFieldChange("severityLevel", value === "__none" ? undefined : value)
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="life-threatening">Life-threatening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="symptoms" required tooltip="Common symptoms of this condition">
              Symptoms
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.symptoms || []}
              onChange={(value) => handleFieldChange("symptoms", value)}
              placeholder="Add symptoms"
              error={displayErrors.symptoms}
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="riskFactors" tooltip="Factors that increase the risk of this condition">
              Risk Factors
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.riskFactors || []}
              onChange={(value) => handleFieldChange("riskFactors", value)}
              placeholder="Add risk factors"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="diagnosisMethods" tooltip="Methods used to diagnose this condition">
              Diagnosis Methods
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.diagnosisMethods || []}
              onChange={(value) => handleFieldChange("diagnosisMethods", value)}
              placeholder="Add diagnosis methods"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="treatments" tooltip="Treatment options for this condition">
              Treatments
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.treatments || []}
              onChange={(value) => handleFieldChange("treatments", value)}
              placeholder="Add treatments"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip htmlFor="prevention" tooltip="Ways to prevent this condition">
              Prevention
            </LabelWithTooltip>
            <ArrayTagInput
              value={formData.prevention || []}
              onChange={(value) => handleFieldChange("prevention", value)}
              placeholder="Add prevention methods"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelWithTooltip htmlFor="onsetAge" tooltip="Age when condition typically appears">
                Onset Age
              </LabelWithTooltip>
              <Input
                id="onsetAge"
                value={formData.onsetAge || ""}
                onChange={(e) => handleFieldChange("onsetAge", e.target.value)}
                placeholder="e.g., 6-12 months"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip htmlFor="commonInSpecies" tooltip="Species commonly affected">
                Common In Species
              </LabelWithTooltip>
              <ArrayTagInput
                value={(formData.commonInSpecies || []).map(s => s.toString())}
                onChange={(value) => handleFieldChange("commonInSpecies", value)}
                placeholder="Add species"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
