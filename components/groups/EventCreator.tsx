"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, AlertCircle, Calendar, MapPin, Users, Image } from "lucide-react"
import type { GroupEvent } from "@/lib/types"

interface EventCreatorProps {
  groupId: string
  initialData?: GroupEvent
  onSubmit: (event: Omit<GroupEvent, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

export function EventCreator({
  groupId,
  initialData,
  onSubmit,
  onCancel,
}: EventCreatorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().slice(0, 16)
      : "",
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().slice(0, 16)
      : "",
    location: initialData?.location || "",
    locationUrl: initialData?.locationUrl || "",
    rsvpRequired: initialData?.rsvpRequired || false,
    maxAttendees: initialData?.maxAttendees?.toString() || "",
    coverImage: initialData?.coverImage || "",
    isCancelled: initialData?.isCancelled || false,
    locationSharingEnabled: initialData?.locationSharingEnabled || false,
    locationSharingDescription: initialData?.locationSharingDescription || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "title":
        if (!value || value.trim().length === 0) {
          return "Title is required"
        }
        if (value.trim().length < 5) {
          return "Title must be at least 5 characters"
        }
        if (value.trim().length > 200) {
          return "Title must be less than 200 characters"
        }
        break
      case "description":
        if (!value || value.trim().length === 0) {
          return "Description is required"
        }
        if (value.trim().length < 10) {
          return "Description must be at least 10 characters"
        }
        break
      case "startDate":
        if (!value) {
          return "Start date is required"
        }
        break
      case "endDate":
        if (value && formData.startDate) {
          const start = new Date(formData.startDate)
          const end = new Date(value)
          if (end <= start) {
            return "End date must be after start date"
          }
        }
        break
      case "maxAttendees":
        if (value && formData.rsvpRequired) {
          const num = parseInt(value, 10)
          if (isNaN(num) || num < 1) {
            return "Max attendees must be a positive number"
          }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      if (key === "isCancelled") return
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) {
        newErrors[key] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      onSubmit({
        groupId,
        authorId: initialData?.authorId || "",
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        location: formData.location.trim() || undefined,
        locationUrl: formData.locationUrl.trim() || undefined,
        rsvpRequired: formData.rsvpRequired,
        maxAttendees: formData.rsvpRequired && formData.maxAttendees
          ? parseInt(formData.maxAttendees, 10)
          : undefined,
        coverImage: formData.coverImage.trim() || undefined,
        attendeeCount: initialData?.attendeeCount || 0,
        isCancelled: formData.isCancelled,
        locationSharingEnabled: formData.locationSharingEnabled,
        locationSharingDescription: formData.locationSharingEnabled
          ? formData.locationSharingDescription.trim() || undefined
          : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Event" : "Create New Event"}</CardTitle>
          <CardDescription>
            Schedule an event for your group members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Event title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
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
              placeholder="Describe your event..."
              rows={6}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time (optional)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleFieldChange("endDate", e.target.value)}
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              placeholder="Event location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationUrl">Location URL (optional)</Label>
            <Input
              id="locationUrl"
              type="url"
              value={formData.locationUrl}
              onChange={(e) => handleFieldChange("locationUrl", e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="locationSharing">Enable attendee location sharing</Label>
              <Switch
                id="locationSharing"
                checked={formData.locationSharingEnabled}
                onCheckedChange={(checked) => handleFieldChange("locationSharingEnabled", checked)}
              />
            </div>
            {formData.locationSharingEnabled && (
              <div className="space-y-2">
                <Label htmlFor="locationSharingDescription">
                  Guidance for attendees (optional)
                </Label>
                <Textarea
                  id="locationSharingDescription"
                  value={formData.locationSharingDescription}
                  onChange={(e) => handleFieldChange("locationSharingDescription", e.target.value)}
                  placeholder="Let attendees know how location sharing will be used or where to meet."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
            <Input
              id="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={(e) => handleFieldChange("coverImage", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="rsvp" className="cursor-pointer">
                Require RSVP
              </Label>
              <Switch
                id="rsvp"
                checked={formData.rsvpRequired}
                onCheckedChange={(checked) =>
                  handleFieldChange("rsvpRequired", checked)
                }
              />
            </div>

            {formData.rsvpRequired && (
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={(e) =>
                    handleFieldChange("maxAttendees", e.target.value)
                  }
                  placeholder="Leave empty for unlimited"
                  className={errors.maxAttendees ? "border-destructive" : ""}
                />
                {errors.maxAttendees && (
                  <p className="text-sm text-destructive">
                    {errors.maxAttendees}
                  </p>
                )}
              </div>
            )}
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
                  {initialData ? "Update Event" : "Create Event"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
