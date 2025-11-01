"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Activity, Gift, Loader2, PawPrint, Share2, UtensilsCrossed, X, Plus } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPetsByOwnerId, updatePet, addBlogPost } from "@/lib/storage"
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

export default function FavoriteItemsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [hydrated, setHydrated] = useState(false)
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState("")
  const [inputValues, setInputValues] = useState<Record<FavoriteCategoryKey, string>>({
    toys: "",
    foods: "",
    activities: "",
  })
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [sharingPetId, setSharingPetId] = useState<string | null>(null)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !user) {
      if (!user) {
        setPets([])
        setSelectedPetId("")
      }
      return
    }

    const ownedPets = getPetsByOwnerId(user.id)
    setPets(ownedPets)
    setSelectedPetId((prev) => {
      if (prev && ownedPets.some((pet) => pet.id === prev)) {
        return prev
      }
      return ownedPets[0]?.id ?? ""
    })
  }, [hydrated, user])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId),
    [pets, selectedPetId],
  )

  const favoriteSummary = useMemo(() => {
    return FAVORITE_CATEGORIES.map((category) => ({
      key: category.key,
      label: category.label,
      total: pets.reduce(
        (sum, pet) => sum + (pet.favoriteThings?.[category.key]?.length ?? 0),
        0,
      ),
    }))
  }, [pets])

  const hasFavorites = (pet: Pet | undefined): boolean => {
    if (!pet) return false
    return FAVORITE_CATEGORIES.some(
      (category) => (pet.favoriteThings?.[category.key]?.length ?? 0) > 0,
    )
  }

  const handleSelectPet = (value: string) => {
    setSelectedPetId(value)
    setInputValues({
      toys: "",
      foods: "",
      activities: "",
    })
  }

  const handleAddFavorite = (category: FavoriteCategoryKey, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPet) return

    const rawValue = inputValues[category]?.trim()
    if (!rawValue) {
      setFeedback({ type: "error", text: "Please enter a value before adding." })
      return
    }

    const currentItems = selectedPet.favoriteThings?.[category] ?? []
    if (currentItems.some((item) => item.toLowerCase() === rawValue.toLowerCase())) {
      setFeedback({ type: "error", text: "That item is already on the list." })
      return
    }

    const updatedPet: Pet = {
      ...selectedPet,
      favoriteThings: {
        ...selectedPet.favoriteThings,
        [category]: [...currentItems, rawValue],
      },
    }

    updatePet(updatedPet)
    setPets((prev) => prev.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)))
    setInputValues((prev) => ({ ...prev, [category]: "" }))
    setFeedback({ type: "success", text: "Favorite saved successfully." })
  }

  const handleRemoveFavorite = (category: FavoriteCategoryKey, value: string) => {
    if (!selectedPet) return

    const currentItems = selectedPet.favoriteThings?.[category] ?? []
    const updatedItems = currentItems.filter(
      (item) => item.toLowerCase() !== value.toLowerCase(),
    )

    const updatedPet: Pet = {
      ...selectedPet,
      favoriteThings: {
        ...selectedPet.favoriteThings,
        [category]: updatedItems,
      },
    }

    updatePet(updatedPet)
    setPets((prev) => prev.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)))
    setFeedback({ type: "success", text: "Favorite removed." })
  }

  const handleShareFavorites = async (pet: Pet) => {
    if (!user) return
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
        authorId: user.id,
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

  if (!hydrated) {
    return null
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Track favorites with PawSocial</CardTitle>
            <CardDescription>
              Sign in to start keeping tabs on toys, foods, and activities your pets love.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>Go to sign in</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="space-y-6 sm:space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">Favorite Items</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Track every toy, snack, and activity your pets adore, then share those highlights with
            friends and followers in a single tap.
          </p>
        </header>

        {feedback && (
          <Alert
            variant={feedback.type === "error" ? "destructive" : "default"}
            className={feedback.type === "success" ? "border-green-500/50 bg-green-500/10" : ""}
          >
            <AlertTitle>{feedback.type === "error" ? "Oops!" : "All set"}</AlertTitle>
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        )}

        {pets.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-muted-foreground" />
                Add your first pet
              </CardTitle>
              <CardDescription>
                Once you add a pet profile, you can start curating their favorite things here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/dashboard/add-pet")}>Create pet profile</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <Card>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
                <div>
                  <CardTitle className="text-xl">Choose a pet to manage</CardTitle>
                  <CardDescription>
                    Switch between pets to keep their favorites fresh and accurate.
                  </CardDescription>
                </div>
                <Select value={selectedPetId} onValueChange={handleSelectPet}>
                  <SelectTrigger className="min-w-[220px]">
                    <SelectValue placeholder="Select a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteSummary.map((summary) => {
                const category = FAVORITE_CATEGORIES.find((c) => c.key === summary.key)
                if (!category) return null
                const Icon = category.icon
                return (
                  <div
                    key={summary.key}
                    className="rounded-lg border bg-card p-4 shadow-sm space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {category.label}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{summary.total}</p>
                    <p className="text-xs text-muted-foreground">
                      Total across {pets.length} pet{pets.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )
              })}
            </div>

            {selectedPet && (
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedPet.name}'s favorites</CardTitle>
                    <CardDescription>
                      Add or update the things that make {selectedPet.name} happiest.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    disabled={sharingPetId === selectedPet.id || !hasFavorites(selectedPet)}
                    onClick={() => handleShareFavorites(selectedPet)}
                  >
                    {sharingPetId === selectedPet.id ? (
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
                </CardHeader>
                <CardContent>
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
                      const items = selectedPet.favoriteThings?.[category.key] ?? []
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
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFavorite(category.key, item)}
                                      className="rounded-full p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                      aria-label={`Remove ${item}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}

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
                                disabled={
                                  inputValues[category.key].trim().length === 0
                                }
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </form>

                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
