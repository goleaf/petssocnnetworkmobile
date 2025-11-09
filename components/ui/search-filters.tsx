"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Typeahead, type TypeaheadOption } from "@/components/ui/typeahead"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBlogPosts } from "@/lib/storage"
import { useUnitSystem } from "@/lib/i18n/hooks"
import { convertDistance, formatDistance as fmtDistance } from "@/lib/i18n/formatting"
import { useLocale } from "next-intl"
import { ANIMAL_TYPES } from "@/lib/animal-types"

// Filter types
export type FilterType = "type" | "species" | "tags" | "radius"

interface BaseFilterProps {
  label: string
  value: string | string[]
  onChange: (value: string | string[]) => void
  className?: string
}

// Type Filter Component
interface TypeFilterProps extends BaseFilterProps {
  type?: "type"
  availableTypes?: string[]
}

const DEFAULT_TYPES = [
  "all",
  "users",
  "pets",
  "blogs",
  "wiki",
  "hashtags",
  "groups",
  "events",
  "shelters",
]

export function TypeFilter({
  label,
  value,
  onChange,
  className,
  availableTypes = DEFAULT_TYPES,
}: TypeFilterProps) {
  const options: TypeaheadOption[] = useMemo(
    () =>
      availableTypes.map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      })),
    [availableTypes]
  )

  const selectedValue = Array.isArray(value) ? value[0] || "" : value

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <Typeahead
        options={options}
        value={selectedValue}
        onValueChange={(newValue) => {
          onChange(newValue)
        }}
        onSelect={(option) => {
          onChange(option.value)
        }}
        placeholder="Select type..."
        emptyMessage="No types found"
        emptyStateCTA={{
          label: "Create type",
          onClick: () => {
            // Handle stub creation - navigate to type creation page
            console.log("Create type clicked")
          },
        }}
        className="w-full"
      />
    </div>
  )
}

// Species Filter Component
interface SpeciesFilterProps extends BaseFilterProps {
  type?: "species"
  multiple?: boolean
}

