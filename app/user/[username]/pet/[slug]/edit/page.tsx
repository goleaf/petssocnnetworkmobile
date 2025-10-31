"use client"

import React, { useState, useEffect, use, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPetByUsernameAndSlug, updatePet, generatePetSlug, getUsers } from "@/lib/storage"
import type { Pet, PersonalityTraits, FavoriteThings, DietInfo, VetInfo, InsuranceInfo, HealthRecord, Vaccination, Medication, TrainingProgress } from "@/lib/types"
import {
  ArrowLeft,
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
  Award,
  Users,
  Camera,
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
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

// Array Tag Input Component
function ArrayTagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
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
    <div
      className="flex flex-wrap gap-2 p-2 min-h-[44px] border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
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
  )
}

export default function EditPetPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [pet, setPet] = useState<Pet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    species: "dog" as Pet["species"],
    breed: "",
    age: "",
    gender: "male" as Pet["gender"],
    bio: "",
    birthday: "",
    weight: "",
    color: "",
    microchipId: "",
    adoptionDate: "",
    specialNeeds: "",
    spayedNeutered: false,
    allergies: [] as string[],
    personality: {
      energyLevel: 3 as 1 | 2 | 3 | 4 | 5,
      friendliness: 3 as 1 | 2 | 3 | 4 | 5,
      trainability: 3 as 1 | 2 | 3 | 4 | 5,
      playfulness: 3 as 1 | 2 | 3 | 4 | 5,
      independence: 3 as 1 | 2 | 3 | 4 | 5,
      traits: [] as string[],
    },
    favoriteThings: {
      toys: [] as string[],
      activities: [] as string[],
      places: [] as string[],
      foods: [] as string[],
    },
    dietInfo: {
      foodBrand: "",
      foodType: "",
      portionSize: "",
      feedingSchedule: [] as string[],
      treats: [] as string[],
      restrictions: [] as string[],
    },
    vetInfo: {
      clinicName: "",
      veterinarianName: "",
      phone: "",
      address: "",
      emergencyContact: "",
    },
    insurance: {
      provider: "",
      policyNumber: "",
      coverage: "",
      expiryDate: "",
    },
    healthRecords: [] as HealthRecord[],
    vaccinations: [] as Vaccination[],
    medications: [] as Medication[],
    trainingProgress: [] as TrainingProgress[],
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchedPet = getPetByUsernameAndSlug(username, slug)
    if (!fetchedPet) {
      router.push(`/user/${username}`)
      return
    }

    // Check if user owns the pet
    if (fetchedPet.ownerId !== user.id) {
      const owner = getUsers().find((u) => u.id === fetchedPet.ownerId)
      if (owner) {
        const petUrl = getPetUrlFromPet(fetchedPet, owner.username)
        router.push(petUrl)
      } else {
        router.push(`/user/${username}`)
      }
      return
    }

    setPet(fetchedPet)
    setFormData({
      name: fetchedPet.name || "",
      species: fetchedPet.species || "dog",
      breed: fetchedPet.breed || "",
      age: fetchedPet.age?.toString() || "",
      gender: fetchedPet.gender || "male",
      bio: fetchedPet.bio || "",
      birthday: fetchedPet.birthday || "",
      weight: fetchedPet.weight || "",
      color: fetchedPet.color || "",
      microchipId: fetchedPet.microchipId || "",
      adoptionDate: fetchedPet.adoptionDate || "",
      specialNeeds: fetchedPet.specialNeeds || "",
      spayedNeutered: fetchedPet.spayedNeutered || false,
      allergies: fetchedPet.allergies || [],
      personality: fetchedPet.personality || {
        energyLevel: 3,
        friendliness: 3,
        trainability: 3,
        playfulness: 3,
        independence: 3,
        traits: [],
      },
      favoriteThings: fetchedPet.favoriteThings || {
        toys: [],
        activities: [],
        places: [],
        foods: [],
      },
      dietInfo: fetchedPet.dietInfo || {
        foodBrand: "",
        foodType: "",
        portionSize: "",
        feedingSchedule: [],
        treats: [],
        restrictions: [],
      },
      vetInfo: fetchedPet.vetInfo || {
        clinicName: "",
        veterinarianName: "",
        phone: "",
        address: "",
        emergencyContact: "",
      },
      insurance: fetchedPet.insurance || {
        provider: "",
        policyNumber: "",
        coverage: "",
        expiryDate: "",
      },
      healthRecords: fetchedPet.healthRecords || [],
      vaccinations: fetchedPet.vaccinations || [],
      medications: fetchedPet.medications || [],
      trainingProgress: fetchedPet.trainingProgress || [],
    })
    setIsLoading(false)
  }, [username, slug, user, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !pet) return

    setIsSubmitting(true)

    // Generate new slug if name changed
    const newSlug = pet.name !== formData.name ? generatePetSlug(formData.name) : pet.slug

    const updatedPet: Pet = {
      ...pet,
      name: formData.name,
      species: formData.species,
      breed: formData.breed || undefined,
      age: formData.age ? Number.parseInt(formData.age) : undefined,
      gender: formData.gender,
      bio: formData.bio || undefined,
      birthday: formData.birthday || undefined,
      weight: formData.weight || undefined,
      color: formData.color || undefined,
      microchipId: formData.microchipId || undefined,
      adoptionDate: formData.adoptionDate || undefined,
      specialNeeds: formData.specialNeeds || undefined,
      spayedNeutered: formData.spayedNeutered,
      allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
      personality: Object.values(formData.personality).some((v) => (Array.isArray(v) ? v.length > 0 : v !== 3 && v !== undefined)) ? formData.personality : undefined,
      favoriteThings: Object.values(formData.favoriteThings).some((v) => v.length > 0) ? formData.favoriteThings : undefined,
      dietInfo: Object.values(formData.dietInfo).some((v) => (Array.isArray(v) ? v.length > 0 : v !== "")) ? formData.dietInfo : undefined,
      vetInfo: Object.values(formData.vetInfo).some((v) => v !== "") ? formData.vetInfo : undefined,
      insurance: Object.values(formData.insurance).some((v) => v !== "") ? formData.insurance : undefined,
      healthRecords: formData.healthRecords.length > 0 ? formData.healthRecords : undefined,
      vaccinations: formData.vaccinations.length > 0 ? formData.vaccinations : undefined,
      medications: formData.medications.length > 0 ? formData.medications : undefined,
      trainingProgress: formData.trainingProgress.length > 0 ? formData.trainingProgress : undefined,
      slug: newSlug,
    }

    updatePet(updatedPet)
    setIsSubmitting(false)

    // Redirect to pet profile with potentially new slug
    const owner = getUsers().find((u) => u.id === user.id)
    if (owner) {
      router.push(getPetUrlFromPet(updatedPet, owner.username))
    } else {
      router.push(`/user/${username}`)
    }
  }

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

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Pet not found or you don't have permission to edit.</p>
            <BackButton href={`/user/${username}`} label="Back to Profile" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={getPetUrlFromPet(pet, username)} label="Back to Pet Profile" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Edit Pet Profile</CardTitle>
              <CardDescription>Update all information about {pet.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit}>
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
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your pet's name"
                    required
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="species">Species *</Label>
                    <Select
                      value={formData.species}
                      onValueChange={(value: Pet["species"]) => setFormData({ ...formData, species: value })}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue>
                          {(() => {
                            const speciesIcons = {
                              dog: Dog,
                              cat: Cat,
                              bird: Bird,
                              rabbit: Rabbit,
                              hamster: PawPrint,
                              fish: Fish,
                              other: CircleDot,
                            }
                            const speciesLabels = {
                              dog: "Dog",
                              cat: "Cat",
                              bird: "Bird",
                              rabbit: "Rabbit",
                              hamster: "Hamster",
                              fish: "Fish",
                              other: "Other",
                            }
                            const Icon = speciesIcons[formData.species] || PawPrint
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
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: Pet["gender"]) => setFormData({ ...formData, gender: value })}
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
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Golden Retriever, Maine Coon"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (years)</Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="0"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Birthday
                    </Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Weight
                    </Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 70 lbs, 5 kg"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color
                    </Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g., Golden, Black"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="microchipId">Microchip ID</Label>
                    <Input
                      id="microchipId"
                      value={formData.microchipId}
                      onChange={(e) => setFormData({ ...formData, microchipId: e.target.value })}
                      placeholder="Enter microchip ID if available"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adoptionDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Adoption Date
                    </Label>
                    <Input
                      id="adoptionDate"
                      type="date"
                      value={formData.adoptionDate}
                      onChange={(e) => setFormData({ ...formData, adoptionDate: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, spayedNeutered: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="spayedNeutered" className="flex items-center gap-2 text-sm font-medium leading-none">
                      <Shield className="h-4 w-4" />
                      Spayed/Neutered
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialNeeds">Special Needs</Label>
                  <Input
                    id="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                    placeholder="Any special care requirements"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Allergies
                  </Label>
                  <ArrayTagInput
                    value={formData.allergies}
                    onChange={(value) => setFormData({ ...formData, allergies: value })}
                    placeholder="Add allergies (press Enter or comma to add)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about your pet's personality, likes, and quirks..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <Label htmlFor="energyLevel" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Energy Level (1-5)
                  </Label>
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
                  <Label htmlFor="friendliness" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Friendliness (1-5)
                  </Label>
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
                  <Label htmlFor="playfulness" className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Playfulness (1-5)
                  </Label>
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
                  <Label htmlFor="trainability" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Trainability (1-5)
                  </Label>
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
                  <Label htmlFor="independence" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Independence (1-5)
                  </Label>
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
                  <Label htmlFor="traits">Personality Traits</Label>
                  <ArrayTagInput
                    value={formData.personality.traits}
                    onChange={(value) => setFormData({ ...formData, personality: { ...formData.personality, traits: value } })}
                    placeholder="Add personality traits (e.g., Energetic, Friendly, Loyal)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <Label htmlFor="toys" className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Favorite Toys
                  </Label>
                  <ArrayTagInput
                    value={formData.favoriteThings.toys}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, toys: value } })}
                    placeholder="Add favorite toys"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activities" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Favorite Activities
                  </Label>
                  <ArrayTagInput
                    value={formData.favoriteThings.activities}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, activities: value } })}
                    placeholder="Add favorite activities"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="places" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Favorite Places
                  </Label>
                  <ArrayTagInput
                    value={formData.favoriteThings.places}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, places: value } })}
                    placeholder="Add favorite places"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foods" className="flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    Favorite Foods
                  </Label>
                  <ArrayTagInput
                    value={formData.favoriteThings.foods}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, foods: value } })}
                    placeholder="Add favorite foods"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <Label htmlFor="foodBrand">Food Brand</Label>
                  <Input
                    id="foodBrand"
                    value={formData.dietInfo.foodBrand}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, foodBrand: e.target.value } })}
                    placeholder="e.g., Blue Buffalo, Royal Canin"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foodType">Food Type</Label>
                  <Input
                    id="foodType"
                    value={formData.dietInfo.foodType}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, foodType: e.target.value } })}
                    placeholder="e.g., Dry Kibble (Adult Large Breed)"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portionSize">Portion Size</Label>
                  <Input
                    id="portionSize"
                    value={formData.dietInfo.portionSize}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, portionSize: e.target.value } })}
                    placeholder="e.g., 3 cups per day"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feeding Schedule</Label>
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
                  <Label htmlFor="treats">Treats</Label>
                  <ArrayTagInput
                    value={formData.dietInfo.treats}
                    onChange={(value) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, treats: value } })}
                    placeholder="Add treats"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restrictions" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Dietary Restrictions
                  </Label>
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
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <Input
                    id="clinicName"
                    value={formData.vetInfo.clinicName}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, clinicName: e.target.value } })}
                    placeholder="Veterinary clinic name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veterinarianName">Veterinarian Name</Label>
                  <Input
                    id="veterinarianName"
                    value={formData.vetInfo.veterinarianName}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, veterinarianName: e.target.value } })}
                    placeholder="Dr. Name, DVM"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vetPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="vetPhone"
                    value={formData.vetInfo.phone}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, phone: e.target.value } })}
                    placeholder="(555) 123-4567"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vetAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="vetAddress"
                    value={formData.vetInfo.address}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, address: e.target.value } })}
                    placeholder="Clinic address"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
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
                  <Label htmlFor="provider">Insurance Provider</Label>
                  <Input
                    id="provider"
                    value={formData.insurance.provider}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, provider: e.target.value } })}
                    placeholder="Insurance company name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    value={formData.insurance.policyNumber}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, policyNumber: e.target.value } })}
                    placeholder="Policy number"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverage">Coverage</Label>
                  <Input
                    id="coverage"
                    value={formData.insurance.coverage}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, coverage: e.target.value } })}
                    placeholder="Coverage details"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiry Date
                  </Label>
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

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Link href={getPetUrlFromPet(pet, username)} className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}