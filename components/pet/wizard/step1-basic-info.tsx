"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon, Info } from "lucide-react"
import { format, differenceInYears, differenceInMonths } from "date-fns"

interface Breed {
  id: string
  name: string
  species: string
  photoUrl?: string
  averageWeight?: string
}

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

interface Step1BasicInfoProps {
  formData: Step1FormData
  onChange: (data: Partial<Step1FormData>) => void
  errors?: Record<string, string>
}

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog", emoji: "🐕" },
  { value: "cat", label: "Cat", emoji: "🐈" },
  { value: "bird", label: "Bird", emoji: "🦜" },
  { value: "rabbit", label: "Rabbit", emoji: "🐰" },
  { value: "guinea_pig", label: "Guinea Pig", emoji: "🐹" },
  { value: "hamster", label: "Hamster", emoji: "🐹" },
  { value: "fish", label: "Fish", emoji: "🐠" },
  { value: "reptile", label: "Reptile", emoji: "🦎" },
  { value: "horse", label: "Horse", emoji: "🐴" },
  { value: "farm_animal", label: "Farm Animal", emoji: "🐄" },
  { value: "other", label: "Other", emoji: "🐾" },
]

export function Step1BasicInfo({ formData, onChange, errors = {} }: Step1BasicInfoProps) {
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [breedSearch, setBreedSearch] = useState("")
  const [loadingBreeds, setLoadingBreeds] = useState(false)
  const [useApproximateAge, setUseApproximateAge] = useState(false)
  const [calculatedAge, setCalculatedAge] = useState<string>("")
  const [timeWithYou, setTimeWithYou] = useState<string>("")

  // Character counter for name
  const nameLength = formData.name?.length || 0
  const maxNameLength = 50

  // Character counter for markings
  const markingsLength = formData.markings?.length || 0
  const maxMarkingsLength = 200

  // Fetch breeds when species changes (for dog/cat)
  useEffect(() => {
    if (formData.species === "dog" || formData.species === "cat") {
      fetchBreeds(formData.species)
    } else {
      setBreeds([])
    }
  }, [formData.species])

  // Calculate age when birthday changes
  useEffect(() => {
    if (formData.birthday) {
      const years = differenceInYears(new Date(), formData.birthday)
      const months = differenceInMonths(new Date(), formData.birthday) % 12
      
      if (years === 0) {
        setCalculatedAge(`${months} month${months !== 1 ? "s" : ""} old`)
      } else if (months === 0) {
        setCalculatedAge(`${years} year${years !== 1 ? "s" : ""} old`)
      } else {
        setCalculatedAge(`${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""} old`)
      }
    } else {
      setCalculatedAge("")
    }
  }, [formData.birthday])

  // Calculate time with you when adoption date changes
  useEffect(() => {
    if (formData.adoptionDate) {
      const months = differenceInMonths(new Date(), formData.adoptionDate)
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      
      if (years === 0) {
        setTimeWithYou(`With you for ${months} month${months !== 1 ? "s" : ""}`)
      } else if (remainingMonths === 0) {
        setTimeWithYou(`With you for ${years} year${years !== 1 ? "s" : ""}`)
      } else {
        setTimeWithYou(`With you for ${years} year${years !== 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`)
      }
    } else {
      setTimeWithYou("")
    }
  }, [formData.adoptionDate])

  const fetchBreeds = async (species: string) => {
    setLoadingBreeds(true)
    try {
      const response = await fetch(`/api/breeds?species=${species}`)
      if (response.ok) {
        const data = await response.json()
        setBreeds(data.breeds || [])
      }
    } catch (error) {
      console.error("Failed to fetch breeds:", error)
    } finally {
      setLoadingBreeds(false)
    }
  }

  const filteredBreeds = breeds.filter((breed) =>
    breed.name.toLowerCase().includes(breedSearch.toLowerCase())
  )

  const handleWeightChange = (value: string) => {
    onChange({ weight: value })
  }

  const handleWeightUnitChange = (unit: "lbs" | "kg") => {
    // Convert weight when unit changes
    if (formData.weight) {
      const currentWeight = parseFloat(formData.weight)
      if (!isNaN(currentWeight)) {
        let convertedWeight: number
        if (unit === "kg" && formData.weightUnit === "lbs") {
          // Convert lbs to kg
          convertedWeight = currentWeight * 0.453592
        } else if (unit === "lbs" && formData.weightUnit === "kg") {
          // Convert kg to lbs
          convertedWeight = currentWeight * 2.20462
        } else {
          convertedWeight = currentWeight
        }
        onChange({ 
          weight: convertedWeight.toFixed(1),
          weightUnit: unit 
        })
      } else {
        onChange({ weightUnit: unit })
      }
    } else {
      onChange({ weightUnit: unit })
    }
  }

  const getHealthyWeightRange = () => {
    // Get healthy weight range from breed data if available
    const selectedBreed = breeds.find(b => b.id === formData.breedId)
    if (selectedBreed?.averageWeight) {
      return selectedBreed.averageWeight
    }
    return null
  }

  const getWeightIndicatorColor = () => {
    const healthyRange = getHealthyWeightRange()
    if (!healthyRange || !formData.weight) return null

    const currentWeight = parseFloat(formData.weight)
    if (isNaN(currentWeight)) return null

    // Parse range like "50-70 lbs" or "22-32 kg"
    const match = healthyRange.match(/(\d+)-(\d+)\s*(lbs|kg)/)
    if (!match) return null

    const [, minStr, maxStr, unit] = match
    let min = parseFloat(minStr)
    let max = parseFloat(maxStr)

    // Convert if units don't match
    if (unit !== formData.weightUnit) {
      if (formData.weightUnit === "kg" && unit === "lbs") {
        min = min * 0.453592
        max = max * 0.453592
      } else if (formData.weightUnit === "lbs" && unit === "kg") {
        min = min * 2.20462
        max = max * 2.20462
      }
    }

    const lowerThreshold = min * 0.9
    const upperThreshold = max * 1.1

    if (currentWeight < lowerThreshold || currentWeight > upperThreshold) {
      return "red" // Concerning
    } else if (currentWeight < min || currentWeight > max) {
      return "yellow" // Slightly over/under
    } else {
      return "green" // Healthy
    }
  }

  const weightColor = getWeightIndicatorColor()

  return (
    <div className="space-y-6">
      {/* Pet Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="required">
          Pet Name
        </Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter your pet's name (supports emoji 🐾)"
          maxLength={maxNameLength}
          className={cn(errors.name && "border-red-500")}
        />
        <div className="flex justify-between text-sm">
          <span className={cn("text-muted-foreground", errors.name && "text-red-500")}>
            {errors.name || "Supports Unicode and emoji"}
          </span>
          <span className={cn(
            "text-muted-foreground",
            nameLength > maxNameLength * 0.9 && "text-orange-500",
            nameLength === maxNameLength && "text-red-500"
          )}>
            {nameLength}/{maxNameLength}
          </span>
        </div>
      </div>

      {/* Species */}
      <div className="space-y-2">
        <Label htmlFor="species" className="required">
          Species
        </Label>
        <Select
          value={formData.species || ""}
          onValueChange={(value) => onChange({ species: value, breedId: undefined, breed: undefined })}
        >
          <SelectTrigger id="species" className={cn(errors.species && "border-red-500")}>
            <SelectValue placeholder="Select species" />
          </SelectTrigger>
          <SelectContent>
            {SPECIES_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.species && (
          <p className="text-sm text-red-500">{errors.species}</p>
        )}
      </div>

      {/* Breed - Autocomplete for Dog/Cat, Free text for others */}
      {formData.species && (
        <div className="space-y-2">
          <Label htmlFor="breed">
            Breed {(formData.species === "dog" || formData.species === "cat") && "(Optional)"}
          </Label>
          
          {(formData.species === "dog" || formData.species === "cat") ? (
            <div className="space-y-2">
              <Input
                id="breed"
                value={breedSearch}
                onChange={(e) => setBreedSearch(e.target.value)}
                placeholder={`Search for ${formData.species} breed...`}
                disabled={loadingBreeds}
              />
              {breedSearch && filteredBreeds.length > 0 && (
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  {filteredBreeds.slice(0, 10).map((breed) => (
                    <button
                      key={breed.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                      onClick={() => {
                        onChange({ breedId: breed.id, breed: breed.name })
                        setBreedSearch(breed.name)
                      }}
                    >
                      {breed.photoUrl && (
                        <img
                          src={breed.photoUrl}
                          alt={breed.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{breed.name}</div>
                        {breed.averageWeight && (
                          <div className="text-sm text-muted-foreground">
                            Average weight: {breed.averageWeight}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {formData.breed && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.breed}
                </p>
              )}
            </div>
          ) : (
            <Input
              id="breed"
              value={formData.breed || ""}
              onChange={(e) => onChange({ breed: e.target.value })}
              placeholder="Enter breed (optional)"
            />
          )}
        </div>
      )}

      {/* Gender */}
      <div className="space-y-2">
        <Label>Gender</Label>
        <div className="flex gap-4">
          {["male", "female", "unknown"].map((gender) => (
            <label key={gender} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={formData.gender === gender}
                onChange={(e) => onChange({ gender: e.target.value as "male" | "female" | "unknown" })}
                className="w-4 h-4"
              />
              <span className="capitalize">{gender}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Spayed/Neutered */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="spayedNeutered"
          checked={formData.spayedNeutered}
          onCheckedChange={(checked) => onChange({ spayedNeutered: checked as boolean })}
        />
        <Label htmlFor="spayedNeutered" className="cursor-pointer flex items-center gap-2">
          Spayed/Neutered
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Indicates whether your pet has been spayed (female) or neutered (male).
                  This is important health information for veterinary care.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>

      {/* Color/Markings */}
      <div className="space-y-2">
        <Label htmlFor="markings">
          Color & Markings
        </Label>
        <Textarea
          id="markings"
          value={formData.markings || ""}
          onChange={(e) => onChange({ markings: e.target.value })}
          placeholder="Describe your pet's color and any distinctive markings..."
          maxLength={maxMarkingsLength}
          rows={3}
        />
        <div className="flex justify-end text-sm">
          <span className={cn(
            "text-muted-foreground",
            markingsLength > maxMarkingsLength * 0.9 && "text-orange-500",
            markingsLength === maxMarkingsLength && "text-red-500"
          )}>
            {markingsLength}/{maxMarkingsLength}
          </span>
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight">Weight</Label>
        <div className="flex gap-2">
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight || ""}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="Enter weight"
            className="flex-1"
          />
          <Select
            value={formData.weightUnit}
            onValueChange={handleWeightUnitChange}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lbs">lbs</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Healthy weight range indicator */}
        {weightColor && (
          <div className={cn(
            "flex items-center gap-2 text-sm p-2 rounded-md",
            weightColor === "green" && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
            weightColor === "yellow" && "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
            weightColor === "red" && "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              weightColor === "green" && "bg-green-500",
              weightColor === "yellow" && "bg-yellow-500",
              weightColor === "red" && "bg-red-500"
            )} />
            <span>
              {weightColor === "green" && "Healthy weight range"}
              {weightColor === "yellow" && "Slightly outside healthy range"}
              {weightColor === "red" && "Concerning - consult your vet"}
              {getHealthyWeightRange() && ` (Typical: ${getHealthyWeightRange()})`}
            </span>
          </div>
        )}
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <Label>Birth Date</Label>
        <div className="space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.birthday && "text-muted-foreground"
                )}
                disabled={useApproximateAge}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.birthday ? format(formData.birthday, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.birthday}
                onSelect={(date) => onChange({ birthday: date, approximateAge: undefined })}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {calculatedAge && !useApproximateAge && (
            <p className="text-sm text-muted-foreground">
              {calculatedAge}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="useApproximateAge"
              checked={useApproximateAge}
              onCheckedChange={(checked) => {
                setUseApproximateAge(checked as boolean)
                if (checked) {
                  onChange({ birthday: undefined })
                } else {
                  onChange({ approximateAge: undefined })
                }
              }}
            />
            <Label htmlFor="useApproximateAge" className="cursor-pointer">
              I don&apos;t know the exact birth date
            </Label>
          </div>

          {useApproximateAge && (
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="approxYears" className="text-sm">Years</Label>
                <Input
                  id="approxYears"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.approximateAge?.years || ""}
                  onChange={(e) => onChange({
                    approximateAge: {
                      ...formData.approximateAge,
                      years: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="approxMonths" className="text-sm">Months</Label>
                <Input
                  id="approxMonths"
                  type="number"
                  min="0"
                  max="11"
                  value={formData.approximateAge?.months || ""}
                  onChange={(e) => onChange({
                    approximateAge: {
                      ...formData.approximateAge,
                      months: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adoption Date */}
      <div className="space-y-2">
        <Label>Adoption Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.adoptionDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.adoptionDate ? format(formData.adoptionDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.adoptionDate}
              onSelect={(date) => onChange({ adoptionDate: date })}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {timeWithYou && (
          <p className="text-sm text-muted-foreground">
            {timeWithYou}
          </p>
        )}
      </div>
    </div>
  )
}
