"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagInput } from "@/components/ui/tag-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addPlace } from "@/lib/storage"
import { MapPin, Clock, ChevronDown } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import type { Place, PlaceType, LeashRule, PlaceHours } from "@/lib/types"

export default function CreatePlacePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "" as PlaceType | "",
    address: "",
    lat: "",
    lng: "",
    leashRule: "" as LeashRule | "",
    amenities: [] as string[],
    rules: [] as string[],
    hazards: [] as string[],
    fenced: false,
    smallDogArea: false,
    waterStation: false,
    permitRequired: false,
    parkingInfo: "",
    hours: {} as PlaceHours,
  })

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    setIsLoading(false)
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a name for the place")
      return
    }

    if (!formData.type) {
      toast.error("Please select a place type")
      return
    }

    if (!formData.address.trim()) {
      toast.error("Please enter an address")
      return
    }

    if (!formData.lat || !formData.lng) {
      toast.error("Please enter coordinates")
      return
    }

    const lat = parseFloat(formData.lat)
    const lng = parseFloat(formData.lng)

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid coordinates")
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Coordinates out of range")
      return
    }

    setIsSubmitting(true)

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type,
      address: formData.address.trim(),
      lat,
      lng,
      leashRule: formData.leashRule || undefined,
      amenities: formData.amenities,
      rules: formData.rules,
      hazards: formData.hazards.length > 0 ? formData.hazards : undefined,
      fenced: formData.fenced || undefined,
      smallDogArea: formData.smallDogArea || undefined,
      waterStation: formData.waterStation || undefined,
      permitRequired: formData.permitRequired || undefined,
      parkingInfo: formData.parkingInfo.trim() || undefined,
      hours: Object.keys(formData.hours).length > 0 ? formData.hours : undefined,
      moderationStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addPlace(newPlace)
    toast.success("Place submitted for review!")
    router.push(`/places/${newPlace.id}`)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href="/places" label="Back to Places" className="mb-6" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Add New Place</CardTitle>
              <CardDescription>Share a pet-friendly location with the community</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Golden Gate Park Dog Playground"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Place Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as PlaceType })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select place type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog_park">Dog Park</SelectItem>
                  <SelectItem value="trail">Trail</SelectItem>
                  <SelectItem value="beach">Beach</SelectItem>
                  <SelectItem value="pet_friendly_venue">Pet-Friendly Venue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="1234 Main St, City, State, ZIP"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">
                  Latitude <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="37.7691"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng">
                  Longitude <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="-122.4862"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities</Label>
              <TagInput
                tags={formData.amenities}
                onChange={(amenities) => setFormData({ ...formData, amenities })}
                placeholder="Add amenities (e.g., Water Fountain, Benches)"
              />
              <p className="text-xs text-muted-foreground">Press Enter to add each amenity</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leashRule">Leash Rules</Label>
              <Select
                value={formData.leashRule}
                onValueChange={(value) => setFormData({ ...formData, leashRule: value as LeashRule })}
              >
                <SelectTrigger id="leashRule">
                  <SelectValue placeholder="Select leash rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Leash Required</SelectItem>
                  <SelectItem value="optional">Leash Optional</SelectItem>
                  <SelectItem value="prohibited">Leash Prohibited</SelectItem>
                  <SelectItem value="off_leash_allowed">Off-Leash Allowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Rules & Guidelines</Label>
              <TagInput
                tags={formData.rules}
                onChange={(rules) => setFormData({ ...formData, rules })}
                placeholder="Add rules (e.g., Dogs must be on leash)"
              />
              <p className="text-xs text-muted-foreground">Press Enter to add each rule</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hazards">Hazards & Safety Concerns</Label>
              <TagInput
                tags={formData.hazards}
                onChange={(hazards) => setFormData({ ...formData, hazards })}
                placeholder="Add hazards (e.g., Busy road nearby, Steep cliffs)"
              />
              <p className="text-xs text-muted-foreground">Press Enter to add each hazard</p>
            </div>

            <div className="space-y-4">
              <Label>Features</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fenced"
                    checked={formData.fenced}
                    onCheckedChange={(checked) => setFormData({ ...formData, fenced: checked === true })}
                  />
                  <Label htmlFor="fenced" className="font-normal cursor-pointer">
                    Fenced area
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smallDogArea"
                    checked={formData.smallDogArea}
                    onCheckedChange={(checked) => setFormData({ ...formData, smallDogArea: checked === true })}
                  />
                  <Label htmlFor="smallDogArea" className="font-normal cursor-pointer">
                    Small dog area available
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="waterStation"
                    checked={formData.waterStation}
                    onCheckedChange={(checked) => setFormData({ ...formData, waterStation: checked === true })}
                  />
                  <Label htmlFor="waterStation" className="font-normal cursor-pointer">
                    Water station available
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permitRequired"
                    checked={formData.permitRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, permitRequired: checked === true })}
                  />
                  <Label htmlFor="permitRequired" className="font-normal cursor-pointer">
                    Permit required
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingInfo">Parking Information</Label>
              <Textarea
                id="parkingInfo"
                placeholder="e.g., Free parking available, Street parking only, Paid parking lot"
                value={formData.parkingInfo}
                onChange={(e) => setFormData({ ...formData, parkingInfo: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Hours of Operation</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                    setExpandedDays(new Set(allDays))
                  }}
                >
                  Expand All
                </Button>
              </div>
              <div className="space-y-2 border rounded-lg p-4">
                {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => {
                  const dayHours = formData.hours[day]
                  const isExpanded = expandedDays.has(day)
                  return (
                    <div key={day} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newExpanded = new Set(expandedDays)
                          if (isExpanded) {
                            newExpanded.delete(day)
                          } else {
                            newExpanded.add(day)
                          }
                          setExpandedDays(newExpanded)
                        }}
                        className="flex items-center justify-between w-full text-left p-2 hover:bg-muted rounded"
                      >
                        <Label className="font-medium capitalize cursor-pointer">{day}</Label>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {isExpanded && (
                        <div className="grid grid-cols-3 gap-2 ml-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${day}-closed`}
                              checked={dayHours?.closed || false}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  hours: {
                                    ...formData.hours,
                                    [day]: { ...dayHours, closed: checked === true, open: "", close: "" },
                                  },
                                })
                              }}
                            />
                            <Label htmlFor={`${day}-closed`} className="font-normal cursor-pointer text-sm">
                              Closed
                            </Label>
                          </div>
                          {!dayHours?.closed && (
                            <>
                              <Input
                                type="time"
                                placeholder="Open"
                                value={dayHours?.open || ""}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    hours: {
                                      ...formData.hours,
                                      [day]: { ...dayHours, open: e.target.value, closed: false },
                                    },
                                  })
                                }}
                              />
                              <Input
                                type="time"
                                placeholder="Close"
                                value={dayHours?.close || ""}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    hours: {
                                      ...formData.hours,
                                      [day]: { ...dayHours, close: e.target.value, closed: false },
                                    },
                                  })
                                }}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div className="mt-4">
                  <Label htmlFor="hoursNotes" className="text-sm">Additional Hours Notes</Label>
                  <Textarea
                    id="hoursNotes"
                    placeholder="e.g., Seasonal hours may vary, Closed on holidays"
                    value={formData.hours.notes || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        hours: { ...formData.hours, notes: e.target.value },
                      })
                    }}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              All submissions will be reviewed before being published on the platform.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

