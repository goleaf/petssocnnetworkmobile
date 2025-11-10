"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Loader2 } from "lucide-react"
import type { LocationStickerData } from "./types"

interface LocationStickerProps {
  onSelect: (data: LocationStickerData) => void
}

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
}

export function LocationSticker({ onSelect }: LocationStickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setPlaces([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Using our own API endpoint that wraps Google Places API
      const response = await fetch(
        `/api/places/search?q=${encodeURIComponent(query)}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to search places")
      }

      const data = await response.json()
      setPlaces(data.results || [])
    } catch (err) {
      setError("Failed to search places")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchPlaces(searchQuery)
  }

  const handleSelectPlace = (place: PlaceResult) => {
    const locationData: LocationStickerData = {
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location.lat,
      longitude: place.geometry?.location.lng,
      placeId: place.place_id,
    }
    onSelect(locationData)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <form onSubmit={handleSearch} className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-destructive p-4">
            {error}
          </div>
        )}

        {!loading && !error && places.length === 0 && searchQuery && (
          <div className="text-center text-sm text-muted-foreground p-4">
            No places found
          </div>
        )}

        {!loading && !error && places.length === 0 && !searchQuery && (
          <div className="text-center text-sm text-muted-foreground p-4">
            Search for a place to add to your story
          </div>
        )}

        {!loading && !error && places.length > 0 && (
          <div className="divide-y">
            {places.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelectPlace(place)}
                className="w-full p-3 hover:bg-accent transition-colors text-left flex items-start gap-3"
              >
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{place.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {place.formatted_address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
