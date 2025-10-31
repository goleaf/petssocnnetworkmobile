"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, Loader2, AlertCircle, Calendar } from "lucide-react"
import type { GroupPoll, PollOption } from "@/lib/types"

interface PollCreatorProps {
  groupId: string
  topicId?: string
  initialData?: GroupPoll
  onSubmit: (poll: Omit<GroupPoll, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

export function PollCreator({
  groupId,
  topicId,
  initialData,
  onSubmit,
  onCancel,
}: PollCreatorProps) {
  const [formData, setFormData] = useState({
    question: initialData?.question || "",
    options: initialData?.options || [
      { id: "opt-1", text: "", voteCount: 0 },
      { id: "opt-2", text: "", voteCount: 0 },
    ] as PollOption[],
    allowMultiple: initialData?.allowMultiple || false,
    expiresAt: initialData?.expiresAt || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "question":
        if (!value || value.trim().length === 0) {
          return "Question is required"
        }
        if (value.trim().length < 5) {
          return "Question must be at least 5 characters"
        }
        if (value.trim().length > 200) {
          return "Question must be less than 200 characters"
        }
        break
      case "options":
        const validOptions = (value as PollOption[]).filter(
          (opt) => opt.text.trim().length > 0
        )
        if (validOptions.length < 2) {
          return "At least 2 options are required"
        }
        if (validOptions.length > 10) {
          return "Maximum 10 options allowed"
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

  const handleOptionChange = (index: number, text: string) => {
    const updatedOptions = [...formData.options]
    updatedOptions[index] = { ...updatedOptions[index], text }
    setFormData((prev) => ({ ...prev, options: updatedOptions }))
    const error = validateField("options", updatedOptions)
    setErrors((prev) => ({ ...prev, options: error }))
  }

  const handleAddOption = () => {
    if (formData.options.length >= 10) return
    const newOption: PollOption = {
      id: `opt-${Date.now()}`,
      text: "",
      voteCount: 0,
    }
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) return
    const updatedOptions = formData.options.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, options: updatedOptions }))
    const error = validateField("options", updatedOptions)
    setErrors((prev) => ({ ...prev, options: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty options
    const validOptions = formData.options
      .filter((opt) => opt.text.trim().length > 0)
      .map((opt) => ({ ...opt, text: opt.text.trim() }))

    // Validate
    const newErrors: Record<string, string> = {}
    const questionError = validateField("question", formData.question)
    if (questionError) newErrors.question = questionError
    
    const optionsError = validateField("options", validOptions)
    if (optionsError) newErrors.options = optionsError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      onSubmit({
        groupId,
        topicId,
        authorId: initialData?.authorId || "",
        question: formData.question.trim(),
        options: validOptions,
        allowMultiple: formData.allowMultiple,
        expiresAt: formData.expiresAt || undefined,
        isClosed: initialData?.isClosed || false,
        voteCount: initialData?.voteCount || 0,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Poll" : "Create New Poll"}</CardTitle>
          <CardDescription>
            Create a poll to gather opinions from group members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">
              Question <span className="text-destructive">*</span>
            </Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => handleFieldChange("question", e.target.value)}
              placeholder="What would you like to ask?"
              className={errors.question ? "border-destructive" : ""}
            />
            {errors.question && (
              <p className="text-sm text-destructive">{errors.question}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Options <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-sm text-destructive">{errors.options}</p>
            )}
            {formData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.options.length} / 10 options
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="multiple" className="cursor-pointer">
                Allow multiple selections
              </Label>
              <Switch
                id="multiple"
                checked={formData.allowMultiple}
                onCheckedChange={(checked) =>
                  handleFieldChange("allowMultiple", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => handleFieldChange("expiresAt", e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>
          </div>

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
                  {initialData ? "Update Poll" : "Create Poll"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

