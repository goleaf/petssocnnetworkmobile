"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Check, ChevronLeft, ChevronRight, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPetSchema, type CreatePetInput } from "@/lib/schemas/pet-schema"
import { z } from "zod"

// Import step components
import { Step1BasicInfo } from "./wizard/step1-basic-info"
import { Step2Photos, type PhotoData } from "./wizard/step2-photos"
import { Step3Personality } from "./wizard/step3-personality"
import { Step4Identification } from "./wizard/step4-identification"
import { Step5Medical } from "./wizard/step5-medical"
import { Step6BioReview } from "./wizard/step6-bio-review"

interface PetCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

// Combined form data that matches step component interfaces
interface CombinedFormData {
  // Step 1
  name?: string
  species?: string
  breedId?: string
  breed?: string
  gender?: "male" | "female" | "unknown"
  spayedNeutered?: boolean
  color?: string
  markings?: string
  weight?: string
  weightUnit?: "lbs" | "kg"
  birthday?: Date
  approximateAge?: {
    years?: number
    months?: number
  }
  adoptionDate?: Date
  
  // Step 2
  photos?: PhotoData[]
  primaryPhotoId?: string
  primaryPhotoUrl?: string
  coverPhoto?: string
  
  // Step 3
  personalityTraits?: string[]
  customTraits?: string[]
  favoriteActivities?: string[]
  customActivities?: string
  favoriteTreats?: string
  favoriteToys?: string
  dislikes?: string
  specialNeeds?: string
  
  // Step 4
  microchipId?: string
  microchipCompany?: string
  microchipRegistrationStatus?: string
  microchipCertificateUrl?: string
  microchipCertificateFile?: File | null
  collarTagId?: string
  insurancePolicyNumber?: string
  
  // Step 5
  vetClinicName?: string
  vetClinicContact?: string
  allergies?: string[]
  allergySeverities?: Record<string, "mild" | "moderate" | "severe">
  medications?: Array<{
    name: string
    dosage: string
    frequency: string
    purpose?: string
    startDate?: string
    endDate?: string
  }>
  conditions?: Array<{
    name: string
    diagnosedAt?: string
    notes?: string
  }>
  
  // Step 6
  bio?: string
  isFeatured?: boolean
  privacy?: {
    visibility: "public" | "followers-only" | "private"
    interactions: "public" | "followers-only" | "private"
    sections?: {
      photos?: "public" | "followers-only" | "private"
      health?: "public" | "followers-only" | "private"
      documents?: "public" | "followers-only" | "private"
      posts?: "public" | "followers-only" | "private"
    }
  }
}

interface WizardState {
  currentStep: WizardStep
  petData: CombinedFormData
  errors: Record<string, string>
  isSubmitting: boolean
  completedSteps: Set<WizardStep>
}

const STEP_TITLES = {
  1: "Basic Information",
  2: "Photos & Gallery",
  3: "Personality & Temperament",
  4: "Identification",
  5: "Medical Information",
  6: "Bio & Review",
}

