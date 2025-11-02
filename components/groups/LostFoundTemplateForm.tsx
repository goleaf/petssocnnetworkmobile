"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { LostFoundTemplate, LostFoundField } from "@/lib/lost-found-templates"
import { createLostFoundPost } from "@/lib/lost-found-templates"
import { postToGroup } from "@/lib/groups"
import { useAuth } from "@/lib/auth"

interface LostFoundTemplateFormProps {
  template: LostFoundTemplate
  groupId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function LostFoundTemplateForm({
  template,
  groupId,
  onSuccess,
  onCancel,
}: LostFoundTemplateFormProps) {
  const { user } = useAuth()
  const [fieldData, setFieldData] = useState<Record<string, string | string[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFieldData((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    template.fields.forEach((field) => {
      if (field.required && !fieldData[field.id]) {
        newErrors[field.id] = `${field.label} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!user) {
      setErrors({ _general: "You must be logged in to post" })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const { title, content, tags } = createLostFoundPost(template, fieldData)

      const result = postToGroup({
        groupId,
        userId: user.id,
        title,
        content,
        tags,
      })

      if (result.success) {
        onSuccess?.()
      } else {
        setErrors({ _general: result.message || "Failed to create post" })
      }
    } catch (error) {
      setErrors({ _general: "An error occurred while creating the post" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: LostFoundField) => {
    const value = fieldData[field.id] || ""
    const hasError = !!errors[field.id]

    switch (field.type) {
      case "text":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? "border-destructive" : ""}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        )

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? "border-destructive" : ""}
              rows={4}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        )

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value as string}
              onValueChange={(val) => handleFieldChange(field.id, val)}
            >
              <SelectTrigger className={hasError ? "border-destructive" : ""}>
                <SelectValue placeholder={field.placeholder || "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        )

      case "date":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? "border-destructive" : ""}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        )

      case "location":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? "border-destructive" : ""}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        )

      case "file":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                // File handling would be implemented here
                // For now, just mark as filled if files are selected
                handleFieldChange(field.id, e.target.files?.length ? "files-selected" : "")
              }}
              className={hasError ? "border-destructive" : ""}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.title}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors._general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors._general}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {template.fields.map((field) => renderField(field))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Submitting..." : "Submit Lost Pet Report"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

