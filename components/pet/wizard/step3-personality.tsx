"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { X, Plus, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ============================================================================
// Types
// ============================================================================

interface Step3FormData {
  personalityTraits: string[]
  customTraits: string[]
  favoriteActivities: string[]
  customActivities: string
  favoriteTreats?: string
  favoriteToys?: string
  dislikes?: string
  specialNeeds?: string
}

interface Step3PersonalityProps {
  formData: Step3FormData
  onChange: (data: Partial<Step3FormData>) => void
  errors?: Record<string, string>
}

// ============================================================================
// Constants
// ============================================================================

const PERSONALITY_TRAITS = [
  { value: "friendly", label: "Friendly", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "shy", label: "Shy", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "energetic", label: "Energetic", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "calm", label: "Calm", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "playful", label: "Playful", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  { value: "curious", label: "Curious", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "protective", label: "Protective", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "independent", label: "Independent", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  { value: "affectionate", label: "Affectionate", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
  { value: "vocal", label: "Vocal", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  { value: "quiet", label: "Quiet", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  { value: "intelligent", label: "Intelligent", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  { value: "stubborn", label: "Stubborn", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "loyal", label: "Loyal", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  { value: "anxious", label: "Anxious", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
  { value: "confident", label: "Confident", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  { value: "gentle", label: "Gentle", color: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200" },
  { value: "aggressive", label: "Aggressive", color: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100" },
  { value: "good_with_kids", label: "Good with Kids", color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" },
  { value: "good_with_pets", label: "Good with Other Pets", color: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200" },
]

const FAVORITE_ACTIVITIES = [
  "Playing fetch",
  "Going for walks",
  "Swimming",
  "Running",
  "Hiking",
  "Playing with toys",
  "Cuddling",
  "Chasing",
  "Exploring",
  "Sleeping",
  "Eating",
  "Training",
  "Agility",
  "Playing with other pets",
  "Car rides",
  "Beach trips",
  "Park visits",
  "Tug of war",
]

const MAX_TRAITS = 10
const MAX_TREATS_LENGTH = 200
const MAX_TOYS_LENGTH = 200
const MAX_DISLIKES_LENGTH = 300
const MAX_SPECIAL_NEEDS_LENGTH = 500

// ============================================================================
// Main Component
// ============================================================================

export function Step3Personality({ formData, onChange, errors = {} }: Step3PersonalityProps) {
  const [customTraitInput, setCustomTraitInput] = useState("")
  const [customActivityInput, setCustomActivityInput] = useState("")

  const selectedTraits = formData.personalityTraits || []
  const customTraits = formData.customTraits || []
  const totalTraits = selectedTraits.length + customTraits.length
  const canAddMoreTraits = totalTraits < MAX_TRAITS

  const selectedActivities = formData.favoriteActivities || []

  // Character counters
  const treatsLength = formData.favoriteTreats?.length || 0
  const toysLength = formData.favoriteToys?.length || 0
  const dislikesLength = formData.dislikes?.length || 0
  const specialNeedsLength = formData.specialNeeds?.length || 0

  // ============================================================================
  // Trait Management
  // ============================================================================

  const handleTraitToggle = (traitValue: string) => {
    const isSelected = selectedTraits.includes(traitValue)
    
    if (isSelected) {
      // Remove trait
      onChange({
        personalityTraits: selectedTraits.filter((t) => t !== traitValue),
      })
    } else {
      // Add trait if under limit
      if (canAddMoreTraits) {
        onChange({
          personalityTraits: [...selectedTraits, traitValue],
        })
      }
    }
  }

  const handleAddCustomTrait = () => {
    const trimmed = customTraitInput.trim()
    
    if (!trimmed) return
    
    // Check if already exists
    if (customTraits.includes(trimmed)) {
      setCustomTraitInput("")
      return
    }
    
    // Check trait limit
    if (!canAddMoreTraits) {
      return
    }
    
    onChange({
      customTraits: [...customTraits, trimmed],
    })
    setCustomTraitInput("")
  }

  const handleRemoveCustomTrait = (trait: string) => {
    onChange({
      customTraits: customTraits.filter((t) => t !== trait),
    })
  }

  const handleCustomTraitKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCustomTrait()
    }
  }

  // ============================================================================
  // Activity Management
  // ============================================================================

  const handleActivityToggle = (activity: string) => {
    const isSelected = selectedActivities.includes(activity)
    
    if (isSelected) {
      onChange({
        favoriteActivities: selectedActivities.filter((a) => a !== activity),
      })
    } else {
      onChange({
        favoriteActivities: [...selectedActivities, activity],
      })
    }
  }

  // ============================================================================
  // Get trait color
  // ============================================================================

  const getTraitColor = (traitValue: string) => {
    const trait = PERSONALITY_TRAITS.find((t) => t.value === traitValue)
    return trait?.color || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  return (
    <div className="space-y-6">
      {/* Personality Traits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">
            Personality Traits
          </Label>
          <span className={cn(
            "text-sm",
            totalTraits >= MAX_TRAITS ? "text-destructive font-medium" : "text-muted-foreground"
          )}>
            {totalTraits}/{MAX_TRAITS} selected
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_TRAITS} traits that best describe your pet&apos;s personality
        </p>

        {/* Pre-defined Traits */}
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TRAITS.map((trait) => {
            const isSelected = selectedTraits.includes(trait.value)
            const isDisabled = !isSelected && !canAddMoreTraits

            return (
              <button
                key={trait.value}
                type="button"
                onClick={() => handleTraitToggle(trait.value)}
                disabled={isDisabled}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  "border-2",
                  isSelected
                    ? `${trait.color} border-current`
                    : "bg-background border-border hover:border-primary/50",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {trait.label}
              </button>
            )
          })}
        </div>

        {/* Custom Trait Input */}
        <div className="space-y-2">
          <Label htmlFor="customTrait" className="text-sm">
            Add Custom Trait
          </Label>
          <div className="flex gap-2">
            <Input
              id="customTrait"
              value={customTraitInput}
              onChange={(e) => setCustomTraitInput(e.target.value)}
              onKeyDown={handleCustomTraitKeyDown}
              placeholder="Enter a unique personality trait..."
              maxLength={30}
              disabled={!canAddMoreTraits}
            />
            <button
              type="button"
              onClick={handleAddCustomTrait}
              disabled={!customTraitInput.trim() || !canAddMoreTraits}
              className={cn(
                "px-4 py-2 rounded-md bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center gap-2"
              )}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Selected Traits Display */}
        {totalTraits > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Selected Traits</Label>
            <div className="flex flex-wrap gap-2">
              {/* Pre-defined selected traits */}
              {selectedTraits.map((traitValue) => {
                const trait = PERSONALITY_TRAITS.find((t) => t.value === traitValue)
                return (
                  <Badge
                    key={traitValue}
                    className={cn(
                      "px-3 py-1.5 text-sm",
                      getTraitColor(traitValue)
                    )}
                  >
                    {trait?.label || traitValue}
                  </Badge>
                )
              })}
              
              {/* Custom traits */}
              {customTraits.map((trait) => (
                <Badge
                  key={trait}
                  className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"
                >
                  {trait}
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomTrait(trait)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {errors.personalityTraits && (
          <p className="text-sm text-destructive">{errors.personalityTraits}</p>
        )}
      </div>

      {/* Favorite Activities */}
      <div className="space-y-3">
        <Label className="text-base">Favorite Activities</Label>
        <p className="text-sm text-muted-foreground">
          Select activities your pet enjoys
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FAVORITE_ACTIVITIES.map((activity) => {
            const isSelected = selectedActivities.includes(activity)

            return (
              <label
                key={activity}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleActivityToggle(activity)}
                />
                <span className="text-sm">{activity}</span>
              </label>
            )
          })}
        </div>

        {/* Custom Activities */}
        <div className="space-y-2">
          <Label htmlFor="customActivities" className="text-sm">
            Other Activities (Optional)
          </Label>
          <Input
            id="customActivities"
            value={formData.customActivities || ""}
            onChange={(e) => onChange({ customActivities: e.target.value })}
            placeholder="e.g., Playing piano, Watching TV, Bird watching..."
            maxLength={200}
          />
        </div>
      </div>

      {/* Favorite Treats */}
      <div className="space-y-2">
        <Label htmlFor="favoriteTreats">
          Favorite Treats (Optional)
        </Label>
        <Input
          id="favoriteTreats"
          value={formData.favoriteTreats || ""}
          onChange={(e) => onChange({ favoriteTreats: e.target.value })}
          placeholder="e.g., Peanut butter, Chicken jerky, Cheese..."
          maxLength={MAX_TREATS_LENGTH}
        />
        <div className="flex justify-end text-sm">
          <span className={cn(
            "text-muted-foreground",
            treatsLength > MAX_TREATS_LENGTH * 0.9 && "text-orange-500",
            treatsLength === MAX_TREATS_LENGTH && "text-red-500"
          )}>
            {treatsLength}/{MAX_TREATS_LENGTH}
          </span>
        </div>
      </div>

      {/* Favorite Toys */}
      <div className="space-y-2">
        <Label htmlFor="favoriteToys">
          Favorite Toys (Optional)
        </Label>
        <Input
          id="favoriteToys"
          value={formData.favoriteToys || ""}
          onChange={(e) => onChange({ favoriteToys: e.target.value })}
          placeholder="e.g., Squeaky ball, Rope toy, Laser pointer..."
          maxLength={MAX_TOYS_LENGTH}
        />
        <div className="flex justify-end text-sm">
          <span className={cn(
            "text-muted-foreground",
            toysLength > MAX_TOYS_LENGTH * 0.9 && "text-orange-500",
            toysLength === MAX_TOYS_LENGTH && "text-red-500"
          )}>
            {toysLength}/{MAX_TOYS_LENGTH}
          </span>
        </div>
      </div>

      {/* Dislikes */}
      <div className="space-y-2">
        <Label htmlFor="dislikes">
          Dislikes (Optional)
        </Label>
        <Textarea
          id="dislikes"
          value={formData.dislikes || ""}
          onChange={(e) => onChange({ dislikes: e.target.value })}
          placeholder="Things your pet doesn't like (e.g., loud noises, being alone, baths, vacuum cleaner...)"
          maxLength={MAX_DISLIKES_LENGTH}
          rows={3}
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Helps caregivers and pet sitters understand what to avoid
          </span>
          <span className={cn(
            "text-muted-foreground",
            dislikesLength > MAX_DISLIKES_LENGTH * 0.9 && "text-orange-500",
            dislikesLength === MAX_DISLIKES_LENGTH && "text-red-500"
          )}>
            {dislikesLength}/{MAX_DISLIKES_LENGTH}
          </span>
        </div>
      </div>

      {/* Special Needs */}
      <div className="space-y-2">
        <Label htmlFor="specialNeeds" className="flex items-center gap-2">
          Special Needs (Optional)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Include any special care requirements, behavioral considerations, 
                  medical needs, or accommodations your pet requires. This information 
                  is crucial for caregivers, pet sitters, and emergency situations.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Textarea
          id="specialNeeds"
          value={formData.specialNeeds || ""}
          onChange={(e) => onChange({ specialNeeds: e.target.value })}
          placeholder="Describe any special care requirements, behavioral considerations, or accommodations needed..."
          maxLength={MAX_SPECIAL_NEEDS_LENGTH}
          rows={4}
          className={cn(errors.specialNeeds && "border-red-500")}
        />
        <div className="flex justify-between text-sm">
          <span className={cn(
            "text-muted-foreground",
            errors.specialNeeds && "text-red-500"
          )}>
            {errors.specialNeeds || "Important for caregivers and emergency situations"}
          </span>
          <span className={cn(
            "text-muted-foreground",
            specialNeedsLength > MAX_SPECIAL_NEEDS_LENGTH * 0.9 && "text-orange-500",
            specialNeedsLength === MAX_SPECIAL_NEEDS_LENGTH && "text-red-500"
          )}>
            {specialNeedsLength}/{MAX_SPECIAL_NEEDS_LENGTH}
          </span>
        </div>
      </div>
    </div>
  )
}
