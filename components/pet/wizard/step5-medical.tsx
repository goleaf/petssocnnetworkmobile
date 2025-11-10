"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Plus,
  X,
  AlertCircle,
  Pill,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react"
import type { Medication, Condition } from "@/lib/schemas/pet-schema"

// ============================================================================
// Types
// ============================================================================

interface Step5FormData {
  vetClinicName?: string
  vetClinicContact?: string
  allergies?: string[]
  allergySeverities?: Record<string, "mild" | "moderate" | "severe">
  medications?: Medication[]
  conditions?: Condition[]
}

interface Step5MedicalProps {
  formData: Step5FormData
  onChange: (data: Partial<Step5FormData>) => void
  errors?: Record<string, string>
}

// ============================================================================
// Constants
// ============================================================================

const COMMON_ALLERGIES = [
  "Chicken",
  "Beef",
  "Dairy",
  "Wheat",
  "Soy",
  "Corn",
  "Eggs",
  "Fish",
  "Pollen",
  "Dust Mites",
  "Fleas",
  "Grass",
]

const COMMON_CONDITIONS = [
  "Arthritis",
  "Hip Dysplasia",
  "Diabetes",
  "Heart Disease",
  "Kidney Disease",
  "Allergies",
  "Epilepsy",
  "Thyroid Issues",
  "Dental Disease",
  "Obesity",
]

const SEVERITY_COLORS = {
  mild: {
    bg: "bg-yellow-100 dark:bg-yellow-950/30",
    text: "text-yellow-800 dark:text-yellow-200",
    border: "border-yellow-300 dark:border-yellow-800",
    hover: "hover:bg-yellow-200 dark:hover:bg-yellow-950/50",
  },
  moderate: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    text: "text-orange-800 dark:text-orange-200",
    border: "border-orange-300 dark:border-orange-800",
    hover: "hover:bg-orange-200 dark:hover:bg-orange-950/50",
  },
  severe: {
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-800 dark:text-red-200",
    border: "border-red-300 dark:border-red-800",
    hover: "hover:bg-red-200 dark:hover:bg-red-950/50",
  },
}

// ============================================================================
// Main Component
// ============================================================================

