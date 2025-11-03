"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { Search, X, Sparkles, Bookmark, BookmarkCheck, BookOpen, Plus } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SpeciesFilter, TagsFilter, TypeFilter } from "@/components/ui/search-filters"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: string
  petId: string
  authorId: string
  title: string
  snippet: string
  type: string
  tags: string[]
  hashtags: string[]
  relevance: number
}

interface SearchResponse {
  query: string
  results: SearchResult[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
  suggestions?: {
    message: string
    tags: string[]
  }
}

interface Filters {
  type?: string
  species?: string[]
  tags?: string[]
}

interface SavedSearch {
  id: string
  query: string
  filters: Filters
  savedAt: string
  name?: string
}

const SAVED_SEARCHES_KEY = "pet_social_saved_searches"
const MAX_SAVED_SEARCHES = 10

const getSavedSearches = (): SavedSearch[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveSearch = (query: string, filters: Filters): void => {
  if (typeof window === "undefined" || !query.trim()) return
  const searches = getSavedSearches()
  const newSearch: SavedSearch = {
    id: `saved_${Date.now()}`,
    query: query.trim(),
    filters: { ...filters },
    savedAt: new Date().toISOString(),
  }
  
  // Remove duplicates
  const filtered = searches.filter(
    (s) => !(s.query === newSearch.query && JSON.stringify(s.filters) === JSON.stringify(newSearch.filters))
  )
  
  // Add new search and keep only latest MAX_SAVED_SEARCHES
  const updated = [newSearch, ...filtered].slice(0, MAX_SAVED_SEARCHES)
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated))
}

const deleteSavedSearch = (id: string): void => {
  if (typeof window === "undefined") return
  const searches = getSavedSearches().filter((s) => s.id !== id)
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches))
}

export default function FacetedSearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [noResults, setNoResults] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

  const performSearch = async (searchQuery: string, currentFilters: Filters) => {
    if (!searchQuery.trim()) {
      setResults([])
      setNoResults(false)
      setSuggestions([])
      return
    }

    setIsLoading(true)
    setNoResults(false)

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "20",
        offset: "0",
      })

      if (currentFilters.species && currentFilters.species.length > 0) {
        params.set("species", currentFilters.species[0])
      }
      if (currentFilters.tags && currentFilters.tags.length > 0) {
        params.set("tags", currentFilters.tags.join(","))
      }
      if (currentFilters.type) {
        params.set("type", currentFilters.type)
      }

      const response = await fetch(`/api/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format")
      }
      
      const data: SearchResponse = await response.json()

      setResults(data.results)
      setNoResults(data.results.length === 0)
      setSuggestions(data.suggestions?.tags || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
      setNoResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setSavedSearches(getSavedSearches())
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, filters)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filters])

  const handleSaveSearch = () => {
    if (!query.trim()) return
    saveSearch(query, filters)
    setSavedSearches(getSavedSearches())
  }

  const handleRunSavedSearch = (saved: SavedSearch) => {
    setQuery(saved.query)
    setFilters(saved.filters)
  }

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Boolean(filters.species?.length || filters.tags?.length || filters.type)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Faceted Search</h1>
        <p className="text-muted-foreground">
          Search with type, species, and tag filters backed by Full-Text Search
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for pets, posts, and more..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {query && query.trim() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveSearch}
              title="Save this search"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          )}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {savedSearches.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" title="Saved searches">
                  <BookmarkCheck className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedSearches.map((saved) => (
                  <DropdownMenuItem
                    key={saved.id}
                    onClick={() => handleRunSavedSearch(saved)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{saved.query}</p>
                      {(saved.filters.type || saved.filters.species?.length || saved.filters.tags?.length) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {saved.filters.type && `Type: ${saved.filters.type}`}
                          {saved.filters.species?.length && ` Species: ${saved.filters.species.join(", ")}`}
                          {saved.filters.tags?.length && ` Tags: ${saved.filters.tags.join(", ")}`}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSavedSearch(saved.id)
                        setSavedSearches(getSavedSearches())
                      }}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 items-center flex-wrap">
        <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {[filters.species?.length, filters.tags?.length, filters.type ? 1 : 0]
                    .filter(Boolean)
                    .reduce((a, b) => (a || 0) + (b || 0), 0)}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 p-4">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Filter Results</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-4 mt-2">
              <TypeFilter
                label="Type"
                value={filters.type || ""}
                onChange={(value) => handleFilterChange("type", value as string)}
              />
              <SpeciesFilter
                label="Species"
                value={filters.species || []}
                onChange={(value) => handleFilterChange("species", value as string[])}
                multiple
              />
              <TagsFilter
                label="Tags"
                value={filters.tags || []}
                onChange={(value) => handleFilterChange("tags", value as string[])}
                multiple
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex gap-2 flex-wrap">
            {filters.type && (
              <Badge variant="secondary" className="gap-1">
                Type: {filters.type}
                <button
                  onClick={() => handleFilterChange("type", "")}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.species?.map((species) => (
              <Badge key={species} variant="secondary" className="gap-1">
                {species}
                <button
                  onClick={() =>
                    handleFilterChange(
                      "species",
                      filters.species?.filter((s) => s !== species) || []
                    )
                  }
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button
                  onClick={() =>
                    handleFilterChange(
                      "tags",
                      filters.tags?.filter((t) => t !== tag) || []
                    )
                  }
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* No Results with Suggestions */}
      {!isLoading && noResults && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Suggestions:</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {suggestions.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setQuery(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 pt-6 border-t w-full">
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium mb-1">Couldn't find what you're looking for?</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a wiki article to help others discover this topic
                    </p>
                  </div>
                  <Link href={`/wiki/create?title=${encodeURIComponent(query)}`}>
                    <CreateButton iconType="plus">
                      Create Wiki Stub
                    </CreateButton>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isLoading && !noResults && results.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{result.title}</CardTitle>
                      <div className="flex gap-2 items-center text-sm text-muted-foreground">
                        <Badge variant="outline">{result.type}</Badge>
                        <span>•</span>
                        <span>Pet ID: {result.petId}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-sm text-muted-foreground mb-4"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                  {(result.tags?.length > 0 || result.hashtags?.length > 0) && (
                    <div className="flex gap-2 flex-wrap">
                      {result.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {result.hashtags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/blog/${result.id}`}>View Post</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/pet/${result.petId}`}>View Pet</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !noResults && results.length === 0 && query && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start searching</h3>
              <p className="text-muted-foreground">
                Enter a query above to find posts, pets, and more
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

