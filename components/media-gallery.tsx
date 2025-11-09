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
import { useAuth } from "@/components/auth/auth-provider"
import type { MediaSettings } from "@/lib/types"
import { getMediaSettings, resolveShouldAutoplayVideos } from "@/lib/media-settings"
import { getOptimizedImageUrl } from "@/lib/performance/cdn"
import { isLikelyCellular } from "@/lib/utils/network"
import type { CaptionLanguagePreference } from "@/lib/types"

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

function appendCaptionParams(
  baseSrc: string,
  provider: "youtube" | "vimeo" | "tiktok" | "other",
  settings?: MediaSettings | null,
): string {
  if (!settings) return baseSrc
  const showCaptions = settings.showCaptions ?? true
  const lang = (settings.captionLanguage ?? "auto") as CaptionLanguagePreference

  try {
    const url = new URL(baseSrc)
    if (provider === "youtube") {
      if (showCaptions) url.searchParams.set("cc_load_policy", "1")
      if (lang && lang !== "auto") url.searchParams.set("cc_lang_pref", lang)
    } else if (provider === "vimeo") {
      if (showCaptions && lang && lang !== "auto") url.searchParams.set("texttrack", lang)
    }
    return url.toString()
  } catch {
    return baseSrc
  }
}

export function MediaGallery({
  media,
  mode = "full",
  className,
  enableLightbox = true,
  caption,
}: MediaGalleryProps) {
  const { user } = useAuth()
  const [mediaSettings, setMediaSettings] = useState<MediaSettings | null>(null)
  const allowAutoplayVideos = mediaSettings ? resolveShouldAutoplayVideos(mediaSettings) : true
  const showFlashWarnings = mediaSettings?.flashWarnings ?? true

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
  const [cellularOverride, setCellularOverride] = useState(false)
  const [gifPlayMap, setGifPlayMap] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (user) {
      setMediaSettings(getMediaSettings(user.id))
    }
  }, [user])

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

  const cellularLikely = isLikelyCellular() === true
  const shouldBlockMedia = Boolean(mediaSettings && cellularLikely && mediaSettings.cellularDataUsage === "minimal" && !cellularOverride)
  const reducedQuality = Boolean(mediaSettings && cellularLikely && mediaSettings.cellularDataUsage === "reduced")

  const renderThumbnail = (
    item: GalleryItem,
    index: number,
    overlayCount = 0,
    extraClassName?: string
  ) => {
    const meta = metadata[index]
    const quality = meta?.quality ?? "unknown"
    const qualityConfig = MEDIA_QUALITY_BADGE[quality]
    const isGif = item.type === "image" && /\.gif(\?|$)/i.test(item.url)
    const shouldShowGifStatic = Boolean(mediaSettings && isGif && !mediaSettings.autoPlayGifs)

    if (shouldBlockMedia) {
      return (
        <div
          className={cn(
            "relative flex min-h-32 items-center justify-center overflow-hidden rounded-lg border bg-muted text-center",
            extraClassName,
          )}
        >
          <div className="space-y-2 p-4">
            <div className="text-sm font-medium">Media blocked on cellular</div>
            <div className="text-xs text-muted-foreground">Your data setting is Minimal. Load once?</div>
            <div className="mt-2">
              <button
                type="button"
                className="rounded bg-primary px-3 py-1.5 text-primary-foreground"
                onClick={() => setCellularOverride(true)}
              >
                Load media
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <button
        type="button"
        data-testid={`media-thumb-${index}`}
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
              <Image
                src={
                  shouldShowGifStatic
                    ? getOptimizedImageUrl(item.url, { format: "jpg", quality: reducedQuality ? 60 : 80 })
                    : reducedQuality
                    ? getOptimizedImageUrl(item.url, { quality: 60 })
                    : item.url
                }
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
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
            ) : shouldShowGifStatic ? (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                <Play className="h-3 w-3" />
                GIF
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

  // Basic heuristic to guess flashing-risk content by URL/caption
  const likelyFlashing = (item: GalleryItem): boolean => {
    const hay = `${item.type}:${item.url}:${caption ?? ""}`
    // Prefer explicit content flag when provided
    if (item.type === "video" && (media as any)?.videoSafety?.[item.url]?.flashing === true) {
      return true
    }
    return /flash|strobe|flicker|blink|rapid\s+light/i.test(hay)
  }

  const [ackFlash, setAckFlash] = useState(false)

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
                {(() => {
                  if (shouldBlockMedia) {
                    return (
                      <div className="flex h-full w-full items-center justify-center bg-black/70 text-center">
                        <div>
                          <div className="mb-2 text-sm">Media blocked on cellular (Minimal)</div>
                          <button
                            type="button"
                            className="rounded bg-white/90 px-3 py-1.5 text-black hover:bg-white"
                            onClick={() => setCellularOverride(true)}
                          >
                            Load media
                          </button>
                        </div>
                      </div>
                    )
                  }
                  if (lightboxItem.type === "image") {
                    const isGif = /\.gif(\?|$)/i.test(lightboxItem.url)
                    const shouldStatic = Boolean(mediaSettings && isGif && !mediaSettings.autoPlayGifs && !gifPlayMap[activeIndex])
                    if (shouldStatic) {
                      const preview = getOptimizedImageUrl(lightboxItem.url, { format: "jpg", quality: reducedQuality ? 60 : 80 })
                      return (
                        <div className="relative h-full w-full">
                          <Image src={preview} alt="" fill className="object-contain" priority unoptimized />
                          <button
                            type="button"
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur hover:bg-white/30"
                            onClick={() => setGifPlayMap((m) => ({ ...m, [activeIndex]: true }))}
                          >
                            <span className="inline-flex items-center gap-2 text-sm font-semibold">
                              <Play className="h-4 w-4" /> Play GIF
                            </span>
                          </button>
                        </div>
                      )
                    }
                    const src = reducedQuality
                      ? getOptimizedImageUrl(lightboxItem.url, { quality: 70 })
                      : lightboxItem.url
                    if (isGif) {
                      return <img src={src} alt="" className="h-full w-full object-contain" />
                    }
                    return <Image src={src} alt="" fill className="object-contain" priority unoptimized />
                  }
                  if (lightboxItem.embed) {
                    return (
                      <iframe
                        src={appendCaptionParams(lightboxItem.embed.src, lightboxItem.embed.provider, mediaSettings)}
                        className="h-full w-full"
                        title="Embedded video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  }
                  return (
                    <VideoWithPrefs
                      src={lightboxItem.url}
                      autoPlay={allowAutoplayVideos && !reducedQuality && !(showFlashWarnings && !ackFlash && likelyFlashing(lightboxItem))}
                      showCaptions={mediaSettings?.showCaptions ?? true}
                      captionLanguage={(mediaSettings?.captionLanguage ?? "auto") as CaptionLanguagePreference}
                      audioDescriptions={mediaSettings?.audioDescriptions ?? false}
                    />
                  )
                })()}
              </AspectRatio>
              {lightboxItem.type === "video" && showFlashWarnings && !ackFlash && likelyFlashing(lightboxItem) ? (
                <div
                  data-testid="flash-warning-overlay"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center"
                >
                  <div className="text-sm font-semibold text-white">Warning: This video may contain flashing lights.</div>
                  <div className="text-xs text-white/80">Viewer discretion advised (epilepsy protection).</div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      data-testid="btn-ack-flash-warning"
                      onClick={() => setAckFlash(true)}
                      className="bg-white text-black hover:bg-white/90"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              ) : null}
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

function VideoWithPrefs({
  src,
  autoPlay,
  showCaptions,
  captionLanguage,
  audioDescriptions,
}: {
  src: string
  autoPlay: boolean
  showCaptions: boolean
  captionLanguage: CaptionLanguagePreference
  audioDescriptions: boolean
}) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!videoEl) return
    try {
      const tracks = (videoEl as any).textTracks as TextTrackList | undefined
      if (!tracks) return

      // Reset all to hidden first
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = "disabled"
      }

      // Prefer audio description track when requested
      if (audioDescriptions) {
        for (let i = 0; i < tracks.length; i++) {
          const t = tracks[i]
          const label = (t as any).label?.toLowerCase?.() ?? ""
          if (t.kind === "descriptions" || /description|audio\s*desc/i.test(label)) {
            t.mode = "showing"
            return
          }
        }
      }

      // Otherwise handle captions/subtitles when enabled
      if (showCaptions) {
        let selected: TextTrack | null = null
        for (let i = 0; i < tracks.length; i++) {
          const t = tracks[i]
          if (t.kind === "captions" || t.kind === "subtitles") {
            const lang = (t as any).language?.toLowerCase?.()
            if (captionLanguage !== "auto" && lang && lang.startsWith(captionLanguage)) {
              selected = t
              break
            }
            // Fallback to the first captions track
            if (!selected) selected = t
          }
        }
        if (selected) selected.mode = "showing"
      }
    } catch {
      // noop
    }
  }, [videoEl, showCaptions, captionLanguage, audioDescriptions])

  return (
    <video
      ref={setVideoEl}
      src={src}
      controls
      autoPlay={autoPlay}
      crossOrigin="anonymous"
      className="h-full w-full object-contain"
    />
  )
}
