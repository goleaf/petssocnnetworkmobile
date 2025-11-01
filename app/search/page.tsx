"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Typeahead, type TypeaheadOption } from "@/components/ui/typeahead"
import { TypeFilter, SpeciesFilter, TagsFilter, RadiusFilter } from "@/components/ui/search-filters"
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
  Users,
  BookmarkPlus,
  History,
  Flame,
  Compass,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"
import { getUsers, getPets, getBlogPosts, getWikiArticles, getComments, getGroups, getGroupEvents } from "@/lib/storage"
import type { User as UserType, Pet, BlogPost, WikiArticle, Group, GroupEvent, SearchContentType } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatCommentDate, formatDate } from "@/lib/utils/date"
import { useAuth } from "@/lib/auth"
import { trackSearchQuery, trackResultClick } from "@/lib/utils/search-analytics"
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
  SAVED_SEARCHES: "search_saved_searches",
}

const RESULTS_PER_PAGE = 12

type SortOption = "relevance" | "recent" | "popular"
type FilterOption = {
  species: string[]
  location: string
  breed: string
  category: string[]
  gender: string[]
  tags: string[]
  types: string[]
  nearby: boolean
  ageMin?: number
  ageMax?: number
  dateFrom?: string
  dateTo?: string
  verified: boolean
}

type SearchHistoryEntry = {
  id: string
  query: string
  timestamp: string
  filters: FilterOption
  sortBy: SortOption
  tab: string
  resultCount: number
}

type SavedSearch = SearchHistoryEntry & {
  label: string
}

type OperatorFiltersState = {
  types: string[]
  species: string[]
  genders: string[]
  tags: string[]
  categories: string[]
  location?: string
  breed?: string
  ageMin?: number
  ageMax?: number
  dateFrom?: string
  dateTo?: string
  verified?: boolean
  nearMe: boolean
  sort?: SortOption
}

function createDefaultFilters(): FilterOption {
  return {
    species: [],
    location: "",
    breed: "",
    category: [],
    gender: [],
    tags: [],
    types: [],
    nearby: false,
    verified: false,
    ageMin: undefined,
    ageMax: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  }
}

function createEmptyOperatorFilters(): OperatorFiltersState {
  return {
    types: [],
    species: [],
    genders: [],
    tags: [],
    categories: [],
    location: undefined,
    breed: undefined,
    ageMin: undefined,
    ageMax: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    verified: undefined,
    nearMe: false,
    sort: undefined,
  }
}

function mergeUnique(values: string[], additions: string[]): string[] {
  return Array.from(new Set([...values, ...additions.filter(Boolean)])).filter(Boolean)
}

function operatorFiltersEqual(a: OperatorFiltersState, b: OperatorFiltersState): boolean {
  return (
    arraysEqual(a.types, b.types) &&
    arraysEqual(a.species, b.species) &&
    arraysEqual(a.genders, b.genders) &&
    arraysEqual(a.tags, b.tags) &&
    arraysEqual(a.categories, b.categories) &&
    a.location === b.location &&
    a.breed === b.breed &&
    a.ageMin === b.ageMin &&
    a.ageMax === b.ageMax &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo &&
    a.verified === b.verified &&
    a.nearMe === b.nearMe &&
    a.sort === b.sort
  )
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value) => b.includes(value))
}

function filtersEqual(a: FilterOption, b: FilterOption): boolean {
  return (
    arraysEqual(a.species, b.species) &&
    a.location === b.location &&
    a.breed === b.breed &&
    arraysEqual(a.category, b.category) &&
    arraysEqual(a.gender, b.gender) &&
    arraysEqual(a.tags, b.tags) &&
    arraysEqual(a.types, b.types) &&
    a.nearby === b.nearby &&
    a.ageMin === b.ageMin &&
    a.ageMax === b.ageMax &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo &&
    a.verified === b.verified
  )
}

function cloneFilters(filters: FilterOption): FilterOption {
  return {
    species: [...filters.species],
    location: filters.location,
    breed: filters.breed,
    category: [...filters.category],
    gender: [...filters.gender],
    tags: [...filters.tags],
    types: [...filters.types],
    nearby: filters.nearby,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    verified: filters.verified,
  }
}

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "").trim().toLowerCase()
}

function normalizeTypeToken(value: string): string | null {
  const token = value.trim().toLowerCase()
  switch (token) {
    case "user":
    case "users":
    case "people":
    case "profiles":
    case "members":
      return "users"
    case "pet":
    case "pets":
    case "animals":
      return "pets"
    case "post":
    case "posts":
    case "blog":
    case "blogs":
    case "stories":
    case "content":
      return "blogs"
    case "article":
    case "articles":
    case "wiki":
    case "knowledge":
    case "guides":
      return "wiki"
    case "tag":
    case "tags":
    case "hashtag":
    case "hashtags":
      return "hashtags"
    case "group":
    case "groups":
    case "community":
    case "communities":
    case "club":
    case "clubs":
      return "groups"
    case "event":
    case "events":
    case "meetup":
    case "meetups":
      return "events"
    case "all":
      return "all"
    default:
      return null
  }
}

