/**
 * Example usage of Step5Medical component
 * This file demonstrates how to use the medical information step
 */

"use client"

import { useState } from "react"
import { Step5Medical } from "./step5-medical"
import type { Medication, Condition } from "@/lib/schemas/pet-schema"

export function Step5MedicalExample() {
  const [formData, setFormData] = useState<{
    vetClinicName?: string
    vetClinicContact?: string
    allergies?: string[]
    allergySeverities?: Record<string, "mild" | "moderate" | "severe">
    medications?: Medication[]
    conditions?: Condition[]
  }>({
    vetClinicName: "",
    vetClinicContact: "",
    allergies: [],
    allergySeverities: {},
    medications: [],
    conditions: [],
  })

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Step5Medical
        formData={formData}
        onChange={handleChange}
        errors={{}}
      />

      {/* Debug Output */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Form Data (Debug)</h4>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
