/**
 * Search configuration and category definitions
 */

import type { SearchCategoryConfig, SearchCategory } from "@/lib/types/search"
import {
  Dog,
  Heart,
  MapPin,
  ShoppingBag,
  Search as SearchIcon,
} from "lucide-react"

export const SEARCH_CATEGORIES: Record<SearchCategory, SearchCategoryConfig> = {
  breed: {
    id: "breed",
    label: "Breed",
    icon: "dog",
    color: "bg-blue-500",
  },
  health: {
    id: "health",
    label: "Health",
    icon: "heart",
    color: "bg-red-500",
  },
  place: {
    id: "place",
    label: "Place",
    icon: "map-pin",
    color: "bg-green-500",
  },
  product: {
    id: "product",
    label: "Product",
    icon: "shopping-bag",
    color: "bg-purple-500",
  },
  all: {
    id: "all",
    label: "All",
    icon: "search",
    color: "bg-gray-500",
  },
}

/**
 * Get category icon component name (for lucide-react)
 */
export function getCategoryIcon(category: SearchCategory): string {
  return SEARCH_CATEGORIES[category].icon
}

/**
 * Get category color class
 */
export function getCategoryColor(category: SearchCategory): string {
  return SEARCH_CATEGORIES[category].color
}

/**
 * Get category label
 */
export function getCategoryLabel(category: SearchCategory): string {
  return SEARCH_CATEGORIES[category].label
}

