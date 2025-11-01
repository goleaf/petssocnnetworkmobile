"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AspectRatio } from "@radix-ui/react-aspect-ratio"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { BlogPostMedia } from "@/lib/types"
import {
  classifyMediaQuality,
  formatMediaDuration,
  isStreamingProvider,
  MEDIA_QUALITY_BADGE,
  type MediaQuality,
} from "@/lib/utils/media-quality"
import { ChevronLeft, ChevronRight, Image as ImageIcon, Play, X } from "lucide-react"

type GalleryItem =
  | {
      type: "image"
      url: string
    }
  | {
      type: "video"
      url: string
      embed?: { src: string; provider: "youtube" | "vimeo" | "tiktok" | "other" }
    }

type MediaStatus = "loading" | "loaded" | "error"

interface MediaMeta {
  status: MediaStatus
  width?: number
  height?: number
  duration?: number
  quality?: MediaQuality
}

interface MediaGalleryProps {
  media: BlogPostMedia
  mode?: "full" | "compact"
  className?: string
  enableLightbox?: boolean
  caption?: string
}

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{8,15})/i
const VIMEO_REGEX = /vimeo\.com\/(\d+)/i
const TIKTOK_REGEX = /tiktok\.com\/(@[\w.-]+\/video\/\d+)/i

function resolveVideoEmbed(url: string) {
  const youtubeMatch = url.match(YOUTUBE_REGEX)
  if (youtubeMatch) {
    return { src: `https://www.youtube.com/embed/${youtubeMatch[1]}`, provider: "youtube" as const }
  }

  const vimeoMatch = url.match(VIMEO_REGEX)
  if (vimeoMatch) {
    return { src: `https://player.vimeo.com/video/${vimeoMatch[1]}`, provider: "vimeo" as const }
  }

  const tiktokMatch = url.match(TIKTOK_REGEX)
  if (tiktokMatch) {
    // TikTok embeds require their widget; fall back to original URL in an iframe.
    return { src: `https://www.tiktok.com/embed/${tiktokMatch[1]}`, provider: "tiktok" as const }
  }

  return null
}

