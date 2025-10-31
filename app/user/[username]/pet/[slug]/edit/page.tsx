"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPetByUsernameAndSlug, updatePet, generatePetSlug, getUsers } from "@/lib/storage"
import type { Pet } from "@/lib/types"
import { ArrowLeft, Save } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

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

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Pet not found or you don't have permission to edit.</p>
            <Link href={`/user/${username}`}>
              <Button>Back to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href={getPetUrlFromPet(pet, username)}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pet Profile
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Edit Pet Profile</CardTitle>
              <CardDescription>Update your pet{"'"}s information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="hamster">Hamster</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: Pet["gender"]) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
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
                <Label htmlFor="birthday">Birthday</Label>
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
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 70 lbs, 5 kg"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
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
                <Label htmlFor="adoptionDate">Adoption Date</Label>
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
                <Label htmlFor="spayedNeutered" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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

            <div className="flex gap-4 pt-4">
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
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

