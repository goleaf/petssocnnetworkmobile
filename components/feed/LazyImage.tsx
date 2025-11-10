"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer"
import { cn } from "@/lib/utils"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  sizes?: string
  blurDataURL?: string
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  style,
  priority = false,
  sizes,
  blurDataURL,
}: LazyImageProps) {
  const [ref, isVisible] = useIntersectionObserver({
    rootMargin: "200px", // Load images 200px before they enter viewport
    freezeOnceVisible: true,
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | undefined>(
    priority ? src : undefined
  )

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src)
    }
  }, [isVisible, src, imageSrc])

  // Generate blur placeholder if not provided
  const placeholder = blurDataURL
    ? "blur"
    : "empty"

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} style={style}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          quality={85}
        />
      ) : (
        // Blur placeholder while image hasn't loaded
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            fill ? "w-full h-full" : ""
          )}
          style={fill ? undefined : { width, height }}
        />
      )}
    </div>
  )
}
