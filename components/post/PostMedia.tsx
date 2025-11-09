"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { BlogPostMedia, MediaSettings } from "@/lib/types"
import { Play } from "lucide-react"
import LazyImage from "@/components/ui/lazy-image"
import { VideoPlayer } from "@/components/post/VideoPlayer"
import { useAuth } from "@/lib/auth"
import { getMediaSettings } from "@/lib/media-settings"
import { analyzeImageQuality } from "@/lib/utils/image-analysis"
import { AlbumLightbox } from "@/components/post/AlbumLightbox"
import { getPetById } from "@/lib/storage"

interface PostMediaProps {
  media: BlogPostMedia
  className?: string
}

// Basic streaming provider detection used to render inline embeds
const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{8,15})/i
const VIMEO_REGEX = /vimeo\.com\/(\d+)/i

function resolveVideoEmbed(url: string): { src: string; provider: "youtube" | "vimeo" } | null {
  const yt = url.match(YOUTUBE_REGEX)
  if (yt) return { src: `https://www.youtube.com/embed/${yt[1]}`, provider: "youtube" as const }
  const vm = url.match(VIMEO_REGEX)
  if (vm) return { src: `https://player.vimeo.com/video/${vm[1]}`, provider: "vimeo" as const }
  return null
}

export function PostMedia({ media, className }: PostMediaProps): JSX.Element | null {
  const { user } = useAuth()
  const [settings, setSettings] = React.useState<MediaSettings | null>(null)

  const imagesAll = React.useMemo(() => (media?.images || []).filter(Boolean).slice(0, 10), [media?.images])
  const videosAll = React.useMemo(() => (media?.videos || []).filter(Boolean), [media?.videos])

  const [images, setImages] = React.useState<string[]>(imagesAll)
  const [videos, setVideos] = React.useState<string[]>(videosAll)
  const [analysisPending, setAnalysisPending] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)

  React.useEffect(() => {
    if (user) setSettings(getMediaSettings(user.id))
    else setSettings(null)
  }, [user])

  // Re-evaluate filters when media or settings change
  React.useEffect(() => {
    let cancelled = false
    async function run() {
      if (!settings) {
        setImages(imagesAll)
        setVideos(videosAll)
        return
      }
      setAnalysisPending(true)
      try {
        // Filter images when requested
        if (settings.highQualityOnlyImages) {
          const checks = await Promise.all(
            imagesAll.map(async (url) => {
              try {
                const res = await analyzeImageQuality(url)
                const pass = res.score >= 60 && !res.isLowResolution && !res.isPoorLighting
                return pass ? url : null
              } catch {
                return null
              }
            })
          )
          if (!cancelled) setImages(checks.filter(Boolean) as string[])
        } else {
          if (!cancelled) setImages(imagesAll)
        }

        // Filter videos to HD+ when requested
        if (settings.videosOnlyHD) {
          const checks = await Promise.all(
            videosAll.map(async (url) => {
              // Allow streaming providers (adaptive bitrate) by default
              if (YOUTUBE_REGEX.test(url) || VIMEO_REGEX.test(url)) return url
              // Probe metadata via a temporary video element
              try {
                const v = document.createElement("video")
                v.preload = "metadata"
                const ok = await new Promise<boolean>((resolve) => {
                  const cleanup = () => {
                    v.onloadedmetadata = null
                    v.onerror = null
                    v.src = ""
                  }
                  v.onloadedmetadata = () => {
                    const w = v.videoWidth || 0
                    const h = v.videoHeight || 0
                    cleanup()
                    resolve(w >= 1920 && h >= 1080)
                  }
                  v.onerror = () => {
                    cleanup()
                    resolve(false)
                  }
                  v.src = url
                  try { v.load() } catch { /* noop */ }
                })
                return ok ? url : null
              } catch {
                return null
              }
            })
          )
          if (!cancelled) setVideos(checks.filter(Boolean) as string[])
        } else {
          if (!cancelled) setVideos(videosAll)
        }
      } finally {
        if (!cancelled) setAnalysisPending(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [imagesAll.join("|"), videosAll.join("|"), settings?.highQualityOnlyImages, settings?.videosOnlyHD])

  if ((images.length === 0 && videos.length === 0) || (!settings && imagesAll.length === 0 && videosAll.length === 0)) return null

  return (
    <div className={cn("space-y-3", className)}>
      {/* View All toggle for albums */}
      {images.length > 4 && (
        <div className="flex justify-end">
          <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Collapse' : 'View All'}
          </button>
        </div>
      )}
      {/* Videos first (modern player with autoplay-in-view) */}
      {videos.map((url, idx) => (
        <InlineVideo key={`${url}-${idx}`} url={url} media={media} />
      ))}

      {/* Images with responsive layouts */}
      {images.length > 0 ? (
        showAll ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((src, i) => {
              const tags = media.imageTags?.[src] || []
              return (
                <button key={`${src}-${i}`} type="button" className="relative" onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}>
                  <LazyImage src={src} alt={`Photo ${i+1}`} className="h-full w-full object-cover" />
                  {tags.length > 0 && (
                    <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                      {tags.slice(0,3).map((pid) => {
                        const pet = getPetById(pid)
                        return (
                          <span key={pid} className="px-1.5 py-0.5 rounded bg-black/40 text-white text-[10px]">@{pet?.name || 'pet'}</span>
                        )
                      })}
                    </div>
                  )}
                  {media.captions?.[src] && (
                    <div className="absolute bottom-1 left-1 right-1 text-[11px] text-white bg-black/40 rounded px-1 py-0.5 truncate">
                      {media.captions[src]}
                    </div>
                  )}
                </button>
              )})}
          </div>
        ) : images.length === 1 ? (
          <button type="button" className="relative overflow-hidden rounded-lg" onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}>
            <LazyImage src={images[0]} alt="Post media" className="w-full h-auto object-cover" />
          </button>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-2">
            {images.map((src, i) => (
              <button key={`${src}-${i}`} type="button" onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}>
                <LazyImage src={src} alt={`Post media ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : images.length === 3 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            <button type="button" onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}>
              <LazyImage src={images[0]} alt="Post media 1" className="col-span-1 row-span-2 h-full w-full object-cover" />
            </button>
            <button type="button" onClick={() => { setLightboxIndex(1); setLightboxOpen(true) }}>
              <LazyImage src={images[1]} alt="Post media 2" className="col-span-1 row-span-1 h-full w-full object-cover" />
            </button>
            <button type="button" onClick={() => { setLightboxIndex(2); setLightboxOpen(true) }}>
              <LazyImage src={images[2]} alt="Post media 3" className="col-span-1 row-span-1 h-full w-full object-cover" />
            </button>
          </div>
        ) : images.length === 4 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {images.slice(0, 4).map((src, i) => (
              <button key={`${src}-${i}`} type="button" onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}>
                <LazyImage src={src} alt={`Post media ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <SwipeCarousel images={images} onClickImage={(i) => { setLightboxIndex(i); setLightboxOpen(true) }} />
        )
      ) : null}

      {/* Captions and per-image pet tags under carousel (for single image or carousel mode) */}
      {images.length > 0 && !showAll && (
        <div className="space-y-1">
          {images.length === 1 && media.captions?.[images[0]] && (
            <div className="text-sm text-muted-foreground">{media.captions[images[0]]}</div>
          )}
          {images.length > 1 && (
            <div className="text-xs text-muted-foreground">{images.length} photos</div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <AlbumLightbox images={images} startIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} allowDownload={media.allowDownload !== false} />
    </div>
  )
}

function InlineVideo({ url, media }: { url: string; media?: BlogPostMedia }): JSX.Element {
  const [playing, setPlaying] = React.useState(false)
  const embed = resolveVideoEmbed(url)

  if (playing) {
    if (embed) {
      return (
        <div className="relative overflow-hidden rounded-lg">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={embed.src}
              title="Embedded video"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )
    }
    // Use our in-view player with lazy load and poster
    const sources = [{ src: url, quality: 'auto' as const }]
    return <VideoPlayer sources={sources} poster={media?.videoThumbnail} autoPlayInView={true} />
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative w-full overflow-hidden rounded-lg"
      aria-label="Play video"
    >
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {/* Placeholder with play overlay; without a poster image we show a neutral background */}
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Play className="h-10 w-10 text-white drop-shadow" />
        </div>
      </div>
    </button>
  )
}

function SwipeCarousel({ images, onClickImage }: { images: string[]; onClickImage?: (index: number) => void }): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = React.useState(0)

  const scrollTo = (i: number) => {
    const el = containerRef.current
    if (!el) return
    const target = el.children[i] as HTMLElement | undefined
    if (target) target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    setIndex(i)
  }

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const { scrollLeft, clientWidth } = el
    const i = Math.round(scrollLeft / clientWidth)
    if (i !== index) setIndex(i)
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-lg"
        style={{ scrollBehavior: "smooth" }}
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full flex-shrink-0 snap-center" style={{ minWidth: "100%" }}>
            <button type="button" className="w-full h-full" onClick={() => onClickImage?.(i)}>
              <img src={src} alt={`Post media ${i + 1}`} className="h-full w-full object-cover" />
            </button>
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              {i + 1}/{images.length}
            </div>
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollTo(Math.max(index - 1, 0)) }}
            className="pointer-events-auto ml-1 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollTo(Math.min(index + 1, images.length - 1)) }}
            className="pointer-events-auto mr-1 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
            aria-label="Next image"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default PostMedia
