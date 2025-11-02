"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { X, MapPin, ShieldCheck } from "lucide-react"
import type { SearchFilters, SearchFacets, SearchCategory } from "@/lib/types/search"
import { SEARCH_CATEGORIES } from "@/lib/search/config"
import { getCurrentLocation, formatDistance } from "@/lib/search/utils"

interface FacetedFiltersProps {
  filters: SearchFilters
  facets: SearchFacets
  onFiltersChange: (filters: SearchFilters) => void
  userLocation?: { lat: number; lng: number }
  onLocationRequest?: () => void
}

export function FacetedFilters({
  filters,
  facets,
  onFiltersChange,
  userLocation,
  onLocationRequest,
}: FacetedFiltersProps) {
  const [locationEnabled, setLocationEnabled] = useState(
    !!filters.location || !!userLocation
  )

  const handleCategoryChange = (category: SearchCategory) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    })
  }

  const handleSpeciesToggle = (species: string) => {
    const currentSpecies = filters.species || []
    const newSpecies = currentSpecies.includes(species)
      ? currentSpecies.filter((s) => s !== species)
      : [...currentSpecies, species]

    onFiltersChange({
      ...filters,
      species: newSpecies.length > 0 ? newSpecies : undefined,
    })
  }

  const handleTopicToggle = (topic: string) => {
    const currentTopics = filters.topic || []
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter((t) => t !== topic)
      : [...currentTopics, topic]

    onFiltersChange({
      ...filters,
      topic: newTopics.length > 0 ? newTopics : undefined,
    })
  }

  const handleVerifiedToggle = () => {
    onFiltersChange({
      ...filters,
      verified: filters.verified === true ? undefined : true,
    })
  }

  const handleLocationToggle = async () => {
    if (!locationEnabled && !userLocation) {
      // Request location
      try {
        const position = await getCurrentLocation()
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: 10, // Default 10km
        }
        setLocationEnabled(true)
        onFiltersChange({
          ...filters,
          location: newLocation,
        })
        onLocationRequest?.()
      } catch (error) {
        console.error("Failed to get location:", error)
        alert("Unable to access your location. Please check your browser settings.")
      }
    } else {
      // Disable location
      setLocationEnabled(false)
      const { location, ...rest } = filters
      onFiltersChange(rest)
    }
  }

  const clearFilters = () => {
    onFiltersChange({})
    setLocationEnabled(false)
  }

  const hasActiveFilters =
    filters.category ||
    (filters.species && filters.species.length > 0) ||
    (filters.topic && filters.topic.length > 0) ||
    filters.verified ||
    filters.location

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Category</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(SEARCH_CATEGORIES)
              .filter((cat) => cat.id !== "all")
              .map((category) => {
                const isSelected = filters.category === category.id
                return (
                  <Badge
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.label}
                  </Badge>
                )
              })}
          </div>
        </div>

        <Separator />

        {/* Species Filter */}
        {facets.species.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Species</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {facets.species.map((species) => {
                const isSelected = filters.species?.includes(species.id) || false
                return (
                  <div key={species.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`species-${species.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleSpeciesToggle(species.id)}
                    />
                    <Label
                      htmlFor={`species-${species.id}`}
                      className="text-sm cursor-pointer flex-1 flex items-center justify-between"
                    >
                      <span className="capitalize">{species.id}</span>
                      <span className="text-xs text-gray-500">
                        {species.count}
                      </span>
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Topic Filter */}
        {facets.topics.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium mb-2 block">Topic</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {facets.topics.map((topic) => {
                  const isSelected = filters.topic?.includes(topic.id) || false
                  return (
                    <div key={topic.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleTopicToggle(topic.id)}
                      />
                      <Label
                        htmlFor={`topic-${topic.id}`}
                        className="text-sm cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <span>{topic.id}</span>
                        <span className="text-xs text-gray-500">
                          {topic.count}
                        </span>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Verified Filter */}
        {facets.verified.count > 0 && (
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verified === true}
                onCheckedChange={handleVerifiedToggle}
              />
              <Label
                htmlFor="verified"
                className="text-sm cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Verified only</span>
                <span className="text-xs text-gray-500">
                  ({facets.verified.count})
                </span>
              </Label>
            </div>
          </div>
        )}

        <Separator />

        {/* Near Me Filter */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="near-me"
              checked={locationEnabled}
              onCheckedChange={handleLocationToggle}
            />
            <Label
              htmlFor="near-me"
              className="text-sm cursor-pointer flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Near me</span>
            </Label>
          </div>
          {locationEnabled && filters.location && (
            <div className="mt-2 ml-6 text-xs text-gray-500">
              {userLocation && (
                <div>
                  Location: {filters.location.lat.toFixed(4)},{" "}
                  {filters.location.lng.toFixed(4)}
                </div>
              )}
              <div>Radius: {filters.location.radius || 10}km</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

