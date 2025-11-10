"use client"

import { useState } from "react"
import type { Pet, Vaccination, Medication, VetInfo, HealthRecord } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Activity,
  Calendar,
  Pill,
  Syringe,
  Scale,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Health Tab Component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.6
 * 
 * Displays comprehensive health information:
 * - Vet records in chronological order
 * - Vaccination history with next due dates
 * - Current medications with schedules
 * - Weight tracking chart
 * - Medical history timeline
 * - Edit functionality for pet owners
 * - Privacy checks for sensitive health data
 */

export interface HealthTabProps {
  pet: Pet
  canEdit?: boolean
  currentUserId?: string | null
}

export function HealthTab({ pet, canEdit = false, currentUserId }: HealthTabProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(canEdit)

  /**
   * Check if user can view sensitive health data
   * Requirement 9.6: Implement privacy checks for sensitive health data
   */
  const canViewHealthData = (): boolean => {
    // Owner can always view
    if (canEdit) return true
    
    // Check if user is a co-owner with health permissions
    if (currentUserId && pet.coOwners) {
      const coOwner = pet.coOwners.find(co => co.userId === currentUserId)
      if (coOwner?.permissions?.viewHealth) return true
    }
    
    // Check privacy settings
    if (pet.privacy && typeof pet.privacy === 'object' && 'sectionPrivacy' in pet.privacy) {
      const healthPrivacy = (pet.privacy as any).sectionPrivacy?.health
      if (healthPrivacy === 'private') return false
      if (healthPrivacy === 'friends' && currentUserId) {
        // Check if user is following the pet
        return pet.followers?.includes(currentUserId) || false
      }
    }
    
    return true
  }

  /**
   * Get vaccination status color
   * Requirement 6.2: Show vaccination history with next due dates
   */
  const getVaccinationStatus = (vaccination: Vaccination): {
    status: 'current' | 'due_soon' | 'overdue'
    color: string
    label: string
  } => {
    if (!vaccination.nextDueDate) {
      return { status: 'current', color: 'text-green-600', label: 'Current' }
    }

    const today = new Date()
    const dueDate = new Date(vaccination.nextDueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      return { status: 'overdue', color: 'text-red-600', label: 'Overdue' }
    } else if (daysUntilDue <= 30) {
      return { status: 'due_soon', color: 'text-yellow-600', label: 'Due Soon' }
    }
    
    return { status: 'current', color: 'text-green-600', label: 'Current' }
  }

  /**
   * Get weight trend from history
   * Requirement 6.4: Display weight tracking chart
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
   * Format medication frequency for display
   * Requirement 6.3: List current medications with schedules
   */
  const formatMedicationSchedule = (medication: Medication): string => {
    if (!medication.frequency) return "As needed"
    
    const freq = medication.frequency.toLowerCase()
    if (freq.includes('daily')) {
      const times = medication.times?.length || 1
      return `${times}x daily`
    }
    
    return medication.frequency
  }

  /**
   * Get medication adherence status
   * Requirement 6.3: Show medication schedules
   */
  const getMedicationAdherence = (medicationId: string): number => {
    if (!pet.medicationAdherence || !pet.medicationAdherence[medicationId]) {
      return 100 // Default to 100% if no data
    }
    
    const doses = pet.medicationAdherence[medicationId]
    // Calculate adherence based on expected vs actual doses
    // This is a simplified calculation
    return Math.min(100, (doses.length / 7) * 100)
  }

  /**
   * Sort health records chronologically
   * Requirement 6.1: Display vet records in chronological order
   */
  const getSortedHealthRecords = (): HealthRecord[] => {
    if (!pet.healthRecords) return []
    
    return [...pet.healthRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  const canViewData = canViewHealthData()
  const weightTrend = getWeightTrend()
  const sortedRecords = getSortedHealthRecords()

  // Privacy gate for sensitive data
  if (!canViewData && !showSensitiveData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Health Information Private</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This pet's health information is private. Only the owner and authorized co-owners can view this data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy Toggle for Owner */}
      {canEdit && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {showSensitiveData ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {showSensitiveData ? "Showing all health data" : "Hiding sensitive data"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
          >
            {showSensitiveData ? "Hide Sensitive" : "Show All"}
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vaccination History - Requirement 6.2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Vaccinations
              </CardTitle>
              {canEdit && (
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pet.vaccinations && pet.vaccinations.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {pet.vaccinations.map((vaccination, index) => {
                    const status = getVaccinationStatus(vaccination)
                    
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{vaccination.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Given: {new Date(vaccination.dateAdministered).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", status.color)}
                          >
                            {status.status === 'current' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status.status === 'due_soon' && <Clock className="h-3 w-3 mr-1" />}
                            {status.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {status.label}
                          </Badge>
                        </div>
                        
                        {vaccination.nextDueDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Next due: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                          </div>
                        )}
                        
                        {vaccination.administeredBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {vaccination.administeredBy}
                          </p>
                        )}
                        
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Syringe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No vaccination records yet</p>
                {canEdit && (
                  <Button size="sm" variant="outline" className="mt-3">
                    Add First Vaccination
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Medications - Requirement 6.3 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications
              </CardTitle>
              {canEdit && (
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pet.medications && pet.medications.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {pet.medications.map((medication, index) => {
                    const adherence = getMedicationAdherence(medication.id || `med-${index}`)
                    
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {medication.dosage}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatMedicationSchedule(medication)}
                          </Badge>
                        </div>
                        
                        {medication.purpose && (
                          <p className="text-xs text-muted-foreground mb-2">
                            For: {medication.purpose}
                          </p>
                        )}
                        
                        {/* Medication Schedule - Requirement 6.3 */}
                        {medication.times && medication.times.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Schedule:</p>
                            <div className="flex flex-wrap gap-1">
                              {medication.times.map((time, timeIndex) => (
                                <Badge key={timeIndex} variant="secondary" className="text-xs">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Adherence Indicator */}
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Adherence</span>
                            <span className={cn(
                              "font-medium",
                              adherence >= 90 && "text-green-600",
                              adherence >= 70 && adherence < 90 && "text-yellow-600",
                              adherence < 70 && "text-red-600"
                            )}>
                              {adherence.toFixed(0)}%
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                adherence >= 90 && "bg-green-600",
                                adherence >= 70 && adherence < 90 && "bg-yellow-600",
                                adherence < 70 && "bg-red-600"
                              )}
                              style={{ width: `${adherence}%` }}
                            />
                          </div>
                        </div>
                        
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No medications currently</p>
                {canEdit && (
                  <Button size="sm" variant="outline" className="mt-3">
                    Add Medication
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weight Tracking - Requirement 6.4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Tracking
            </CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Log Weight
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pet.weightHistory && pet.weightHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Current Weight with Trend */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Weight</p>
                  <p className="text-2xl font-bold">{pet.weight}</p>
                </div>
                {weightTrend && (
                  <Badge variant="outline" className="gap-1">
                    {weightTrend === "gaining" && <TrendingUp className="h-4 w-4" />}
                    {weightTrend === "losing" && <TrendingDown className="h-4 w-4" />}
                    {weightTrend === "stable" && <Minus className="h-4 w-4" />}
                    {weightTrend.charAt(0).toUpperCase() + weightTrend.slice(1)}
                  </Badge>
                )}
              </div>

              {/* Weight History Chart */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Weight History</p>
                <div className="h-48 flex items-end gap-2">
                  {pet.weightHistory
                    .slice(-10)
                    .map((entry, index) => {
                      const maxWeight = Math.max(...pet.weightHistory!.map(e => e.weight))
                      const height = (entry.weight / maxWeight) * 100
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary rounded-t transition-all hover:opacity-80 cursor-pointer"
                            style={{ height: `${height}%` }}
                            title={`${entry.weight} on ${new Date(entry.date).toLocaleDateString()}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString(undefined, { 
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Recent Entries */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Recent Entries</p>
                <div className="space-y-2">
                  {pet.weightHistory.slice(-5).reverse().map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 rounded hover:bg-accent/50"
                    >
                      <span className="text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <span className="font-medium">{entry.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No weight history yet</p>
              {canEdit && (
                <Button size="sm" variant="outline" className="mt-3">
                  Log First Weight
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Veterinary Information - Requirement 6.1 */}
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
            {canEdit && (
              <Button size="sm" variant="outline" className="mt-4">
                <Edit className="h-4 w-4 mr-1" />
                Edit Vet Info
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medical History Timeline - Requirement 6.5 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Medical History
            </CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Record
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedRecords.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {sortedRecords.map((record, index) => (
                  <div
                    key={index}
                    className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0 last:pb-0"
                  >
                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{record.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        {canEdit && (
                          <Button size="sm" variant="ghost" className="h-7">
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {record.description && (
                        <p className="text-sm text-muted-foreground">
                          {record.description}
                        </p>
                      )}
                      
                      {record.veterinarian && (
                        <p className="text-xs text-muted-foreground">
                          Vet: {record.veterinarian}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No medical history records yet</p>
              {canEdit && (
                <Button size="sm" variant="outline" className="mt-3">
                  Add First Record
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