export function Step5Medical({
  formData,
  onChange,
  errors = {},
}: Step5MedicalProps) {
  const [customAllergy, setCustomAllergy] = useState("")
  const [customCondition, setCustomCondition] = useState("")
  const [expandedMedications, setExpandedMedications] = useState<Set<number>>(
    new Set()
  )

  const allergies = formData.allergies || []
  const allergySeverities = formData.allergySeverities || {}
  const medications = formData.medications || []
  const conditions = formData.conditions || []

  // ============================================================================
  // Allergy Handlers
  // ============================================================================

  const toggleAllergy = (allergy: string) => {
    const newAllergies = allergies.includes(allergy)
      ? allergies.filter((a) => a !== allergy)
      : [...allergies, allergy]

    // Remove severity if allergy is removed
    const newSeverities = { ...allergySeverities }
    if (!newAllergies.includes(allergy)) {
      delete newSeverities[allergy]
    }

    onChange({
      allergies: newAllergies,
      allergySeverities: newSeverities,
    })
  }

  const addCustomAllergy = () => {
    const trimmed = customAllergy.trim()
    if (trimmed && !allergies.includes(trimmed)) {
      onChange({
        allergies: [...allergies, trimmed],
      })
      setCustomAllergy("")
    }
  }

  const setSeverity = (
    allergy: string,
    severity: "mild" | "moderate" | "severe"
  ) => {
    onChange({
      allergySeverities: {
        ...allergySeverities,
        [allergy]: severity,
      },
    })
  }

  // ============================================================================
  // Medication Handlers
  // ============================================================================

  const addMedication = () => {
    const newMedication: Medication = {
      name: "",
      dosage: "",
      frequency: "",
      purpose: "",
      startDate: "",
      endDate: "",
    }
    onChange({
      medications: [...medications, newMedication],
    })
    // Auto-expand the new medication
    setExpandedMedications(new Set([...expandedMedications, medications.length]))
  }

  const updateMedication = (index: number, updates: Partial<Medication>) => {
    const newMedications = [...medications]
    newMedications[index] = { ...newMedications[index], ...updates }
    onChange({ medications: newMedications })
  }

  const removeMedication = (index: number) => {
    onChange({
      medications: medications.filter((_, i) => i !== index),
    })
    // Remove from expanded set
    const newExpanded = new Set(expandedMedications)
    newExpanded.delete(index)
    setExpandedMedications(newExpanded)
  }

  const toggleMedicationExpanded = (index: number) => {
    const newExpanded = new Set(expandedMedications)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMedications(newExpanded)
  }

  // ============================================================================
  // Condition Handlers
  // ============================================================================

  const toggleCondition = (condition: string) => {
    const exists = conditions.find((c) => c.name === condition)
    if (exists) {
      onChange({
        conditions: conditions.filter((c) => c.name !== condition),
      })
    } else {
      onChange({
        conditions: [...conditions, { name: condition }],
      })
    }
  }

  const addCustomCondition = () => {
    const trimmed = customCondition.trim()
    if (trimmed && !conditions.find((c) => c.name === trimmed)) {
      onChange({
        conditions: [...conditions, { name: trimmed }],
      })
      setCustomCondition("")
    }
  }

  const updateCondition = (
    index: number,
    updates: Partial<Condition>
  ) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    onChange({ conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    onChange({
      conditions: conditions.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Medical Information</h3>
        <p className="text-sm text-muted-foreground">
          Add basic medical information to help caregivers and vets. All fields are optional.
        </p>
      </div>

      {/* Vet Clinic Information */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <h4 className="font-medium flex items-center gap-2">
          <span className="text-lg">🏥</span>
          Veterinary Clinic
        </h4>

        <div className="space-y-2">
          <Label htmlFor="vetClinicName">Clinic Name (Optional)</Label>
          <Input
            id="vetClinicName"
            value={formData.vetClinicName || ""}
            onChange={(e) => onChange({ vetClinicName: e.target.value })}
            placeholder="e.g., Happy Paws Veterinary Clinic"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vetClinicContact">Contact Information (Optional)</Label>
          <Input
            id="vetClinicContact"
            value={formData.vetClinicContact || ""}
            onChange={(e) => onChange({ vetClinicContact: e.target.value })}
            placeholder="e.g., (555) 123-4567 or vet@example.com"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Phone number or email for quick reference
          </p>
        </div>
      </div>

      {/* Allergies Section */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <h4 className="font-medium flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          Allergies
        </h4>

        {/* Common Allergies */}
        <div className="space-y-2">
          <Label>Common Allergies</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => {
              const isSelected = allergies.includes(allergy)
              return (
                <Button
                  key={allergy}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAllergy(allergy)}
                  className="h-auto py-1.5"
                >
                  {allergy}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Custom Allergy Input */}
        <div className="space-y-2">
          <Label htmlFor="customAllergy">Add Custom Allergy</Label>
          <div className="flex gap-2">
            <Input
              id="customAllergy"
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCustomAllergy()
                }
              }}
              placeholder="Enter allergy name"
              maxLength={50}
            />
            <Button
              type="button"
              onClick={addCustomAllergy}
              disabled={!customAllergy.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Selected Allergies with Severity */}
        {allergies.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Allergies & Severity</Label>
            <div className="space-y-2">
              {allergies.map((allergy) => {
                const severity = allergySeverities[allergy]
                return (
                  <div
                    key={allergy}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background"
                  >
                    <span className="font-medium">{allergy}</span>
                    <div className="flex items-center gap-2">
                      {(["mild", "moderate", "severe"] as const).map((sev) => {
                        const colors = SEVERITY_COLORS[sev]
                        const isSelected = severity === sev
                        return (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setSeverity(allergy, sev)}
                            className={cn(
                              "px-3 py-1 rounded-md text-xs font-medium border transition-colors capitalize",
                              isSelected
                                ? `${colors.bg} ${colors.text} ${colors.border}`
                                : "bg-background text-muted-foreground border-border hover:bg-accent"
                            )}
                          >
                            {sev}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Click severity level to indicate how serious each allergy is
            </p>
          </div>
        )}
      </div>

      {/* Medications Section */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Current Medications
          </h4>
          <Button type="button" onClick={addMedication} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Medication
          </Button>
        </div>

        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No medications added yet. Click &quot;Add Medication&quot; to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {medications.map((medication, index) => {
              const isExpanded = expandedMedications.has(index)
              const hasContent = medication.name || medication.dosage

              return (
                <div
                  key={index}
                  className="border rounded-lg bg-background overflow-hidden"
                >
                  {/* Medication Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleMedicationExpanded(index)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Pill className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        {hasContent ? (
                          <>
                            <p className="font-medium truncate">
                              {medication.name || "Unnamed Medication"}
                            </p>
                            {medication.dosage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {medication.dosage}
                                {medication.frequency && ` • ${medication.frequency}`}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">
                            Click to add medication details
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMedication(index)
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Medication Details (Expanded) */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`med-name-${index}`}>
                            Medication Name *
                          </Label>
                          <Input
                            id={`med-name-${index}`}
                            value={medication.name}
                            onChange={(e) =>
                              updateMedication(index, { name: e.target.value })
                            }
                            placeholder="e.g., Carprofen"
                            maxLength={100}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`med-dosage-${index}`}>
                            Dosage *
                          </Label>
                          <Input
                            id={`med-dosage-${index}`}
                            value={medication.dosage}
                            onChange={(e) =>
                              updateMedication(index, { dosage: e.target.value })
                            }
                            placeholder="e.g., 50mg"
                            maxLength={50}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`med-frequency-${index}`}>
                            Frequency *
                          </Label>
                          <Input
                            id={`med-frequency-${index}`}
                            value={medication.frequency}
                            onChange={(e) =>
                              updateMedication(index, {
                                frequency: e.target.value,
                              })
                            }
                            placeholder="e.g., Twice daily"
                            maxLength={50}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`med-purpose-${index}`}>
                            Purpose (Optional)
                          </Label>
                          <Input
                            id={`med-purpose-${index}`}
                            value={medication.purpose || ""}
                            onChange={(e) =>
                              updateMedication(index, { purpose: e.target.value })
                            }
                            placeholder="e.g., Pain relief"
                            maxLength={100}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`med-start-${index}`}>
                            Start Date (Optional)
                          </Label>
                          <Input
                            id={`med-start-${index}`}
                            type="date"
                            value={medication.startDate || ""}
                            onChange={(e) =>
                              updateMedication(index, {
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`med-end-${index}`}>
                            End Date (Optional)
                          </Label>
                          <Input
                            id={`med-end-${index}`}
                            type="date"
                            value={medication.endDate || ""}
                            onChange={(e) =>
                              updateMedication(index, { endDate: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pre-existing Conditions Section */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <h4 className="font-medium flex items-center gap-2">
          <span className="text-lg">🩺</span>
          Pre-existing Conditions
        </h4>

        {/* Common Conditions */}
        <div className="space-y-2">
          <Label>Common Conditions</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_CONDITIONS.map((condition) => {
              const isSelected = conditions.some((c) => c.name === condition)
              return (
                <Button
                  key={condition}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCondition(condition)}
                  className="h-auto py-1.5"
                >
                  {condition}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Custom Condition Input */}
        <div className="space-y-2">
          <Label htmlFor="customCondition">Add Custom Condition</Label>
          <div className="flex gap-2">
            <Input
              id="customCondition"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCustomCondition()
                }
              }}
              placeholder="Enter condition name"
              maxLength={100}
            />
            <Button
              type="button"
              onClick={addCustomCondition}
              disabled={!customCondition.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Selected Conditions with Details */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Conditions</Label>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-background space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{condition.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`condition-date-${index}`}>
                        Date Diagnosed (Optional)
                      </Label>
                      <Input
                        id={`condition-date-${index}`}
                        type="date"
                        value={condition.diagnosedAt || ""}
                        onChange={(e) =>
                          updateCondition(index, {
                            diagnosedAt: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`condition-notes-${index}`}>
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id={`condition-notes-${index}`}
                        value={condition.notes || ""}
                        onChange={(e) =>
                          updateCondition(index, { notes: e.target.value })
                        }
                        placeholder="Treatment details, management notes, etc."
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Why add medical information?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Having medical information readily available helps caregivers, pet sitters, and
              emergency vets provide the best care for your pet. This information is kept
              private and only shared with people you choose.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
