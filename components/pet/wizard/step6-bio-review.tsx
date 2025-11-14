"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  Info,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Heart,
  Lock,
  Globe,
  Users,
  Sparkles,
} from "lucide-react"
import type { PetPrivacySettings } from "@/lib/schemas/pet-schema"

// ============================================================================
// Types
// ============================================================================

interface Step6FormData {
  bio?: string
  isFeatured?: boolean
  privacy?: PetPrivacySettings
}

interface Step6BioReviewProps {
  formData: Step6FormData
  allFormData: any // Complete form data from all steps
  onChange: (data: Partial<Step6FormData>) => void
  onEditStep: (step: number) => void
  onSubmit: () => void
  errors?: Record<string, string>
  isSubmitting?: boolean
}

// ============================================================================
// Main Component
// ============================================================================

export function Step6BioReview({
  formData,
  allFormData,
  onChange,
  onEditStep,
  onSubmit,
  errors = {},
  isSubmitting = false,
}: Step6BioReviewProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [bioText, setBioText] = useState(formData.bio || "")

  const bioLength = bioText.length
  const maxBioLength = 1000

  const privacy = formData.privacy || {
    visibility: "public" as const,
    interactions: "public" as const,
  }

  // ============================================================================
  // Bio Editor Handlers
  // ============================================================================

  const handleBioChange = (value: string) => {
    // Limit to 1000 characters
    if (value.length <= maxBioLength) {
      setBioText(value)
      onChange({ bio: value })
    }
  }

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById("bio-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = bioText.substring(start, end)
    const newText =
      bioText.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      bioText.substring(end)

    if (newText.length <= maxBioLength) {
      handleBioChange(newText)
      // Set cursor position after formatting
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + prefix.length,
          end + prefix.length
        )
      }, 0)
    }
  }

  const handleBold = () => insertFormatting("**")
  const handleItalic = () => insertFormatting("_")

  // ============================================================================
  // Privacy Handlers
  // ============================================================================

  const handleVisibilityChange = (
    visibility: "public" | "followers-only" | "private"
  ) => {
    onChange({
      privacy: {
        ...privacy,
        visibility,
      },
    })
  }

  // ============================================================================
  // Submit Handler
  // ============================================================================

  const handleSubmitClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false)
    onSubmit()
  }

  // ============================================================================
  // Review Summary Helpers
  // ============================================================================

  const getStepSummary = (step: number) => {
    switch (step) {
      case 1:
        return {
          title: "Basic Information",
          icon: "🐾",
          items: [
            { label: "Name", value: allFormData.name },
            {
              label: "Species",
              value: allFormData.species
                ?.replace("_", " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
            },
            { label: "Breed", value: allFormData.breed || "Not specified" },
            {
              label: "Gender",
              value: allFormData.gender
                ? allFormData.gender.charAt(0).toUpperCase() +
                  allFormData.gender.slice(1)
                : "Not specified",
            },
            {
              label: "Weight",
              value: allFormData.weight
                ? `${allFormData.weight} ${allFormData.weightUnit || "kg"}`
                : "Not specified",
            },
            {
              label: "Birthday",
              value: allFormData.birthday
                ? new Date(allFormData.birthday).toLocaleDateString()
                : allFormData.approximateAge
                ? `~${allFormData.approximateAge.years || 0} years, ${
                    allFormData.approximateAge.months || 0
                  } months`
                : "Not specified",
            },
          ].filter((item) => item.value),
        }

      case 2:
        return {
          title: "Photos",
          icon: "📸",
          items: [
            {
              label: "Primary Photo",
              value: allFormData.primaryPhotoUrl ? "Uploaded" : "Not uploaded",
            },
            {
              label: "Additional Photos",
              value: allFormData.photos?.length
                ? `${allFormData.photos.length} photo${
                    allFormData.photos.length !== 1 ? "s" : ""
                  }`
                : "None",
            },
          ],
        }

      case 3:
        return {
          title: "Personality",
          icon: "✨",
          items: [
            {
              label: "Traits",
              value:
                allFormData.personality?.traits?.length > 0
                  ? allFormData.personality.traits.join(", ")
                  : "Not specified",
            },
            {
              label: "Special Needs",
              value: allFormData.specialNeeds || "None",
            },
          ].filter((item) => item.value && item.value !== "Not specified"),
        }

      case 4:
        return {
          title: "Identification",
          icon: "🔖",
          items: [
            {
              label: "Microchip ID",
              value: allFormData.microchipId || "Not specified",
            },
            {
              label: "Collar Tag",
              value: allFormData.collarTagId || "Not specified",
            },
            {
              label: "Insurance",
              value: allFormData.insurancePolicyNumber || "Not specified",
            },
          ].filter((item) => item.value !== "Not specified"),
        }

      case 5:
        return {
          title: "Medical Information",
          icon: "🏥",
          items: [
            {
              label: "Vet Clinic",
              value: allFormData.vetClinicName || "Not specified",
            },
            {
              label: "Allergies",
              value:
                allFormData.allergies?.length > 0
                  ? `${allFormData.allergies.length} allerg${
                      allFormData.allergies.length !== 1 ? "ies" : "y"
                    }`
                  : "None",
            },
            {
              label: "Medications",
              value:
                allFormData.medications?.length > 0
                  ? `${allFormData.medications.length} medication${
                      allFormData.medications.length !== 1 ? "s" : ""
                    }`
                  : "None",
            },
            {
              label: "Conditions",
              value:
                allFormData.conditions?.length > 0
                  ? `${allFormData.conditions.length} condition${
                      allFormData.conditions.length !== 1 ? "s" : ""
                    }`
                  : "None",
            },
          ].filter((item) => item.value),
        }

      default:
        return null
    }
  }

  const visibilityConfig = {
    public: {
      icon: Globe,
      label: "Public",
      description: "Anyone can view this profile",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/20",
    },
    "followers-only": {
      icon: Users,
      label: "Followers Only",
      description: "Only followers can view this profile",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    private: {
      icon: Lock,
      label: "Private",
      description: "Only you can view this profile",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/20",
    },
  }

  const currentVisibility = visibilityConfig[privacy.visibility]
  const VisibilityIcon = currentVisibility.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Bio & Review</h3>
        <p className="text-sm text-muted-foreground">
          Tell your pet&apos;s story and review all information before creating the profile.
        </p>
      </div>

      {/* Bio Editor Section */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <span className="text-lg">📝</span>
            Pet Bio
          </h4>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBold}
              title="Bold (Ctrl+B)"
            >
              <span className="font-bold">B</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleItalic}
              title="Italic (Ctrl+I)"
            >
              <span className="italic">I</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Textarea
            id="bio-editor"
            value={bioText}
            onChange={(e) => handleBioChange(e.target.value)}
            placeholder="Tell your pet's story... You can use **bold**, _italic_, emoji 🐾, @mentions, and #hashtags"
            rows={6}
            className={cn(
              "resize-none font-sans",
              errors.bio && "border-red-500"
            )}
          />
          <div className="flex justify-between items-center text-sm">
            <div className="text-muted-foreground">
              <p className="text-xs">
                Supports: <strong>**bold**</strong>, <em>_italic_</em>, emoji 🐾, @mentions, #hashtags
              </p>
            </div>
            <span
              className={cn(
                "text-muted-foreground",
                bioLength > maxBioLength * 0.9 && "text-orange-500",
                bioLength === maxBioLength && "text-red-500"
              )}
            >
              {bioLength}/{maxBioLength}
            </span>
          </div>
          {errors.bio && (
            <p className="text-sm text-red-500">{errors.bio}</p>
          )}
        </div>

        {/* Bio Preview */}
        {bioText && (
          <div className="p-3 rounded-md bg-muted/50 border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Preview:
            </p>
            <div className="text-sm whitespace-pre-wrap break-all">
              {bioText
                .split(/(\*\*.*?\*\*|_.*?_|@\w+|#\w+)/g)
                .map((part, i) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={i}>{part.slice(2, -2)}</strong>
                    )
                  }
                  if (part.startsWith("_") && part.endsWith("_")) {
                    return <em key={i}>{part.slice(1, -1)}</em>
                  }
                  if (part.startsWith("@")) {
                    return (
                      <span key={i} className="text-blue-600 dark:text-blue-400">
                        {part}
                      </span>
                    )
                  }
                  if (part.startsWith("#")) {
                    return (
                      <span key={i} className="text-blue-600 dark:text-blue-400">
                        {part}
                      </span>
                    )
                  }
                  return <span key={i}>{part}</span>
                })}
            </div>
          </div>
        )}
      </div>

      {/* Privacy Settings Section */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <h4 className="font-medium flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Privacy Settings
        </h4>

        <div className="space-y-3">
          <Label htmlFor="visibility">Profile Visibility</Label>
          <Select
            value={privacy.visibility}
            onValueChange={handleVisibilityChange}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Public - Anyone can view</span>
                </div>
              </SelectItem>
              <SelectItem value="followers-only">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Followers Only</span>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Private - Only you</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-md",
              currentVisibility.bg
            )}
          >
            <VisibilityIcon
              className={cn("w-5 h-5 shrink-0 mt-0.5", currentVisibility.color)}
            />
            <div>
              <p className={cn("text-sm font-medium", currentVisibility.color)}>
                {currentVisibility.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentVisibility.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Pet Checkbox */}
      <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
        <Checkbox
          id="isFeatured"
          checked={formData.isFeatured || false}
          onCheckedChange={(checked) =>
            onChange({ isFeatured: checked as boolean })
          }
        />
        <div className="flex-1">
          <Label
            htmlFor="isFeatured"
            className="cursor-pointer flex items-center gap-2 font-medium"
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Featured Pet
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Display this pet prominently on your main profile. Great if you have multiple pets!
          </p>
        </div>
      </div>

      <Separator />

      {/* Review Summary Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h4 className="font-semibold">Review Your Information</h4>
        </div>

        <p className="text-sm text-muted-foreground">
          Please review all the information below. You can edit any section by clicking the edit button.
        </p>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((step) => {
            const summary = getStepSummary(step)
            if (!summary) return null

            return (
              <div
                key={step}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{summary.icon}</span>
                      <h5 className="font-medium">{summary.title}</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {summary.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-muted-foreground">
                            {item.label}:
                          </span>{" "}
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditStep(step)}
                    className="shrink-0"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Ready to create your pet&apos;s profile?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Once you click &quot;Create Profile&quot;, your pet&apos;s profile will be created and you&apos;ll
              be redirected to their new profile page. You can always edit information later.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSubmitClick}
          disabled={isSubmitting || !allFormData.name}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Creating Profile...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Create Profile
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Create Pet Profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You&apos;re about to create a profile for{" "}
                <strong>{allFormData.name}</strong>.
              </p>
              <div className="p-3 rounded-md bg-muted text-sm space-y-1">
                <p>
                  <strong>Species:</strong>{" "}
                  {allFormData.species
                    ?.replace("_", " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
                {allFormData.breed && (
                  <p>
                    <strong>Breed:</strong> {allFormData.breed}
                  </p>
                )}
                <p>
                  <strong>Visibility:</strong> {currentVisibility.label}
                </p>
              </div>
              <p className="text-muted-foreground">
                You can edit all information after creating the profile.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Yes, Create Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
