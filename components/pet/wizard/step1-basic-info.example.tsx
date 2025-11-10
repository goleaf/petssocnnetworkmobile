/**
 * Example usage of Step1BasicInfo component
 * 
 * This file demonstrates how to integrate the Step1BasicInfo component
 * into a pet creation wizard.
 */

"use client"

import { useState } from "react"
import { Step1BasicInfo } from "./step1-basic-info"
import { Button } from "@/components/ui/button"

interface Step1FormData {
  name: string
  species: string
  breedId?: string
  breed?: string
  gender?: "male" | "female" | "unknown"
  spayedNeutered: boolean
  color?: string
  markings?: string
  weight?: string
  weightUnit: "lbs" | "kg"
  birthday?: Date
  approximateAge?: {
    years?: number
    months?: number
  }
  adoptionDate?: Date
}

export function Step1BasicInfoExample() {
  const [formData, setFormData] = useState<Step1FormData>({
    name: "",
    species: "",
    spayedNeutered: false,
    weightUnit: "lbs",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (updates: Partial<Step1FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates)
    setErrors((prev) => {
      const newErrors = { ...prev }
      updatedFields.forEach((field) => delete newErrors[field])
      return newErrors
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Pet name must be at least 2 characters"
    }

    if (formData.name && formData.name.length > 50) {
      newErrors.name = "Pet name must be at most 50 characters"
    }

    if (!formData.species) {
      newErrors.species = "Please select a species"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      console.log("Form is valid, proceeding to next step:", formData)
      // Navigate to next step
    }
  }

  const handleSaveDraft = () => {
    console.log("Saving draft:", formData)
    // Save to localStorage or API
    localStorage.setItem("petWizardDraft", JSON.stringify(formData))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Add Your Pet - Step 1</h2>
        <p className="text-muted-foreground">
          Let&apos;s start with the basics about your pet
        </p>
      </div>

      <Step1BasicInfo
        formData={formData}
        onChange={handleChange}
        errors={errors}
      />

      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
        >
          Save Draft
        </Button>
        <Button
          onClick={handleNext}
          className="ml-auto"
        >
          Next: Photos
        </Button>
      </div>

      {/* Debug info (remove in production) */}
      <details className="mt-8 p-4 border rounded-md">
        <summary className="cursor-pointer font-medium">
          Form Data (Debug)
        </summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </details>
    </div>
  )
}
