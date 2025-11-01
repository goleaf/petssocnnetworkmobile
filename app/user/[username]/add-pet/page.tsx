"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { PetForm, type PetFormData } from "@/components/pet-form"
import { addPet, getUserByUsername, generatePetSlug, getUsers } from "@/lib/storage"
import { Plus } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

export default function AddPetPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchedUser = getUserByUsername(username)
    if (!fetchedUser || !user || fetchedUser.id !== user.id) {
      router.push(`/user/${username}`)
      return
    }
    setIsLoading(false)
  }, [username, user, router])

  const handleSubmit = async (formData: PetFormData) => {
    if (!user) return

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

    const newPet = {
      id: String(Date.now()),
      ownerId: user.id,
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
      privacy: {
        visibility: formData.privacyVisibility,
        interactions: formData.privacyInteractions,
      },
      followers: [],
      slug: generatePetSlug(formData.name),
    }

    addPet(newPet)
    // Redirect to pets page after successful creation
    setTimeout(() => {
      router.push(`/user/${username}/pets`)
    }, 1000)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/user/${username}/pets`} label="Back to Pets" />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Add New Pet</CardTitle>
              <CardDescription>Share your furry friend with the community</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <PetForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/user/${username}/pets`)}
      />
    </div>
  )
}
