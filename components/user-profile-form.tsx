"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagInput } from "@/components/ui/tag-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/lib/types"
import {
  Save,
  X,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  MapPin,
  Phone,
  Briefcase,
  Heart,
  Image as ImageIcon,
} from "lucide-react"

export interface UserProfileFormData {
  fullName: string
  bio: string
  avatar: string
  location: string
  website: string
  phone: string
  occupation: string
  interests: string[]
  favoriteAnimal: string
}

interface ValidationErrors {
  [key: string]: string | undefined
}

interface UserProfileFormProps {
  mode: "edit"
  initialData: User
  onSubmit: (formData: UserProfileFormData) => Promise<void> | void
  onCancel: () => void
}

export function UserProfileForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: UserProfileFormProps) {
  const [formData, setFormData] = useState<UserProfileFormData>({
    fullName: initialData.fullName || "",
    bio: initialData.bio || "",
    avatar: initialData.avatar || "",
    location: initialData.location || "",
    website: initialData.website || "",
    phone: initialData.phone || "",
    occupation: initialData.occupation || "",
    interests: initialData.interests || [],
    favoriteAnimal: initialData.favoriteAnimals?.[0] || "",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Real-time validation
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "fullName":
        if (!value || value.trim().length === 0) {
          return "Full name is required"
        }
        if (value.trim().length < 2) {
          return "Full name must be at least 2 characters"
        }
        break
      case "website":
        if (value && value.trim().length > 0 && !isValidUrl(value)) {
          return "Please enter a valid URL (e.g., https://example.com)"
        }
        break
      case "avatar":
        if (value && value.trim().length > 0 && !isValidUrl(value)) {
          return "Please enter a valid image URL"
        }
        break
    }
    return undefined
  }

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
    if (message) setMessage(null)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    const fullNameError = validateField("fullName", formData.fullName)
    if (fullNameError) newErrors.fullName = fullNameError

    const websiteError = validateField("website", formData.website)
    if (websiteError) newErrors.website = websiteError

    const avatarError = validateField("avatar", formData.avatar)
    if (avatarError) newErrors.avatar = avatarError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." })
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      setMessage({ type: "success", text: "Profile updated successfully!" })
      
      // Clear success message after redirect (handled by parent)
      setTimeout(() => {
        setMessage(null)
      }, 2000)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  return (
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

      {/* Basic Information Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>

          {/* Avatar Preview & URL */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={formData.avatar || "/placeholder.svg"} alt={formData.fullName || "User"} />
                  <AvatarFallback className="text-4xl">
                    {(formData.fullName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground text-center">Avatar Preview</p>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => handleFieldChange("avatar", e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className={errors.avatar ? "border-destructive" : ""}
                  />
                  {errors.avatar && (
                    <p className="text-sm text-destructive">{errors.avatar}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your profile picture
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
                placeholder="John Doe"
                required
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleFieldChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Share a bit about yourself and your pets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Details Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Contact & Details</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupation" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Occupation
              </Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleFieldChange("occupation", e.target.value)}
                placeholder="Your occupation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                placeholder="https://yourwebsite.com"
                className={errors.website ? "border-destructive" : ""}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests & Favorites Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Interests & Favorites</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="favoriteAnimal">Favorite Animal</Label>
              <Input
                id="favoriteAnimal"
                value={formData.favoriteAnimal}
                onChange={(e) => handleFieldChange("favoriteAnimal", e.target.value)}
                placeholder="Dogs, Cats, Birds, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <TagInput
                value={formData.interests.join(", ")}
                onChange={(value) => {
                  const interestsArray = value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag)
                  handleFieldChange("interests", interestsArray)
                }}
                placeholder="Add interests (e.g., hiking, photography, dogs)"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple interests with commas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