export function SpeciesFilter({
  label,
  value,
  onChange,
  className,
  multiple = true,
}: SpeciesFilterProps) {
  const options: TypeaheadOption[] = useMemo(
    () =>
      ANIMAL_TYPES.map((animal) => ({
        value: animal.value,
        label: animal.label,
        icon: animal.icon,
      })),
    []
  )

  const selectedValues = Array.isArray(value) ? value : value ? [value] : []
  const [inputValue, setInputValue] = useState("")

  const handleSelect = (option: TypeaheadOption) => {
    if (multiple) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value]
      onChange(newValues)
      setInputValue("")
    } else {
      onChange(option.value)
      setInputValue("")
    }
  }

  const handleRemove = (valueToRemove: string) => {
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== valueToRemove))
    } else {
      onChange("")
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <Typeahead
        options={options}
        value={inputValue}
        onValueChange={setInputValue}
        onSelect={handleSelect}
        placeholder="Search species..."
        emptyMessage="No species found"
        emptyStateCTA={{
          label: "Add species",
          onClick: () => {
            console.log("Add species clicked")
          },
        }}
        className="w-full"
      />
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((val) => {
            const option = options.find((opt) => opt.value === val)
            return (
              <Badge
                key={val}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {option?.label || val}
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  aria-label={`Remove ${option?.label || val}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Tags Filter Component
interface TagsFilterProps extends BaseFilterProps {
  type?: "tags"
  multiple?: boolean
}

export function TagsFilter({
  label,
  value,
  onChange,
  className,
  multiple = true,
}: TagsFilterProps) {
  const [allTags, setAllTags] = useState<string[]>([])

  // Load all tags from blog posts
  useEffect(() => {
    const posts = getBlogPosts()
    const tagSet = new Set<string>()
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tagSet.add(tag))
      post.hashtags?.forEach((tag) => tagSet.add(tag))
    })
    setAllTags(Array.from(tagSet).sort())
  }, [])

  const options: TypeaheadOption[] = useMemo(
    () =>
      allTags.map((tag) => ({
        value: tag,
        label: tag.startsWith("#") ? tag : `#${tag}`,
      })),
    [allTags]
  )

  const selectedValues = Array.isArray(value) ? value : value ? [value] : []
  const [inputValue, setInputValue] = useState("")

  const handleSelect = (option: TypeaheadOption) => {
    const tagValue = option.value.startsWith("#")
      ? option.value.slice(1)
      : option.value

    if (multiple) {
      const newValues = selectedValues.includes(tagValue)
        ? selectedValues.filter((v) => v !== tagValue)
        : [...selectedValues, tagValue]
      onChange(newValues)
      setInputValue("")
    } else {
      onChange(tagValue)
      setInputValue("")
    }
  }

  const handleRemove = (valueToRemove: string) => {
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== valueToRemove))
    } else {
      onChange("")
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <Typeahead
        options={options}
        value={inputValue}
        onValueChange={setInputValue}
        onSelect={handleSelect}
        placeholder="Search tags..."
        emptyMessage="No tags found"
        emptyStateCTA={{
          label: "Create tag",
          onClick: () => {
            console.log("Create tag clicked")
          },
        }}
        className="w-full"
      />
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((val) => (
            <Badge
              key={val}
              variant="secondary"
              className="gap-1 pr-1"
            >
              #{val}
              <button
                type="button"
                onClick={() => handleRemove(val)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label={`Remove #${val}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Radius Filter Component (for places)
interface RadiusFilterProps extends BaseFilterProps {
  type?: "radius"
  location?: { lat: number; lng: number }
}

const RADIUS_OPTIONS = [
  { value: "1", label: "1 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "250", label: "250 km" },
]

export function RadiusFilter({
  label,
  value,
  onChange,
  className,
  location,
}: RadiusFilterProps) {
  const unitSystem = useUnitSystem()
  const locale = useLocale()
  const options: TypeaheadOption[] = useMemo(() => {
    // Base values are in km; adapt labels to unit preference
    return RADIUS_OPTIONS.map((opt) => {
      const km = parseFloat(opt.value)
      const label =
        unitSystem === "imperial"
          ? fmtDistance(convertDistance(km, "metric", "imperial"), "imperial", locale)
          : fmtDistance(km, "metric", locale)
      return { value: opt.value, label }
    })
  }, [unitSystem, locale])

  const selectedValue = Array.isArray(value) ? value[0] || "" : value || ""

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      {!location && (
        <p className="text-xs text-muted-foreground">
          Enable location access to use radius filter
        </p>
      )}
      <Typeahead
        options={options}
        value={selectedValue}
        onValueChange={(newValue) => {
          onChange(newValue)
        }}
        onSelect={(option) => {
          onChange(option.value)
        }}
        placeholder="Select radius..."
        emptyMessage="No radius options found"
        disabled={!location}
        className="w-full"
      />
      {selectedValue && (
        <div className="mt-2">
          <Badge variant="secondary" className="gap-1 pr-1">
            {options.find((opt) => opt.value === selectedValue)?.label}
            <button
              type="button"
              onClick={() => onChange("")}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              aria-label="Clear radius"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  )
}

// Combined Search Filters Component
interface SearchFiltersProps {
  filters: {
    type?: string | string[]
    species?: string | string[]
    tags?: string | string[]
    radius?: string
  }
  onChange: (filters: {
    type?: string | string[]
    species?: string | string[]
    tags?: string | string[]
    radius?: string
  }) => void
  location?: { lat: number; lng: number }
  className?: string
}

export function SearchFilters({
  filters,
  onChange,
  location,
  className,
}: SearchFiltersProps) {
  const handleFilterChange = (key: FilterType, value: string | string[]) => {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <TypeFilter
        label="Type"
        value={filters.type || ""}
        onChange={(value) => handleFilterChange("type", value)}
      />
      <SpeciesFilter
        label="Species"
        value={filters.species || []}
        onChange={(value) => handleFilterChange("species", value)}
        multiple
      />
      <TagsFilter
        label="Tags"
        value={filters.tags || []}
        onChange={(value) => handleFilterChange("tags", value)}
        multiple
      />
      <RadiusFilter
        label="Radius (for places)"
        value={filters.radius || ""}
        onChange={(value) => handleFilterChange("radius", value)}
        location={location}
      />
    </div>
  )
}
