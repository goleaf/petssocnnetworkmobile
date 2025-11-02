/**
 * Search-related TypeScript types for discovery & search features
 */

export type SearchCategory = "breed" | "health" | "place" | "product" | "all"

export interface SearchCategoryConfig {
  id: SearchCategory
  label: string
  icon: string
  color: string
}

export interface SearchResult {
  id: string
  category: SearchCategory
  title: string
  description?: string
  snippet?: string
  url: string
  imageUrl?: string
  metadata?: Record<string, unknown>
  relevance: number
  verified?: boolean
  location?: {
    lat: number
    lng: number
    address?: string
    distance?: number // Distance in km if "near me" is used
  }
}

export interface TypeAheadSuggestion {
  id: string
  category: SearchCategory
  title: string
  subtitle?: string
  icon: string
  url?: string
  relevance: number
}

export interface SearchFilters {
  category?: SearchCategory
  species?: string[]
  topic?: string[]
  location?: {
    lat: number
    lng: number
    radius?: number // km
  }
  verified?: boolean
  tags?: string[]
}

export interface SearchFacets {
  categories: Array<{
    id: SearchCategory
    count: number
  }>
  species: Array<{
    id: string
    count: number
  }>
  topics: Array<{
    id: string
    count: number
  }>
  locations: Array<{
    id: string
    count: number
  }>
  verified: {
    count: number
  }
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  facets: SearchFacets
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  suggestions?: string[]
  relatedQueries?: string[]
  expandedQuery?: string // Query with synonyms expanded
}

export interface RelatedPage {
  id: string
  title: string
  url: string
  category: SearchCategory
  relevance: number
  reason: string // Why this page is related
}

export interface SynonymEntry {
  terms: string[] // All synonymous terms
  primary: string // Primary/canonical term
  category?: SearchCategory // Optional category restriction
}

export interface GraphSignal {
  sourceId: string
  targetId: string
  type: "category" | "tag" | "location" | "breed" | "user" | "pet"
  strength: number // 0-1
}

