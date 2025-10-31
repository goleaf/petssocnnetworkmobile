"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  Clock,
  Grid,
  List,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const GROUPS_PER_PAGE = 6

type SortOption = "recent" | "popular" | "members"

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Discover Groups</h1>
            <p className="text-muted-foreground">
              Find communities of pet owners sharing your interests
            </p>
          </div>
          {isAuthenticated && (
            <Link href="/groups/create">
              <Button>
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
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Category Filter */}
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full md:w-auto"
          >
            <TabsList className="flex-wrap h-auto p-1">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2"
                >
                  <span>{category.icon}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Type: {selectedType === "all" ? "All" : selectedType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Group Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedType === "all"}
                onCheckedChange={() => setSelectedType("all")}
              >
                All Types
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedType === "open"}
                onCheckedChange={() => setSelectedType("open")}
              >
                Open
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedType === "closed"}
                onCheckedChange={() => setSelectedType("closed")}
              >
                Closed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {sortBy === "recent" && <Clock className="h-4 w-4" />}
                  {sortBy === "popular" && <TrendingUp className="h-4 w-4" />}
                  {sortBy === "members" && <Users className="h-4 w-4" />}
                  <span>
                    {sortBy === "recent"
                      ? "Most Recent"
                      : sortBy === "popular"
                      ? "Most Popular"
                      : "Most Members"}
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
          <div className="flex items-center gap-2 border rounded-md p-1">
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
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {query && (
              <Badge variant="secondary">
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
              <Badge variant="secondary">
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
              <Badge variant="secondary">
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
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, groups.length)} of {groups.length} {groups.length === 1 ? "group" : "groups"}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && groups.length > GROUPS_PER_PAGE && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
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
                  className="w-10"
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
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

