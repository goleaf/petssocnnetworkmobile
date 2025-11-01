"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Search,
  Users,
  TrendingUp,
  Clock,
  Grid,
  List,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  HeartHandshake,
  UtensilsCrossed,
  Lock,
  Globe,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import {
  getGroups,
  getGroupCategories,
  searchGroups,
  getGroupsByCategory,
  canUserViewGroup,
} from "@/lib/storage"
import type { Group, GroupCategory } from "@/lib/types"
import { GroupCard } from "@/components/groups/GroupCard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/lib/auth"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getAnimalConfigLucide } from "@/lib/animal-types"

const GROUPS_PER_PAGE = 6

type SortOption = "recent" | "popular" | "members"

// Map category IDs to animal types or custom icons
const getCategoryIcon = (categoryId: string) => {
  // Map specific categories to animal types
  const categoryToAnimalMap: Record<string, string> = {
    "cat-dogs": "dog",
    "cat-cats": "cat",
    "cat-birds": "bird",
    "cat-small-pets": "rabbit", // Using rabbit as representative for small pets
  }
  
  const animalType = categoryToAnimalMap[categoryId]
  if (animalType) {
    return getAnimalConfigLucide(animalType)
  }
  
  // Map non-animal categories to icons
  const customIconMap: Record<string, { icon: any; color: string }> = {
    "cat-training": { icon: GraduationCap, color: "text-red-500" },
    "cat-health": { icon: Heart, color: "text-pink-500" },
    "cat-adoption": { icon: HeartHandshake, color: "text-orange-500" },
    "cat-nutrition": { icon: UtensilsCrossed, color: "text-cyan-500" },
  }
  
  return customIconMap[categoryId]
}

