"use client"

import { useCallback, useEffect, useMemo, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FriendCategoryManager } from "@/components/friends/friend-category-manager"
import { FriendRequestsSection } from "@/components/friend-requests-manager"
import { getPetByUsernameAndSlug, getPets, getUsers, removePetFriendship } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { FriendCategory, Pet, User } from "@/lib/types"
import {
  CircleDot,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  Loader2,
  PawPrint,
  Search,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { findMutualFriendSuggestions, type MutualFriendSuggestion } from "@/lib/utils/mutual-friends"

const ALL_CATEGORIES_ID = "all"
const UNASSIGNED_CATEGORY_ID = "__unassigned__"

export default function PetFriendsPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [friends, setFriends] = useState<Pet[]>([])
  const [categories, setCategories] = useState<FriendCategory[]>([])
  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [mutualFriendSuggestions, setMutualFriendSuggestions] = useState<MutualFriendSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_ID)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const usersById = useMemo(() => {
    const map = new Map<string, User>()
    for (const user of allUsers) {
      map.set(user.id, user)
    }
    return map
  }, [allUsers])

  const fetchPetData = useCallback(() => {
    const fetchedPet = getPetByUsernameAndSlug(username, slug)
    if (!fetchedPet) {
      return null
    }

    const pets = getPets()
    const users = getUsers()
    const owner = users.find((user) => user.id === fetchedPet.ownerId) ?? null
    const friendPets =
      fetchedPet.friends?.map((friendId: string) => pets.find((p) => p.id === friendId)).filter(Boolean) as Pet[] ?? []

    return { pet: fetchedPet, owner, friends: friendPets, pets, users }
  }, [username, slug])

  const applyPetData = useCallback(
    (data: { pet: Pet; owner: User | null; friends: Pet[] }) => {
      setPet(data.pet)
      setOwner(data.owner)
      setFriends(data.friends)
      const nextCategories = data.pet.friendCategories ?? []
      setCategories(nextCategories)
      setAssignments(data.pet.friendCategoryAssignments ?? {})
      setSelectedCategory((prev) => {
        if (nextCategories.length === 0) {
          return ALL_CATEGORIES_ID
        }
        if (prev === ALL_CATEGORIES_ID || prev === UNASSIGNED_CATEGORY_ID) {
          return prev
        }
        const exists = nextCategories.some((category) => category.id === prev)
        return exists ? prev : ALL_CATEGORIES_ID
      })
    },
    [],
  )

  const refreshPetData = useCallback(() => {
    setRemoveError(null)
    const data = fetchPetData()
    if (!data) return
    applyPetData(data)
    setAllUsers(data.users)
    const suggestions = findMutualFriendSuggestions(data.pet, data.pets).slice(0, 6)
    setMutualFriendSuggestions(suggestions)
  }, [applyPetData, fetchPetData])

  useEffect(() => {
    setIsLoading(true)
    const data = fetchPetData()

    if (!data) {
      setIsLoading(false)
      router.push(`/user/${username}`)
      return
    }

    applyPetData(data)
    setAllUsers(data.users)
    const suggestions = findMutualFriendSuggestions(data.pet, data.pets).slice(0, 6)
    setMutualFriendSuggestions(suggestions)
    setIsLoading(false)
  }, [fetchPetData, applyPetData, router, username])

  const { categoryCounts, unassignedCount } = useMemo(() => {
    const counts: Record<string, number> = {}
    let unassigned = 0

    for (const friend of friends) {
      const assignment = assignments[friend.id]
      if (assignment) {
        counts[assignment] = (counts[assignment] ?? 0) + 1
      } else {
        unassigned += 1
      }
    }

    return { categoryCounts: counts, unassignedCount: unassigned }
  }, [friends, assignments])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredFriends = friends.filter((friend) => {
    if (normalizedQuery.length > 0) {
      const nameMatches = friend.name.toLowerCase().includes(normalizedQuery)
      const breedMatches = friend.breed ? friend.breed.toLowerCase().includes(normalizedQuery) : false
      const speciesMatches = friend.species.toLowerCase().includes(normalizedQuery)

      if (!nameMatches && !breedMatches && !speciesMatches) {
        return false
      }
    }

    const assignment = assignments[friend.id]
    if (selectedCategory === ALL_CATEGORIES_ID) {
      return true
    }
    if (selectedCategory === UNASSIGNED_CATEGORY_ID) {
      return !assignment
    }
    return assignment === selectedCategory
  })

  const hasSearch = normalizedQuery.length > 0
  const selectedCategoryLabel =
    selectedCategory === ALL_CATEGORIES_ID
      ? null
      : selectedCategory === UNASSIGNED_CATEGORY_ID
        ? "Unassigned"
        : categories.find((category) => category.id === selectedCategory)?.name ?? null

  const isOwner = currentUser?.id === owner?.id
  const groupedFriends = useMemo(() => {
    if (selectedCategory !== ALL_CATEGORIES_ID) {
      return null
    }
    const groups: Record<string, Pet[]> = {}
    for (const friend of filteredFriends) {
      const assignment = assignments[friend.id] ?? UNASSIGNED_CATEGORY_ID
      if (!groups[assignment]) {
        groups[assignment] = []
      }
      groups[assignment].push(friend)
    }
    return groups
  }, [filteredFriends, assignments, selectedCategory])
  const unassignedGroup = groupedFriends?.[UNASSIGNED_CATEGORY_ID] ?? []

  const getSpeciesIcon = (species: Pet["species"]) => {
    const icons = {
      dog: Dog,
      cat: Cat,
      bird: Bird,
      rabbit: Rabbit,
      hamster: PawPrint,
      fish: Fish,
      other: CircleDot,
    }
    return icons[species] || PawPrint
  }

  const handleRemoveFriend = (friend: Pet) => {
    if (!pet) return
    setRemovingFriendId(friend.id)
    setRemoveError(null)
    const result = removePetFriendship(pet.id, friend.id)
    if (!result.success) {
      setRemoveError(result.error ?? `Unable to remove ${friend.name} at the moment.`)
      setRemovingFriendId(null)
      return
    }
    setRemovingFriendId(null)
    refreshPetData()
  }

  const renderFriendCard = (friend: Pet) => {
    const friendOwner = usersById.get(friend.ownerId)
    const friendSlug = friend.slug || friend.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
    const SpeciesIcon = getSpeciesIcon(friend.species)
    const assignmentId = assignments[friend.id]
    const assignedCategory = assignmentId ? categories.find((category) => category.id === assignmentId) : undefined

    return (
      <Link
        key={friend.id}
        href={friendOwner ? `/user/${friendOwner.username}/pet/${friendSlug}` : `/pet/${friend.id}`}
      >
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardContent className="relative p-6">
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-3 top-3 h-8"
                title="Remove friend"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleRemoveFriend(friend)
                }}
                disabled={removingFriendId === friend.id}
              >
                {removingFriendId === friend.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                <span className="sr-only">Remove friend</span>
              </Button>
            )}
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                <AvatarFallback className="text-2xl">{friend.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 w-full">
                <h3 className="font-semibold text-lg">{friend.name}</h3>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <SpeciesIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="capitalize">
                      {friend.breed || friend.species}
                    </Badge>
                  </div>
                  {assignedCategory ? (
                    <Badge variant="secondary">{assignedCategory.name}</Badge>
                  ) : categories.length > 0 ? (
                    <Badge variant="outline">No category</Badge>
                  ) : null}
                </div>
                {friend.age !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {friend.age} {friend.age === 1 ? "year" : "years"} old
                  </p>
                )}
                {friend.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{friend.bio}</p>
                )}
                {friendOwner && (
                  <p className="text-xs text-muted-foreground mt-2">Owned by {friendOwner.fullName}</p>
                )}
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{friend.followers.length} followers</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !owner) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Pet not found</p>
            <BackButton href={`/user/${username}`} label="Back to Profile" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const petDisplayName = pet.name
  const emptyStateMessage = hasSearch
    ? selectedCategory === ALL_CATEGORIES_ID
      ? `No friends found matching "${searchQuery}"`
      : `No friends found matching "${searchQuery}" in ${selectedCategoryLabel ?? "this category"}`
    : selectedCategory === UNASSIGNED_CATEGORY_ID
      ? `${petDisplayName} hasn't assigned any friends to a category yet`
      : selectedCategoryLabel
        ? `${petDisplayName} doesn't have any friends in ${selectedCategoryLabel} yet`
        : `${petDisplayName} doesn't have any friends yet`

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={getPetUrlFromPet(pet, username)} label={`Back to ${pet.name}'s Profile`} />

      {isOwner && (
        <div className="mb-6">
          <FriendRequestsSection pet={pet} onChange={refreshPetData} />
        </div>
      )}

      <Card>
        <CardHeader className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {pet.name}'s Friends
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    {selectedCategory === ALL_CATEGORIES_ID && !hasSearch
                      ? friends.length
                      : `${filteredFriends.length} of ${friends.length}`}
                  </span>
                </CardTitle>
                <CardDescription>
                  {selectedCategory === ALL_CATEGORIES_ID
                    ? `${pet.name}'s furry friends`
                    : selectedCategory === UNASSIGNED_CATEGORY_ID
                      ? "Friends waiting for a category"
                      : `${pet.name}'s ${selectedCategoryLabel ?? "selected"} circle`}
                </CardDescription>
              </div>
            </div>
            {isOwner && (
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Manage categories</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Manage Friend Categories</DialogTitle>
                    <DialogDescription>
                      Create groups and assign friends to keep {pet.name}'s social circle organized.
                    </DialogDescription>
                  </DialogHeader>
                  <FriendCategoryManager
                    petId={pet.id}
                    categories={categories}
                    friends={friends}
                    assignments={assignments}
                    onRefresh={refreshPetData}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {removeError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {removeError}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={selectedCategory === ALL_CATEGORIES_ID ? "default" : "outline"}
              onClick={() => setSelectedCategory(ALL_CATEGORIES_ID)}
            >
              All ({friends.length})
            </Button>
            {categories.map((category) => {
              const count = categoryCounts[category.id] ?? 0
              return (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({count})
                </Button>
              )
            })}
            {categories.length > 0 && (
              <Button
                size="sm"
                variant={selectedCategory === UNASSIGNED_CATEGORY_ID ? "default" : "outline"}
                onClick={() => setSelectedCategory(UNASSIGNED_CATEGORY_ID)}
              >
                Unassigned ({unassignedCount})
              </Button>
            )}
          </div>
          <div>
            {filteredFriends.length > 0 ? (
              selectedCategory === ALL_CATEGORIES_ID && categories.length > 0 ? (
                <div className="space-y-8">
                  {categories.map((category) => {
                    const categoryGroup = groupedFriends?.[category.id] ?? []
                    if (categoryGroup.length === 0) {
                      return null
                    }
                    return (
                      <div key={category.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <Badge variant="secondary">{categoryGroup.length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryGroup.map(renderFriendCard)}
                        </div>
                      </div>
                    )
                  })}
                  {unassignedGroup.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Unassigned</h3>
                        <Badge variant="outline">{unassignedGroup.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unassignedGroup.map(renderFriendCard)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map(renderFriendCard)}
                </div>
              )
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{emptyStateMessage}</p>
              </div>
            )}
          </div>

          {mutualFriendSuggestions.length > 0 && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Pets you may know
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Based on mutual friends of {pet.name}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {mutualFriendSuggestions.length} suggestion
                  {mutualFriendSuggestions.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mutualFriendSuggestions.map((suggestion) => {
                  const suggestionOwner = usersById.get(suggestion.pet.ownerId)
                  const suggestionSlug =
                    suggestion.pet.slug ||
                    suggestion.pet.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
                  const SpeciesIcon = getSpeciesIcon(suggestion.pet.species)
                  const mutualFriendNames = suggestion.mutualFriends.map((mutual) => mutual.name).join(", ")

                  return (
                    <Link
                      key={suggestion.pet.id}
                      href={
                        suggestionOwner
                          ? `/user/${suggestionOwner.username}/pet/${suggestionSlug}`
                          : `/pet/${suggestion.pet.id}`
                      }
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-dashed">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center space-y-4">
                            <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                              <AvatarImage src={suggestion.pet.avatar || "/placeholder.svg"} alt={suggestion.pet.name} />
                              <AvatarFallback className="text-2xl">{suggestion.pet.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 w-full">
                              <h3 className="font-semibold text-lg">{suggestion.pet.name}</h3>
                              <div className="flex items-center justify-center gap-2">
                                <SpeciesIcon className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline" className="capitalize">
                                  {suggestion.pet.breed || suggestion.pet.species}
                                </Badge>
                              </div>
                              {suggestion.pet.age !== undefined && (
                                <p className="text-sm text-muted-foreground">
                                  {suggestion.pet.age} {suggestion.pet.age === 1 ? "year" : "years"} old
                                </p>
                              )}
                              {suggestionOwner && (
                                <p className="text-xs text-muted-foreground">
                                  Owned by {suggestionOwner.fullName}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground mt-3 space-y-1">
                                <div className="flex items-center justify-center gap-2 font-medium">
                                  <Users className="h-3 w-3" />
                                  {suggestion.mutualFriends.length} mutual{" "}
                                  {suggestion.mutualFriends.length === 1 ? "friend" : "friends"}
                                </div>
                                <p className="line-clamp-1">{mutualFriendNames}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


