"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { MapPin, CheckCircle, Clock, X, Plus, ImageIcon } from "lucide-react"
import { getPlaceById, getPlacePhotosByPlaceId, getUsers } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"

export default function PlaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [place, setPlace] = useState<ReturnType<typeof getPlaceById>>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof params.id === "string") {
      const foundPlace = getPlaceById(params.id)
      setPlace(foundPlace)
      setLoading(false)
    }
  }, [params.id])

  const photos = place ? getPlacePhotosByPlaceId(place.id) : []
  const users = getUsers()

  const getModerationStatusBadge = (status: typeof place.moderationStatus) => {
    if (!status) return null
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
            Pending Review
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p className="text-center">Loading...</p>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackButton onClick={() => router.back()} label="Back to Places" className="mb-4" />
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Place not found</h3>
            <p className="text-muted-foreground mb-4">The place you're looking for doesn't exist or has been removed.</p>
            <Link href="/places">
              <Button>Browse All Places</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton onClick={() => router.back()} label="Back to Places" className="mb-4" />

      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-bold">{place.name}</h1>
          {getModerationStatusBadge(place.moderationStatus)}
        </div>
        <p className="text-muted-foreground flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {place.address}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-2">{place.address}</span>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Coordinates: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{place.amenities.length}</div>
            <div className="flex flex-wrap gap-2">
              {place.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{photos.length}</div>
            <p className="text-sm text-muted-foreground">Uploaded photos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {place.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary">
                {amenity}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Rules & Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {place.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-muted-foreground">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Photos</h2>
          {user && place.moderationStatus === "approved" && (
            <Link href={`/places/${place.id}/photos/add`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
            </Link>
          )}
        </div>

        {photos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos yet. Be the first to add one!</p>
              {user && place.moderationStatus === "approved" && (
                <Link href={`/places/${place.id}/photos/add`}>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Photo
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {photos.map((photo) => {
              const uploader = users.find((u) => u.id === photo.uploadedById)
              return (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image src={photo.url} alt={photo.caption || "Place photo"} fill className="object-cover" />
                  </div>
                  {photo.caption && (
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{photo.caption}</p>
                      {uploader && (
                        <p className="text-xs text-muted-foreground mt-2">
                          by {uploader.fullName}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