export default function GroupsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  const initialQuery = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || "all"
  const initialType = searchParams.get("type") || "all"
  const initialSort = (searchParams.get("sort") as SortOption) || "recent"
  const initialPage = parseInt(searchParams.get("page") || "1", 10)

  const [query, setQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedType, setSelectedType] = useState<"all" | "open" | "closed">(
    initialType as "all" | "open" | "closed"
  )
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)

  const [categories] = useState<GroupCategory[]>(() => getGroupCategories())
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    setMounted(true)
    loadGroups()
  }, [])

  useEffect(() => {
    if (mounted) {
      loadGroups()
      updateURL()
    }
  }, [query, selectedCategory, selectedType, sortBy, currentPage, mounted])

  useEffect(() => {
    if (mounted && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mounted])

  const updateURL = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (selectedCategory !== "all") params.set("category", selectedCategory)
    if (selectedType !== "all") params.set("type", selectedType)
    if (sortBy !== "recent") params.set("sort", sortBy)
    if (currentPage > 1) params.set("page", currentPage.toString())
    router.replace(`/groups?${params.toString()}`, { scroll: false })
  }

  const loadGroups = () => {
    setIsLoading(true)
    
    let filteredGroups: Group[] = []

    // Apply search
    if (query.trim()) {
      filteredGroups = searchGroups(query)
    } else if (selectedCategory !== "all") {
      filteredGroups = getGroupsByCategory(selectedCategory)
    } else {
      filteredGroups = getGroups()
    }

    // Filter by type
    if (selectedType !== "all") {
      filteredGroups = filteredGroups.filter((g) => g.type === selectedType)
    }

    // Filter by visibility (secret groups only visible to members)
    if (isAuthenticated && user) {
      filteredGroups = filteredGroups.filter((g) =>
        canUserViewGroup(g.id, user.id)
      )
    } else {
      filteredGroups = filteredGroups.filter(
        (g) => g.type === "open" || g.type === "closed"
      )
    }

    // Sort
    filteredGroups.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.memberCount - a.memberCount
        case "members":
          return b.memberCount - a.memberCount
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      }
    })

    setGroups(filteredGroups)
    setIsLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadGroups()
  }

  const clearFilters = () => {
    setQuery("")
    setSelectedCategory("all")
    setSelectedType("all")
    setSortBy("recent")
    setCurrentPage(1)
    router.replace("/groups")
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    if (mounted) {
      setCurrentPage(1)
    }
  }, [query, selectedCategory, selectedType])

  const hasActiveFilters =
    query || selectedCategory !== "all" || selectedType !== "all"

  // Pagination calculations
  const totalPages = Math.ceil(groups.length / GROUPS_PER_PAGE)
  const startIndex = (currentPage - 1) * GROUPS_PER_PAGE
  const endIndex = startIndex + GROUPS_PER_PAGE
  const paginatedGroups = groups.slice(startIndex, endIndex)

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Discover Groups</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find communities of pet owners sharing your interests
            </p>
          </div>
          {isAuthenticated && (
            <Link href="/groups/create">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search groups by name, description, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  loadGroups()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </form>

        {/* Filters and Controls */}
        <div className="space-y-4 mb-6">
          {/* Mobile: Stack all filters, Desktop: Horizontal layout */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {/* Category Filter - Full width on mobile */}
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="flex-wrap h-auto p-1 w-full md:w-auto justify-start">
                <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
                {categories.map((category) => {
                  const iconConfig = getCategoryIcon(category.id)
                  const IconComponent = iconConfig?.icon
                  
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                    >
                      {IconComponent && (
                        <IconComponent className={`h-3 w-3 md:h-4 md:w-4 ${iconConfig.color || "text-muted-foreground"}`} />
                      )}
                      <span className="hidden sm:inline">{category.name}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Secondary filters - Grid on mobile, flex on desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2 md:gap-4">
            {/* Type Filter */}
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as "all" | "open" | "closed")}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {selectedType === "all" && <CheckCircle className="h-4 w-4" />}
                    {selectedType === "open" && <Globe className="h-4 w-4" />}
                    {selectedType === "closed" && <Lock className="h-4 w-4" />}
                    <span className="hidden sm:inline">
                      {selectedType === "all" ? "All Types" : selectedType === "open" ? "Open" : "Closed"}
                    </span>
                    <span className="sm:hidden">
                      {selectedType === "all" ? "All" : selectedType === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    All Types
                  </div>
                </SelectItem>
                <SelectItem value="open">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Open
                  </div>
                </SelectItem>
                <SelectItem value="closed">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Closed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {sortBy === "recent" && <Clock className="h-4 w-4" />}
                    {sortBy === "popular" && <TrendingUp className="h-4 w-4" />}
                    {sortBy === "members" && <Users className="h-4 w-4" />}
                    <span className="text-xs md:text-sm">
                      {sortBy === "recent"
                        ? "Recent"
                        : sortBy === "popular"
                        ? "Popular"
                        : "Members"}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Most Recent
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Most Popular
                  </div>
                </SelectItem>
                <SelectItem value="members">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Most Members
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center gap-2 border rounded-md p-1 md:col-span-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full md:w-auto">
                <X className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
            <span className="text-xs md:text-sm text-muted-foreground">Active filters:</span>
            {query && (
              <Badge variant="secondary" className="text-xs">
                Search: {query}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => {
                    setQuery("")
                    loadGroups()
                  }}
                />
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {categories.find((c) => c.id === selectedCategory)?.name}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory("all")
                    loadGroups()
                  }}
                />
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {selectedType}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => {
                    setSelectedType("all")
                    loadGroups()
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No groups found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? "Try adjusting your filters to see more groups"
              : "Be the first to create a group!"}
          </p>
          {isAuthenticated && (
            <Link href="/groups/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {paginatedGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && groups.length > 0 && (
        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, groups.length)} of {groups.length} {groups.length === 1 ? "group" : "groups"}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && groups.length > GROUPS_PER_PAGE && (
        <div className="flex items-center justify-center gap-1 md:gap-2 mt-6 md:mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="text-xs md:text-sm"
          >
            <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="text-xs md:text-sm"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 sm:ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

