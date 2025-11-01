"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  User,
  PawPrint,
  FileText,
  BookOpen,
  Hash,
  Filter,
  MapPin,
  X,
  Clock,
  TrendingUp,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Heart,
  MessageSquare,
  Eye,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { getUsers, getPets, getBlogPosts, getWikiArticles, getComments } from "@/lib/storage"
import type { User as UserType, Pet, BlogPost, WikiArticle } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatCommentDate } from "@/lib/utils/date"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

const STORAGE_KEYS = {
  RECENT_SEARCHES: "search_recent_searches",
  SEARCH_HISTORY: "search_history",
}

const RESULTS_PER_PAGE = 12

type SortOption = "relevance" | "recent" | "popular"
type FilterOption = {
  species: string[]
  location: string
  breed: string
  category: string[]
  gender: string[]
  ageMin?: number
  ageMax?: number
  dateFrom?: string
  dateTo?: string
  verified: boolean
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  const initialQuery = searchParams.get("q") || ""
  const initialTab = searchParams.get("tab") || "all"
  const initialSort = (searchParams.get("sort") as SortOption) || "relevance"

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState([
    "golden retriever",
    "cat care",
    "dog training",
    "bird nutrition",
    "rabbit health",
    "pet adoption",
  ])

  const [filters, setFilters] = useState<FilterOption>({
    species: [],
    location: "",
    breed: "",
    category: [],
    gender: [],
    verified: false,
  })

  const [results, setResults] = useState({
    users: [] as UserType[],
    pets: [] as Pet[],
    blogs: [] as BlogPost[],
    wiki: [] as WikiArticle[],
    hashtags: [] as string[],
    shelters: [] as any[],
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true)
      const recent = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
      if (recent) {
        setRecentSearches(JSON.parse(recent))
      }
    }
  }, [])

  // Focus input on mount
  useEffect(() => {
    if (mounted && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mounted])

  // Generate search suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    const searchQuery = query.toLowerCase()
    const allSuggestions = new Set<string>()

    // Get suggestions from users
    getUsers()
      .slice(0, 5)
      .forEach((user) => {
        if (user.username.toLowerCase().includes(searchQuery)) {
          allSuggestions.add(user.username)
        }
        if (user.fullName.toLowerCase().includes(searchQuery)) {
          allSuggestions.add(user.fullName)
        }
      })

    // Get suggestions from pets
    getPets()
      .slice(0, 5)
      .forEach((pet) => {
        if (pet.name.toLowerCase().includes(searchQuery)) {
          allSuggestions.add(pet.name)
        }
        if (pet.breed?.toLowerCase().includes(searchQuery)) {
          allSuggestions.add(pet.breed)
        }
      })

    // Get suggestions from hashtags
    getBlogPosts().forEach((post) => {
      post.hashtags?.forEach((tag) => {
        if (tag.toLowerCase().includes(searchQuery)) {
          allSuggestions.add(`#${tag}`)
        }
      })
    })

    // Get suggestions from wiki categories
    const categories = ["care", "health", "training", "nutrition", "behavior", "breeds"]
    categories.forEach((cat) => {
      if (cat.includes(searchQuery)) {
        allSuggestions.add(cat)
      }
    })

    setSuggestions(Array.from(allSuggestions).slice(0, 8))
  }, [query])

  // Perform search
  useEffect(() => {
    setIsLoading(true)

    const timer = setTimeout(() => {
      if (
        !query.trim() &&
        filters.species.length === 0 &&
        !filters.location &&
        !filters.breed &&
        filters.category.length === 0 &&
        filters.gender.length === 0 &&
        !filters.verified
      ) {
        setResults({ users: [], pets: [], blogs: [], wiki: [], hashtags: [], shelters: [] })
        setIsLoading(false)
        return
      }

      const searchQuery = query.toLowerCase()

      // Search users with location filter
      let users = getUsers().filter(
        (user) =>
          !query.trim() ||
          user.username.toLowerCase().includes(searchQuery) ||
          user.fullName.toLowerCase().includes(searchQuery) ||
          user.bio?.toLowerCase().includes(searchQuery),
      )

      if (filters.location) {
        users = users.filter((user) => user.location?.toLowerCase().includes(filters.location.toLowerCase()))
      }

      if (filters.verified) {
        users = users.filter((user) => user.badge === "verified" || user.role === "admin")
      }

      // Search pets with species and breed filters
      let pets = getPets().filter(
        (pet) =>
          !query.trim() ||
          pet.name.toLowerCase().includes(searchQuery) ||
          pet.species.toLowerCase().includes(searchQuery) ||
          pet.breed?.toLowerCase().includes(searchQuery) ||
          pet.bio?.toLowerCase().includes(searchQuery),
      )

      if (filters.species.length > 0) {
        pets = pets.filter((pet) => filters.species.includes(pet.species))
      }

      if (filters.breed) {
        pets = pets.filter((pet) => pet.breed?.toLowerCase().includes(filters.breed.toLowerCase()))
      }

      if (filters.gender.length > 0) {
        pets = pets.filter((pet) => pet.gender && filters.gender.includes(pet.gender))
      }

      if (filters.ageMin !== undefined) {
        pets = pets.filter((pet) => pet.age !== undefined && pet.age >= filters.ageMin!)
      }

      if (filters.ageMax !== undefined) {
        pets = pets.filter((pet) => pet.age !== undefined && pet.age <= filters.ageMax!)
      }

      // Search blog posts
      let blogs = getBlogPosts().filter(
        (post) =>
          !query.trim() ||
          post.title.toLowerCase().includes(searchQuery) ||
          post.content.toLowerCase().includes(searchQuery) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchQuery)) ||
          post.hashtags?.some((tag) => tag.toLowerCase().includes(searchQuery)),
      )

      if (filters.dateFrom) {
        blogs = blogs.filter((post) => new Date(post.createdAt) >= new Date(filters.dateFrom!))
      }

      if (filters.dateTo) {
        blogs = blogs.filter((post) => new Date(post.createdAt) <= new Date(filters.dateTo!))
      }

      // Search wiki articles with category filter
      let wiki = getWikiArticles().filter(
        (article) =>
          !query.trim() ||
          article.title.toLowerCase().includes(searchQuery) ||
          article.content.toLowerCase().includes(searchQuery) ||
          article.category.toLowerCase().includes(searchQuery),
      )

      if (filters.category.length > 0) {
        wiki = wiki.filter((article) => filters.category.includes(article.category))
      }

      // Extract hashtags from blogs
      const allHashtags = new Set<string>()
      getBlogPosts().forEach((post) => {
        post.hashtags?.forEach((tag) => {
          if (!query.trim() || tag.toLowerCase().includes(searchQuery)) {
            allHashtags.add(tag)
          }
        })
      })

      // Mock shelters search (since shelters are not in storage yet)
      const shelters: any[] = []

      // Sort results
      const sortedUsers = sortResults(users, sortBy, "users")
      const sortedPets = sortResults(pets, sortBy, "pets")
      const sortedBlogs = sortResults(blogs, sortBy, "blogs")
      const sortedWiki = sortResults(wiki, sortBy, "wiki")

      setResults({
        users: sortedUsers,
        pets: sortedPets,
        blogs: sortedBlogs,
        wiki: sortedWiki,
        hashtags: Array.from(allHashtags),
        shelters,
      })

      setIsLoading(false)

      // Save to recent searches
      if (query.trim() && typeof window !== "undefined") {
        const recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || "[]") as string[]
        const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 10)
        localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated))
        setRecentSearches(updated)

        // Save to history
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || "[]") as Array<{
          query: string
          timestamp: string
        }>
        history.unshift({ query, timestamp: new Date().toISOString() })
        localStorage.setItem(
          STORAGE_KEYS.SEARCH_HISTORY,
          JSON.stringify(history.slice(0, 50)), // Keep last 50 searches
        )
      }

      // Update URL
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (activeTab !== "all") params.set("tab", activeTab)
      if (sortBy !== "relevance") params.set("sort", sortBy)
      router.replace(`/search?${params.toString()}`, { scroll: false })
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [query, filters, sortBy, activeTab, router])

  // Sort results
  const sortResults = (items: any[], sort: SortOption, type: string) => {
    if (sort === "recent") {
      return [...items].sort(
        (a, b) => new Date(b.createdAt || b.joinedAt || "").getTime() - new Date(a.createdAt || a.joinedAt || "").getTime(),
      )
    } else if (sort === "popular") {
      if (type === "users") {
        return [...items].sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0))
      } else if (type === "blogs") {
        return [...items].sort((a, b) => {
          const aLikes = a.reactions
            ? Object.values(a.reactions).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
            : a.likes?.length || 0
          const bLikes = b.reactions
            ? Object.values(b.reactions).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
            : b.likes?.length || 0
          return bLikes - aLikes
        })
      } else if (type === "wiki") {
        return [...items].sort((a, b) => (b.views || 0) - (a.views || 0))
      }
      return items
    }
    return items // relevance - keep original order
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setShowSuggestions(false)
    setCurrentPage(1)
    inputRef.current?.blur()
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion.replace("#", ""))
  }

  const handlePopularSearch = (popularQuery: string) => {
    handleSearch(popularQuery)
  }

  const toggleSpeciesFilter = (species: string) => {
    setFilters((prev) => ({
      ...prev,
      species: prev.species.includes(species) ? prev.species.filter((s) => s !== species) : [...prev.species, species],
    }))
    setCurrentPage(1)
  }

  const toggleCategoryFilter = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }))
    setCurrentPage(1)
  }

  const toggleGenderFilter = (gender: string) => {
    setFilters((prev) => ({
      ...prev,
      gender: prev.gender.includes(gender)
        ? prev.gender.filter((g) => g !== gender)
        : [...prev.gender, gender],
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      species: [],
      location: "",
      breed: "",
      category: [],
      gender: [],
      verified: false,
    })
    setCurrentPage(1)
  }

  const hasActiveFilters =
    filters.species.length > 0 ||
    filters.location ||
    filters.breed ||
    filters.category.length > 0 ||
    filters.gender.length > 0 ||
    filters.ageMin !== undefined ||
    filters.ageMax !== undefined ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.verified

  const totalResults =
    results.users.length +
    results.pets.length +
    results.blogs.length +
    results.wiki.length +
    results.hashtags.length +
    results.shelters.length

  // Get paginated results
  const getPaginatedResults = (items: any[]) => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE
    const endIndex = startIndex + RESULTS_PER_PAGE
    return {
      items: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / RESULTS_PER_PAGE),
      totalItems: items.length,
    }
  }


  if (!mounted) {
    return <LoadingSpinner fullScreen />
  }

  const paginatedUsers = getPaginatedResults(results.users)
  const paginatedPets = getPaginatedResults(results.pets)
  const paginatedBlogs = getPaginatedResults(results.blogs)
  const paginatedWiki = getPaginatedResults(results.wiki)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search & Discover</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-4 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search for users, pets, blogs, wiki articles, hashtags..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(query)
                } else if (e.key === "Escape") {
                  setShowSuggestions(false)
                  inputRef.current?.blur()
                }
              }}
              className="pl-10"
            />
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
                <CardContent className="p-2">
                  {recentSearches.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </div>
                      {recentSearches.slice(0, 5).map((recent, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(recent)}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {recent}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <>
                      {recentSearches.length > 0 && <div className="border-t my-2" />}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Suggestions</div>
                        {suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2"
                          >
                            <Search className="h-3 w-3 text-muted-foreground" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {(() => {
                    const sortIcons = {
                      relevance: ArrowUpDown,
                      recent: Clock,
                      popular: TrendingUp,
                    }
                    const sortLabels = {
                      relevance: "Relevance",
                      recent: "Most Recent",
                      popular: "Most Popular",
                    }
                    const Icon = sortIcons[sortBy] || ArrowUpDown
                    return (
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{sortLabels[sortBy]}</span>
                      </div>
                    )
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>Relevance</span>
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>Most Recent</span>
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>Most Popular</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {filters.species.length +
                        filters.category.length +
                        filters.gender.length +
                        (filters.location ? 1 : 0) +
                        (filters.breed ? 1 : 0) +
                        (filters.ageMin !== undefined ? 1 : 0) +
                        (filters.ageMax !== undefined ? 1 : 0) +
                        (filters.dateFrom ? 1 : 0) +
                        (filters.dateTo ? 1 : 0) +
                        (filters.verified ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto">
                <DropdownMenuLabel>Pet Species</DropdownMenuLabel>
                {["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"].map((species) => (
                  <DropdownMenuCheckboxItem
                    key={species}
                    checked={filters.species.includes(species)}
                    onCheckedChange={() => toggleSpeciesFilter(species)}
                  >
                    {species.charAt(0).toUpperCase() + species.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Pet Gender</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.gender.includes("male")}
                  onCheckedChange={() => toggleGenderFilter("male")}
                >
                  Male
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.gender.includes("female")}
                  onCheckedChange={() => toggleGenderFilter("female")}
                >
                  Female
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Pet Age</DropdownMenuLabel>
                <div className="p-2 flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min age"
                    value={filters.ageMin || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, ageMin: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                    className="h-8"
                    min={0}
                  />
                  <Input
                    type="number"
                    placeholder="Max age"
                    value={filters.ageMax || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, ageMax: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                    className="h-8"
                    min={0}
                  />
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Wiki Categories</DropdownMenuLabel>
                {["care", "health", "training", "nutrition", "behavior", "breeds"].map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={filters.category.includes(category)}
                    onCheckedChange={() => toggleCategoryFilter(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Location..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="h-8"
                  />
                  <Input
                    placeholder="Breed..."
                    value={filters.breed}
                    onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="From date"
                      value={filters.dateFrom || ""}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                      className="h-8"
                    />
                    <Input
                      type="date"
                      placeholder="To date"
                      value={filters.dateTo || ""}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                      className="h-8"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.verified}
                  onCheckedChange={(checked) => setFilters({ ...filters, verified: checked })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 inline" />
                  Verified Only
                </DropdownMenuCheckboxItem>

                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Popular Searches */}
        {!query && popularSearches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Popular Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((popular, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePopularSearch(popular)}
                  className="gap-2"
                >
                  <Sparkles className="h-3 w-3" />
                  {popular}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.species.map((species) => (
              <Badge key={species} variant="secondary" className="gap-1">
                {species}
                <button onClick={() => toggleSpeciesFilter(species)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {filters.category.map((category) => (
              <Badge key={category} variant="secondary" className="gap-1">
                {category}
                <button onClick={() => toggleCategoryFilter(category)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {filters.gender.map((gender) => (
              <Badge key={gender} variant="secondary" className="gap-1">
                {gender}
                <button onClick={() => toggleGenderFilter(gender)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {filters.location && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {filters.location}
                <button onClick={() => setFilters({ ...filters, location: "" })} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {filters.breed && (
              <Badge variant="secondary" className="gap-1">
                {filters.breed}
                <button onClick={() => setFilters({ ...filters, breed: "" })} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {(filters.ageMin !== undefined || filters.ageMax !== undefined) && (
              <Badge variant="secondary" className="gap-1">
                Age: {filters.ageMin || 0}-{filters.ageMax || "∞"}
                <button
                  onClick={() => setFilters({ ...filters, ageMin: undefined, ageMax: undefined })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {filters.dateFrom || "..."} - {filters.dateTo || "..."}
                <button
                  onClick={() => setFilters({ ...filters, dateFrom: undefined, dateTo: undefined })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.verified && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
                <button onClick={() => setFilters({ ...filters, verified: false })} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Summary */}
        {query && (
          <p className="text-sm text-muted-foreground">
            Found <strong>{totalResults}</strong> result{totalResults !== 1 ? "s" : ""} for "{query}"
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
          <TabsTrigger value="users">
            <User className="h-4 w-4 mr-1" />
            Users ({results.users.length})
          </TabsTrigger>
          <TabsTrigger value="pets">
            <PawPrint className="h-4 w-4 mr-1" />
            Pets ({results.pets.length})
          </TabsTrigger>
          <TabsTrigger value="blogs">
            <FileText className="h-4 w-4 mr-1" />
            Blogs ({results.blogs.length})
          </TabsTrigger>
          <TabsTrigger value="wiki">
            <BookOpen className="h-4 w-4 mr-1" />
            Wiki ({results.wiki.length})
          </TabsTrigger>
          <TabsTrigger value="hashtags">
            <Hash className="h-4 w-4 mr-1" />
            Tags ({results.hashtags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !query && !hasActiveFilters ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Start typing to search across the platform</p>
                <p className="text-sm text-muted-foreground">Try searching for pets, users, blog posts, or wiki articles</p>
              </CardContent>
            </Card>
          ) : totalResults === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No results found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Users ({results.users.length})</h2>
                    {results.users.length > 4 && (
                      <Link href="/search?tab=users" className="text-sm text-primary hover:underline">
                        View all →
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.users.slice(0, 6).map((user) => (
                      <UserCard key={user.id} user={user} query={query} />
                    ))}
                  </div>
                </div>
              )}

              {results.pets.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Pets ({results.pets.length})</h2>
                    {results.pets.length > 4 && (
                      <Link href="/search?tab=pets" className="text-sm text-primary hover:underline">
                        View all →
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.pets.slice(0, 6).map((pet) => (
                      <PetCard key={pet.id} pet={pet} query={query} />
                    ))}
                  </div>
                </div>
              )}

              {results.blogs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Blog Posts ({results.blogs.length})</h2>
                    {results.blogs.length > 4 && (
                      <Link href="/search?tab=blogs" className="text-sm text-primary hover:underline">
                        View all →
                      </Link>
                    )}
                  </div>
                  <div className="space-y-4">
                    {results.blogs.slice(0, 4).map((post) => (
                      <BlogCard key={post.id} post={post} query={query} />
                    ))}
                  </div>
                </div>
              )}

              {results.wiki.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Wiki Articles ({results.wiki.length})</h2>
                    {results.wiki.length > 4 && (
                      <Link href="/search?tab=wiki" className="text-sm text-primary hover:underline">
                        View all →
                      </Link>
                    )}
                  </div>
                  <div className="space-y-4">
                    {results.wiki.slice(0, 4).map((article) => (
                      <WikiCard key={article.id} article={article} query={query} />
                    ))}
                  </div>
                </div>
              )}

              {results.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Hashtags ({results.hashtags.length})</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.hashtags.slice(0, 20).map((tag) => (
                      <Link key={tag} href={`/search?q=${encodeURIComponent(`#${tag}`)}&tab=blogs`}>
                        <Badge
                          variant="secondary"
                          className="text-sm px-3 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          #{tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.users.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {paginatedUsers.items.map((user) => (
                  <UserCard key={user.id} user={user} query={query} />
                ))}
              </div>
              {paginatedUsers.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedUsers.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={paginatedUsers.totalItems}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="pets" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.pets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pets found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {paginatedPets.items.map((pet) => (
                  <PetCard key={pet.id} pet={pet} query={query} />
                ))}
              </div>
              {paginatedPets.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedPets.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={paginatedPets.totalItems}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="blogs" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.blogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <div className="space-y-2">
                  <p className="text-muted-foreground font-medium">No blog posts found</p>
                  <p className="text-sm text-muted-foreground/80">Try adjusting your search terms or filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedBlogs.items.map((post) => (
                  <BlogCard key={post.id} post={post} query={query} />
                ))}
              </div>
              {paginatedBlogs.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedBlogs.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={paginatedBlogs.totalItems}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="wiki" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.wiki.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No wiki articles found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedWiki.items.map((article) => (
                  <WikiCard key={article.id} article={article} query={query} />
                ))}
              </div>
              {paginatedWiki.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedWiki.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={paginatedWiki.totalItems}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.hashtags.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hashtags found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {results.hashtags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(`#${tag}`)}&tab=blogs`}>
                  <Badge
                    variant="secondary"
                    className="text-base px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserCard({ user, query }: { user: UserType; query: string }) {
  const users = getUsers()
  const userReactions = getBlogPosts()
    .flatMap((post) => Object.values(post.reactions || {}))
    .flat()
    .filter((id) => id === user.id).length

  return (
    <Link href={`/user/${user.username}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold truncate">{highlightText(user.fullName, query)}</p>
                {user.badge === "verified" && <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              {user.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </p>
              )}
              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {highlightText(user.bio, query)}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{user.followers?.length || 0} followers</span>
                <span>{user.following?.length || 0} following</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PetCard({ pet, query }: { pet: Pet; query: string }) {
  const users = getUsers()
  const owner = users.find((u) => u.id === pet.ownerId)
  const petUrl = owner ? getPetUrlFromPet(pet, owner.username) : `/pet/${pet.id}`

  return (
    <Link href={petUrl}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={pet.avatar || "/placeholder.svg"} />
              <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate mb-1">{highlightText(pet.name, query)}</p>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {pet.species}
                </Badge>
                {pet.breed && <Badge variant="outline" className="text-xs">{highlightText(pet.breed, query)}</Badge>}
                {pet.gender && <Badge variant="outline" className="text-xs capitalize">{pet.gender}</Badge>}
                {pet.age !== undefined && <span className="text-xs text-muted-foreground">{pet.age} years</span>}
              </div>
              {pet.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{highlightText(pet.bio, query)}</p>
              )}
              {owner && (
                <p className="text-xs text-muted-foreground mt-2">Owner: @{owner.username}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function BlogCard({ post, query }: { post: BlogPost; query: string }) {
  const users = getUsers()
  const pets = getPets()
  const author = users.find((u) => u.id === post.authorId)
  const pet = pets.find((p) => p.id === post.petId)

  const totalReactions = post.reactions
    ? Object.values(post.reactions).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
    : post.likes?.length || 0

  const comments = getComments().filter((c) => c.postId === post.id).length

  return (
    <Link href={`/blog/${post.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {post.coverImage && (
              <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{highlightText(post.title, query)}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {highlightText(post.content.substring(0, 150), query)}
              </p>
              <div className="flex items-center gap-4 flex-wrap mb-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {post.hashtags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {author && <span>By {author.fullName}</span>}
                {pet && <span>• {pet.name}</span>}
                <span>• {formatCommentDate(post.createdAt)}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {totalReactions}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {comments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function WikiCard({ article, query }: { article: WikiArticle; query: string }) {
  const users = getUsers()
  const author = users.find((u) => u.id === article.authorId)

  return (
    <Link href={`/wiki/${article.slug}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{highlightText(article.title, query)}</h3>
                <Badge variant="secondary" className="text-xs capitalize">
                  {article.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {highlightText(article.content.substring(0, 200), query)}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {author && <span>By {author.fullName}</span>}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {article.likes?.length || 0} likes
                </span>
                <span>• {formatCommentDate(article.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
}) {
  const startItem = (currentPage - 1) * RESULTS_PER_PAGE + 1
  const endItem = Math.min(currentPage * RESULTS_PER_PAGE, totalItems)

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
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
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function highlightText(text: string, searchTerm: string) {
  if (!searchTerm.trim()) return text
  const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  )
}

