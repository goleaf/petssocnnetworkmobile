"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { LucideIcon } from "lucide-react"
import { Activity, Gift, Loader2, Share2, UtensilsCrossed, X, Plus } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updatePet, addBlogPost } from "@/lib/storage"
import type { BlogPost, Pet } from "@/lib/types"

type FavoriteCategoryKey = "toys" | "foods" | "activities"

interface FavoriteCategory {
  key: FavoriteCategoryKey
  label: string
  placeholder: string
  description: string
  icon: LucideIcon
  emptyState: string
}

const FAVORITE_CATEGORIES: FavoriteCategory[] = [
  {
    key: "toys",
    label: "Toys",
    placeholder: "Add a favorite toy",
    description: "Keep a running list of the toys that always spark joy.",
    icon: Gift,
    emptyState: "No favorite toys added yet.",
  },
  {
    key: "foods",
    label: "Foods",
    placeholder: "Add a favorite food or treat",
    description: "Track go-to meals, treats, and special snacks.",
    icon: UtensilsCrossed,
    emptyState: "No favorite foods added yet.",
  },
  {
    key: "activities",
    label: "Activities",
    placeholder: "Add a favorite activity",
    description: "Capture the activities that keep your pet energized.",
    icon: Activity,
    emptyState: "No favorite activities added yet.",
  },
]

interface FeedbackState {
  type: "success" | "error"
  text: string
}

interface PetFavoritesProps {
  pet: Pet
  currentUserId: string | null
  onPetUpdate: (updatedPet: Pet) => void
}

export function PetFavorites({ pet, currentUserId, onPetUpdate }: PetFavoritesProps) {
  const [inputValues, setInputValues] = useState<Record<FavoriteCategoryKey, string>>({
    toys: "",
    foods: "",
    activities: "",
  })
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [sharingPetId, setSharingPetId] = useState<string | null>(null)

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const hasFavorites = (pet: Pet): boolean => {
    return FAVORITE_CATEGORIES.some(
      (category) => (pet.favoriteThings?.[category.key]?.length ?? 0) > 0,
    )
  }

  const handleAddFavorite = (category: FavoriteCategoryKey, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const rawValue = inputValues[category]?.trim()
    if (!rawValue) {
      setFeedback({ type: "error", text: "Please enter a value before adding." })
      return
    }

    const currentItems = pet.favoriteThings?.[category] ?? []
    if (currentItems.some((item) => item.toLowerCase() === rawValue.toLowerCase())) {
      setFeedback({ type: "error", text: "That item is already on the list." })
      return
    }

    const updatedPet: Pet = {
      ...pet,
      favoriteThings: {
        ...pet.favoriteThings,
        [category]: [...currentItems, rawValue],
      },
    }

    updatePet(updatedPet)
    onPetUpdate(updatedPet)
    setInputValues((prev) => ({ ...prev, [category]: "" }))
    setFeedback({ type: "success", text: "Favorite saved successfully." })
  }

  const handleRemoveFavorite = (category: FavoriteCategoryKey, value: string) => {
    const currentItems = pet.favoriteThings?.[category] ?? []
    const updatedItems = currentItems.filter(
      (item) => item.toLowerCase() !== value.toLowerCase(),
    )

    const updatedPet: Pet = {
      ...pet,
      favoriteThings: {
        ...pet.favoriteThings,
        [category]: updatedItems,
      },
    }

    updatePet(updatedPet)
    onPetUpdate(updatedPet)
    setFeedback({ type: "success", text: "Favorite removed." })
  }

  const handleShareFavorites = async () => {
    if (!currentUserId) return
    if (!hasFavorites(pet)) {
      setFeedback({ type: "error", text: "Add a few favorites before sharing." })
      return
    }

    setSharingPetId(pet.id)
    setFeedback(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 400))

      const sections: string[] = []
      FAVORITE_CATEGORIES.forEach((category) => {
        const items = pet.favoriteThings?.[category.key] ?? []
        if (items.length > 0) {
          sections.push(`${category.label}: ${items.join(", ")}`)
        }
      })

      const sanitizedName = pet.name.replace(/\s+/g, "")

      const newPost: BlogPost = {
        id: String(Date.now()),
        petId: pet.id,
        authorId: currentUserId,
        title: `${pet.name}'s Favorite Things`,
        content: `Sharing ${pet.name}'s favorite things:\n\n${sections.join("\n")}`,
        coverImage: undefined,
        tags: ["favorites", "pet-life"],
        categories: ["Favorites"],
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        privacy: "public",
        hashtags: ["#favorites", `#${sanitizedName}`, "#pawsocial"],
      }

      addBlogPost(newPost)
      setFeedback({
        type: "success",
        text: `${pet.name}'s favorites are now shared to your feed.`,
      })
    } catch (error) {
      console.error("Failed to share favorites", error)
      setFeedback({
        type: "error",
        text: "We couldn't share those favorites right now. Please try again.",
      })
    } finally {
      setSharingPetId(null)
    }
  }

  const isOwner = currentUserId === pet.ownerId

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl">{pet.name}'s Favorites</CardTitle>
          <CardDescription>
            {isOwner
              ? `Add or update the things that make ${pet.name} happiest.`
              : `Things that ${pet.name} loves.`}
          </CardDescription>
        </div>
        {isOwner && (
          <Button
            size="sm"
            disabled={sharingPetId === pet.id || !hasFavorites(pet)}
            onClick={handleShareFavorites}
          >
            {sharingPetId === pet.id ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing…
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share favorites
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {feedback && (
          <Alert
            variant={feedback.type === "error" ? "destructive" : "default"}
            className={`mb-4 ${feedback.type === "success" ? "border-green-500/50 bg-green-500/10" : ""}`}
          >
            <AlertTitle>{feedback.type === "error" ? "Oops!" : "All set"}</AlertTitle>
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={FAVORITE_CATEGORIES[0]?.key}>
          <TabsList className="flex-wrap">
            {FAVORITE_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger key={category.key} value={category.key}>
                  <Icon className="h-4 w-4" />
                  {category.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {FAVORITE_CATEGORIES.map((category) => {
            const Icon = category.icon
            const items = pet.favoriteThings?.[category.key] ?? []
            return (
              <TabsContent key={category.key} value={category.key}>
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{category.label}</p>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{category.emptyState}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, index) => (
                        <Badge
                          key={`${item}-${index}`}
                          variant="outline"
                          className="flex items-center gap-1 pr-1"
                        >
                          {item}
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFavorite(category.key, item)}
                              className="rounded-full p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Remove ${item}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {isOwner && (
                    <>
                      <form
                        onSubmit={(event) => handleAddFavorite(category.key, event)}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                      >
                        <Input
                          value={inputValues[category.key]}
                          onChange={(event) =>
                            setInputValues((prev) => ({
                              ...prev,
                              [category.key]: event.target.value,
                            }))
                          }
                          placeholder={category.placeholder}
                          aria-label={`Add ${category.label.toLowerCase()}`}
                        />
                        <Button
                          type="submit"
                          className="sm:w-auto"
                          disabled={inputValues[category.key].trim().length === 0}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </form>

                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </>
                  )}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}

