"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { getOptimizedImageUrl, isCDNUrl } from "@/lib/performance/cdn"

interface LazyImageProps extends React.HTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  className?: string
  rounded?: boolean
  priority?: boolean
  sizes?: string
}

export function LazyImage({ src, alt, className, rounded = true, priority = false, sizes = '100vw', ...rest }: LazyImageProps) {
  const ref = useRef<HTMLImageElement | null>(null)
  const [inView, setInView] = useState(priority)
  const [loaded, setLoaded] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string>(() => {
    // Try to construct a low-quality preview URL if using CDN
    if (isCDNUrl(src)) {
      try { return getOptimizedImageUrl(src, { width: 24, quality: 10, format: 'jpg' }) } catch { return src }
    }
    return src
  })

  // Build responsive srcsets for multiple formats (medium quality for feed)
  const widths = [320, 640, 960, 1280, 1920]
  const srcsetAvif = isCDNUrl(src) ? widths.map((w) => `${getOptimizedImageUrl(src, { width: w, quality: 60, format: 'avif' })} ${w}w`).join(', ') : undefined
  const srcsetWebp = isCDNUrl(src) ? widths.map((w) => `${getOptimizedImageUrl(src, { width: w, quality: 60, format: 'webp' })} ${w}w`).join(', ') : undefined
  const srcsetJpg = isCDNUrl(src) ? widths.map((w) => `${getOptimizedImageUrl(src, { width: w, quality: 60, format: 'jpg' })} ${w}w`).join(', ') : undefined
  const defaultSrc = isCDNUrl(src) ? getOptimizedImageUrl(src, { width: 960, quality: 60, format: 'jpg' }) : src

  useEffect(() => {
    if (priority) { setInView(true); return }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => { try { io.disconnect() } catch {} }
  }, [priority])

  if (!inView) {
    // Render tiny preview until in view
    return (
      <img
        ref={ref}
        src={previewSrc}
        alt={alt}
        className={cn(
          "w-full h-auto object-cover",
          rounded && "rounded-lg",
          "scale-105 blur-sm",
          className,
        )}
        {...rest}
      />
    )
  }

  return (
    <picture>
      {srcsetAvif && <source type="image/avif" srcSet={srcsetAvif} sizes={sizes} />}
      {srcsetWebp && <source type="image/webp" srcSet={srcsetWebp} sizes={sizes} />}
      <img
        ref={ref}
        src={defaultSrc}
        srcSet={srcsetJpg}
        sizes={sizes}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-auto object-cover",
          rounded && "rounded-lg",
          !loaded && "scale-105 blur-sm",
          loaded && "transition-all duration-300 ease-out blur-0 scale-100",
          className,
        )}
        {...rest}
      />
    </picture>
  )
}

export default LazyImage
