"use client"

import { useState, useEffect } from "react"
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer"
import { cn } from "@/lib/utils"
import {
  getOptimizedImageUrl,
  generateSrcSet,
  IMAGE_SIZES,
} from "@/lib/utils/image-optimization"

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  sizes?: string
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
}

/**
 * ResponsiveImage component with WebP/AVIF support and JPEG fallback
 * Uses picture element for maximum browser compatibility
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 720px, 1080px",
  objectFit = "cover",
}: ResponsiveImageProps) {
  const [ref, isVisible] = useIntersectionObserver({
    rootMargin: "200px",
    freezeOnceVisible: true,
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority)

  useEffect(() => {
    if (isVisible && !shouldLoad) {
      setShouldLoad(true)
    }
  }, [isVisible, shouldLoad])

  // Generate srcsets for different formats
  const avifSrcSet = generateSrcSet(src, [
    IMAGE_SIZES.small,
    IMAGE_SIZES.medium,
    IMAGE_SIZES.large,
  ])
  const webpSrcSet = generateSrcSet(src, [
    IMAGE_SIZES.small,
    IMAGE_SIZES.medium,
    IMAGE_SIZES.large,
  ])
  const jpegSrcSet = generateSrcSet(src, [
    IMAGE_SIZES.small,
    IMAGE_SIZES.medium,
    IMAGE_SIZES.large,
  ])

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      style={style}
    >
      {shouldLoad ? (
        <picture>
          {/* AVIF format - best compression */}
          <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
          
          {/* WebP format - good compression, wide support */}
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
          
          {/* JPEG fallback - universal support */}
          <img
            src={getOptimizedImageUrl(src, width, height, "jpeg")}
            srcSet={jpegSrcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              className
            )}
            style={{
              objectFit,
              width: width ? `${width}px` : "100%",
              height: height ? `${height}px` : "auto",
            }}
            onLoad={() => setIsLoaded(true)}
          />
        </picture>
      ) : (
        // Placeholder while not loaded
        <div
          className="bg-muted animate-pulse"
          style={{
            width: width ? `${width}px` : "100%",
            height: height ? `${height}px` : "auto",
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
        />
      )}
    </div>
  )
}
