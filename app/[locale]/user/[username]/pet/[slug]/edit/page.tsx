"use client"

import React, { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { PetForm, type PetFormData } from "@/components/pet-form"
import { getPetByUsernameAndSlug } from "@/lib/storage"
import { updatePetEncrypted, getPetByUsernameAndSlugForViewer } from "@/lib/pet-health-storage"
import { generatePetSlug, getUsers } from "@/lib/storage"
import type { Pet } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Save } from "lucide-react"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { toast } from "sonner"

export default function EditPetPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [pet, setPet] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

    // Check if user owns the pet or is a co-owner with edit permission
    const isOwner = fetchedPet.ownerId === user.id
    const canCoOwnerEdit = Array.isArray(fetchedPet.coOwners) && fetchedPet.coOwners.some((c: any) => c.userId === user.id && (c.permissions?.editProfile || c.permissions?.editHealth))
    if (!isOwner && !canCoOwnerEdit) {
      const owner = getUsers().find((u) => u.id === fetchedPet.ownerId)
      if (owner) {
        const petUrl = getPetUrlFromPet(fetchedPet, owner.username)
        router.push(petUrl)
      } else {
        router.push(`/user/${username}`)
      }
      return
    }

    // Load decrypted view for editor
    getPetByUsernameAndSlugForViewer(username, slug, user.id).then((decrypted) => {
      setPet((decrypted as Pet) || fetchedPet)
      setIsLoading(false)
    })
  }, [username, slug, user, router])

  const handleSubmit = async (formData: PetFormData) => {
    if (!user || !pet) return

    // Generate new slug if name changed
    const newSlug = pet.name !== formData.name ? generatePetSlug(formData.name) : pet.slug

    const sanitizedAchievements = formData.achievements
      .map((achievement) => {
        const title = achievement.title.trim()
        const description = achievement.description.trim()
        const icon = achievement.icon?.trim() || "🏆"
        const earnedAt = achievement.earnedAt || new Date().toISOString().split("T")[0]

        return {
          ...achievement,
          title,
          description,
          icon,
          earnedAt,
          type: achievement.type || "milestone",
          highlight: Boolean(achievement.highlight),
        }
      })
      .filter((achievement) => achievement.title.length > 0)

    const updatedPet = {
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
      achievements: sanitizedAchievements.length > 0 ? sanitizedAchievements : undefined,
      trainingProgress: formData.trainingProgress.length > 0 ? formData.trainingProgress : undefined,
      slug: newSlug,
      privacy: {
        visibility: formData.privacyVisibility,
        interactions: formData.privacyInteractions,
      },
    }

    try {
      // Submit to moderation API instead of direct update
      const response = await fetch("/api/admin/moderation/edit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: "pet",
          contentId: pet.id,
          originalContent: pet,
          editedContent: updatedPet,
          reason: "Pet profile edit",
          priority: "normal",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limit errors
        if (response.status === 429) {
          const retryMinutes = data.details?.retryAfterMinutes || 1
          toast.error(`Rate limit exceeded. You can submit ${data.details?.remaining || 0} more edits. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''}.`)
          return
        }

        // Handle other errors
        throw new Error(data.error || "Failed to submit edit request")
      }

      // Show success message
      toast.success("Edit submitted for approval! Your changes will be reviewed by a moderator.")

      // Redirect to pet profile after a short delay
      setTimeout(() => {
        router.push(getPetUrlFromPet(pet, username))
      }, 1000)
    } catch (error) {
      console.error("Error submitting edit request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit edit request. Please try again.")
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

      <PetForm
        mode="edit"
        initialData={pet}
        onSubmit={handleSubmit}
        onCancel={() => router.push(getPetUrlFromPet(pet, username))}
        petName={pet.name}
      />
    </div>
  )
}
