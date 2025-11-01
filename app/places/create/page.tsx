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
import { addPlace } from "@/lib/storage"
import { MapPin } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import type { Place } from "@/lib/types"

export default function CreatePlacePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    amenities: [] as string[],
    rules: [] as string[],
  })

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
      address: formData.address.trim(),
      lat,
      lng,
      amenities: formData.amenities,
      rules: formData.rules,
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
              <Label htmlFor="rules">Rules & Guidelines</Label>
              <TagInput
                tags={formData.rules}
                onChange={(rules) => setFormData({ ...formData, rules })}
                placeholder="Add rules (e.g., Dogs must be on leash)"
              />
              <p className="text-xs text-muted-foreground">Press Enter to add each rule</p>
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

