"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, MapPin, Download, Trash2, Eye } from "lucide-react"
import { getPlacePhotos, getPlaces, getUsers } from "@/lib/storage"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

export default function PhotoGalleryPage() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState(getPlacePhotos())
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const places = getPlaces()
  const users = getUsers()

  useEffect(() => {
    setPhotos(getPlacePhotos())
  }, [])

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return
    
    // Remove photo from photos array
    const updatedPhotos = photos.filter((p) => p.id !== photoId)
    setPhotos(updatedPhotos)
    
    // TODO: Implement actual deletion in storage
    alert("Photo deleted successfully")
  }

  const getPlaceName = (placeId: string) => {
    const place = places.find((p) => p.id === placeId)
    return place?.name || "Unknown Place"
  }

  const getUploaderName = (uploaderId: string) => {
    const uploader = users.find((u) => u.id === uploaderId)
    return uploader?.username || "Unknown User"
  }

  if (photos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Photo Gallery</h1>
          <p className="text-muted-foreground">Browse all place photos</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground">There are no photos in the gallery.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Photo Gallery</h1>
        <p className="text-muted-foreground">Browse all place photos</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative h-64 w-full overflow-hidden">
              <Image
                src={photo.url}
                alt={photo.caption || "Place photo"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Link href={`/places/${photo.placeId}`}>
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-1" />
                    View Place
                  </Button>
                </Link>
                {user && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Link href={`/places/${photo.placeId}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium">{getPlaceName(photo.placeId)}</span>
                </Link>
              </div>
              {photo.caption && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{photo.caption}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>by @{getUploaderName(photo.uploadedById)}</span>
                <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Preview Modal would go here */}
    </div>
  )
}