function parseAdvancedQuery(rawQuery: string): { baseQuery: string; operators: OperatorFiltersState } {
  if (!rawQuery.trim()) {
    return { baseQuery: "", operators: createEmptyOperatorFilters() }
  }

  const operators = createEmptyOperatorFilters()
  let baseQuery = rawQuery
  const matches: string[] = []
  const regex = /(?:^|\s)(\w+):(?:"([^"]+)"|([^\s]+))/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(rawQuery)) !== null) {
    const fullMatch = match[0]
    const key = match[1].toLowerCase()
    const value = (match[2] ?? match[3] ?? "").replace(/^"|"$/g, "").trim()

    matches.push(fullMatch)

    if (!value) continue

    switch (key) {
      case "type":
      case "types": {
        value
          .split(",")
          .map((item) => normalizeTypeToken(item))
          .filter(Boolean)
          .forEach((item) => operators.types.push(item as string))
        break
      }
      case "tag":
      case "tags":
      case "hashtag":
      case "hashtags": {
        value
          .split(",")
          .map((item) => normalizeTag(item))
          .filter(Boolean)
          .forEach((item) => operators.tags.push(item))
        break
      }
      case "species": {
        value
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .forEach((item) => operators.species.push(item))
        break
      }
      case "gender":
      case "genders": {
        value
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .forEach((item) => operators.genders.push(item))
        break
      }
      case "category":
      case "categories": {
        value
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .forEach((item) => operators.categories.push(item))
        break
      }
      case "location":
      case "loc":
      case "city": {
        operators.location = value
        break
      }
      case "breed": {
        operators.breed = value
        break
      }
      case "near":
      case "nearby": {
        const normalized = value.toLowerCase()
        operators.nearMe = normalized === "true" || normalized === "1" || normalized === "me"
        break
      }
      case "verified": {
        const normalized = value.toLowerCase()
        operators.verified = normalized === "true" || normalized === "1" || normalized === "yes"
        break
      }
      case "sort": {
        const normalized = value.toLowerCase()
        if (normalized === "popular" || normalized === "recent" || normalized === "relevance") {
          operators.sort = normalized as SortOption
        }
        break
      }
      case "age": {
        const normalized = value.replace(/\s+/g, "")
        if (normalized.includes("-")) {
          const [min, max] = normalized.split("-").map((v) => Number(v))
          if (!Number.isNaN(min)) operators.ageMin = min
          if (!Number.isNaN(max)) operators.ageMax = max
        } else if (normalized.startsWith(">")) {
          const min = Number(normalized.slice(1))
          if (!Number.isNaN(min)) operators.ageMin = min
        } else if (normalized.startsWith("<")) {
          const max = Number(normalized.slice(1))
          if (!Number.isNaN(max)) operators.ageMax = max
        } else {
          const exact = Number(normalized)
          if (!Number.isNaN(exact)) {
            operators.ageMin = exact
            operators.ageMax = exact
          }
        }
        break
      }
      case "from":
      case "after": {
        operators.dateFrom = value
        break
      }
      case "to":
      case "before": {
        operators.dateTo = value
        break
      }
      case "date": {
        operators.dateFrom = value
        operators.dateTo = value
        break
      }
      default:
        break
    }
  }

  // Deduplicate operator arrays
  operators.types = Array.from(new Set(operators.types))
  operators.species = Array.from(new Set(operators.species))
  operators.genders = Array.from(new Set(operators.genders))
  operators.tags = Array.from(new Set(operators.tags))
  operators.categories = Array.from(new Set(operators.categories))

  matches.forEach((matchText) => {
    baseQuery = baseQuery.replace(matchText, " ")
  })

  return { baseQuery: baseQuery.replace(/\s+/g, " ").trim(), operators }
}

