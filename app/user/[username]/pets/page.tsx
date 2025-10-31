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
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
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
import { canViewUserPets } from "@/lib/utils/privacy"

type SortOption = "name" | "recent" | "oldest" | "species"
type SpeciesFilter = "all" | "dog" | "cat" | "bird" | "rabbit" | "hamster" | "fish" | "other"

const speciesIcons: Record<string, any> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
}

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
  }, [pets, searchQuery, sortBy, speciesFilter])

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{user.fullName}'s Pets</h1>
            <p className="text-muted-foreground">
              {canViewPets 
                ? `${filteredAndSortedPets.length} ${filteredAndSortedPets.length === 1 ? "pet" : "pets"}`
                : "Private"
              }
            </p>
          </div>
          {isOwnProfile && (
            <Link href={`/user/${user.username}/add-pet`}>
              <CreateButton iconType="plus">
                Add Pet
              </CreateButton>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search pets by name, breed, species, color, or microchip ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full md:w-[180px]">
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
              className="w-full md:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Species</label>
                  <Select value={speciesFilter} onValueChange={(value) => setSpeciesFilter(value as SpeciesFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Species</SelectItem>
                      {availableSpecies.map((species) => {
                        const Icon = speciesIcons[species] || PawPrint
                        return (
                          <SelectItem key={species} value={species}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {species.charAt(0).toUpperCase() + species.slice(1)}
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
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">This user{"'"}s pets are private</p>
          </CardContent>
        </Card>
      ) : groupedPets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <PawPrint className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No pets found matching your filters" : "No pets added yet"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            {isOwnProfile && !hasActiveFilters && (
              <Link href={`/user/${user.username}/add-pet`}>
                <CreateButton iconType="plus">
                  Add Your First Pet
                </CreateButton>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedPets.map(([species, speciesPets]) => {
            const SpeciesIcon = speciesIcons[species] || PawPrint
            
            return (
              <div key={species} className="space-y-4">
                {/* Species Header */}
                <div className="flex items-center gap-3 pb-2 border-b">
                  <SpeciesIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold capitalize">
                    {species.charAt(0).toUpperCase() + species.slice(1)}s
                  </h2>
                  <Badge variant="secondary" className="ml-auto">
                    {speciesPets.length} {speciesPets.length === 1 ? "pet" : "pets"}
                  </Badge>
                </div>

                {/* Pets for this species */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {speciesPets.map((pet) => {
                    const isOwner = isOwnProfile && currentUser?.id === pet.ownerId
                    const petUrl = getPetUrlFromPet(pet, user.username)

                    return (
                      <Card key={pet.id} className="hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
                        <Link href={petUrl} className="flex-1">
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            {pet.avatar ? (
                              <img
                                src={pet.avatar || "/placeholder.svg"}
                                alt={pet.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                <PawPrint className="h-16 w-16 text-primary/30" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Link href={petUrl}>
                                <h3 className="font-bold text-lg line-clamp-1 hover:text-primary transition-colors mb-1">
                                  {pet.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {pet.breed && (
                                  <span className="capitalize">{pet.breed}</span>
                                )}
                                {pet.age !== undefined && (
                                  <>
                                    {pet.breed && "•"}
                                    <span>{pet.age} {pet.age === 1 ? "year" : "years"} old</span>
                                  </>
                                )}
                              </div>
                              {pet.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
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
                        <CardContent className="pt-0 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {pet.followers?.length || 0} followers
                              </div>
                              {pet.birthday && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-xs">{formatDate(pet.birthday)}</span>
                                </div>
                              )}
                            </div>
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
  )
}
