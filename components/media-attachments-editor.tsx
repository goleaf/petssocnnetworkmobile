"use client"

import { useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { BlogPostMedia } from "@/lib/types"
import {
  classifyMediaQuality,
  formatMediaDuration,
  isStreamingProvider,
  MEDIA_QUALITY_BADGE,
  type MediaQuality,
} from "@/lib/utils/media-quality"
import { Image as ImageIcon, Link2, Plus, Video, X } from "lucide-react"

type MediaStatus = "loading" | "loaded" | "error"

interface MediaMeta {
  status: MediaStatus
  width?: number
  height?: number
  duration?: number
  quality?: MediaQuality
  message?: string
}

interface MediaAttachmentsEditorProps {
  media: BlogPostMedia
  onChange: (media: BlogPostMedia) => void
  className?: string
}

export function MediaAttachmentsEditor({ media, onChange, className }: MediaAttachmentsEditorProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [imageMetadata, setImageMetadata] = useState<Record<string, MediaMeta>>({})
  const [videoMetadata, setVideoMetadata] = useState<Record<string, MediaMeta>>({})

  useEffect(() => {
    const activeUrls = new Set(media.images.filter(Boolean))

    setImageMetadata((previous) => {
      let changed = false
      const next = { ...previous }
      Object.keys(next).forEach((url) => {
        if (!activeUrls.has(url)) {
          delete next[url]
          changed = true
        }
      })
      return changed ? next : previous
    })

    const pendingUrls = media.images.filter((url) => url && !imageMetadata[url]) as string[]
    if (pendingUrls.length === 0) return

    let isMounted = true
    const controllers: HTMLImageElement[] = []

    pendingUrls.forEach((url) => {
      const image = new window.Image()
      controllers.push(image)

      setImageMetadata((previous) => ({
        ...previous,
        [url]: { status: "loading" },
      }))

      image.onload = () => {
        if (!isMounted) return
        const width = image.naturalWidth
        const height = image.naturalHeight
        setImageMetadata((previous) => ({
          ...previous,
          [url]: {
            status: "loaded",
            width,
            height,
            quality: classifyMediaQuality(width, height),
          },
        }))
      }

      image.onerror = () => {
        if (!isMounted) return
        setImageMetadata((previous) => ({
          ...previous,
          [url]: {
            status: "error",
            message: "Unable to load image metadata",
          },
        }))
      }

      image.src = url
    })

    return () => {
      isMounted = false
      controllers.forEach((image) => {
        image.onload = null
        image.onerror = null
      })
    }
  }, [media.images, imageMetadata])

  useEffect(() => {
    const activeUrls = new Set(media.videos.filter(Boolean))

    setVideoMetadata((previous) => {
      let changed = false
      const next = { ...previous }
      Object.keys(next).forEach((url) => {
        if (!activeUrls.has(url)) {
          delete next[url]
          changed = true
        }
      })
      return changed ? next : previous
    })

    const pendingUrls = media.videos.filter((url) => url && !videoMetadata[url]) as string[]
    if (pendingUrls.length === 0) return

    let isMounted = true
    const disposers: Array<() => void> = []

    pendingUrls.forEach((url) => {
      if (isStreamingProvider(url)) {
        setVideoMetadata((previous) => ({
          ...previous,
          [url]: {
            status: "loaded",
            quality: "unknown",
            message: "Streaming provider detected. Quality is controlled by the host platform.",
          },
        }))
        return
      }

      const video = document.createElement("video")
      try {
        video.crossOrigin = "anonymous"
      } catch {
        // Some providers block CORS; we'll still try to read metadata.
      }
      video.preload = "metadata"

      const handleLoadedMetadata = () => {
        if (!isMounted) return
        const width = video.videoWidth || undefined
        const height = video.videoHeight || undefined
        const duration = Number.isFinite(video.duration) ? video.duration : undefined
        setVideoMetadata((previous) => ({
          ...previous,
          [url]: {
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
        setVideoMetadata((previous) => ({
          ...previous,
          [url]: {
            status: "error",
            message: "Unable to load video metadata",
          },
        }))
      }

      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("error", handleError)

      setVideoMetadata((previous) => ({
        ...previous,
        [url]: { status: "loading" },
      }))

      try {
        video.src = url
        video.load()
      } catch {
        handleError()
      }

      disposers.push(() => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("error", handleError)
        video.src = ""
      })
    })

    return () => {
      isMounted = false
      disposers.forEach((dispose) => dispose())
    }
  }, [media.videos, videoMetadata])

  const lowQualityImageCount = useMemo(
    () =>
      media.images.filter((url) => {
        const meta = imageMetadata[url]
        return meta?.status === "loaded" && meta.quality === "sd"
      }).length,
    [media.images, imageMetadata]
  )

  const lowQualityVideoCount = useMemo(
    () =>
      media.videos.filter((url) => {
        const meta = videoMetadata[url]
        return meta?.status === "loaded" && meta.quality === "sd"
      }).length,
    [media.videos, videoMetadata]
  )

  const handleAddImage = () => {
    const url = imageUrl.trim()
    if (!url) return

    onChange({
      images: [...media.images, url],
      videos: [...media.videos],
      links: [...media.links],
    })
    setImageUrl("")
  }

  const handleRemoveImage = (index: number) => {
    const nextImages = media.images.filter((_, i) => i !== index)
    onChange({
      images: nextImages,
      videos: [...media.videos],
      links: [...media.links],
    })
  }

  const handleAddVideo = () => {
    const url = videoUrl.trim()
    if (!url) return

    onChange({
      images: [...media.images],
      videos: [...media.videos, url],
      links: [...media.links],
    })
    setVideoUrl("")
  }

  const handleRemoveVideo = (index: number) => {
    const nextVideos = media.videos.filter((_, i) => i !== index)
    onChange({
      images: [...media.images],
      videos: nextVideos,
      links: [...media.links],
    })
  }

  const handleAddLink = () => {
    const url = linkUrl.trim()
    const title = linkTitle.trim()
    if (!url) return

    onChange({
      images: [...media.images],
      videos: [...media.videos],
      links: [...media.links, title ? { url, title } : { url }],
    })
    setLinkUrl("")
    setLinkTitle("")
  }

  const handleRemoveLink = (index: number) => {
    const nextLinks = media.links.filter((_, i) => i !== index)
    onChange({
      images: [...media.images],
      videos: [...media.videos],
      links: nextLinks,
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-primary" />
          Photos
        </Label>
        <p className="text-xs text-muted-foreground">
          Add high-resolution image URLs (at least 1920×1080 recommended) for a crisp gallery experience.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://cdn.example.com/photo.jpg"
            className="sm:flex-1"
          />
          <Button type="button" onClick={handleAddImage} disabled={!imageUrl.trim()} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </div>

        {media.images.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {media.images.map((url, index) => {
              const meta = imageMetadata[url]
              const qualityConfig = MEDIA_QUALITY_BADGE[meta?.quality ?? "unknown"]

              return (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border bg-background/60">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={url}
                      alt={`Post attachment ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2 h-7 w-7"
                      onClick={() => handleRemoveImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2 text-xs">
                    {!meta || meta.status === "loading" ? (
                      <span className="text-muted-foreground">Analyzing quality…</span>
                    ) : null}
                    {meta?.status === "error" ? (
                      <span className="text-destructive">
                        {meta.message ?? "Unable to analyze image quality"}
                      </span>
                    ) : null}
                    {meta?.status === "loaded" ? (
                      <>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            qualityConfig.badgeClassName
                          )}
                        >
                          {qualityConfig.label}
                        </Badge>
                        {meta.width && meta.height ? (
                          <span className="text-muted-foreground font-medium">
                            {meta.width}×{meta.height}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  {meta?.status === "loaded" && meta.quality === "sd" ? (
                    <div className="border-t bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      We detected a resolution below 1920×1080. Upload a higher quality photo if available.
                    </div>
                  ) : null}
                  {meta?.status === "loaded" && meta.quality !== "sd" && meta.quality !== "unknown" ? (
                    <div className="border-t bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-700">
                      Looks great! This image will hold up nicely on large displays.
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {lowQualityImageCount > 0 ? (
          <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTitle>
              {lowQualityImageCount > 1 ? "Some images need attention" : "This image needs attention"}
            </AlertTitle>
            <AlertDescription>
              Add higher resolution photos (at least 1920×1080) to keep your gallery looking sharp.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Video className="h-4 w-4 text-primary" />
          Videos
        </Label>
        <p className="text-xs text-muted-foreground">
          Share hosted video URLs (MP4, Vimeo, YouTube). We&apos;ll capture resolution and duration when possible.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://cdn.example.com/video.mp4"
            className="sm:flex-1"
          />
          <Button type="button" onClick={handleAddVideo} disabled={!videoUrl.trim()} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </div>

        {media.videos.length > 0 && (
          <div className="space-y-3">
            {media.videos.map((url, index) => {
                    const meta = videoMetadata[url]
                    const qualityConfig = MEDIA_QUALITY_BADGE[meta?.quality ?? "unknown"]
                    const durationLabel = formatMediaDuration(meta?.duration)

              return (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border bg-background/60">
                  <div className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      Video {index + 1}
                    </Badge>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-sm text-primary hover:underline"
                    >
                      {url}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVideo(index)}
                      aria-label={`Remove video ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2 text-xs">
                    {!meta || meta.status === "loading" ? (
                      <span className="text-muted-foreground">Analyzing quality…</span>
                    ) : null}
                    {meta?.status === "error" ? (
                      <span className="text-destructive">
                        {meta.message ?? "Unable to analyze video quality"}
                      </span>
                    ) : null}
                    {meta?.status === "loaded" ? (
                      <>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            qualityConfig.badgeClassName
                          )}
                        >
                          {qualityConfig.label}
                        </Badge>
                        {meta.width && meta.height ? (
                          <span className="text-muted-foreground font-medium">
                            {meta.width}×{meta.height}
                          </span>
                        ) : null}
                        {durationLabel ? (
                          <span className="text-muted-foreground">Duration: {durationLabel}</span>
                        ) : null}
                        {meta.message && meta.quality === "unknown" ? (
                          <span className="text-muted-foreground">{meta.message}</span>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  {meta?.status === "loaded" && meta.quality === "sd" ? (
                    <div className="border-t bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      This video is below HD quality. Link a 1080p or higher source to keep playback crisp.
                    </div>
                  ) : null}
                  {meta?.status === "loaded" && meta.quality !== "sd" && meta.quality !== "unknown" ? (
                    <div className="border-t bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-700">
                      Great! Viewers will enjoy smooth, high-definition playback.
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {lowQualityVideoCount > 0 ? (
          <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTitle>
              {lowQualityVideoCount > 1 ? "Some videos are below HD" : "This video is below HD"}
            </AlertTitle>
            <AlertDescription>
              For the best viewing experience, link to 1080p or higher video sources when possible.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-primary" />
          Links
        </Label>
        <p className="text-xs text-muted-foreground">Highlight helpful resources or related articles.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com/article"
            className="sm:flex-[2]"
          />
          <Input
            value={linkTitle}
            onChange={(event) => setLinkTitle(event.target.value)}
            placeholder="Optional title"
            className="sm:flex-1"
          />
          <Button type="button" onClick={handleAddLink} disabled={!linkUrl.trim()} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </div>
        {media.links.length > 0 && (
          <div className="space-y-3">
            {media.links.map((link, index) => (
              <div key={`${link.url}-${index}`} className="overflow-hidden rounded-lg border bg-background/60">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5" />
                    Link {index + 1}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{link.title || link.url}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs text-primary hover:underline"
                    >
                      {link.url}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(index)}
                    aria-label={`Remove resource link ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