function getPostTrendingScore(post: BlogPost): number {
  const likes = post.reactions
    ? Object.values(post.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    : post.likes?.length || 0
  const daysSincePublished = Math.max(
    0,
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  )
  const recencyBoost = Math.max(0, 30 - daysSincePublished) / 30
  return likes * 2 + recencyBoost
}

function getTrendingPosts(posts: BlogPost[], limit: number, query: string): BlogPost[] {
  const normalizedQuery = query.trim().toLowerCase()
  return [...posts]
    .filter((post) => {
      if (!normalizedQuery) return true
      return (
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.content.toLowerCase().includes(normalizedQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        post.hashtags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      )
    })
    .sort((a, b) => getPostTrendingScore(b) - getPostTrendingScore(a))
    .slice(0, limit)
}

function getTrendingTags(posts: BlogPost[], limit: number, query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase()
  const tagCounts = new Map<string, number>()
  posts.forEach((post) => {
    post.hashtags?.forEach((tag) => {
      const normalized = tag.toLowerCase()
      if (normalizedQuery && !normalized.includes(normalizedQuery)) return
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, limit)
}

function getTrendingGroups(groups: Group[], limit: number): Group[] {
  return [...groups].sort((a, b) => b.memberCount - a.memberCount).slice(0, limit)
}

function buildFilterSummary(filters: FilterOption): string {
  const parts: string[] = []
  if (filters.species.length > 0) parts.push(`species:${filters.species.join(",")}`)
  if (filters.location) parts.push(`location:${filters.location}`)
  if (filters.breed) parts.push(`breed:${filters.breed}`)
  if (filters.gender.length > 0) parts.push(`gender:${filters.gender.join(",")}`)
  if (filters.category.length > 0) parts.push(`category:${filters.category.join(",")}`)
  if (filters.tags.length > 0) parts.push(`tags:${filters.tags.map((tag) => `#${tag}`).join(",")}`)
  if (filters.types.length > 0) parts.push(`type:${filters.types.join(",")}`)
  if (filters.nearby) parts.push("near:me")
  if (filters.verified) parts.push("verified:true")
  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    parts.push(`age:${filters.ageMin ?? 0}-${filters.ageMax ?? "∞"}`)
  }
  if (filters.dateFrom || filters.dateTo) {
    parts.push(`date:${filters.dateFrom || "..."}-${filters.dateTo || "..."}`)
  }
  return parts.join(" ") || "Search"
}

function generateSmartSuggestions({
  query,
  user,
  filters,
  trendingTags,
  typeRestrictions,
}: {
  query: string
  user?: UserType | null
  filters: FilterOption
  trendingTags: string[]
  typeRestrictions: string[]
}): string[] {
  const suggestions = new Set<string>()
  const baseQuery = query.trim()

  if (baseQuery) {
    suggestions.add(`${baseQuery} tips`)
    suggestions.add(`${baseQuery} events`)
  }

  if (filters.location) {
    suggestions.add(`type:events location:"${filters.location}"`)
  }

  if (filters.species.length > 0) {
    suggestions.add(`type:pets species:${filters.species[0]}`)
  }

  if (user?.favoriteAnimals?.length) {
    suggestions.add(`species:${user.favoriteAnimals[0].toLowerCase()} care guide`)
  }

  if (trendingTags.length > 0) {
    suggestions.add(`#${normalizeTag(trendingTags[0])}`)
  }

  if (!typeRestrictions.includes("events")) {
    suggestions.add("type:events near:true")
  }

  if (!baseQuery && suggestions.size === 0) {
    suggestions.add("type:pets tag:adoption")
    suggestions.add("type:users verified:true")
  }

  return Array.from(suggestions).filter(Boolean).slice(0, 4)
}

function combineFilters({
  filters,
  operators,
  user,
}: {
  filters: FilterOption
  operators: OperatorFiltersState
  user?: UserType | null
}): FilterOption {
  const operatorLocation = operators.location || ""
  const manualLocation = filters.location
  const autoLocation =
    !manualLocation && !operatorLocation && (filters.nearby || operators.nearMe) && user?.location ? user.location : ""

  return {
    ...createDefaultFilters(),
    ...filters,
    species: mergeUnique(filters.species, operators.species),
    gender: mergeUnique(filters.gender, operators.genders),
    category: mergeUnique(filters.category, operators.categories),
    tags: mergeUnique(filters.tags, operators.tags),
    types: mergeUnique(filters.types, operators.types),
    location: (operatorLocation || manualLocation || autoLocation || "").trim(),
    nearby: filters.nearby || operators.nearMe,
    verified: operators.verified ?? filters.verified,
    ageMin: operators.ageMin ?? filters.ageMin,
    ageMax: operators.ageMax ?? filters.ageMax,
    dateFrom: operators.dateFrom ?? filters.dateFrom,
    dateTo: operators.dateTo ?? filters.dateTo,
    breed: operators.breed ?? filters.breed,
  }
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
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

  const [filters, setFilters] = useState<FilterOption>(createDefaultFilters())

  const [results, setResults] = useState({
    users: [] as UserType[],
    pets: [] as Pet[],
    blogs: [] as BlogPost[],
    wiki: [] as WikiArticle[],
    hashtags: [] as string[],
    shelters: [] as any[],
    groups: [] as Group[],
    events: [] as GroupEvent[],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [operatorFilters, setOperatorFilters] = useState<OperatorFiltersState>(createEmptyOperatorFilters())
  const [trendingContent, setTrendingContent] = useState<{
    posts: BlogPost[]
    tags: string[]
    groups: Group[]
  }>({ posts: [], tags: [], groups: [] })
  const [locationHighlights, setLocationHighlights] = useState<{
    users: UserType[]
    pets: Pet[]
    events: GroupEvent[]
  }>({ users: [], pets: [], events: [] })
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const updateLocationHighlights = ({
    allUsers,
    allPets,
    allEvents,
    usersById,
    locationFilter,
  }: {
    allUsers: UserType[]
    allPets: Pet[]
    allEvents: GroupEvent[]
    usersById: Map<string, UserType>
    locationFilter: string
  }) => {
    const normalizedLocation =
      locationFilter ||
      (filters.nearby && user?.location ? user.location.toLowerCase() : "") ||
      ""

    if (!normalizedLocation) {
      setLocationHighlights({ users: [], pets: [], events: [] })
      return
    }

    const usersNearby = allUsers
      .filter((item) => item.location?.toLowerCase().includes(normalizedLocation))
      .slice(0, 3)

    const petsNearby = allPets
      .filter((pet) => {
        const ownerLocation = usersById.get(pet.ownerId)?.location?.toLowerCase()
        return ownerLocation ? ownerLocation.includes(normalizedLocation) : false
      })
      .slice(0, 3)

    const eventsNearby = allEvents
      .filter((event) => event.location?.toLowerCase().includes(normalizedLocation))
      .slice(0, 3)

    if (usersNearby.length === 0 && petsNearby.length === 0 && eventsNearby.length === 0) {
      setLocationHighlights({ users: [], pets: [], events: [] })
      return
    }

    setLocationHighlights({
      users: usersNearby,
      pets: petsNearby,
      events: eventsNearby,
    })
  }

  // Load recent searches, history, and saved searches from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    setMounted(true)

    const recent = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
    if (recent) {
      try {
        const parsed = JSON.parse(recent)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 10))
        }
      } catch (error) {
        console.error("Failed to parse recent searches", error)
      }
    }

    const historyRaw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)
    if (historyRaw) {
      try {
        const parsed = JSON.parse(historyRaw) as any[]
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((entry, index) => {
            if (!entry || typeof entry !== "object") {
              return {
                id: `history-${index}`,
                query: String(entry ?? ""),
                timestamp: new Date().toISOString(),
                filters: createDefaultFilters(),
                sortBy: "relevance" as SortOption,
                tab: "all",
                resultCount: 0,
              }
            }
            return {
              id: entry.id || `history-${index}`,
              query: entry.query || "",
              timestamp: entry.timestamp || new Date().toISOString(),
              filters: { ...createDefaultFilters(), ...(entry.filters ?? {}) },
              sortBy: (entry.sortBy as SortOption) || "relevance",
              tab: entry.tab || "all",
              resultCount: typeof entry.resultCount === "number" ? entry.resultCount : 0,
            }
          })
          setSearchHistory(normalized.slice(0, 50))
        }
      } catch (error) {
        console.error("Failed to parse search history", error)
      }
    }

    const savedRaw = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES)
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw) as any[]
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((entry, index) => ({
            id: entry.id || `saved-${index}`,
            label: entry.label || entry.query || "Saved search",
            query: entry.query || "",
            timestamp: entry.timestamp || new Date().toISOString(),
            filters: { ...createDefaultFilters(), ...(entry.filters ?? {}) },
            sortBy: (entry.sortBy as SortOption) || "relevance",
            tab: entry.tab || "all",
            resultCount: typeof entry.resultCount === "number" ? entry.resultCount : 0,
          }))
          setSavedSearches(normalized.slice(0, 20))
        }
      } catch (error) {
        console.error("Failed to parse saved searches", error)
      }
    }
  }, [])

  // Focus input on mount
  useEffect(() => {
    if (mounted && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mounted])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

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
      const { baseQuery, operators: parsedOperators } = parseAdvancedQuery(query)
      const normalizedQuery = baseQuery.trim().toLowerCase()

      if (!operatorFiltersEqual(operatorFilters, parsedOperators)) {
        setOperatorFilters(parsedOperators)
      }

      if (parsedOperators.sort && parsedOperators.sort !== sortBy) {
        setSortBy(parsedOperators.sort)
      }

      const effectiveFilters = combineFilters({ filters, operators: parsedOperators, user })

      const combinedTypes = effectiveFilters.types
      if (combinedTypes.length === 1 && activeTab !== combinedTypes[0]) {
        setActiveTab(combinedTypes[0])
      }

      const effectiveSort = parsedOperators.sort || sortBy

      const typeRestrictions = effectiveFilters.types
      const shouldIncludeType = (type: string) =>
        typeRestrictions.length === 0 || typeRestrictions.includes(type) || typeRestrictions.includes("all")

      const hasFilterConstraints =
        effectiveFilters.species.length > 0 ||
        effectiveFilters.location.length > 0 ||
        effectiveFilters.breed.length > 0 ||
        effectiveFilters.category.length > 0 ||
        effectiveFilters.gender.length > 0 ||
        effectiveFilters.tags.length > 0 ||
        effectiveFilters.types.length > 0 ||
        effectiveFilters.nearby ||
        effectiveFilters.ageMin !== undefined ||
        effectiveFilters.ageMax !== undefined ||
        Boolean(effectiveFilters.dateFrom) ||
        Boolean(effectiveFilters.dateTo) ||
        effectiveFilters.verified

      const allUsers = getUsers()
      const allPets = getPets()
      const allBlogPosts = getBlogPosts()
      const allWikiArticles = getWikiArticles()
      const allGroups = getGroups()
      const allEvents = getGroupEvents()

      const usersById = new Map(allUsers.map((item) => [item.id, item]))
      const locationFilter = effectiveFilters.location.toLowerCase()

      const trendingPosts = getTrendingPosts(allBlogPosts, 3, normalizedQuery)
      const trendingTags = getTrendingTags(allBlogPosts, 8, normalizedQuery)
      const trendingGroups = getTrendingGroups(allGroups, 3)
      setTrendingContent({ posts: trendingPosts, tags: trendingTags, groups: trendingGroups })

      if (!normalizedQuery && !hasFilterConstraints) {
        setResults({
          users: [],
          pets: [],
          blogs: [],
          wiki: [],
          hashtags: [],
          shelters: [],
          groups: [],
          events: [],
        })
        updateLocationHighlights({
          allUsers,
          allPets,
          allEvents,
          usersById,
          locationFilter,
        })
        setAiSuggestions(
          generateSmartSuggestions({
            query: normalizedQuery,
            user,
            filters: effectiveFilters,
            trendingTags,
            typeRestrictions,
          }),
        )
        setIsLoading(false)
        const params = new URLSearchParams()
        router.replace(`/search?${params.toString()}`, { scroll: false })
        return
      }

      let users: UserType[] = []
      if (shouldIncludeType("users")) {
        users = allUsers.filter((item) => {
          const matchesQuery =
            !normalizedQuery ||
            item.username.toLowerCase().includes(normalizedQuery) ||
            item.fullName.toLowerCase().includes(normalizedQuery) ||
            item.bio?.toLowerCase().includes(normalizedQuery)
          if (!matchesQuery) return false

          if (locationFilter && !item.location?.toLowerCase().includes(locationFilter)) {
            return false
          }

          if (effectiveFilters.verified && !(item.badge === "verified" || item.role === "admin")) {
            return false
          }

          if (effectiveFilters.tags.length > 0) {
            const normalizedTags = effectiveFilters.tags.map(normalizeTag)
            const interests = (item.interests || []).map((interest) => interest.toLowerCase())
            if (!normalizedTags.some((tag) => interests.includes(tag))) {
              return false
            }
          }

          return true
        })
      }

      let pets: Pet[] = []
      if (shouldIncludeType("pets")) {
        pets = allPets.filter((pet) => {
          const matchesQuery =
            !normalizedQuery ||
            pet.name.toLowerCase().includes(normalizedQuery) ||
            pet.species.toLowerCase().includes(normalizedQuery) ||
            pet.breed?.toLowerCase().includes(normalizedQuery) ||
            pet.bio?.toLowerCase().includes(normalizedQuery)
          if (!matchesQuery) return false

          if (effectiveFilters.species.length > 0 && !effectiveFilters.species.includes(pet.species)) {
            return false
          }

          if (effectiveFilters.breed && !pet.breed?.toLowerCase().includes(effectiveFilters.breed.toLowerCase())) {
            return false
          }

          if (effectiveFilters.gender.length > 0) {
            if (!pet.gender || !effectiveFilters.gender.includes(pet.gender)) {
              return false
            }
          }

          if (effectiveFilters.ageMin !== undefined && (pet.age ?? -Infinity) < effectiveFilters.ageMin) {
            return false
          }

          if (effectiveFilters.ageMax !== undefined && (pet.age ?? Infinity) > effectiveFilters.ageMax) {
            return false
          }

          if (locationFilter) {
            const ownerLocation = usersById.get(pet.ownerId)?.location?.toLowerCase()
            if (!ownerLocation || !ownerLocation.includes(locationFilter)) {
              return false
            }
          }

          return true
        })
      }

      let blogs: BlogPost[] = []
      if (shouldIncludeType("blogs")) {
        blogs = allBlogPosts.filter((post) => {
          const normalizedContent = post.content.toLowerCase()
          const matchesQuery =
            !normalizedQuery ||
            post.title.toLowerCase().includes(normalizedQuery) ||
            normalizedContent.includes(normalizedQuery) ||
            post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
            post.hashtags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
          if (!matchesQuery) return false

          if (effectiveFilters.tags.length > 0) {
            const normalizedTags = effectiveFilters.tags.map(normalizeTag)
            const postTags = [
              ...post.tags.map((tag) => normalizeTag(tag)),
              ...(post.hashtags || []).map((tag) => normalizeTag(tag)),
            ]
            if (!normalizedTags.some((tag) => postTags.includes(tag))) {
              return false
            }
          }

          if (effectiveFilters.dateFrom && new Date(post.createdAt) < new Date(effectiveFilters.dateFrom)) {
            return false
          }

          if (effectiveFilters.dateTo && new Date(post.createdAt) > new Date(effectiveFilters.dateTo)) {
            return false
          }

          return true
        })
      }

      let wiki: WikiArticle[] = []
      if (shouldIncludeType("wiki")) {
        wiki = allWikiArticles.filter((article) => {
          const matchesQuery =
            !normalizedQuery ||
            article.title.toLowerCase().includes(normalizedQuery) ||
            article.content.toLowerCase().includes(normalizedQuery) ||
            article.category.toLowerCase().includes(normalizedQuery)
          if (!matchesQuery) return false

          if (effectiveFilters.category.length > 0 && !effectiveFilters.category.includes(article.category.toLowerCase())) {
            return false
          }

          if (effectiveFilters.species.length > 0 && article.species?.length) {
            const speciesMatches = article.species.some((spec) => effectiveFilters.species.includes(spec.toLowerCase()))
            if (!speciesMatches) return false
          }

          if (effectiveFilters.tags.length > 0) {
            const normalizedTags = effectiveFilters.tags.map(normalizeTag)
            const contentText = article.content.toLowerCase()
            if (!normalizedTags.some((tag) => contentText.includes(tag))) {
              return false
            }
          }

          return true
        })
      }

      let groups: Group[] = []
      if (shouldIncludeType("groups")) {
        groups = allGroups.filter((group) => {
          const matchesQuery =
            !normalizedQuery ||
            group.name.toLowerCase().includes(normalizedQuery) ||
            group.description.toLowerCase().includes(normalizedQuery) ||
            group.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
          if (!matchesQuery) return false

          if (effectiveFilters.tags.length > 0) {
            const normalizedTags = effectiveFilters.tags.map(normalizeTag)
            const groupTags = (group.tags || []).map((tag) => normalizeTag(tag))
            if (!normalizedTags.some((tag) => groupTags.includes(tag))) {
              return false
            }
          }

          return true
        })
      }

      let events: GroupEvent[] = []
      if (shouldIncludeType("events")) {
        events = allEvents.filter((event) => {
          if (event.isCancelled) return false
          const group = allGroups.find((g) => g.id === event.groupId)
          const matchesQuery =
            !normalizedQuery ||
            event.title.toLowerCase().includes(normalizedQuery) ||
            event.description?.toLowerCase().includes(normalizedQuery) ||
            event.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
            group?.name.toLowerCase().includes(normalizedQuery)
          if (!matchesQuery) return false

          if (locationFilter && !event.location?.toLowerCase().includes(locationFilter)) {
            return false
          }

          if (effectiveFilters.tags.length > 0) {
            const normalizedTags = effectiveFilters.tags.map(normalizeTag)
            const eventTags = (event.tags || []).map((tag) => normalizeTag(tag))
            if (!normalizedTags.some((tag) => eventTags.includes(tag))) {
              return false
            }
          }

          if (effectiveFilters.dateFrom && new Date(event.startDate) < new Date(effectiveFilters.dateFrom)) {
            return false
          }

          if (effectiveFilters.dateTo && new Date(event.startDate) > new Date(effectiveFilters.dateTo)) {
            return false
          }

          return true
        })
      }

      let hashtags: string[] = []
      if (shouldIncludeType("hashtags")) {
        const tagSet = new Set<string>()
        allBlogPosts.forEach((post) => {
          post.hashtags?.forEach((tag) => {
            const normalized = tag.toLowerCase()
            if (!normalizedQuery || normalized.includes(normalizedQuery)) {
              tagSet.add(tag)
            }
          })
        })

        if (effectiveFilters.tags.length > 0) {
          const normalizedTags = effectiveFilters.tags.map(normalizeTag)
          hashtags = Array.from(tagSet).filter((tag) => normalizedTags.includes(normalizeTag(tag)))
        } else {
          hashtags = Array.from(tagSet)
        }
      }

      const sortedUsers = sortResults(users, effectiveSort, "users")
      const sortedPets = sortResults(pets, effectiveSort, "pets")
      const sortedBlogs = sortResults(blogs, effectiveSort, "blogs")
      const sortedWiki = sortResults(wiki, effectiveSort, "wiki")
      const sortedGroups = sortResults(groups, effectiveSort, "groups")
      const sortedEvents = sortResults(events, effectiveSort, "events")

      const resultPayload = {
        users: sortedUsers,
        pets: sortedPets,
        blogs: sortedBlogs,
        wiki: sortedWiki,
        hashtags,
        shelters: [] as any[],
        groups: sortedGroups,
        events: sortedEvents,
      }

      setResults(resultPayload)
      setIsLoading(false)

      updateLocationHighlights({
        allUsers,
        allPets,
        allEvents,
        usersById,
        locationFilter,
      })

      const totalResultsCount =
        sortedUsers.length +
        sortedPets.length +
        sortedBlogs.length +
        sortedWiki.length +
        hashtags.length +
        sortedGroups.length +
        sortedEvents.length

      setAiSuggestions(
        generateSmartSuggestions({
          query: normalizedQuery,
          user,
          filters: effectiveFilters,
          trendingTags,
          typeRestrictions,
        }),
      )

      if ((normalizedQuery || hasFilterConstraints) && typeof window !== "undefined") {
        const label = query.trim() || buildFilterSummary(effectiveFilters)
        const historyTab = combinedTypes.length === 1 ? combinedTypes[0] : activeTab
        const historyEntry: SearchHistoryEntry = {
          id: `history-${Date.now()}`,
          query: query.trim(),
          timestamp: new Date().toISOString(),
          filters: cloneFilters(effectiveFilters),
          sortBy: effectiveSort,
          tab: historyTab,
          resultCount: totalResultsCount,
        }

        setRecentSearches((prev) => {
          const updated = [label, ...prev.filter((item) => item !== label)].slice(0, 10)
          localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated))
          return updated
        })

        setSearchHistory((prev) => {
          const historyWithoutDuplicate = prev.filter(
            (entry) => entry.query !== historyEntry.query || !filtersEqual(entry.filters, historyEntry.filters),
          )
          const updatedHistory = [historyEntry, ...historyWithoutDuplicate].slice(0, 50)
          localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory))
          return updatedHistory
        })

        // Track search analytics
        try {
          trackSearchQuery({
            query: normalizedQuery || undefined,
            filters: effectiveFilters,
            resultCount: totalResultsCount,
            contentType: activeTab === "all" ? undefined : (activeTab as SearchContentType),
            isAuthenticated: Boolean(user),
          })
        } catch (error) {
          // Silently fail analytics tracking to not disrupt search
          console.debug("Analytics tracking error:", error)
        }
      }

      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (activeTab !== "all") params.set("tab", activeTab)
      if (effectiveSort !== "relevance") params.set("sort", effectiveSort)
      router.replace(`/search?${params.toString()}`, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filters, sortBy, activeTab, router, user])

  // Sort results
  const sortResults = (items: any[], sort: SortOption, type: string) => {
    if (sort === "recent") {
      return [...items].sort((a, b) => {
        if (type === "events") {
          return new Date(b.startDate || b.createdAt || 0).getTime() - new Date(a.startDate || a.createdAt || 0).getTime()
        }
        if (type === "groups") {
          return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
        }
        if (type === "pets") {
          return new Date(b.adoptionDate || b.birthday || 0).getTime() - new Date(a.adoptionDate || a.birthday || 0).getTime()
        }
        return new Date(b.createdAt || b.joinedAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.joinedAt || a.updatedAt || 0).getTime()
      })
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
      } else if (type === "pets") {
        return [...items].sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0))
      } else if (type === "groups") {
        return [...items].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      } else if (type === "events") {
        return [...items].sort((a, b) => (b.attendeeCount || 0) - (a.attendeeCount || 0))
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

  const handleSaveCurrentSearch = () => {
    const effectiveFiltersSnapshot = combineFilters({ filters, operators: operatorFilters, user })
    const summary = buildFilterSummary(effectiveFiltersSnapshot)
    const normalizedQuery = query.trim()
    if (!normalizedQuery && summary === "Search") {
      return
    }

    const label = normalizedQuery || summary
    const preferredTab = effectiveFiltersSnapshot.types.length === 1 ? effectiveFiltersSnapshot.types[0] : activeTab
    const savedEntry: SavedSearch = {
      id: `saved-${Date.now()}`,
      label,
      query: normalizedQuery,
      timestamp: new Date().toISOString(),
      filters: cloneFilters(effectiveFiltersSnapshot),
      sortBy,
      tab: preferredTab,
      resultCount:
        results.users.length +
        results.pets.length +
        results.blogs.length +
        results.wiki.length +
        results.hashtags.length +
        results.groups.length +
        results.events.length,
    }

    setSavedSearches((prev) => {
      const withoutDuplicate = prev.filter(
        (entry) => entry.query !== savedEntry.query || !filtersEqual(entry.filters, savedEntry.filters),
      )
      const updated = [savedEntry, ...withoutDuplicate].slice(0, 20)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleApplySavedSearch = (saved: SavedSearch) => {
    setQuery(saved.query)
    setFilters(cloneFilters(saved.filters))
    setSortBy(saved.sortBy)
    setActiveTab(saved.tab)
    setCurrentPage(1)
  }

  const handleRemoveSavedSearch = (id: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((entry) => entry.id !== id)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated))
      }
      return updated
    })
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
    setFilters(createDefaultFilters())
    setCurrentPage(1)
  }

  const combinedFiltersForUi = combineFilters({ filters, operators: operatorFilters, user })

  const hasActiveFilters =
    combinedFiltersForUi.species.length > 0 ||
    combinedFiltersForUi.location.length > 0 ||
    combinedFiltersForUi.breed.length > 0 ||
    combinedFiltersForUi.category.length > 0 ||
    combinedFiltersForUi.gender.length > 0 ||
    combinedFiltersForUi.tags.length > 0 ||
    combinedFiltersForUi.types.length > 0 ||
    combinedFiltersForUi.nearby ||
    combinedFiltersForUi.ageMin !== undefined ||
    combinedFiltersForUi.ageMax !== undefined ||
    Boolean(combinedFiltersForUi.dateFrom) ||
    Boolean(combinedFiltersForUi.dateTo) ||
    combinedFiltersForUi.verified

  const totalResults =
    results.users.length +
    results.pets.length +
    results.blogs.length +
    results.wiki.length +
    results.hashtags.length +
    results.shelters.length +
    results.groups.length +
    results.events.length
  const canSaveSearch = query.trim().length > 0 || hasActiveFilters
  const locationContextLabel = combinedFiltersForUi.location || user?.location || ""
  const hasLocationHighlights =
    locationHighlights.users.length > 0 ||
    locationHighlights.pets.length > 0 ||
    locationHighlights.events.length > 0
  const hasSuggestions = aiSuggestions.length > 0
  const filterCount =
    combinedFiltersForUi.species.length +
    combinedFiltersForUi.category.length +
    combinedFiltersForUi.gender.length +
    combinedFiltersForUi.tags.length +
    combinedFiltersForUi.types.length +
    (combinedFiltersForUi.location ? 1 : 0) +
    (combinedFiltersForUi.breed ? 1 : 0) +
    (combinedFiltersForUi.nearby ? 1 : 0) +
    (combinedFiltersForUi.ageMin !== undefined || combinedFiltersForUi.ageMax !== undefined ? 1 : 0) +
    (combinedFiltersForUi.dateFrom || combinedFiltersForUi.dateTo ? 1 : 0) +
    (combinedFiltersForUi.verified ? 1 : 0)

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
  const paginatedGroups = getPaginatedResults(results.groups)
  const paginatedEvents = getPaginatedResults(results.events)

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
                      {filterCount}
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
                  checked={filters.nearby}
                  onCheckedChange={(checked) => setFilters({ ...filters, nearby: checked })}
                >
                  <Compass className="h-4 w-4 mr-2 inline" />
                  Near Me
                </DropdownMenuCheckboxItem>

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
              <Badge key={`species-${species}`} variant="secondary" className="gap-1">
                {species}
                <button onClick={() => toggleSpeciesFilter(species)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {combinedFiltersForUi.species
              .filter((species) => !filters.species.includes(species))
              .map((species) => (
                <Badge key={`query-species-${species}`} variant="outline" className="gap-1">
                  Query: {species}
                </Badge>
              ))}

            {filters.category.map((category) => (
              <Badge key={`category-${category}`} variant="secondary" className="gap-1">
                {category}
                <button onClick={() => toggleCategoryFilter(category)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {combinedFiltersForUi.category
              .filter((category) => !filters.category.includes(category))
              .map((category) => (
                <Badge key={`query-category-${category}`} variant="outline" className="gap-1">
                  Query: {category}
                </Badge>
              ))}

            {filters.gender.map((gender) => (
              <Badge key={`gender-${gender}`} variant="secondary" className="gap-1">
                {gender}
                <button onClick={() => toggleGenderFilter(gender)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {combinedFiltersForUi.gender
              .filter((gender) => !filters.gender.includes(gender))
              .map((gender) => (
                <Badge key={`query-gender-${gender}`} variant="outline" className="gap-1">
                  Query: {gender}
                </Badge>
              ))}

            {filters.tags.map((tag) => (
              <Badge key={`tag-${tag}`} variant="secondary" className="gap-1">
                #{tag}
                <button
                  onClick={() => setFilters({ ...filters, tags: filters.tags.filter((t) => t !== tag) })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {combinedFiltersForUi.tags
              .filter((tag) => !filters.tags.includes(tag))
              .map((tag) => (
                <Badge key={`query-tag-${tag}`} variant="outline" className="gap-1">
                  Query: #{tag}
                </Badge>
              ))}

            {filters.types.map((type) => (
              <Badge key={`type-${type}`} variant="secondary" className="gap-1 capitalize">
                {type}
                <button
                  onClick={() => setFilters({ ...filters, types: filters.types.filter((t) => t !== type) })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {combinedFiltersForUi.types
              .filter((type) => !filters.types.includes(type))
              .map((type) => (
                <Badge key={`query-type-${type}`} variant="outline" className="gap-1 capitalize">
                  Query: {type}
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
            {!filters.location && combinedFiltersForUi.location && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {combinedFiltersForUi.location}
                <span className="text-xs text-muted-foreground">Query</span>
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
            {!filters.breed && operatorFilters.breed && (
              <Badge variant="outline" className="gap-1">
                Breed: {operatorFilters.breed}
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
            {filters.ageMin === undefined && filters.ageMax === undefined &&
              (combinedFiltersForUi.ageMin !== undefined || combinedFiltersForUi.ageMax !== undefined) && (
                <Badge variant="outline" className="gap-1">
                  Age: {combinedFiltersForUi.ageMin ?? 0}-{combinedFiltersForUi.ageMax ?? "∞"}
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
            {!filters.dateFrom && !filters.dateTo &&
              (combinedFiltersForUi.dateFrom || combinedFiltersForUi.dateTo) && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {combinedFiltersForUi.dateFrom || "..."} - {combinedFiltersForUi.dateTo || "..."}
                </Badge>
              )}

            {filters.nearby && (
              <Badge variant="secondary" className="gap-1">
                <Compass className="h-3 w-3" />
                Near Me
                <button onClick={() => setFilters({ ...filters, nearby: false })} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {!filters.nearby && combinedFiltersForUi.nearby && (
              <Badge variant="outline" className="gap-1">
                <Compass className="h-3 w-3" />
                Near Me
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
            {!filters.verified && operatorFilters.verified && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
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

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
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
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-1" />
            Groups ({results.groups.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <CalendarDays className="h-4 w-4 mr-1" />
            Events ({results.events.length})
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

              {results.groups.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Groups ({results.groups.length})</h2>
                    {results.groups.length > 4 && (
                      <Link href="/search?tab=groups" className="text-sm text-primary hover:underline">
                        View all →
                      </Link>
                    )}
                  </div>
                  <div className="space-y-4">
                    {results.groups.slice(0, 4).map((group) => (
                      <GroupCard key={group.id} group={group} query={query} />
                    ))}
                  </div>
                </div>
              )}

              {results.events.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Events & Meetups ({results.events.length})</h2>
                    {results.events.length > 4 && (
                      <Link href="/search?tab=events" className="text-sm text-primary hover:underline">
                        View all →
                      </Link>
                    )}
                  </div>
                  <div className="space-y-4">
                    {results.events.slice(0, 4).map((event) => (
                      <EventCard key={event.id} event={event} query={query} />
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

        <TabsContent value="groups" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.groups.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-2">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No groups found</p>
                <p className="text-sm text-muted-foreground/80">Try adjusting your interests or filters</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedGroups.items.map((group) => (
                  <GroupCard key={group.id} group={group} query={query} />
                ))}
              </div>
              {paginatedGroups.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedGroups.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={paginatedGroups.totalItems}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.events.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-2">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No events or meetups found</p>
                <p className="text-sm text-muted-foreground/80">Try searching with a different location or date</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedEvents.items.map((event) => (
                  <EventCard key={event.id} event={event} query={query} />
                ))}
              </div>
              {paginatedEvents.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedEvents.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={paginatedEvents.totalItems}
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
        <aside className="space-y-4">
          {/* Saved Searches */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <BookmarkPlus className="h-4 w-4" />
                  Saved searches
                </div>
                <Button variant="outline" size="sm" onClick={handleSaveCurrentSearch} disabled={!canSaveSearch}>
                  Save current
                </Button>
              </div>
              {savedSearches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keep tabs on favorite queries to revisit them quickly.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedSearches.slice(0, 5).map((saved) => (
                    <div key={saved.id} className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleApplySavedSearch(saved)}
                        className="text-left flex-1"
                      >
                        <div className="text-sm font-medium leading-tight truncate">{saved.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {saved.resultCount} result{saved.resultCount === 1 ? "" : "s"} · {formatCommentDate(saved.timestamp)}
                        </div>
                      </button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveSavedSearch(saved.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search History */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <History className="h-4 w-4" />
                Recent history
              </div>
              {searchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">We’ll keep the last 50 searches right here.</p>
              ) : (
                <div className="space-y-2">
                  {searchHistory.slice(0, 5).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setQuery(entry.query)
                        setFilters(cloneFilters(entry.filters))
                        setSortBy(entry.sortBy)
                        setActiveTab(entry.tab)
                        setCurrentPage(1)
                      }}
                      className="w-full text-left text-sm hover:bg-muted rounded px-2 py-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{entry.query || buildFilterSummary(entry.filters)}</span>
                        <span className="text-xs text-muted-foreground">{formatCommentDate(entry.timestamp)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location based discovery */}
          {hasLocationHighlights && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Compass className="h-4 w-4" />
                  Nearby {locationContextLabel ? `in ${locationContextLabel}` : "matches"}
                </div>
                {locationHighlights.users.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">Users</p>
                    {locationHighlights.users.slice(0, 3).map((localUser) => (
                      <Link
                        key={localUser.id}
                        href={`/user/${localUser.username}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={localUser.avatar} />
                          <AvatarFallback>{localUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{localUser.fullName || localUser.username}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {locationHighlights.pets.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">Pets</p>
                    {locationHighlights.pets.slice(0, 3).map((pet) => (
                      <Link
                        key={pet.id}
                        href={getPetUrlFromPet(pet)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={pet.avatar} />
                          <AvatarFallback>{pet.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{pet.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {locationHighlights.events.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">Events</p>
                    {locationHighlights.events.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        href={
                          (() => {
                            const g = getGroups().find((group) => group.id === event.groupId)
                            return g ? `/groups/${g.slug}/events/${event.id}` : "/groups"
                          })()
                        }
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <CalendarDays className="h-4 w-4" />
                        <span className="truncate">{event.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trending Content */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <Flame className="h-4 w-4" />
                Trending now
              </div>
              {trendingContent.posts.length === 0 && trendingContent.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Trending highlights will appear as activity grows.</p>
              ) : (
                <div className="space-y-3">
                  {trendingContent.posts.slice(0, 2).map((post) => (
                    <Link key={post.id} href={`/blog/${post.id}`} className="block text-sm hover:underline">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="text-xs text-muted-foreground">{formatCommentDate(post.createdAt)}</div>
                    </Link>
                  ))}
                  {trendingContent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trendingContent.tags.slice(0, 6).map((tag) => (
                        <Link key={tag} href={`/search?q=${encodeURIComponent(`#${tag}`)}&tab=blogs`}>
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            #{tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                  {trendingContent.groups.length > 0 && (
                    <div className="space-y-1">
                      {trendingContent.groups.slice(0, 2).map((group) => (
                        <Link key={group.id} href={`/groups/${group.slug}`} className="text-sm hover:underline">
                          {group.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {hasSuggestions && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Suggestions
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <Button
                      key={`${suggestion}-${index}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
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
  const { user: currentUser } = useAuth()
  const users = getUsers()
  const owner = users.find((u) => u.id === pet.ownerId)
  const petUrl = owner ? getPetUrlFromPet(pet, owner.username) : `/pet/${pet.id}`

  const handleClick = () => {
    try {
      trackResultClick({
        query: query || undefined,
        clickedResultType: "pet",
        clickedResultId: pet.id,
        isAuthenticated: Boolean(currentUser),
      })
    } catch (error) {
      console.debug("Analytics tracking error:", error)
    }
  }

  return (
    <Link href={petUrl} onClick={handleClick}>
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
  const { user: currentUser } = useAuth()
  const users = getUsers()
  const pets = getPets()
  const author = users.find((u) => u.id === post.authorId)
  const pet = pets.find((p) => p.id === post.petId)

  const totalReactions = post.reactions
    ? Object.values(post.reactions).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
    : post.likes?.length || 0

  const comments = getComments().filter((c) => c.postId === post.id).length

  const handleClick = () => {
    try {
      trackResultClick({
        query: query || undefined,
        clickedResultType: "blog",
        clickedResultId: post.id,
        isAuthenticated: Boolean(currentUser),
      })
    } catch (error) {
      console.debug("Analytics tracking error:", error)
    }
  }

  return (
    <Link href={`/blog/${post.id}`} onClick={handleClick}>
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
  const { user: currentUser } = useAuth()
  const users = getUsers()
  const author = users.find((u) => u.id === article.authorId)

  const handleClick = () => {
    try {
      trackResultClick({
        query: query || undefined,
        clickedResultType: "wiki",
        clickedResultId: article.id,
        isAuthenticated: Boolean(currentUser),
      })
    } catch (error) {
      console.debug("Analytics tracking error:", error)
    }
  }

  return (
    <Link href={`/wiki/${article.slug}`} onClick={handleClick}>
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

function GroupCard({ group, query }: { group: Group; query: string }) {
  return (
    <Link href={`/groups/${group.slug}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Users className="h-10 w-10 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{highlightText(group.name, query)}</h3>
                {group.isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {highlightText(group.description, query)}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span>{group.memberCount} members</span>
                <span>• {group.postCount} posts</span>
                <span>• {group.topicCount} topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.tags?.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EventCard({ event, query }: { event: GroupEvent; query: string }) {
  const group = getGroups().find((g) => g.id === event.groupId)
  const startDate = formatDate(event.startDate)

  return (
    <Link href={group ? `/groups/${group.slug}/events/${event.id}` : "/groups"}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-10 w-10 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-lg">{highlightText(event.title, query)}</h3>
                {event.attendeeCount !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {event.attendeeCount} attending
                  </Badge>
                )}
              </div>
              {group && (
                <p className="text-sm text-muted-foreground mb-1">
                  Hosted by {highlightText(group.name, query)}
                </p>
              )}
              {event.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {highlightText(event.location, query)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Starts on {startDate}</p>
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {highlightText(event.description, query)}
            </p>
          )}
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

          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {highlightText(event.description, query)}
            </p>
          )}
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
