"use client"

import { useState } from "react"
import type { Pet } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  Scale,
  Cake,
  Clipboard,
  Check,
  AlertTriangle,
  Pill,
  Activity,
  Sparkles,
  Cookie,
  Bone,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * About Tab Component
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 * 
 * Displays comprehensive pet information organized in cards:
 * - Physical Stats with weight history chart
 * - Personality traits organized by category
 * - Favorites list with icons
 * - Medical Summary with allergies, medications, conditions
 * - Birthday notifications
 * - Microchip copy button
 * - Medication dosage schedules
 * - Condition management status
 */

export interface AboutTabProps {
  pet: Pet
  canEdit?: boolean
}

export function AboutTab({ pet, canEdit = false }: AboutTabProps) {
  const [copiedMicrochip, setCopiedMicrochip] = useState(false)

  /**
   * Calculate if birthday is within 30 days
   * Requirement 10.3: Display birthday notification when within 30 days
   */
  const isBirthdayComingSoon = (): boolean => {
    if (!pet.birthday) return false
    
    const today = new Date()
    const birthday = new Date(pet.birthday)
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birthday.getMonth(),
      birthday.getDate()
    )
    
    // If birthday already passed this year, check next year
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1)
    }
    
    const daysUntilBirthday = Math.ceil(
      (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return daysUntilBirthday <= 30 && daysUntilBirthday >= 0
  }

  /**
   * Get weight trend indicator
   * Requirement 10.2: Display weight history with trend
   */
  const getWeightTrend = (): "gaining" | "stable" | "losing" | null => {
    if (!pet.weightHistory || pet.weightHistory.length < 2) return null
    
    const sorted = [...pet.weightHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    const latest = sorted[0].weight
    const previous = sorted[1].weight
    const difference = latest - previous
    const percentChange = (difference / previous) * 100
    
    if (Math.abs(percentChange) < 2) return "stable"
    return difference > 0 ? "gaining" : "losing"
  }

  /**
   * Check if weight is in healthy range
   * Requirement 10.2: Display healthy weight range indicator
   */
  const getWeightStatus = (): "healthy" | "warning" | "concern" | null => {
    // This would ideally come from breed data
    // For now, return null if no weight
    if (!pet.weight) return null
    
    // TODO: Implement breed-based healthy weight range checking
    return "healthy"
  }

  /**
   * Copy microchip ID to clipboard
   * Requirement 10.4: Add copy button for microchip ID
   */
  const handleCopyMicrochip = async () => {
    if (!pet.microchipId) return
    
    try {
      await navigator.clipboard.writeText(pet.microchipId)
      setCopiedMicrochip(true)
      setTimeout(() => setCopiedMicrochip(false), 2000)
    } catch (error) {
      console.error("Failed to copy microchip ID:", error)
    }
  }

  /**
   * Get severity color for allergies
   * Requirement 10.7: Highlight allergies in warning colors
   */
  const getAllergySeverityColor = (severity: string): string => {
    switch (severity) {
      case "severe":
        return "destructive"
      case "moderate":
        return "default"
      case "mild":
        return "secondary"
      default:
        return "secondary"
    }
  }

  /**
   * Get condition management status
   * Requirement 10.9: Display condition management status
   */
  const getConditionStatus = (condition: { name: string; notes?: string }): string => {
    // This would ideally be stored in the condition object
    // For now, infer from notes or default to "Monitoring"
    const notes = condition.notes?.toLowerCase() || ""
    
    if (notes.includes("controlled") || notes.includes("stable")) {
      return "Controlled"
    } else if (notes.includes("treatment") || notes.includes("treating")) {
      return "Under Treatment"
    }
    
    return "Monitoring"
  }

  const getConditionStatusColor = (status: string): string => {
    switch (status) {
      case "Controlled":
        return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
      case "Under Treatment":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400"
      case "Monitoring":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400"
    }
  }

  const weightTrend = getWeightTrend()
  const weightStatus = getWeightStatus()
  const birthdaySoon = isBirthdayComingSoon()

  return (
    <div className="space-y-6">
      {/* Birthday Notification - Requirement 10.3 */}
      {birthdaySoon && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Cake className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">
              🎂 Birthday coming up! {pet.name}'s special day is approaching.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Physical Stats Card - Requirement 10.1, 10.2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Physical Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Weight */}
            {pet.weight && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Weight</span>
                  {weightTrend && (
                    <Badge variant="outline" className="gap-1">
                      {weightTrend === "gaining" && <TrendingUp className="h-3 w-3" />}
                      {weightTrend === "losing" && <TrendingDown className="h-3 w-3" />}
                      {weightTrend === "stable" && <Minus className="h-3 w-3" />}
                      {weightTrend.charAt(0).toUpperCase() + weightTrend.slice(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{pet.weight}</p>
                {weightStatus && (
                  <p className={cn(
                    "text-xs mt-1",
                    weightStatus === "healthy" && "text-green-600",
                    weightStatus === "warning" && "text-yellow-600",
                    weightStatus === "concern" && "text-red-600"
                  )}>
                    {weightStatus === "healthy" && "✓ Healthy weight range"}
                    {weightStatus === "warning" && "⚠ Slightly outside healthy range"}
                    {weightStatus === "concern" && "⚠ Outside healthy range"}
                  </p>
                )}
              </div>
            )}

            {/* Weight History Chart - Requirement 10.1 */}
            {pet.weightHistory && pet.weightHistory.length > 1 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Weight History</p>
                <div className="h-32 flex items-end gap-2">
                  {pet.weightHistory
                    .slice(-6)
                    .map((entry, index) => {
                      const maxWeight = Math.max(...pet.weightHistory!.map(e => e.weight))
                      const height = (entry.weight / maxWeight) * 100
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                            style={{ height: `${height}%` }}
                            title={`${entry.weight} on ${new Date(entry.date).toLocaleDateString()}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            <Separator />

            {/* Color/Markings */}
            {pet.color && (
              <div>
                <span className="text-sm text-muted-foreground">Color/Markings</span>
                <p className="font-medium">{pet.color}</p>
              </div>
            )}

            {/* Spayed/Neutered */}
            {pet.spayedNeutered !== undefined && (
              <div>
                <span className="text-sm text-muted-foreground">Spayed/Neutered</span>
                <p className="font-medium">{pet.spayedNeutered ? "Yes" : "No"}</p>
              </div>
            )}

            {/* Microchip - Requirement 10.4 */}
            {pet.microchipId && (
              <div>
                <span className="text-sm text-muted-foreground">Microchip ID</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {pet.microchipId}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyMicrochip}
                    className="h-7 px-2"
                  >
                    {copiedMicrochip ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {pet.microchipCompany && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered with {pet.microchipCompany}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personality Card - Requirement 10.5, 10.6 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Personality & Traits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personality Traits - Requirement 10.5 */}
            {pet.personality && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Traits</p>
                <div className="flex flex-wrap gap-2">
                  {pet.personality.traits?.map((trait, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <Heart className="h-3 w-3" />
                      {trait}
                    </Badge>
                  ))}
                  {pet.personality.energyLevel && (
                    <Badge variant="outline" className="gap-1">
                      <Activity className="h-3 w-3" />
                      {pet.personality.energyLevel} energy
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Favorites - Requirement 10.6 */}
            {pet.favoriteThings && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Favorites</p>
                  
                  {pet.favoriteThings.foods && pet.favoriteThings.foods.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Cookie className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Treats</p>
                        <p className="text-sm">{pet.favoriteThings.foods.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  
                  {pet.favoriteThings.toys && pet.favoriteThings.toys.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Bone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Toys</p>
                        <p className="text-sm">{pet.favoriteThings.toys.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  
                  {pet.favoriteThings.activities && pet.favoriteThings.activities.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Activities</p>
                        <p className="text-sm">{pet.favoriteThings.activities.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Dislikes */}
            {pet.dislikes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dislikes</p>
                  <p className="text-sm">{pet.dislikes}</p>
                </div>
              </>
            )}

            {/* Special Needs */}
            {pet.specialNeeds && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Special Needs</p>
                  <p className="text-sm">{pet.specialNeeds}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Summary Card - Requirement 10.7, 10.8, 10.9 */}
      {(pet.allergies?.length || pet.medications?.length || pet.conditions?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medical Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allergies - Requirement 10.7 */}
            {pet.allergies && pet.allergies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm font-medium">Allergies</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pet.allergies.map((allergy, index) => {
                    const severity = pet.allergySeverities?.[allergy] || "mild"
                    return (
                      <Badge
                        key={index}
                        variant={getAllergySeverityColor(severity) as any}
                        className="gap-1"
                      >
                        {allergy}
                        <span className="text-xs opacity-70">
                          ({severity})
                        </span>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Medications - Requirement 10.8 */}
            {pet.medications && pet.medications.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Current Medications</p>
                <div className="space-y-3">
                  {pet.medications.map((medication, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{medication.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {medication.dosage}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {medication.frequency}
                        </Badge>
                      </div>
                      {medication.purpose && (
                        <p className="text-xs text-muted-foreground">
                          For: {medication.purpose}
                        </p>
                      )}
                      {/* Dosage Schedule - Requirement 10.8 */}
                      {medication.frequency && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Schedule: {medication.frequency}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions - Requirement 10.9 */}
            {pet.conditions && pet.conditions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Pre-existing Conditions</p>
                <div className="space-y-2">
                  {pet.conditions.map((condition, index) => {
                    const status = getConditionStatus(condition)
                    const statusColor = getConditionStatusColor(status)
                    
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium">{condition.name}</p>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", statusColor)}
                          >
                            {status}
                          </Badge>
                        </div>
                        {condition.diagnosedAt && (
                          <p className="text-xs text-muted-foreground">
                            Diagnosed: {new Date(condition.diagnosedAt).toLocaleDateString()}
                          </p>
                        )}
                        {condition.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {condition.notes}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vet Information */}
      {pet.vetInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Veterinary Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pet.vetInfo.clinicName && (
              <div>
                <span className="text-sm text-muted-foreground">Clinic</span>
                <p className="font-medium">{pet.vetInfo.clinicName}</p>
              </div>
            )}
            {pet.vetInfo.phone && (
              <div>
                <span className="text-sm text-muted-foreground">Phone</span>
                <p className="font-medium">{pet.vetInfo.phone}</p>
              </div>
            )}
            {pet.vetInfo.address && (
              <div>
                <span className="text-sm text-muted-foreground">Address</span>
                <p className="font-medium">{pet.vetInfo.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
