"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface PhotoViewerProps {
  photos: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  petName?: string
}

export function PhotoViewer({ photos, initialIndex = 0, isOpen, onClose, petName }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when viewer is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, photos.length, onClose])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  if (!isOpen || photos.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Photo Container */}
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        {/* Previous Button */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
            onClick={(e) => {
              e.stopPropagation()
              handlePrevious()
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Current Photo */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            src={photos[currentIndex] || "/placeholder.svg"}
            alt={petName ? `${petName} photo ${currentIndex + 1}` : `Photo ${currentIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  )
}

