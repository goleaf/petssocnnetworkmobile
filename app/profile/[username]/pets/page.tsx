"use client"

import { useState, useEffect, useMemo, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ViewModeSelector } from "@/components/ui/view-mode-selector"
import { BackButton } from "@/components/ui/back-button"
import { FilterDropdown } from "@/components/ui/filter-dropdown"
import { getUsers, getPets, getFeedPostsByPetId, getBlogPostsByPetId, deletePet } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import {
  PawPrint,
  Users,
  Plus,
  Lock,
  Search,
  Filter,
  X,
  Heart,
  Calendar,
  MessageCircle,
  FileText,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { canViewUserPets } from "@/lib/utils/privacy"
import { formatDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ANIMAL_TYPES } from "@/lib/animal-types"

type SortOption = "name" | "recent" | "oldest" | "species" | "followers"
type SpeciesFilter = "all" | "dog" | "cat" | "bird" | "rabbit" | "hamster" | "fish" | "other"
type ViewMode = "grid" | "list"

const speciesIcons: Record<string, any> = ANIMAL_TYPES.reduce((acc, animal) => {
  acc[animal.value] = animal.lucideIcon
  return acc
}, {} as Record<string, any>)

export default function PetsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [expandedSpecies, setExpandedSpecies] = useState<Set<string>>(new Set())

  useEffect(() => {
    const foundUser = getUsers().find((u) => u.username === username)
    if (foundUser) {
      setUser(foundUser)
      const viewerId = currentUser?.id || null
      if (canViewUserPets(foundUser, viewerId)) {
        const userPets = getPets().filter((p) => p.ownerId === foundUser.id)
        setPets(userPets)
        // Auto-expand all species groups by default
        const speciesSet = new Set<string>()
        userPets.forEach((pet) => {
          if (pet.species) speciesSet.add(pet.species)
        })
        setExpandedSpecies(speciesSet)
      } else {
        setPets([])
      }
    }
  }, [username, currentUser])

  // Filter and sort pets
  const filteredAndSortedPets = useMemo(() => {
    let filtered = [...pets]

    // Search filter
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
      filtered.sort((a, b) => {
        const aPosts = getFeedPostsByPetId(a.id).length + getBlogPostsByPetId(a.id).length
        const bPosts = getFeedPostsByPetId(b.id).length + getBlogPostsByPetId(b.id).length
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
    } else if (sortBy === "followers") {
      filtered.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0))
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
    return Object.entries(groups).sort((a, b) => {
      const aIndex = speciesOrder.indexOf(a[0])
      const bIndex = speciesOrder.indexOf(b[0])
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [filteredAndSortedPets])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPets = pets.length
    const totalFollowers = pets.reduce((sum, pet) => sum + (pet.followers?.length || 0), 0)
    const totalFeedPosts = pets.reduce(
      (sum, pet) => sum + getFeedPostsByPetId(pet.id).length,
      0
    )
    const totalBlogPosts = pets.reduce(
      (sum, pet) => sum + getBlogPostsByPetId(pet.id).length,
      0
    )

    return {
      totalPets,
      totalFollowers,
      totalFeedPosts,
      totalBlogPosts,
    }
  }, [pets])

  const handleDelete = (petId: string) => {
    if (window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) {
      deletePet(petId)
      setPets(pets.filter((p) => p.id !== petId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSpeciesFilter("all")
    setSortBy("name")
  }

  const hasActiveFilters = searchQuery || speciesFilter !== "all"

  const toggleSpeciesExpansion = (species: string) => {
    const newExpanded = new Set(expandedSpecies)
    if (newExpanded.has(species)) {
      newExpanded.delete(species)
    } else {
      newExpanded.add(species)
    }
    setExpandedSpecies(newExpanded)
  }

  // Get all unique species from user's pets
  const availableSpecies = useMemo(() => {
    const species = new Set<string>()
    pets.forEach((pet) => {
      if (pet.species) species.add(pet.species)
    })
    return Array.from(species).sort()
  }, [pets])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p className="text-center text-muted-foreground">User not found</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/profile/${username}`} label="Back to Profile" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{user.fullName}'s Pets</h1>
            <p className="text-muted-foreground">
              {canViewPets
                ? `${filteredAndSortedPets.length} ${filteredAndSortedPets.length === 1 ? "pet" : "pets"}`
                : "Private"}
            </p>
          </div>
          {isOwnProfile && (
            <Link href={`/profile/${user.username}/add-pet`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Pet
              </Button>
            </Link>
          )}
        </div>

        {/* Statistics Cards */}
        {canViewPets && pets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <PawPrint className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPets}</p>
                    <p className="text-xs text-muted-foreground">Total Pets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalFollowers}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalFeedPosts}</p>
                    <p className="text-xs text-muted-foreground">Feed Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalBlogPosts}</p>
                    <p className="text-xs text-muted-foreground">Blog Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        {canViewPets && pets.length > 0 && (
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
                  <SelectItem value="followers">Most Followers</SelectItem>
                </SelectContent>
              </Select>
              <FilterDropdown
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
                className="w-full md:w-auto"
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Species</label>
                    <Select
                      value={speciesFilter}
                      onValueChange={(value) => setSpeciesFilter(value as SpeciesFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All species" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        {availableSpecies.map((species) => {
                          const Icon = speciesIcons[species] || PawPrint
                          const animalConfig = ANIMAL_TYPES.find(a => a.value === species)
                          const label = animalConfig ? animalConfig.label : species.charAt(0).toUpperCase() + species.slice(1)
                          const iconColor = animalConfig ? animalConfig.color : "text-gray-500"
                          
                          return (
                            <SelectItem key={species} value={species}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", iconColor)} />
                                {label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FilterDropdown>
              <ViewModeSelector
                value={viewMode}
                onValueChange={(value) => setViewMode(value)}
                iconVariant="grid3x3"
              />
            </div>
          </div>
        )}
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
              <Link href={`/profile/${user.username}/add-pet`}>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Pet
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedPets.map(([species, speciesPets]) => {
            const SpeciesIcon = speciesIcons[species] || PawPrint
            const isExpanded = expandedSpecies.has(species)

            return (
              <div key={species} className="space-y-4">
                {/* Species Header */}
                <button
                  onClick={() => toggleSpeciesExpansion(species)}
                  className="flex items-center gap-3 pb-2 border-b w-full text-left hover:bg-accent/50 p-2 rounded-md transition-colors"
                >
                  {(() => {
                    const animalConfig = ANIMAL_TYPES.find(a => a.value === species)
                    const label = animalConfig ? animalConfig.label : `${species.charAt(0).toUpperCase() + species.slice(1)}s`
                    const iconColor = animalConfig ? animalConfig.color : "text-muted-foreground"
                    return (
                      <>
                        <SpeciesIcon className={`h-5 w-5 ${iconColor}`} />
                        <h2 className="text-xl font-semibold">
                          {label}
                        </h2>
                      </>
                    )
                  })()}
                  <Badge variant="secondary" className="ml-auto">
                    {speciesPets.length} {speciesPets.length === 1 ? "pet" : "pets"}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Pets for this species */}
                {isExpanded && (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "space-y-4"
                    }
                  >
                    {speciesPets.map((pet) => {
                      const isOwner = isOwnProfile && currentUser?.id === pet.ownerId
                      const petUrl = getPetUrlFromPet(pet, user.username)
                      const feedPostsCount = getFeedPostsByPetId(pet.id).length
                      const blogPostsCount = getBlogPostsByPetId(pet.id).length

                      return viewMode === "grid" ? (
                        <Card
                          key={pet.id}
                          className="hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group pt-0"
                        >
                          <Link href={petUrl} className="flex-1">
                            <div className="aspect-video w-full overflow-hidden bg-muted">
                              {pet.avatar ? (
                                <img
                                  src={pet.avatar || "/placeholder.svg"}
                                  alt={pet.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                  {pet.breed && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {pet.breed}
                                    </Badge>
                                  )}
                                  {pet.age !== undefined && (
                                    <span className="text-xs">
                                      {pet.age} {pet.age === 1 ? "year" : "years"} old
                                    </span>
                                  )}
                                  {pet.gender && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {pet.gender}
                                    </Badge>
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
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
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
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(pet.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 pb-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  {pet.followers?.length || 0} followers
                                </div>
                                {(feedPostsCount > 0 || blogPostsCount > 0) && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {feedPostsCount + blogPostsCount} posts
                                  </div>
                                )}
                              </div>
                              {pet.birthday && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(pet.birthday)}
                                </div>
                              )}
                            </div>
                            {pet.spayedNeutered && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                <span className="mr-1">✓</span>
                                Fixed
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card key={pet.id} className="hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Link href={petUrl}>
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  {pet.avatar ? (
                                    <img
                                      src={pet.avatar || "/placeholder.svg"}
                                      alt={pet.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                      <PawPrint className="h-10 w-10 text-primary/30" />
                                    </div>
                                  )}
                                </div>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <Link href={petUrl}>
                                      <h3 className="font-bold text-lg hover:text-primary transition-colors">
                                        {pet.name}
                                      </h3>
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-1">
                                      {pet.breed && (
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {pet.breed}
                                        </Badge>
                                      )}
                                      {pet.age !== undefined && (
                                        <span className="text-xs">
                                          {pet.age} {pet.age === 1 ? "year" : "years"} old
                                        </span>
                                      )}
                                      {pet.gender && (
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {pet.gender}
                                        </Badge>
                                      )}
                                      {pet.spayedNeutered && (
                                        <Badge variant="secondary" className="text-xs">
                                          <span className="mr-1">✓</span>
                                          Fixed
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {isOwner && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 flex-shrink-0"
                                        >
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
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(pet.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                {pet.bio && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {pet.bio}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" />
                                    {pet.followers?.length || 0} followers
                                  </div>
                                  {(feedPostsCount > 0 || blogPostsCount > 0) && (
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-4 w-4" />
                                      {feedPostsCount + blogPostsCount} posts
                                    </div>
                                  )}
                                  {pet.birthday && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {formatDate(pet.birthday)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

