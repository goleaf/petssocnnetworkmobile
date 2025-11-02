"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cacheImage, getCachedImage } from "@/lib/offline-cache"

interface CachedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export function CachedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  onLoad,
  onError,
}: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadImage() {
      // Try to get from cache first
      const cachedBlob = await getCachedImage(src)
      if (cachedBlob && isMounted) {
        const url = URL.createObjectURL(cachedBlob)
        setImageSrc(url)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch and cache it
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error("Failed to fetch image")

        const blob = await response.blob()
        await cacheImage(src, blob)

        if (isMounted) {
          const url = URL.createObjectURL(blob)
          setImageSrc(url)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to load image:", error)
        if (isMounted) {
          // Fallback to original src
          setImageSrc(src)
          setIsLoading(false)
          onError?.()
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
      // Clean up blob URLs
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [src])

  if (!imageSrc) {
    return null
  }

  // Next.js Image doesn't optimize blob URLs, so use unoptimized for cached images
  const isBlobUrl = imageSrc.startsWith("blob:")

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes}
        quality={quality}
        onLoad={onLoad}
        onError={onError}
        unoptimized={isBlobUrl}
      />
    )
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 600}
      height={height || 400}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={quality}
      onLoad={onLoad}
      onError={onError}
      unoptimized={isBlobUrl}
    />
  )
}