const DRAFT_STORAGE_KEY = "pet-creation-draft"
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export function PetCreationWizard({ isOpen, onClose, userId }: PetCreationWizardProps) {
  // @ts-ignore - useRouter type issue in Next.js 16
  const router = useRouter()
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    petData: {
      weightUnit: "lbs",
      spayedNeutered: false,
      photos: [],
      personalityTraits: [],
      customTraits: [],
      favoriteActivities: [],
      customActivities: "",
      allergies: [],
      allergySeverities: {},
      medications: [],
      conditions: [],
      privacy: {
        visibility: "public" as const,
        interactions: "public" as const,
      },
    },
    errors: {},
    isSubmitting: false,
    completedSteps: new Set(),
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          setState((prev) => ({
            ...prev,
            petData: draft.petData || prev.petData,
            completedSteps: new Set(draft.completedSteps || []),
          }))
        } catch (error) {
          console.error("Failed to load draft:", error)
        }
      }
    }
  }, [isOpen])

  // Auto-save to localStorage
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        petData: state.petData,
        completedSteps: Array.from(state.completedSteps),
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error("Failed to save draft:", error)
    }
  }, [state.petData, state.completedSteps])

  // Set up auto-save timer
  useEffect(() => {
    if (isOpen && hasUnsavedChanges) {
      autoSaveTimerRef.current = setInterval(saveDraft, AUTO_SAVE_INTERVAL)
      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
        }
      }
    }
  }, [isOpen, hasUnsavedChanges, saveDraft])

  // Update pet data
  const updatePetData = useCallback((data: Partial<CombinedFormData>) => {
    setState((prev) => ({
      ...prev,
      petData: { ...prev.petData, ...data },
      errors: {}, // Clear errors when data changes
    }))
    setHasUnsavedChanges(true)
  }, [])

  // Validate current step
  const validateStep = useCallback((step: WizardStep): boolean => {
    const errors: Record<string, string> = {}

    try {
      switch (step) {
        case 1: {
          // Validate basic info
          const step1Schema = z.object({
            name: createPetSchema.shape.name,
            species: createPetSchema.shape.species,
          })
          step1Schema.parse({
            name: state.petData.name,
            species: state.petData.species,
          })
          break
        }
        case 2: {
          // Photos are optional, but if uploading, validate format
          // Validation happens in the photo component
          break
        }
        case 3: {
          // Personality is optional
          break
        }
        case 4: {
          // Validate microchip ID if provided
          if (state.petData.microchipId) {
            const microchipSchema = z.object({
              microchipId: createPetSchema.shape.microchipId,
            })
            microchipSchema.parse({ microchipId: state.petData.microchipId })
          }
          break
        }
        case 5: {
          // Medical info is optional
          break
        }
        case 6: {
          // Bio is optional, validate length if provided
          if (state.petData.bio) {
            const bioSchema = z.object({
              bio: createPetSchema.shape.bio,
            })
            bioSchema.parse({ bio: state.petData.bio })
          }
          break
        }
      }

      setState((prev) => ({ ...prev, errors: {} }))
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors[err.path[0] as string] = err.message
        })
      }
      setState((prev) => ({ ...prev, errors }))
      return false
    }
  }, [state.petData])

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (validateStep(state.currentStep)) {
      setState((prev) => ({
        ...prev,
        currentStep: Math.min(6, prev.currentStep + 1) as WizardStep,
        completedSteps: new Set([...prev.completedSteps, prev.currentStep]),
      }))
    }
  }, [state.currentStep, validateStep])

  // Navigate to previous step
  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as WizardStep,
      errors: {},
    }))
  }, [])

  // Jump to specific step (only if already completed)
  const handleJumpToStep = useCallback((step: WizardStep) => {
    if (state.completedSteps.has(step) || step < state.currentStep) {
      setState((prev) => ({
        ...prev,
        currentStep: step,
        errors: {},
      }))
    }
  }, [state.completedSteps, state.currentStep])

  // Save draft and close
  const handleSaveDraft = useCallback(() => {
    saveDraft()
    setHasUnsavedChanges(false)
    onClose()
  }, [saveDraft, onClose])

  // Handle close with confirmation if unsaved changes
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true)
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, onClose])

  // Confirm close without saving
  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirmation(false)
    setHasUnsavedChanges(false)
    onClose()
  }, [onClose])

  // Submit final form
  const handleSubmit = useCallback(async () => {
    // Validate all data
    try {
      createPetSchema.parse(state.petData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          errors[err.path.join(".")] = err.message
        })
        setState((prev) => ({ ...prev, errors }))
        return
      }
    }

    setState((prev) => ({ ...prev, isSubmitting: true }))

    try {
      const response = await fetch("/api/pets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state.petData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create pet")
      }

      const result = await response.json()

      // Clear draft from localStorage
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setHasUnsavedChanges(false)

      // Close modal and redirect to new pet profile
      onClose()
      router.push(`/pet/${result.slug}`)
    } catch (error) {
      console.error("Failed to create pet:", error)
      setState((prev) => ({
        ...prev,
        errors: {
          submit: error instanceof Error ? error.message : "Failed to create pet profile",
        },
        isSubmitting: false,
      }))
    }
  }, [state.petData, onClose, router])

  // Calculate progress percentage
  const progressPercentage = (state.currentStep / 6) * 100

  // Render current step component
  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            formData={{
              name: state.petData.name || "",
              species: state.petData.species || "",
              breedId: state.petData.breedId,
              breed: state.petData.breed,
              gender: state.petData.gender,
              spayedNeutered: state.petData.spayedNeutered || false,
              color: state.petData.color,
              markings: state.petData.markings,
              weight: state.petData.weight,
              weightUnit: state.petData.weightUnit || "lbs",
              birthday: state.petData.birthday,
              approximateAge: state.petData.approximateAge,
              adoptionDate: state.petData.adoptionDate,
            }}
            onChange={updatePetData}
            errors={state.errors}
          />
        )
      case 2:
        return (
          <Step2Photos
            formData={{
              photos: state.petData.photos || [],
              primaryPhotoId: state.petData.primaryPhotoId,
            }}
            onChange={updatePetData}
            errors={state.errors}
          />
        )
      case 3:
        return (
          <Step3Personality
            formData={{
              personalityTraits: state.petData.personalityTraits || [],
              customTraits: state.petData.customTraits || [],
              favoriteActivities: state.petData.favoriteActivities || [],
              customActivities: state.petData.customActivities || "",
              favoriteTreats: state.petData.favoriteTreats,
              favoriteToys: state.petData.favoriteToys,
              dislikes: state.petData.dislikes,
              specialNeeds: state.petData.specialNeeds,
            }}
            onChange={updatePetData}
            errors={state.errors}
          />
        )
      case 4:
        return (
          <Step4Identification
            formData={{
              microchipId: state.petData.microchipId,
              microchipCompany: state.petData.microchipCompany,
              microchipRegistrationStatus: state.petData.microchipRegistrationStatus,
              microchipCertificateUrl: state.petData.microchipCertificateUrl,
              collarTagId: state.petData.collarTagId,
              insurancePolicyNumber: state.petData.insurancePolicyNumber,
            }}
            onChange={updatePetData}
            errors={state.errors}
          />
        )
      case 5:
        return (
          <Step5Medical
            formData={{
              vetClinicName: state.petData.vetClinicName,
              vetClinicContact: state.petData.vetClinicContact,
              allergies: state.petData.allergies || [],
              allergySeverities: state.petData.allergySeverities || {},
              medications: state.petData.medications || [],
              conditions: state.petData.conditions || [],
            }}
            onChange={updatePetData}
            errors={state.errors}
          />
        )
      case 6:
        return (
          <Step6BioReview
            formData={{
              bio: state.petData.bio,
              isFeatured: state.petData.isFeatured,
              privacy: state.petData.privacy,
            }}
            allFormData={state.petData}
            onChange={updatePetData}
            onEditStep={(step) => handleJumpToStep(step as WizardStep)}
            onSubmit={handleSubmit}
            errors={state.errors}
            isSubmitting={state.isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Add New Pet</DialogTitle>
                <DialogDescription>
                  Step {state.currentStep} of 6: {STEP_TITLES[state.currentStep]}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              {([1, 2, 3, 4, 5, 6] as WizardStep[]).map((step) => (
                <button
                  key={step}
                  onClick={() => handleJumpToStep(step)}
                  disabled={!state.completedSteps.has(step) && step > state.currentStep}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                    state.currentStep === step &&
                      "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                    state.completedSteps.has(step) &&
                      state.currentStep !== step &&
                      "bg-green-500 text-white cursor-pointer hover:bg-green-600",
                    !state.completedSteps.has(step) &&
                      state.currentStep !== step &&
                      "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  aria-label={`Step ${step}: ${STEP_TITLES[step]}`}
                  aria-current={state.currentStep === step ? "step" : undefined}
                >
                  {state.completedSteps.has(step) && state.currentStep !== step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error Summary */}
          {Object.keys(state.errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Please correct the following errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(state.errors).map(([field, message]) => (
                    <li key={field} className="text-sm">
                      {message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="py-4">{renderStep()}</div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              {state.currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={state.isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={state.isSubmitting}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
            </div>

            <div>
              {state.currentStep < 6 ? (
                <Button onClick={handleNext} disabled={state.isSubmitting}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={state.isSubmitting}
                  className="min-w-[120px]"
                >
                  {state.isSubmitting ? "Creating..." : "Create Pet Profile"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save your progress before closing?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleConfirmClose}>
              Discard Changes
            </Button>
            <Button onClick={handleSaveDraft}>
              Save Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