export function MediaGallery({
  media,
  mode = "full",
  className,
  enableLightbox = true,
  caption,
}: MediaGalleryProps) {
  const items: GalleryItem[] = useMemo(() => {
    const imageItems: GalleryItem[] = media.images
      .filter((url) => typeof url === "string" && url.trim().length > 0)
      .map((url) => ({ type: "image", url }))

    const videoItems: GalleryItem[] = media.videos
      .filter((url) => typeof url === "string" && url.trim().length > 0)
      .map((url) => {
        const trimmed = url.trim()
        const embed = resolveVideoEmbed(trimmed)
        return embed
          ? { type: "video", url: trimmed, embed }
          : { type: "video", url: trimmed }
      })

    return [...imageItems, ...videoItems]
  }, [media.images, media.videos])

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [metadata, setMetadata] = useState<Record<number, MediaMeta>>({})

  useEffect(() => {
    setMetadata((previous) => {
      let changed = false
      const next: Record<number, MediaMeta> = {}
      items.forEach((_, index) => {
        if (previous[index]) {
          next[index] = previous[index]
        } else {
          changed = true
        }
      })
      return changed ? next : previous
    })
  }, [items])

  useEffect(() => {
    let isMounted = true
    const disposers: Array<() => void> = []

    items.forEach((item, index) => {
      if (metadata[index]) {
        return
      }

      if (item.type === "image") {
        const image = new window.Image()
        const cleanup = () => {
          image.onload = null
          image.onerror = null
        }

        setMetadata((previous) => ({
          ...previous,
          [index]: { status: "loading" },
        }))

        image.onload = () => {
          if (!isMounted) return
          const width = image.naturalWidth
          const height = image.naturalHeight
          setMetadata((previous) => ({
            ...previous,
            [index]: {
              status: "loaded",
              width,
              height,
              quality: classifyMediaQuality(width, height),
            },
          }))
        }

        image.onerror = () => {
          if (!isMounted) return
          setMetadata((previous) => ({
            ...previous,
            [index]: {
              status: "error",
            },
          }))
        }

        image.src = item.url
        disposers.push(cleanup)
        return
      }

      if (item.type === "video" && isStreamingProvider(item.url)) {
        setMetadata((previous) => ({
          ...previous,
          [index]: {
            status: "loaded",
            quality: "unknown",
          },
        }))
        return
      }

      if (item.type === "video") {
        const video = document.createElement("video")
        try {
          video.crossOrigin = "anonymous"
        } catch {
          // Ignore cross-origin errors; we'll still attempt to read metadata.
        }
        video.preload = "metadata"

        const handleLoadedMetadata = () => {
          if (!isMounted) return
          const width = video.videoWidth || undefined
          const height = video.videoHeight || undefined
          const duration = Number.isFinite(video.duration) ? video.duration : undefined
          setMetadata((previous) => ({
            ...previous,
            [index]: {
              status: "loaded",
              width,
              height,
              duration,
              quality: classifyMediaQuality(width, height),
            },
          }))
        }

        const handleError = () => {
          if (!isMounted) return
          setMetadata((previous) => ({
            ...previous,
            [index]: {
              status: "error",
            },
          }))
        }

        video.addEventListener("loadedmetadata", handleLoadedMetadata)
        video.addEventListener("error", handleError)

        setMetadata((previous) => ({
          ...previous,
          [index]: { status: "loading" },
        }))

        try {
          video.src = item.url
          video.load()
        } catch {
          handleError()
        }

        disposers.push(() => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("error", handleError)
          video.src = ""
        })
      }
    })

    return () => {
      isMounted = false
      disposers.forEach((dispose) => dispose())
    }
  }, [items, metadata])

  if (items.length === 0) {
    return null
  }

  const openLightbox = (index: number) => {
    if (!enableLightbox) return
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length)
  }

  const renderThumbnail = (
    item: GalleryItem,
    index: number,
    overlayCount = 0,
    extraClassName?: string
  ) => {
    const meta = metadata[index]
    const quality = meta?.quality ?? "unknown"
    const qualityConfig = MEDIA_QUALITY_BADGE[quality]

    return (
      <button
        type="button"
        onClick={() => openLightbox(index)}
        disabled={!enableLightbox}
        className={cn(
          "group relative block overflow-hidden rounded-lg border bg-background transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          !enableLightbox && "cursor-default",
          extraClassName
        )}
      >
        <AspectRatio ratio={16 / 9}>
          <div className="absolute inset-0 bg-muted">
            {item.type === "image" ? (
              <Image src={item.url} alt="" fill className="object-cover" unoptimized />
            ) : item.embed ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                <Play className="h-10 w-10 opacity-80" />
              </div>
            ) : (
              <video
                className="h-full w-full object-cover"
                src={item.url}
                muted
                playsInline
                preload="metadata"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/20 opacity-0 transition group-hover:opacity-100" />
            {item.type === "video" ? (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                <Play className="h-3 w-3" />
                Video
              </div>
            ) : null}
            {meta?.status === "loaded" && quality !== "unknown" ? (
              <Badge
                variant="secondary"
                className={cn(
                  "absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-wide drop-shadow-sm",
                  qualityConfig.badgeClassName
                )}
              >
                {qualityConfig.label}
              </Badge>
            ) : null}
          </div>
        </AspectRatio>
        {overlayCount > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
            <span className="text-lg font-semibold">+{overlayCount} more</span>
          </div>
        ) : null}
      </button>
    )
  }

  const lightboxItem = items[activeIndex]
  const lightboxMeta = metadata[activeIndex]
  const lightboxQuality = lightboxMeta?.quality ?? "unknown"
  const lightboxQualityConfig = MEDIA_QUALITY_BADGE[lightboxQuality]
  const durationLabel = lightboxMeta?.duration ? formatMediaDuration(lightboxMeta.duration) : ""

  return (
    <div className={cn("space-y-3", className)}>
      {mode === "compact" ? (
        <>
          {renderThumbnail(items[0], 0, items.length - 1 > 0 ? items.length - 1 : 0)}
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item, index) =>
            renderThumbnail(item, index, 0, index === 0 && items.length > 1 ? "md:col-span-2" : undefined)
          )}
        </div>
      )}

      {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}

      {enableLightbox ? (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl gap-0 overflow-hidden border-none bg-black/90 p-0 text-white shadow-2xl sm:max-w-4xl" showCloseButton={false}>
            <div className="relative bg-black">
              <AspectRatio ratio={16 / 9}>
                {lightboxItem.type === "image" ? (
                  <Image
                    src={lightboxItem.url}
                    alt=""
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                  />
                ) : lightboxItem.embed ? (
                  <iframe
                    src={lightboxItem.embed.src}
                    className="h-full w-full"
                    title="Embedded video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={lightboxItem.url}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                )}
              </AspectRatio>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/80"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              {items.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/70 px-5 py-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">
                  {activeIndex + 1} of {items.length}
                </span>
                {lightboxItem.type === "video" ? (
                  <span className="flex items-center gap-1 text-xs text-white/80">
                    <Play className="h-3.5 w-3.5" />
                    Video
                    {durationLabel ? <span>• {durationLabel}</span> : null}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-white/80">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Photo
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                {lightboxMeta?.status === "loaded" && (lightboxMeta.width || lightboxMeta.height) ? (
                  <span>
                    {lightboxMeta.width ?? "—"}×{lightboxMeta.height ?? "—"} px
                  </span>
                ) : null}
                {lightboxMeta?.status === "loaded" && lightboxQuality !== "unknown" ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border-transparent text-[10px] font-semibold uppercase tracking-wide",
                      lightboxQualityConfig.badgeClassName
                    )}
                  >
                    {lightboxQualityConfig.label}
                  </Badge>
                ) : null}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
