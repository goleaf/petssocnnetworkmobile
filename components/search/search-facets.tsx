"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Facets {
  species?: Record<string, number>
  tags?: Record<string, number>
  postTypes?: Record<string, number>
}

interface SearchFacetsProps {
  facets: Facets
  activeFilters: {
    species?: string[]
    tags?: string[]
    postTypes?: string[]
    radius?: number
  }
  onFilterChange: (filters: {
    species?: string[]
    tags?: string[]
    postTypes?: string[]
    radius?: number
  }) => void
  showRadiusFilter?: boolean
  maxRadius?: number
}

export function SearchFacets({
  facets,
  activeFilters,
  onFilterChange,
  showRadiusFilter = false,
  maxRadius = 50,
}: SearchFacetsProps) {
  const [radius, setRadius] = useState(activeFilters.radius || maxRadius)

  const toggleSpecies = (species: string) => {
    const current = activeFilters.species || []
    const updated = current.includes(species)
      ? current.filter((s) => s !== species)
      : [...current, species]
    onFilterChange({ ...activeFilters, species: updated.length > 0 ? updated : undefined })
  }

  const toggleTag = (tag: string) => {
    const current = activeFilters.tags || []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    onFilterChange({ ...activeFilters, tags: updated.length > 0 ? updated : undefined })
  }

  const togglePostType = (type: string) => {
    const current = activeFilters.postTypes || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    onFilterChange({ ...activeFilters, postTypes: updated.length > 0 ? updated : undefined })
  }

  const clearFilters = () => {
    onFilterChange({})
    setRadius(maxRadius)
  }

  const hasActiveFilters =
    (activeFilters.species && activeFilters.species.length > 0) ||
    (activeFilters.tags && activeFilters.tags.length > 0) ||
    (activeFilters.postTypes && activeFilters.postTypes.length > 0) ||
    (activeFilters.radius && activeFilters.radius < maxRadius)

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs">
                Clear all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeFilters.species && activeFilters.species.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeFilters.species.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 capitalize">
                    {s}
                    <button
                      onClick={() => toggleSpecies(s)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {activeFilters.tags && activeFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeFilters.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button
                      onClick={() => toggleTag(t)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {activeFilters.postTypes && activeFilters.postTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeFilters.postTypes.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button
                      onClick={() => togglePostType(t)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {activeFilters.radius && activeFilters.radius < maxRadius && (
              <Badge variant="secondary" className="gap-1">
                Within {activeFilters.radius} km
                <button
                  onClick={() => {
                    setRadius(maxRadius)
                    onFilterChange({ ...activeFilters, radius: undefined })
                  }}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {facets.species && Object.keys(facets.species).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Species</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(facets.species)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([species, count]) => (
                <div key={species} className="flex items-center space-x-2">
                  <Checkbox
                    id={`species-${species}`}
                    checked={activeFilters.species?.includes(species) || false}
                    onCheckedChange={() => toggleSpecies(species)}
                  />
                  <Label
                    htmlFor={`species-${species}`}
                    className="text-sm font-normal flex-1 cursor-pointer capitalize"
                  >
                    {species} <span className="text-muted-foreground">({count})</span>
                  </Label>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {facets.tags && Object.keys(facets.tags).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(facets.tags)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 15)
              .map(([tag, count]) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={activeFilters.tags?.includes(tag) || false}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <Label htmlFor={`tag-${tag}`} className="text-sm font-normal flex-1 cursor-pointer">
                    {tag} <span className="text-muted-foreground">({count})</span>
                  </Label>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {facets.postTypes && Object.keys(facets.postTypes).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Post Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(facets.postTypes)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={activeFilters.postTypes?.includes(type) || false}
                    onCheckedChange={() => togglePostType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm font-normal flex-1 cursor-pointer">
                    {type} <span className="text-muted-foreground">({count})</span>
                  </Label>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {showRadiusFilter && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Near Me</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Radius</span>
                <span className="font-medium">{radius} km</span>
              </div>
              <Slider
                value={[radius]}
                onValueChange={(value) => {
                  const newRadius = value[0]
                  setRadius(newRadius)
                  onFilterChange({ ...activeFilters, radius: newRadius })
                }}
                min={1}
                max={maxRadius}
                step={1}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

