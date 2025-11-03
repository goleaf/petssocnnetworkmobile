"use client"

import { useState, useEffect, useMemo, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserByUsername, getPetsByOwnerId, deletePet, getPets } from "@/lib/storage"
import type { PrivacyLevel } from "@/lib/types"
import { EditButton } from "@/components/ui/edit-button"
import { DeleteButton } from "@/components/ui/delete-button"
import { CreateButton } from "@/components/ui/create-button"
import {
  Search,
  Heart,
  PawPrint,
  Edit2,
  Trash2,
  MoreHorizontal,
  Filter,
  X,
  Lock,
  Calendar,
  Users,
  Plus,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { canSendFollowRequest, canViewUserPets, canViewPet } from "@/lib/utils/privacy"
import { getPrivacyNotice } from "@/lib/utils/privacy-messages"
import { ANIMAL_TYPES } from "@/lib/animal-types"

type SortOption = "name" | "recent" | "oldest" | "species"
type SpeciesFilter = "all" | "dog" | "cat" | "bird" | "rabbit" | "hamster" | "fish" | "other"

const speciesIcons: Record<string, any> = ANIMAL_TYPES.reduce((acc, animal) => {
  acc[animal.value] = animal.lucideIcon
  return acc
}, {} as Record<string, any>)

export default function UserPetsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any | null>(null)
  const [pets, setPets] = useState<any[]>([])
  const [allPets, setAllPets] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchedUser = getUserByUsername(username)
    if (!fetchedUser) {
      router.push("/")
      return
    }

    setUser(fetchedUser)
    const viewerId = currentUser?.id || null

    if (canViewUserPets(fetchedUser, viewerId)) {
      const userPets = getPetsByOwnerId(fetchedUser.id)
      setPets(userPets)
    } else {
      setPets([])
    }

    setAllPets(getPets())
  }, [username, currentUser, router])

  // Filter and sort pets
  const filteredAndSortedPets = useMemo(() => {
    let filtered = [...pets]

    if (user) {
      const viewerId = currentUser?.id ?? null
      filtered = filtered.filter((pet) => canViewPet(pet, user, viewerId))
    }

    // Search filter - maximum search functionality
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (pet) =>
          pet.name?.toLowerCase().includes(query) ||
          pet.bio?.toLowerCase().includes(query) ||
          pet.breed?.toLowerCase().includes(query) ||
          pet.species?.toLowerCase().includes(query) ||
          pet.color?.toLowerCase().includes(query) ||
          pet.microchipId?.toLowerCase().includes(query)
      )
    }

    // Species filter
    if (speciesFilter !== "all") {
      filtered = filtered.filter((pet) => pet.species === speciesFilter)
    }

    // Sort
    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "recent") {
      // Sort by most recent posts or creation date
      filtered.sort((a, b) => {
        const aPosts = getPets().find((p) => p.id === a.id)?.photos?.length || 0
        const bPosts = getPets().find((p) => p.id === b.id)?.photos?.length || 0
        return bPosts - aPosts
      })
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        if (!a.birthday && !b.birthday) return 0
        if (!a.birthday) return 1
        if (!b.birthday) return -1
        return new Date(a.birthday).getTime() - new Date(b.birthday).getTime()
      })
    } else if (sortBy === "species") {
      filtered.sort((a, b) => a.species.localeCompare(b.species))
    }

    return filtered
  }, [pets, searchQuery, sortBy, speciesFilter, user, currentUser])

  // Group pets by species
  const groupedPets = useMemo(() => {
    const groups: Record<string, any[]> = {}

    filteredAndSortedPets.forEach((pet) => {
      const species = pet.species || "other"
      if (!groups[species]) {
        groups[species] = []
      }
      groups[species].push(pet)
    })

    // Sort species groups
    const speciesOrder = ["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"]
    return Object.entries(groups).sort(
      (a, b) => {
        const aIndex = speciesOrder.indexOf(a[0])
        const bIndex = speciesOrder.indexOf(b[0])
        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      }
    )
  }, [filteredAndSortedPets])

  const handleDelete = (petId: string) => {
    if (window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) {
      deletePet(petId)
      setPets(pets.filter((p) => p.id !== petId))
      setAllPets(allPets.filter((p) => p.id !== petId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSpeciesFilter("all")
    setSortBy("name")
  }

  const hasActiveFilters = searchQuery || speciesFilter !== "all"

  const privacyLabelMap: Record<PrivacyLevel, string> = {
    public: "Public",
    "followers-only": "Followers Only",
    private: "Private",
  }

  // Get all unique species from user's pets - MUST be before any conditional returns
  const availableSpecies = useMemo(() => {
    const species = new Set<string>()
    pets.forEach((pet) => {
      if (pet.species) species.add(pet.species)
    })
    return Array.from(species).sort()
  }, [pets])

  if (!user) return null

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)
  const privacyMessage = getPrivacyNotice({
    profileUser: user,
    scope: "pets",
    viewerId,
    canRequestAccess: canFollow,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{user.fullName}'s Pets</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {canViewPets
                  ? `${filteredAndSortedPets.length} ${filteredAndSortedPets.length === 1 ? "pet" : "pets"}`
                  : privacyMessage
                }
              </p>
            </div>
            {isOwnProfile && (
              <Link href={`/user/${user.username}/add-pet`} className="w-full sm:w-auto">
                <CreateButton iconType="plus" className="w-full sm:w-auto">
                  Add Pet
                </CreateButton>
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search pets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="species">Species</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="shadow-md">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <label className="text-sm sm:text-base font-medium">Filter by Species</label>
                    <Select value={speciesFilter} onValueChange={(value) => setSpeciesFilter(value as SpeciesFilter)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All species" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        {availableSpecies.map((species) => {
                          const Icon = speciesIcons[species] || PawPrint
                          const animalConfig = ANIMAL_TYPES.find(a => a.value === species)
                          const label = animalConfig ? animalConfig.label : species.charAt(0).toUpperCase() + species.slice(1)
                          const iconColor = animalConfig ? animalConfig.color : "text-muted-foreground"
                          return (
                            <SelectItem key={species} value={species}>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${iconColor}`} />
                                {label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Content */}
        {!canViewPets ? (
          <Card className="shadow-md mt-6 sm:mt-8">
            <CardContent className="p-8 sm:p-12 text-center space-y-4">
              <Lock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{privacyMessage}</p>
            </CardContent>
          </Card>
        ) : groupedPets.length === 0 ? (
          <Card className="shadow-md mt-6 sm:mt-8">
            <CardContent className="p-8 sm:p-12 text-center space-y-4">
              <PawPrint className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
              <p className="text-sm sm:text-base text-muted-foreground">
                {hasActiveFilters ? "No pets found matching your filters" : "No pets added yet"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
              {isOwnProfile && !hasActiveFilters && (
                <Link href={`/user/${user.username}/add-pet`} className="inline-block mt-4">
                  <CreateButton iconType="plus">
                    Add Your First Pet
                  </CreateButton>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
            {groupedPets.map(([species, speciesPets]) => {
              const SpeciesIcon = speciesIcons[species] || PawPrint

              return (
                <div key={species} className="space-y-4">
                  {/* Species Header */}
                  <div className="flex items-center gap-3 pb-2 border-b">
                    {(() => {
                      const animalConfig = ANIMAL_TYPES.find(a => a.value === species)
                      const label = animalConfig ? animalConfig.label : `${species.charAt(0).toUpperCase() + species.slice(1)}s`
                      const iconColor = animalConfig ? animalConfig.color : "text-muted-foreground"
                      return (
                        <>
                          <SpeciesIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
                          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
                            {label}
                          </h2>
                        </>
                      )
                    })()}
                    <Badge variant="secondary" className="ml-auto text-xs sm:text-sm">
                      {speciesPets.length} {speciesPets.length === 1 ? "pet" : "pets"}
                    </Badge>
                  </div>

                  {/* Pets for this species */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {speciesPets.map((pet) => {
                      const isOwner = isOwnProfile && currentUser?.id === pet.ownerId
                      const petUrl = getPetUrlFromPet(pet, user.username)
                      const ownerPrivacyFallback = (user.privacy?.sections?.pets ?? user.privacy?.pets ?? "public") as PrivacyLevel
                      const rawPrivacy = pet.privacy
                      const visibilitySetting =
                        rawPrivacy && typeof rawPrivacy === "object" && "visibility" in rawPrivacy
                          ? (rawPrivacy.visibility as PrivacyLevel)
                          : typeof rawPrivacy === "string"
                            ? (rawPrivacy as PrivacyLevel)
                            : ownerPrivacyFallback
                      const interactionSetting =
                        rawPrivacy && typeof rawPrivacy === "object" && "interactions" in rawPrivacy
                          ? (rawPrivacy.interactions as PrivacyLevel)
                          : typeof rawPrivacy === "string"
                            ? (rawPrivacy as PrivacyLevel)
                            : ownerPrivacyFallback

                      return (
                        <Card key={pet.id} className="hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:scale-[1.02] border-0 bg-card/50">
                          <Link href={petUrl} className="flex-1">
                            <div className="aspect-video w-full overflow-hidden bg-muted">
                              {pet.avatar ? (
                                <img
                                  src={pet.avatar || "/placeholder.svg"}
                                  alt={pet.name}
                                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                  <PawPrint className="h-12 w-12 sm:h-16 sm:w-16 text-primary/30" />
                                </div>
                              )}
                            </div>
                          </Link>
                          <CardHeader className="pb-3 p-4 sm:p-6">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link href={petUrl}>
                                  <h3 className="font-bold text-base sm:text-lg md:text-xl line-clamp-1 hover:text-primary transition-colors mb-1">
                                    {pet.name}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                  {pet.breed && (
                                    <span className="capitalize truncate">{pet.breed}</span>
                                  )}
                                  {pet.age !== undefined && (
                                    <>
                                      {pet.breed && "•"}
                                      <span>{pet.age} {pet.age === 1 ? "year" : "years"} old</span>
                                    </>
                                  )}
                                </div>
                                {pet.bio && (
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-2">
                                    {pet.bio}
                                  </p>
                                )}
                              </div>
                              {isOwner && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <Link href={`${petUrl}/edit`}>
                                      <DropdownMenuItem>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem onClick={() => handleDelete(pet.id)} variant="destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 pb-4 px-4 sm:px-6">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{pet.followers?.length || 0} followers</span>
                                </div>
                                {pet.birthday && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs">{formatDate(pet.birthday)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="text-xs font-semibold">
                                Visibility: {privacyLabelMap[visibilitySetting]}
                              </Badge>
                              <Badge variant="outline" className="text-xs font-semibold">
                                Interactions: {privacyLabelMap[interactionSetting]}
                              </Badge>
                            </div>
                            {pet.spayedNeutered && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                <span className="mr-1">✓</span>
                                Fixed
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
