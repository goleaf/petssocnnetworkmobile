"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Pet, PersonalityTraits, FavoriteThings, DietInfo, VetInfo, InsuranceInfo, HealthRecord, Vaccination, Medication, TrainingProgress } from "@/lib/types"
import {
  Save,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  CircleDot,
  User,
  Loader2,
  FileText,
  Brain,
  Star,
  Utensils,
  AlertCircle,
  Stethoscope,
  Shield,
  Syringe,
  Pill,
  Activity,
  Plus,
  X,
  Calendar,
  Weight,
  Palette,
  MapPin,
  Phone,
  Zap,
  Heart,
  Gamepad2,
  Home,
  Apple,
  Target,
  GraduationCap,
  CheckCircle2,
  Info,
} from "lucide-react"

// Label with Tooltip Component
interface LabelWithTooltipProps {
  htmlFor?: string
  tooltip?: string
  required?: boolean
  children: React.ReactNode
}

function LabelWithTooltip({ htmlFor, tooltip, required, children }: LabelWithTooltipProps) {
  const labelContent = (
    <Label htmlFor={htmlFor} required={required} className="flex items-center gap-1.5">
      {children}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Label>
  )

  return tooltip ? <TooltipProvider>{labelContent}</TooltipProvider> : labelContent
}

// Array Tag Input Component
function ArrayTagInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
}) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue("")
    } else if (trimmed && value.includes(trimmed)) {
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        className={`
          flex flex-wrap gap-2 p-2 min-h-[44px] border rounded-md bg-background 
          focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
          ${error ? "border-destructive" : "border-input"}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1 text-sm font-medium">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// Form Data Type
export interface PetFormData {
  name: string
  species: Pet["species"]
  breed: string
  age: string
  gender: Pet["gender"]
  bio: string
  birthday: string
  weight: string
  color: string
  microchipId: string
  adoptionDate: string
  specialNeeds: string
  spayedNeutered: boolean
  allergies: string[]
  personality: PersonalityTraits
  favoriteThings: FavoriteThings
  dietInfo: DietInfo
  vetInfo: VetInfo
  insurance: InsuranceInfo
  healthRecords: HealthRecord[]
  vaccinations: Vaccination[]
  medications: Medication[]
  trainingProgress: TrainingProgress[]
}

interface PetFormProps {
  mode: "create" | "edit"
  initialData?: Partial<Pet>
  onSubmit: (data: PetFormData) => Promise<void> | void
  onCancel?: () => void
  petName?: string
}

// Validation errors type
interface ValidationErrors {
  [key: string]: string | undefined
}

export function PetForm({ mode, initialData, onSubmit, onCancel, petName }: PetFormProps) {
  const [formData, setFormData] = useState<PetFormData>({
    name: initialData?.name || "",
    species: initialData?.species || "dog",
    breed: initialData?.breed || "",
    age: initialData?.age?.toString() || "",
    gender: initialData?.gender || "male",
    bio: initialData?.bio || "",
    birthday: initialData?.birthday || "",
    weight: initialData?.weight || "",
    color: initialData?.color || "",
    microchipId: initialData?.microchipId || "",
    adoptionDate: initialData?.adoptionDate || "",
    specialNeeds: initialData?.specialNeeds || "",
    spayedNeutered: initialData?.spayedNeutered || false,
    allergies: initialData?.allergies || [],
    personality: initialData?.personality || {
      energyLevel: 3,
      friendliness: 3,
      trainability: 3,
      playfulness: 3,
      independence: 3,
      traits: [],
    },
    favoriteThings: initialData?.favoriteThings || {
      toys: [],
      activities: [],
      places: [],
      foods: [],
    },
    dietInfo: initialData?.dietInfo || {
      foodBrand: "",
      foodType: "",
      portionSize: "",
      feedingSchedule: [],
      treats: [],
      restrictions: [],
    },
    vetInfo: initialData?.vetInfo || {
      clinicName: "",
      veterinarianName: "",
      phone: "",
      address: "",
      emergencyContact: "",
    },
    insurance: initialData?.insurance || {
      provider: "",
      policyNumber: "",
      coverage: "",
      expiryDate: "",
    },
    healthRecords: initialData?.healthRecords || [],
    vaccinations: initialData?.vaccinations || [],
    medications: initialData?.medications || [],
    trainingProgress: initialData?.trainingProgress || [],
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Real-time validation
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "name":
        if (!value || value.trim().length === 0) {
          return "Pet name is required"
        }
        if (value.trim().length < 2) {
          return "Pet name must be at least 2 characters"
        }
        if (value.trim().length > 50) {
          return "Pet name must be less than 50 characters"
        }
        break
      case "age":
        if (value && (Number.isNaN(Number(value)) || Number(value) < 0 || Number(value) > 50)) {
          return "Age must be between 0 and 50"
        }
        break
      case "microchipId":
        if (value && value.length > 20) {
          return "Microchip ID must be less than 20 characters"
        }
        break
      case "bio":
        if (value && value.length > 1000) {
          return "Bio must be less than 1000 characters"
        }
        break
    }
    return undefined
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
    if (message) setMessage(null)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    const nameError = validateField("name", formData.name)
    if (nameError) newErrors.name = nameError

    const ageError = validateField("age", formData.age)
    if (ageError) newErrors.age = ageError

    const microchipError = validateField("microchipId", formData.microchipId)
    if (microchipError) newErrors.microchipId = microchipError

    const bioError = validateField("bio", formData.bio)
    if (bioError) newErrors.bio = bioError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await onSubmit(formData)
      setMessage({ type: "success", text: mode === "create" ? "Pet created successfully!" : "Pet updated successfully!" })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : (mode === "create" ? "Failed to create pet. Please try again." : "Failed to update pet. Please try again.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Health record functions
  const addHealthRecord = () => {
    setFormData({
      ...formData,
      healthRecords: [
        ...formData.healthRecords,
        {
          id: `hr-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          type: "checkup",
          title: "",
          description: "",
        },
      ],
    })
  }

  const updateHealthRecord = (index: number, field: keyof HealthRecord, value: any) => {
    const updated = [...formData.healthRecords]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, healthRecords: updated })
  }

  const removeHealthRecord = (index: number) => {
    setFormData({
      ...formData,
      healthRecords: formData.healthRecords.filter((_, i) => i !== index),
    })
  }

  // Vaccination functions
  const addVaccination = () => {
    setFormData({
      ...formData,
      vaccinations: [
        ...formData.vaccinations,
        {
          id: `v-${Date.now()}`,
          name: "",
          date: new Date().toISOString().split("T")[0],
        },
      ],
    })
  }

  const updateVaccination = (index: number, field: keyof Vaccination, value: any) => {
    const updated = [...formData.vaccinations]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, vaccinations: updated })
  }

  const removeVaccination = (index: number) => {
    setFormData({
      ...formData,
      vaccinations: formData.vaccinations.filter((_, i) => i !== index),
    })
  }

  // Medication functions
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          id: `m-${Date.now()}`,
          name: "",
          dosage: "",
          frequency: "",
          startDate: new Date().toISOString().split("T")[0],
        },
      ],
    })
  }

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const updated = [...formData.medications]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, medications: updated })
  }

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    })
  }

  // Training progress functions
  const addTrainingProgress = () => {
    setFormData({
      ...formData,
      trainingProgress: [
        ...formData.trainingProgress,
        {
          id: `t-${Date.now()}`,
          skill: "",
          level: "beginner",
          startedAt: new Date().toISOString().split("T")[0],
        },
      ],
    })
  }

  const updateTrainingProgress = (index: number, field: keyof TrainingProgress, value: any) => {
    const updated = [...formData.trainingProgress]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, trainingProgress: updated })
  }

  const removeTrainingProgress = (index: number) => {
    setFormData({
      ...formData,
      trainingProgress: formData.trainingProgress.filter((_, i) => i !== index),
    })
  }

  // Feeding schedule functions
  const addFeedingSchedule = () => {
    setFormData({
      ...formData,
      dietInfo: {
        ...formData.dietInfo,
        feedingSchedule: [...formData.dietInfo.feedingSchedule, ""],
      },
    })
  }

  const updateFeedingSchedule = (index: number, value: string) => {
    const updated = [...formData.dietInfo.feedingSchedule]
    updated[index] = value
    setFormData({
      ...formData,
      dietInfo: { ...formData.dietInfo, feedingSchedule: updated },
    })
  }

  const removeFeedingSchedule = (index: number) => {
    setFormData({
      ...formData,
      dietInfo: {
        ...formData.dietInfo,
        feedingSchedule: formData.dietInfo.feedingSchedule.filter((_, i) => i !== index),
      },
    })
  }

  const speciesIcons = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    hamster: PawPrint,
    fish: Fish,
    other: CircleDot,
  }

  return (
    <TooltipProvider delayDuration={300}>
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

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-auto p-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Personality</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="diet" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Diet</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Essential details about your pet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="name" 
                    required 
                    tooltip="Enter your pet's name. This will be displayed on their profile."
                  >
                    Pet Name
                  </LabelWithTooltip>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="Enter your pet's name"
                    className={`h-10 ${errors.name ? "border-destructive" : ""}`}
                    required
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="species" 
                      required
                      tooltip="Select the type of animal your pet is."
                    >
                      Species
                    </LabelWithTooltip>
                    <Select
                      value={formData.species}
                      onValueChange={(value: Pet["species"]) => handleFieldChange("species", value)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue>
                          {(() => {
                            const Icon = speciesIcons[formData.species] || PawPrint
                            const speciesLabels = {
                              dog: "Dog",
                              cat: "Cat",
                              bird: "Bird",
                              rabbit: "Rabbit",
                              hamster: "Hamster",
                              fish: "Fish",
                              other: "Other",
                            }
                            return (
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <span className="truncate">{speciesLabels[formData.species]}</span>
                              </div>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog">
                          <div className="flex items-center gap-2">
                            <Dog className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Dog</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cat">
                          <div className="flex items-center gap-2">
                            <Cat className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Cat</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bird">
                          <div className="flex items-center gap-2">
                            <Bird className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Bird</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rabbit">
                          <div className="flex items-center gap-2">
                            <Rabbit className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Rabbit</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hamster">
                          <div className="flex items-center gap-2">
                            <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Hamster</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fish">
                          <div className="flex items-center gap-2">
                            <Fish className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Fish</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <CircleDot className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Other</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="gender"
                      tooltip="Select your pet's gender."
                    >
                      Gender
                    </LabelWithTooltip>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: Pet["gender"]) => handleFieldChange("gender", value)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate capitalize">{formData.gender}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Male</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="female">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span>Female</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="breed"
                    tooltip="Enter your pet's breed or breed mix if known."
                  >
                    Breed
                  </LabelWithTooltip>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => handleFieldChange("breed", e.target.value)}
                    placeholder="e.g., Golden Retriever, Maine Coon"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="age"
                      tooltip="Enter your pet's age in years. This helps other users understand your pet's life stage."
                    >
                      Age (years)
                    </LabelWithTooltip>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.age}
                      onChange={(e) => handleFieldChange("age", e.target.value)}
                      placeholder="0"
                      className={`h-10 ${errors.age ? "border-destructive" : ""}`}
                    />
                    {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="birthday"
                      tooltip="Enter your pet's birthday if known. This helps celebrate their special day!"
                    >
                      <Calendar className="h-4 w-4" />
                      Birthday
                    </LabelWithTooltip>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => handleFieldChange("birthday", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="weight"
                      tooltip="Enter your pet's weight (e.g., 70 lbs, 5 kg). Useful for health tracking."
                    >
                      <Weight className="h-4 w-4" />
                      Weight
                    </LabelWithTooltip>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => handleFieldChange("weight", e.target.value)}
                      placeholder="e.g., 70 lbs, 5 kg"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="color"
                      tooltip="Describe your pet's primary colors or coat pattern."
                    >
                      <Palette className="h-4 w-4" />
                      Color
                    </LabelWithTooltip>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => handleFieldChange("color", e.target.value)}
                      placeholder="e.g., Golden, Black"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="microchipId"
                      tooltip="Microchip ID is useful for identification if your pet gets lost."
                    >
                      Microchip ID
                    </LabelWithTooltip>
                    <Input
                      id="microchipId"
                      value={formData.microchipId}
                      onChange={(e) => handleFieldChange("microchipId", e.target.value)}
                      placeholder="Enter microchip ID if available"
                      className={`h-10 ${errors.microchipId ? "border-destructive" : ""}`}
                    />
                    {errors.microchipId && <p className="text-xs text-destructive">{errors.microchipId}</p>}
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="adoptionDate"
                      tooltip="The date when you adopted your pet. Celebrate adoption anniversaries!"
                    >
                      <Calendar className="h-4 w-4" />
                      Adoption Date
                    </LabelWithTooltip>
                    <Input
                      id="adoptionDate"
                      type="date"
                      value={formData.adoptionDate}
                      onChange={(e) => handleFieldChange("adoptionDate", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="spayedNeutered"
                      checked={formData.spayedNeutered}
                      onChange={(e) => handleFieldChange("spayedNeutered", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <LabelWithTooltip 
                      htmlFor="spayedNeutered"
                      tooltip="Indicates if your pet has been spayed or neutered. Important for health records."
                    >
                      <Shield className="h-4 w-4" />
                      Spayed/Neutered
                    </LabelWithTooltip>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="specialNeeds"
                    tooltip="List any special care requirements or medical conditions your pet has."
                  >
                    Special Needs
                  </LabelWithTooltip>
                  <Input
                    id="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={(e) => handleFieldChange("specialNeeds", e.target.value)}
                    placeholder="Any special care requirements"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="allergies"
                    tooltip="List any known allergies your pet has. Press Enter or comma to add each allergy."
                  >
                    <AlertCircle className="h-4 w-4" />
                    Allergies
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.allergies}
                    onChange={(value) => handleFieldChange("allergies", value)}
                    placeholder="Add allergies (press Enter or comma to add)"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="bio"
                    tooltip="Write a short biography about your pet. Share their personality, likes, and quirks!"
                  >
                    Bio
                  </LabelWithTooltip>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                    placeholder="Tell us about your pet's personality, likes, and quirks..."
                    rows={4}
                    className={`resize-none ${errors.bio ? "border-destructive" : ""}`}
                  />
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/1000 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personality Tab - Continue with remaining tabs */}
          {/* Due to length limits, I'll continue in a follow-up message if needed */}
          {/* For now, I'll add the submit buttons and remaining structure */}
          
          {/* Personality Tab */}
          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Personality Traits
                </CardTitle>
                <CardDescription>Rate your pet's personality characteristics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="energyLevel"
                    tooltip="Rate your pet's energy level from 1 (very calm) to 5 (very energetic)."
                  >
                    <Zap className="h-4 w-4" />
                    Energy Level (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.energyLevel.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, energyLevel: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="friendliness"
                    tooltip="Rate how friendly and social your pet is with people and other animals."
                  >
                    <Heart className="h-4 w-4" />
                    Friendliness (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.friendliness.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, friendliness: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="playfulness"
                    tooltip="How playful is your pet? Rate from 1 (not very playful) to 5 (very playful)."
                  >
                    <Gamepad2 className="h-4 w-4" />
                    Playfulness (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.playfulness.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, playfulness: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="trainability"
                    tooltip="How easy is your pet to train? Rate from 1 (difficult) to 5 (very easy)."
                  >
                    <GraduationCap className="h-4 w-4" />
                    Trainability (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.trainability.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, trainability: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="independence"
                    tooltip="How independent is your pet? Rate from 1 (needs constant attention) to 5 (very independent)."
                  >
                    <Target className="h-4 w-4" />
                    Independence (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.independence.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, independence: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="traits"
                    tooltip="Add personality traits that describe your pet (e.g., Energetic, Friendly, Loyal)."
                  >
                    Personality Traits
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.personality.traits}
                    onChange={(value) => setFormData({ ...formData, personality: { ...formData.personality, traits: value } })}
                    placeholder="Add personality traits (e.g., Energetic, Friendly, Loyal)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Favorite Things
                </CardTitle>
                <CardDescription>What your pet loves most</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="toys"
                    tooltip="List your pet's favorite toys."
                  >
                    <Gamepad2 className="h-4 w-4" />
                    Favorite Toys
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.favoriteThings.toys}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, toys: value } })}
                    placeholder="Add favorite toys"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="activities"
                    tooltip="What activities does your pet enjoy most?"
                  >
                    <Activity className="h-4 w-4" />
                    Favorite Activities
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.favoriteThings.activities}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, activities: value } })}
                    placeholder="Add favorite activities"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="places"
                    tooltip="Where does your pet love to be?"
                  >
                    <Home className="h-4 w-4" />
                    Favorite Places
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.favoriteThings.places}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, places: value } })}
                    placeholder="Add favorite places"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="foods"
                    tooltip="What foods does your pet enjoy?"
                  >
                    <Apple className="h-4 w-4" />
                    Favorite Foods
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.favoriteThings.foods}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, foods: value } })}
                    placeholder="Add favorite foods"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diet Tab */}
          <TabsContent value="diet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Diet & Nutrition
                </CardTitle>
                <CardDescription>Feeding information and dietary preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="foodBrand"
                    tooltip="The brand of food you feed your pet."
                  >
                    Food Brand
                  </LabelWithTooltip>
                  <Input
                    id="foodBrand"
                    value={formData.dietInfo.foodBrand}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, foodBrand: e.target.value } })}
                    placeholder="e.g., Blue Buffalo, Royal Canin"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="foodType"
                    tooltip="Type of food (e.g., Dry Kibble, Wet Food, Raw Diet)."
                  >
                    Food Type
                  </LabelWithTooltip>
                  <Input
                    id="foodType"
                    value={formData.dietInfo.foodType}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, foodType: e.target.value } })}
                    placeholder="e.g., Dry Kibble (Adult Large Breed)"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="portionSize"
                    tooltip="How much food does your pet eat per day?"
                  >
                    Portion Size
                  </LabelWithTooltip>
                  <Input
                    id="portionSize"
                    value={formData.dietInfo.portionSize}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, portionSize: e.target.value } })}
                    placeholder="e.g., 3 cups per day"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="feedingSchedule"
                    tooltip="Schedule when you feed your pet throughout the day."
                  >
                    Feeding Schedule
                  </LabelWithTooltip>
                  <div className="space-y-2">
                    {formData.dietInfo.feedingSchedule.map((schedule, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={schedule}
                          onChange={(e) => updateFeedingSchedule(index, e.target.value)}
                          placeholder="e.g., 8:00 AM - 1.5 cups"
                          className="h-10"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeFeedingSchedule(index)}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addFeedingSchedule} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feeding Time
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="treats"
                    tooltip="What treats does your pet enjoy?"
                  >
                    Treats
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.dietInfo.treats}
                    onChange={(value) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, treats: value } })}
                    placeholder="Add treats"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="restrictions"
                    tooltip="Any dietary restrictions or foods to avoid."
                  >
                    <AlertCircle className="h-4 w-4" />
                    Dietary Restrictions
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.dietInfo.restrictions}
                    onChange={(value) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, restrictions: value } })}
                    placeholder="Add dietary restrictions"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Veterinarian Information
                </CardTitle>
                <CardDescription>Your pet's veterinary clinic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="clinicName"
                    tooltip="Name of your pet's veterinary clinic."
                  >
                    Clinic Name
                  </LabelWithTooltip>
                  <Input
                    id="clinicName"
                    value={formData.vetInfo.clinicName}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, clinicName: e.target.value } })}
                    placeholder="Veterinary clinic name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="veterinarianName"
                    tooltip="Your pet's primary veterinarian."
                  >
                    Veterinarian Name
                  </LabelWithTooltip>
                  <Input
                    id="veterinarianName"
                    value={formData.vetInfo.veterinarianName}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, veterinarianName: e.target.value } })}
                    placeholder="Dr. Name, DVM"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="vetPhone"
                    tooltip="Veterinary clinic phone number."
                  >
                    <Phone className="h-4 w-4" />
                    Phone
                  </LabelWithTooltip>
                  <Input
                    id="vetPhone"
                    value={formData.vetInfo.phone}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, phone: e.target.value } })}
                    placeholder="(555) 123-4567"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="vetAddress"
                    tooltip="Veterinary clinic address."
                  >
                    <MapPin className="h-4 w-4" />
                    Address
                  </LabelWithTooltip>
                  <Input
                    id="vetAddress"
                    value={formData.vetInfo.address}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, address: e.target.value } })}
                    placeholder="Clinic address"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="emergencyContact"
                    tooltip="24/7 emergency contact for your pet."
                  >
                    Emergency Contact
                  </LabelWithTooltip>
                  <Input
                    id="emergencyContact"
                    value={formData.vetInfo.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, emergencyContact: e.target.value } })}
                    placeholder="24/7 Emergency line"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Insurance Information
                </CardTitle>
                <CardDescription>Pet insurance policy details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="provider"
                    tooltip="Your pet insurance provider."
                  >
                    Insurance Provider
                  </LabelWithTooltip>
                  <Input
                    id="provider"
                    value={formData.insurance.provider}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, provider: e.target.value } })}
                    placeholder="Insurance company name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="policyNumber"
                    tooltip="Your pet insurance policy number."
                  >
                    Policy Number
                  </LabelWithTooltip>
                  <Input
                    id="policyNumber"
                    value={formData.insurance.policyNumber}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, policyNumber: e.target.value } })}
                    placeholder="Policy number"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="coverage"
                    tooltip="Coverage details of your pet insurance."
                  >
                    Coverage
                  </LabelWithTooltip>
                  <Input
                    id="coverage"
                    value={formData.insurance.coverage}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, coverage: e.target.value } })}
                    placeholder="Coverage details"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="expiryDate"
                    tooltip="When does your pet insurance expire?"
                  >
                    <Calendar className="h-4 w-4" />
                    Expiry Date
                  </LabelWithTooltip>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.insurance.expiryDate}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, expiryDate: e.target.value } })}
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Vaccinations
                </CardTitle>
                <CardDescription>Vaccination history and records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.vaccinations.map((vaccination, index) => (
                  <Card key={vaccination.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Vaccination {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeVaccination(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Vaccine Name</Label>
                          <Input
                            value={vaccination.name}
                            onChange={(e) => updateVaccination(index, "name", e.target.value)}
                            placeholder="e.g., Rabies, DHPP"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date Given</Label>
                          <Input
                            type="date"
                            value={vaccination.date}
                            onChange={(e) => updateVaccination(index, "date", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Next Due Date</Label>
                          <Input
                            type="date"
                            value={vaccination.nextDue || ""}
                            onChange={(e) => updateVaccination(index, "nextDue", e.target.value || undefined)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Veterinarian</Label>
                          <Input
                            value={vaccination.veterinarian || ""}
                            onChange={(e) => updateVaccination(index, "veterinarian", e.target.value || undefined)}
                            placeholder="Dr. Name"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Batch Number</Label>
                          <Input
                            value={vaccination.batchNumber || ""}
                            onChange={(e) => updateVaccination(index, "batchNumber", e.target.value || undefined)}
                            placeholder="Batch number"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addVaccination} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vaccination
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications
                </CardTitle>
                <CardDescription>Current and past medications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.medications.map((medication, index) => (
                  <Card key={medication.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Medication {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMedication(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Medication Name</Label>
                          <Input
                            value={medication.name}
                            onChange={(e) => updateMedication(index, "name", e.target.value)}
                            placeholder="e.g., Heartgard Plus"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dosage</Label>
                          <Input
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                            placeholder="e.g., 51-100 lbs tablet"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Input
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                            placeholder="e.g., Once monthly"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={medication.startDate}
                            onChange={(e) => updateMedication(index, "startDate", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={medication.endDate || ""}
                            onChange={(e) => updateMedication(index, "endDate", e.target.value || undefined)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prescribed By</Label>
                          <Input
                            value={medication.prescribedBy || ""}
                            onChange={(e) => updateMedication(index, "prescribedBy", e.target.value || undefined)}
                            placeholder="Dr. Name"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={medication.notes || ""}
                            onChange={(e) => updateMedication(index, "notes", e.target.value || undefined)}
                            placeholder="Additional notes"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addMedication} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Records
                </CardTitle>
                <CardDescription>Medical history and checkups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.healthRecords.map((record, index) => (
                  <Card key={record.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Health Record {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeHealthRecord(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={record.date}
                            onChange={(e) => updateHealthRecord(index, "date", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={record.type}
                            onValueChange={(value) => updateHealthRecord(index, "type", value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checkup">Checkup</SelectItem>
                              <SelectItem value="illness">Illness</SelectItem>
                              <SelectItem value="injury">Injury</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Title</Label>
                          <Input
                            value={record.title}
                            onChange={(e) => updateHealthRecord(index, "title", e.target.value)}
                            placeholder="e.g., Annual Wellness Exam"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={record.description}
                            onChange={(e) => updateHealthRecord(index, "description", e.target.value)}
                            placeholder="Record details"
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Veterinarian</Label>
                          <Input
                            value={record.veterinarian || ""}
                            onChange={(e) => updateHealthRecord(index, "veterinarian", e.target.value || undefined)}
                            placeholder="Dr. Name"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addHealthRecord} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Health Record
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Training Progress
                </CardTitle>
                <CardDescription>Skills and training milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.trainingProgress.map((training, index) => (
                  <Card key={training.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Training {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTrainingProgress(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Skill</Label>
                          <Input
                            value={training.skill}
                            onChange={(e) => updateTrainingProgress(index, "skill", e.target.value)}
                            placeholder="e.g., Basic Obedience"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select
                            value={training.level}
                            onValueChange={(value) => updateTrainingProgress(index, "level", value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="mastered">Mastered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Started At</Label>
                          <Input
                            type="date"
                            value={training.startedAt}
                            onChange={(e) => updateTrainingProgress(index, "startedAt", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Completed At</Label>
                          <Input
                            type="date"
                            value={training.completedAt || ""}
                            onChange={(e) => updateTrainingProgress(index, "completedAt", e.target.value || undefined)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={training.notes || ""}
                            onChange={(e) => updateTrainingProgress(index, "notes", e.target.value || undefined)}
                            placeholder="Training notes"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addTrainingProgress} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Record
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Buttons */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {onCancel && (
                <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === "create" ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === "create" ? "Create Pet" : "Save All Changes"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </TooltipProvider>
  )
}

