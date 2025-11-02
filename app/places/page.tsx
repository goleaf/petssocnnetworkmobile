"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Search, Plus, CheckCircle, Clock, X, Fence, Droplets, Dog, Grid, Map as MapIcon } from "lucide-react"
import Link from "next/link"
import { getApprovedPlaces } from "@/lib/storage"
import type { Place } from "@/lib/types"
import { PlaceMap } from "@/components/places/PlaceMap"

export default function PlacesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [filters, setFilters] = useState({
    fenced: false,
    smallDogArea: false,
    waterStation: false,
  })
  const places = getApprovedPlaces()

  const filteredPlaces = places.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFenced = !filters.fenced || place.fenced
    const matchesSmallDogArea = !filters.smallDogArea || place.smallDogArea
    const matchesWaterStation = !filters.waterStation || place.waterStation
    
    return matchesSearch && matchesFenced && matchesSmallDogArea && matchesWaterStation
  })

  const getModerationStatusBadge = (status: Place["moderationStatus"]) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Pet-Friendly Places</h1>
          <p className="text-muted-foreground">Discover dog parks, trails, and pet-friendly locations near you</p>
        </div>
        <Link href="/places/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Place
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        {/* Search and View Toggle */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search places by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="gap-2"
            >
              <MapIcon className="h-4 w-4" />
              Map
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-sm font-semibold">Filters:</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fenced"
                  checked={filters.fenced}
                  onCheckedChange={(checked) => setFilters({ ...filters, fenced: checked === true })}
                />
                <label htmlFor="fenced" className="text-sm cursor-pointer flex items-center gap-1">
                  <Fence className="h-3 w-3" />
                  Fenced
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="smallDogArea"
                  checked={filters.smallDogArea}
                  onCheckedChange={(checked) => setFilters({ ...filters, smallDogArea: checked === true })}
                />
                <label htmlFor="smallDogArea" className="text-sm cursor-pointer flex items-center gap-1">
                  <Dog className="h-3 w-3" />
                  Small Dog Area
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="waterStation"
                  checked={filters.waterStation}
                  onCheckedChange={(checked) => setFilters({ ...filters, waterStation: checked === true })}
                />
                <label htmlFor="waterStation" className="text-sm cursor-pointer flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  Water Station
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No places found</h3>
          <p className="text-muted-foreground mb-4">
            {places.length === 0 ? "Be the first to add a pet-friendly place!" : "Try adjusting your search query."}
          </p>
          {places.length === 0 && (
            <Link href="/places/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Place
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === "map" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:order-2">
            <CardHeader>
              <CardTitle>Map View</CardTitle>
              <CardDescription>{filteredPlaces.length} places shown</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPlaces.length > 0 ? (
                <PlaceMap
                  lat={filteredPlaces[0].lat}
                  lng={filteredPlaces[0].lng}
                  name={filteredPlaces[0].name}
                  address={filteredPlaces[0].address}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No places to display
                </div>
              )}
            </CardContent>
          </Card>
          <div className="md:order-1 space-y-4 max-h-[600px] overflow-y-auto">
            {filteredPlaces.map((place) => (
              <Card key={place.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/places/${place.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{place.name}</CardTitle>
                      {getModerationStatusBadge(place.moderationStatus)}
                    </div>
                    <CardDescription className="flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="text-xs line-clamp-1">{place.address}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(place.fenced || place.smallDogArea || place.waterStation) && (
                      <div className="flex flex-wrap gap-1.5">
                        {place.fenced && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Fence className="h-3 w-3" />
                            Fenced
                          </Badge>
                        )}
                        {place.smallDogArea && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Dog className="h-3 w-3" />
                            Small
                          </Badge>
                        )}
                        {place.waterStation && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Droplets className="h-3 w-3" />
                            Water
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {place.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {place.amenities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{place.amenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{place.name}</CardTitle>
                  {getModerationStatusBadge(place.moderationStatus)}
                </div>
                <CardDescription className="flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{place.address}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(place.fenced || place.smallDogArea || place.waterStation) && (
                  <div className="flex flex-wrap gap-1.5">
                    {place.fenced && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Fence className="h-3 w-3" />
                        Fenced
                      </Badge>
                    )}
                    {place.smallDogArea && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Dog className="h-3 w-3" />
                        Small Dog Area
                      </Badge>
                    )}
                    {place.waterStation && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Droplets className="h-3 w-3" />
                        Water Station
                      </Badge>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Amenities</h4>
                  <div className="flex flex-wrap gap-1">
                    {place.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {place.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{place.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                {place.hazards.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Hazards
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {place.hazards.slice(0, 2).map((hazard, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-orange-300 text-orange-700">
                          {hazard}
                        </Badge>
                      ))}
                      {place.hazards.length > 2 && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          +{place.hazards.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Rules</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {place.rules.slice(0, 2).map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="mt-0.5">•</span>
                        <span className="line-clamp-1">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {place.parkingInfo && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <span className="font-semibold">Parking: </span>
                    <span className="line-clamp-2">{place.parkingInfo}</span>
                  </div>
                )}
                <Link href={`/places/${place.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
