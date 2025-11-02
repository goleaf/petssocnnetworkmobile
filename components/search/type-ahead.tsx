"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Dog, Heart, MapPin, ShoppingBag, Loader2 } from "lucide-react"
import type { TypeAheadSuggestion, SearchCategory } from "@/lib/types/search"
import { SEARCH_CATEGORIES } from "@/lib/search/config"
import Link from "next/link"

interface TypeAheadProps {
  onSelect?: (suggestion: TypeAheadSuggestion) => void
  onQueryChange?: (query: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

const CATEGORY_ICONS = {
  breed: Dog,
  health: Heart,
  place: MapPin,
  product: ShoppingBag,
  all: Search,
}

export function TypeAhead({
  onSelect,
  onQueryChange,
  placeholder = "Search breeds, health, places, products...",
  className = "",
  debounceMs = 300,
}: TypeAheadProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<TypeAheadSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`
        )
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setIsOpen(data.suggestions && data.suggestions.length > 0)
      } catch (error) {
        console.error("Failed to fetch suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, debounceMs])

  useEffect(() => {
    onQueryChange?.(query)
  }, [query, onQueryChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleSuggestionClick = (suggestion: TypeAheadSuggestion) => {
    setQuery(suggestion.title)
    setIsOpen(false)
    onSelect?.(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        break
    }
  }

  const IconComponent = (category: SearchCategory) => {
    const Icon = CATEGORY_ICONS[category] || Search
    return <Icon className="h-4 w-4" />
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            <div className="py-2">
              {suggestions.map((suggestion, index) => {
                const Icon = CATEGORY_ICONS[suggestion.category] || Search
                const config = SEARCH_CATEGORIES[suggestion.category]
                const isSelected = index === selectedIndex

                return (
                  <div
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      flex items-center gap-3 px-4 py-2 cursor-pointer
                      hover:bg-gray-100 dark:hover:bg-gray-800
                      ${isSelected ? "bg-gray-100 dark:bg-gray-800" : ""}
                    `}
                  >
                    <div
                      className={`${config.color} p-2 rounded-lg text-white`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

