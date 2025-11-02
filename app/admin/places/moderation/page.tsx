"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  Map as MapIcon,
  Fence,
  Droplets,
  Dog,
  Car,
} from "lucide-react"
import {
  getPlaces,
  getPlacePhotos,
  getUserById,
  updatePlace,
  deletePlacePhoto,
  getPlacePhotosByPlaceId,
} from "@/lib/storage"
import Image from "next/image"
import Link from "next/link"
import type { Place, PlacePhoto } from "@/lib/types"
import { PlaceMap } from "@/components/places/PlaceMap"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PlacesModerationPage() {
  const { user } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [photos, setPhotos] = useState<PlacePhoto[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<"places" | "photos">("places")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const pageSize = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setPlaces(getPlaces())
    setPhotos(getPlacePhotos())
  }

  const handleApprovePlace = (placeId: string) => {
    updatePlace(placeId, { moderationStatus: "approved" })
    loadData()
  }

  const handleRejectPlace = (placeId: string) => {
    if (!confirm("Are you sure you want to reject this place?")) return
    updatePlace(placeId, { moderationStatus: "rejected" })
    loadData()
  }

  const handleApprovePhoto = (photoId: string) => {
    // Photos don't have moderation status in the current model
    // But we can implement this if needed
    alert("Photo approved")
  }

  const handleRejectPhoto = (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return
    deletePlacePhoto(photoId)
    loadData()
  }

  const filteredPlaces = places.filter((place) => {
    const matchesStatus = statusFilter === "all" || place.moderationStatus === statusFilter
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredPhotos = photos.filter((photo) => {
    const place = places.find((p) => p.id === photo.placeId)
    const matchesSearch =
      photo.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getPlaceName = (placeId: string) => {
    const place = places.find((p) => p.id === placeId)
    return place?.name || "Unknown Place"
  }

  const getUploaderName = (uploaderId: string) => {
    const uploader = getUserById(uploaderId)
    return uploader?.username || "Unknown User"
  }

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
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
    }
  }

  const paginatedPlaces = filteredPlaces.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedPhotos = filteredPhotos.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(
    (filterType === "places" ? filteredPlaces.length : filteredPhotos.length) / pageSize
  )

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access moderation tools.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Places & Photos Moderation</h1>
        <p className="text-muted-foreground">Review and moderate places and photos</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Places</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {places.filter((p) => p.moderationStatus === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Places</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {places.filter((p) => p.moderationStatus === "approved").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-[200px]">
              <Select
                value={filterType}
                onValueChange={(value: "places" | "photos") => setFilterType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="places">Places</SelectItem>
                  <SelectItem value="photos">Photos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterType === "places" && (
              <div className="w-[200px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "pending" | "approved" | "rejected") =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>{filterType === "places" ? "Places" : "Photos"}</CardTitle>
          <CardDescription>
            {filterType === "places"
              ? `${filteredPlaces.length} places found`
              : `${filteredPhotos.length} photos found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filterType === "places" ? (
            paginatedPlaces.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No places found</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {paginatedPlaces.map((place) => {
                  const placePhotos = getPlacePhotosByPlaceId(place.id)
                  const hasHazards = place.hazards && place.hazards.length > 0

                  return (
                    <Card key={place.id} className="overflow-hidden">
                      <div className="grid md:grid-cols-2">
                        {/* Map Preview */}
                        <div className="h-48 md:h-auto">
                          <PlaceMap
                            lat={place.lat}
                            lng={place.lng}
                            name={place.name}
                            address={place.address}
                            className="h-full"
                          />
                        </div>

                        {/* Place Details */}
                        <div className="p-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {getModerationStatusBadge(place.moderationStatus)}
                                </div>
                                <h3 className="font-semibold mt-1">{place.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="line-clamp-2">{place.address}</span>
                                </div>
                              </div>
                            </div>

                            {/* Feature Icons */}
                            <div className="flex flex-wrap gap-2">
                              {place.fenced && (
                                <Badge variant="outline" className="text-xs">
                                  <Fence className="h-3 w-3 mr-1" />
                                  Fenced
                                </Badge>
                              )}
                              {place.smallDogArea && (
                                <Badge variant="outline" className="text-xs">
                                  <Dog className="h-3 w-3 mr-1" />
                                  Small Dog Area
                                </Badge>
                              )}
                              {place.waterStation && (
                                <Badge variant="outline" className="text-xs">
                                  <Droplets className="h-3 w-3 mr-1" />
                                  Water
                                </Badge>
                              )}
                              {place.parkingInfo && (
                                <Badge variant="outline" className="text-xs">
                                  <Car className="h-3 w-3 mr-1" />
                                  Parking
                                </Badge>
                              )}
                              {hasHazards && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Hazards
                                </Badge>
                              )}
                            </div>

                            {/* Amenities */}
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">Amenities:</div>
                              <div className="flex flex-wrap gap-1">
                                {place.amenities.slice(0, 4).map((amenity, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                                {place.amenities.length > 4 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{place.amenities.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Photo Count */}
                            {placePhotos.length > 0 && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {placePhotos.length} photo{placePhotos.length !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedPlace(place)
                                setShowDetailsDialog(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            {place.moderationStatus === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectPlace(place.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Reject
                                </Button>
                                <Button variant="default" size="sm" onClick={() => handleApprovePlace(place.id)}>
                                  Approve
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )
          ) : paginatedPhotos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No photos found</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedPhotos.map((photo) => {
                const place = places.find((p) => p.id === photo.placeId)
                return (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative h-64 w-full group">
                      <Image
                        src={photo.url}
                        alt={photo.caption || "Place photo"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                        <MapPin className="h-3 w-3" />
                        <Link href={`/places/${photo.placeId}`} className="hover:underline">
                          {place?.name || "Unknown Place"}
                        </Link>
                      </div>
                      {photo.caption && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{photo.caption}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pb-3 border-b">
                        <span>by @{getUploaderName(photo.uploadedById)}</span>
                        <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApprovePhoto(photo.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => handleRejectPhoto(photo.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Place Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPlace && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getModerationStatusBadge(selectedPlace.moderationStatus)}
                  {selectedPlace.name}
                </DialogTitle>
                <DialogDescription>{selectedPlace.address}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Map Preview */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapIcon className="h-4 w-4" />
                    Location Map
                  </h4>
                  <PlaceMap
                    lat={selectedPlace.lat}
                    lng={selectedPlace.lng}
                    name={selectedPlace.name}
                    address={selectedPlace.address}
                    className="h-64"
                  />
                </div>

                {/* Feature Flags */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Features
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Fence className={`h-4 w-4 ${selectedPlace.fenced ? "text-green-600" : "text-muted-foreground"}`} />
                      <span className={`text-sm ${selectedPlace.fenced ? "" : "text-muted-foreground"}`}>
                        Fenced
                      </span>
                      {selectedPlace.fenced && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Dog className={`h-4 w-4 ${selectedPlace.smallDogArea ? "text-green-600" : "text-muted-foreground"}`} />
                      <span className={`text-sm ${selectedPlace.smallDogArea ? "" : "text-muted-foreground"}`}>
                        Small Dog Area
                      </span>
                      {selectedPlace.smallDogArea && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Droplets className={`h-4 w-4 ${selectedPlace.waterStation ? "text-green-600" : "text-muted-foreground"}`} />
                      <span className={`text-sm ${selectedPlace.waterStation ? "" : "text-muted-foreground"}`}>
                        Water Station
                      </span>
                      {selectedPlace.waterStation && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Car className={`h-4 w-4 ${selectedPlace.parkingInfo ? "text-green-600" : "text-muted-foreground"}`} />
                      <span className={`text-sm ${selectedPlace.parkingInfo ? "" : "text-muted-foreground"}`}>
                        Parking
                      </span>
                      {selectedPlace.parkingInfo && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
                    </div>
                  </div>
                </div>

                {/* Amenities Checklist */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Amenities ({selectedPlace.amenities.length})
                  </h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {selectedPlace.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hazard Flags */}
                {selectedPlace.hazards && selectedPlace.hazards.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Hazard Flags ({selectedPlace.hazards.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedPlace.hazards.map((hazard: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-red-900">{hazard}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {selectedPlace.rules && selectedPlace.rules.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Rules ({selectedPlace.rules.length})</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedPlace.rules.map((rule, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Parking Info */}
                {selectedPlace.parkingInfo && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Parking Information
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedPlace.parkingInfo}</p>
                  </div>
                )}

                {/* Photo Moderation */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Photos ({getPlacePhotosByPlaceId(selectedPlace.id).length})
                  </h4>
                  {getPlacePhotosByPlaceId(selectedPlace.id).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {getPlacePhotosByPlaceId(selectedPlace.id).map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="relative h-32 w-full rounded overflow-hidden border">
                            <Image
                              src={photo.url}
                              alt={photo.caption || "Place photo"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{photo.caption}</p>
                          )}
                          <div className="flex gap-1 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-7"
                              onClick={() => {
                                handleApprovePhoto(photo.id)
                                setShowDetailsDialog(false)
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-7 text-red-600 hover:text-red-700"
                              onClick={() => {
                                handleRejectPhoto(photo.id)
                                setShowDetailsDialog(false)
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No photos submitted yet</p>
                  )}
                </div>

                {/* Actions */}
                {selectedPlace.moderationStatus === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => {
                        handleRejectPlace(selectedPlace.id)
                        setShowDetailsDialog(false)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Place
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        handleApprovePlace(selectedPlace.id)
                        setShowDetailsDialog(false)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Place
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

