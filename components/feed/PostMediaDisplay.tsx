"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LazyImage } from "./LazyImage"
import { LazyVideo } from "./LazyVideo"
import {
  generateSrcSet,
  generateSizesAttribute,
  generateBlurDataURL,
} from "@/lib/utils/image-optimization"

interface MediaItem {
  id: string
  type: "photo" | "video"
  url: string
  thumbnail?: string
}

interface PostMediaDisplayProps {
  media: MediaItem[]
  compact?: boolean
}

export function PostMediaDisplay({ media, compact = false }: PostMediaDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (media.length === 0) return null

  // Single image - full width
  if (media.length === 1 && media[0].type === "photo") {
    const sizes = generateSizesAttribute([
      { maxWidth: "640px", size: "100vw" },
      { maxWidth: "1024px", size: "720px" },
    ])

    return (
      <div className="relative w-full rounded-lg overflow-hidden mb-3">
        <LazyImage
          src={media[0].url}
          alt="Post image"
          width={720}
          height={480}
          className="w-full h-auto object-cover"
          style={{ maxHeight: compact ? "300px" : "600px" }}
          sizes={sizes}
          blurDataURL={generateBlurDataURL()}
        />
      </div>
    )
  }

  // Single video
  if (media.length === 1 && media[0].type === "video") {
    return (
      <div className="relative w-full rounded-lg overflow-hidden mb-3">
        <LazyVideo
          src={media[0].url}
          thumbnail={media[0].thumbnail}
          alt="Post video"
          className="w-full"
          style={{ maxHeight: "600px" }}
          controls
        />
      </div>
    )
  }

  // Multiple images - grid layout
  if (media.length === 2) {
    const sizes = generateSizesAttribute([
      { maxWidth: "640px", size: "50vw" },
      { maxWidth: "1024px", size: "360px" },
    ])

    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden mb-3">
        {media.map((item) => (
          <div key={item.id} className="relative aspect-square">
            <LazyImage
              src={item.url}
              alt="Post image"
              fill
              className="object-cover"
              sizes={sizes}
              blurDataURL={generateBlurDataURL()}
            />
          </div>
        ))}
      </div>
    )
  }

  if (media.length === 3) {
    const sizesLarge = generateSizesAttribute([
      { maxWidth: "640px", size: "100vw" },
      { maxWidth: "1024px", size: "720px" },
    ])
    const sizesSmall = generateSizesAttribute([
      { maxWidth: "640px", size: "50vw" },
      { maxWidth: "1024px", size: "360px" },
    ])

    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden mb-3">
        <div className="relative aspect-square col-span-2">
          <LazyImage
            src={media[0].url}
            alt="Post image"
            fill
            className="object-cover"
            sizes={sizesLarge}
            blurDataURL={generateBlurDataURL()}
          />
        </div>
        {media.slice(1).map((item) => (
          <div key={item.id} className="relative aspect-square">
            <LazyImage
              src={item.url}
              alt="Post image"
              fill
              className="object-cover"
              sizes={sizesSmall}
              blurDataURL={generateBlurDataURL()}
            />
          </div>
        ))}
      </div>
    )
  }

  if (media.length === 4) {
    const sizes = generateSizesAttribute([
      { maxWidth: "640px", size: "50vw" },
      { maxWidth: "1024px", size: "360px" },
    ])

    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden mb-3">
        {media.map((item) => (
          <div key={item.id} className="relative aspect-square">
            <LazyImage
              src={item.url}
              alt="Post image"
              fill
              className="object-cover"
              sizes={sizes}
              blurDataURL={generateBlurDataURL()}
            />
          </div>
        ))}
      </div>
    )
  }

  // More than 4 images - carousel
  const sizes = generateSizesAttribute([
    { maxWidth: "640px", size: "100vw" },
    { maxWidth: "1024px", size: "720px" },
  ])

  return (
    <div className="relative rounded-lg overflow-hidden mb-3">
      <div className="relative aspect-video">
        <LazyImage
          src={media[currentIndex].url}
          alt={`Post image ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes={sizes}
          blurDataURL={generateBlurDataURL()}
        />
      </div>

      {/* Navigation */}
      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1))}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1))}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {media.length}
          </div>
        </>
      )}
    </div>
  )
}
