"use client"

import React, { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BackButton } from "@/components/ui/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TagInput } from "@/components/ui/tag-input"
import { getUserByUsername, updateUser } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
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
  ArrowLeft,
} from "lucide-react"

export default function EditProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    avatar: "",
    location: "",
    website: "",
    phone: "",
    occupation: "",
    interests: [] as string[],
    favoriteAnimal: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchedUser = getUserByUsername(username)
    if (!fetchedUser) {
      router.push("/")
      return
    }

    // Check if user owns the profile
    if (fetchedUser.id !== user.id) {
      router.push(`/user/${username}`)
      return
    }

    setProfileUser(fetchedUser)
    setFormData({
      fullName: fetchedUser.fullName || "",
      bio: fetchedUser.bio || "",
      avatar: fetchedUser.avatar || "",
      location: fetchedUser.location || "",
      website: fetchedUser.website || "",
      phone: fetchedUser.phone || "",
      occupation: fetchedUser.occupation || "",
      interests: fetchedUser.interests || [],
      favoriteAnimal: fetchedUser.favoriteAnimals?.[0] || "",
    })
    setIsLoading(false)
  }, [username, user, router])

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid URL (e.g., https://example.com)"
    }

    if (formData.avatar && !isValidUrl(formData.avatar)) {
      newErrors.avatar = "Please enter a valid image URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!validate()) {
      setMessage({ type: "error", text: "Please fix the errors in the form" })
      return
    }

    if (!profileUser || !user) return

    setIsSubmitting(true)

    try {
      updateUser(profileUser.id, {
        fullName: formData.fullName,
        bio: formData.bio,
        avatar: formData.avatar,
        location: formData.location,
        website: formData.website,
        phone: formData.phone,
        occupation: formData.occupation,
        interests: formData.interests,
        favoriteAnimals: formData.favoriteAnimal ? [formData.favoriteAnimal] : [],
      })

      setMessage({ type: "success", text: "Profile updated successfully!" })

      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push(`/user/${username}`)
      }, 1500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <LoadingSpinner fullScreen />
        </div>
      </div>
    )
  }

  if (!profileUser || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Profile not found or you don't have permission to edit.</p>
              <BackButton href={`/user/${username}`} label="Back to Profile" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <BackButton href={`/user/${username}`} label="Back to Profile" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Edit Profile</CardTitle>
                <CardDescription>Update your profile information and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Message */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Preview & URL */}
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
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className={errors.avatar ? "border-destructive" : ""}
                    />
                    {errors.avatar && <p className="text-sm text-destructive">{errors.avatar}</p>}
                    <p className="text-xs text-muted-foreground">Enter a URL to your profile picture</p>
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
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Share a bit about yourself and your pets</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Occupation
                  </Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className={errors.website ? "border-destructive" : ""}
                  />
                  {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests & Favorites Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Interests & Favorites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="favoriteAnimal">Favorite Animal</Label>
                  <Input
                    id="favoriteAnimal"
                    value={formData.favoriteAnimal}
                    onChange={(e) => setFormData({ ...formData, favoriteAnimal: e.target.value })}
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
                      setFormData({ ...formData, interests: interestsArray })
                    }}
                    placeholder="Add interests (e.g., hiking, photography, dogs)"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple interests with commas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/user/${username}`)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
      </div>
    </div>
  )
}
