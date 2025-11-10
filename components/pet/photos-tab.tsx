"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, X, Download, Play, Pause } from "lucide-react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LazyImage } from "@/components/feed/LazyImage"
import { cn } from "@/lib/utils"

interface PetPhoto {
  id: string
  url: string
  thumbnailUrl?: string
  optimizedUrl?: string
  caption?: string
  uploadedAt: string
  isPrimary: boolean
  order: number
}

interface PhotosTabProps {
  photos: PetPhoto[]
  petName: string
  canDownload?: boolean
  className?: string
}

export function PhotosTab({
  photos,
  petName,
  canDownload = true,
  className,
}: PhotosTabProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSlideshow, setIsSlideshow] = useState(false)
  const [slideshowInterval, setSlideshowInterval] = useState<NodeJS.Timeout | null>(null)

  // Sort photos by order
  const sortedPhotos = [...photos].sort((a, b) => a.order - b.order)

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    setIsSlideshow(false)
    if (slideshowInterval) {
      clearInterval(slideshowInterval)
      setSlideshowInterval(null)
    }
  }, [slideshowInterval])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1))
  }, [sortedPhotos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1))
  }, [sortedPhotos.length])

  const toggleSlideshow = useCallback(() => {
    if (isSlideshow) {
      // Stop slideshow
      setIsSlideshow(false)
      if (slideshowInterval) {
        clearInterval(slideshowInterval)
        setSlideshowInterval(null)
      }
    } else {
      // Start slideshow
      setIsSlideshow(true)
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1))
      }, 3000) // Auto-advance every 3 seconds
      setSlideshowInterval(interval)
    }
  }, [isSlideshow, slideshowInterval, sortedPhotos.length])

  const downloadPhoto = useCallback(async (photoUrl: string, photoId: string) => {
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${petName}-photo-${photoId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download photo:", error)
    }
  }, [petName])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      } else if (e.key === "Escape") {
        closeLightbox()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, goToPrevious, goToNext, closeLightbox])

  // Cleanup slideshow on unmount
  useEffect(() => {
    return () => {
      if (slideshowInterval) {
        clearInterval(slideshowInterval)
      }
    }
  }, [slideshowInterval])

  if (photos.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-muted-foreground text-center">
          No photos yet. Add some photos to showcase {petName}!
        </p>
      </div>
    )
  }

  const currentPhoto = sortedPhotos[currentIndex]

  return (
    <>
      {/* Photo Grid */}
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {sortedPhotos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "transition-transform hover:scale-[1.02]"
            )}
            aria-label={`View photo ${index + 1} of ${sortedPhotos.length}${
              photo.caption ? `: ${photo.caption}` : ""
            }`}
          >
            <LazyImage
              src={photo.thumbnailUrl || photo.optimizedUrl || photo.url}
              alt={photo.caption || `${petName} photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {photo.isPrimary && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                Primary
              </div>
            )}
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
          showCloseButton={false}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {currentIndex + 1} / {sortedPhotos.length}
                </p>
                {currentPhoto.caption && (
                  <p className="text-white/80 text-sm mt-1">{currentPhoto.caption}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Slideshow toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSlideshow}
                  className="text-white hover:bg-white/20"
                  aria-label={isSlideshow ? "Pause slideshow" : "Start slideshow"}
                >
                  {isSlideshow ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                {/* Download button */}
                {canDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadPhoto(currentPhoto.url, currentPhoto.id)}
                    className="text-white hover:bg-white/20"
                    aria-label="Download photo"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                )}
                {/* Close button */}
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    aria-label="Close lightbox"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </div>
            </div>

            {/* Main image */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-16">
              <div className="relative w-full h-full max-w-6xl max-h-[80vh]">
                <img
                  src={currentPhoto.optimizedUrl || currentPhoto.url}
                  alt={currentPhoto.caption || `${petName} photo ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
            </div>

            {/* Navigation arrows */}
            {sortedPhotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Thumbnail strip */}
            {sortedPhotos.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                  {sortedPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 rounded overflow-hidden",
                        "focus:outline-none focus:ring-2 focus:ring-white",
                        "transition-opacity",
                        currentIndex === index
                          ? "ring-2 ring-white opacity-100"
                          : "opacity-50 hover:opacity-75"
                      )}
                      aria-label={`Go to photo ${index + 1}`}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.optimizedUrl || photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
