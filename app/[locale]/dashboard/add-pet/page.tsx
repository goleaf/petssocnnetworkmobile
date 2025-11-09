"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addPet } from "@/lib/storage"
import type { Pet, PrivacyLevel } from "@/lib/types"
import { PrivacySelector } from "@/components/privacy-selector"
import { calculateAge } from "@/lib/utils/date"
import { ArrowLeft, Plus, PawPrint, Dog, Cat, Bird, Rabbit, Fish, CircleDot, User } from "lucide-react"
import Link from "next/link"

export default function AddPetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    species: "dog" as Pet["species"],
    breed: "",
    age: "",
    gender: "male" as Pet["gender"],
    bio: "",
    privacyVisibility: "public" as PrivacyLevel,
    privacyInteractions: "public" as PrivacyLevel,
    birthday: "",
    weight: "",
    color: "",
  })

  useEffect(() => {
    if (!formData.birthday) {
      return
    }
    const computedAge = calculateAge(formData.birthday)
    const nextAge = computedAge !== undefined ? computedAge.toString() : ""
    setFormData((prev) => (prev.age === nextAge ? prev : { ...prev, age: nextAge }))
  }, [formData.birthday])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const computedAge = formData.birthday ? calculateAge(formData.birthday) : undefined
    const newPet: Pet = {
      id: String(Date.now()),
      ownerId: user.id,
      name: formData.name,
      species: formData.species,
      breed: formData.breed || undefined,
      age: computedAge ?? (formData.age ? Number.parseInt(formData.age, 10) : undefined),
      gender: formData.gender,
      bio: formData.bio || undefined,
      birthday: formData.birthday || undefined,
      weight: formData.weight || undefined,
      color: formData.color || undefined,
      privacy: {
        visibility: formData.privacyVisibility,
        interactions: formData.privacyInteractions,
      },
      followers: [],
    }

    addPet(newPet)
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      <Card>
        <CardHeader>
          <CardTitle>Add a New Pet</CardTitle>
          <CardDescription>Share your furry, feathered, or scaly friend with the community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Select
                  value={formData.species}
                  onValueChange={(value: Pet["species"]) => setFormData({ ...formData, species: value })}
                >
                  <SelectTrigger className="w-full">
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
                  onValueChange={(value: string) => setFormData({ ...formData, gender: value as Pet["gender"] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(() => {
                        const genderIcons = {
                          male: User,
                          female: User,
                        }
                        const genderLabels = {
                          male: "Male",
                          female: "Female",
                        }
                        const g = (formData.gender || 'male') as 'male' | 'female'
                        const Icon = genderIcons[g] || User
                        return (
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{genderLabels[g]}</span>
                          </div>
                        )
                      })()}
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  value={formData.age}
                  onChange={(e) => {
                    if (!formData.birthday) {
                      const value = e.target.value
                      setFormData((prev) => ({ ...prev, age: value }))
                    }
                  }}
                  readOnly={Boolean(formData.birthday)}
                />
                {formData.birthday && (
                  <p className="text-xs text-muted-foreground">
                    Age updates automatically from the selected birthday.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      birthday: value,
                      age: value ? prev.age : "",
                    }))
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 70 lbs, 5 kg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Golden, Black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Profile Visibility</div>
              <PrivacySelector
                value={formData.privacyVisibility}
                onChange={(value) => setFormData({ ...formData, privacyVisibility: value })}
              />
              <p className="text-xs text-muted-foreground">
                Decide who can view this pet&apos;s profile and updates.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Interaction Access</div>
              <PrivacySelector
                value={formData.privacyInteractions}
                onChange={(value) => setFormData({ ...formData, privacyInteractions: value })}
              />
              <p className="text-xs text-muted-foreground">
                Limit who can follow or engage with this pet.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your pet's personality, likes, and quirks..."
                rows={4}
              />
            </div>

            <CreateButton type="submit" className="w-full" iconType="plus">
              Add Pet
            </CreateButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
