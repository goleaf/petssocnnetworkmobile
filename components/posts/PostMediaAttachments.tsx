"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Image as ImageIcon, Video as VideoIcon, Plus, X, Edit2, GripVertical } from "lucide-react"
import { PhotoEditor } from "@/components/ui/photo-editor"
import { useAuth } from "@/lib/auth"
import { PetTagSelector } from "@/components/posts/PetTagSelector"
import { formatMediaDuration } from "@/lib/utils/media-quality"
import { formatCacheSize } from "@/lib/sync-manager"

type SelectedImage = { id: string; src: string; caption?: string; taggedPetIds?: string[] }
type SelectedVideo = { src: string; size: number; duration?: number; compress: boolean }

export interface PostMediaValue {
  images: SelectedImage[]
  video: SelectedVideo | null
  allowDownload?: boolean
  videoThumbnail?: string
  videoCaptionsVtt?: string
}

interface PostMediaAttachmentsProps {
  value: PostMediaValue
  onChange: (value: PostMediaValue) => void
  className?: string
}

export function PostMediaAttachments({ value, onChange, className }: PostMediaAttachmentsProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<{ open: boolean; imageId?: string; src?: string }>({ open: false })
  const maxPhotos = 10

  const hasVideo = !!value.video
  const photoCount = value.images.length

  const canAddMorePhotos = !hasVideo && photoCount < maxPhotos
  const canAddVideo = !hasVideo && photoCount === 0

  const pickFiles = () => fileInputRef.current?.click()

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const images: SelectedImage[] = []
    let video: SelectedVideo | null = value.video

    const list = Array.from(files)
    const imageFiles = list.filter((f) => f.type.startsWith('image/'))
    const videoFiles = list.filter((f) => f.type.startsWith('video/'))

    if (videoFiles.length > 0) {
      // Only one video allowed
      if (!canAddVideo) return
      const vf = videoFiles[0]
      const url = URL.createObjectURL(vf)
      const v: SelectedVideo = { src: url, size: vf.size, compress: false }
      // Read metadata for duration
      const temp = document.createElement('video')
      temp.preload = 'metadata'
      temp.onloadedmetadata = () => {
        v.duration = temp.duration
        const limitSeconds = (user?.isPro ? 30 : 5) * 60
        if ((v.duration || 0) > limitSeconds) {
          alert(`Video is too long. Limit is ${Math.floor(limitSeconds/60)} minutes.`)
          URL.revokeObjectURL(url)
          return
        }
        URL.revokeObjectURL(temp.src)
        onChange({ images: value.images, video: v })
      }
      temp.onerror = () => {
        onChange({ images: value.images, video: v })
      }
      temp.src = url
      return
    }

    if (imageFiles.length > 0) {
      if (!canAddMorePhotos) return
      const slots = Math.max(0, maxPhotos - photoCount)
      const toTake = imageFiles.slice(0, slots)
      let pending = toTake.length
      toTake.forEach((f) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const src = String(e.target?.result || '')
          images.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, src })
          pending -= 1
          if (pending === 0) {
            onChange({ images: [...value.images, ...images], video: value.video })
          }
        }
        reader.readAsDataURL(f)
      })
    }
  }

  // Drag & drop reordering
  const [dragId, setDragId] = useState<string | null>(null)
  const onDragStart = (id: string) => setDragId(id)
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const from = value.images.findIndex((i) => i.id === dragId)
    const to = value.images.findIndex((i) => i.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...value.images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange({ images: next, video: value.video })
    setDragId(null)
  }

  const removeImage = (id: string) => {
    const next = value.images.filter((i) => i.id !== id)
    onChange({ images: next, video: value.video })
  }

  const removeVideo = () => {
    onChange({ images: value.images, video: null })
  }

  const openEditor = (img: SelectedImage) => {
    setEditing({ open: true, imageId: img.id, src: img.src })
  }

  const applyEdit = (editedSrc: string) => {
    if (!editing.imageId) return
    const next = value.images.map((i) => (i.id === editing.imageId ? { ...i, src: editedSrc } : i))
    onChange({ images: next, video: value.video })
    setEditing({ open: false })
  }

  const updateCaption = (id: string, caption: string) => {
    const next = value.images.map((i) => (i.id === id ? { ...i, caption: caption.slice(0, 200) } : i))
    onChange({ images: next, video: value.video })
  }

  const [taggingFor, setTaggingFor] = useState<SelectedImage | null>(null)
  const applyTags = (petIds: string[]) => {
    if (!taggingFor) return
    const next = value.images.map((i) => (i.id === taggingFor.id ? { ...i, taggedPetIds: petIds } : i))
    onChange({ images: next, video: value.video, allowDownload: value.allowDownload })
    setTaggingFor(null)
  }

  const estimatedCompressedSize = useMemo(() => {
    const v = value.video
    if (!v) return 0
    if (!v.compress) return 0
    // Rough estimate: 45% of original size
    return Math.round(v.size * 0.45)
  }, [value.video?.compress, value.video?.size])

  return (
    <div className={cn("space-y-3", className)}>
      {/* Add button */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={pickFiles} disabled={!canAddMorePhotos && !canAddVideo}>
          <Plus className="h-4 w-4 mr-2" /> Add Photos/Videos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={canAddVideo ? "image/*,video/*" : "image/*"}
          multiple={canAddMorePhotos}
          capture
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {!canAddMorePhotos && !hasVideo && <span className="text-xs text-muted-foreground">Max 10 photos</span>}
        {hasVideo && <span className="text-xs text-muted-foreground">Remove video to add photos</span>}
        {photoCount > 0 && <span className="text-xs text-muted-foreground">Drag to reorder</span>}
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="allow-dl" className="text-xs">Allow downloads</Label>
          <Switch id="allow-dl" checked={value.allowDownload !== false} onCheckedChange={(v) => onChange({ ...value, allowDownload: Boolean(v) })} />
        </div>
      </div>

      {/* Thumbnails grid for photos */}
      {value.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.images.map((img) => (
            <div
              key={img.id}
              className={cn("group relative overflow-hidden rounded-md border", dragId === img.id ? 'ring-2 ring-primary' : '')}
              draggable
              onDragStart={() => onDragStart(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(img.id)}
            >
              <div className="relative aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="Selected" className="absolute inset-0 h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                  onClick={() => removeImage(img.id)}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="absolute top-1 left-1 h-7 px-2 rounded bg-black/50 text-white text-xs flex items-center gap-1"
                  onClick={() => setTaggingFor(img)}
                >
                  Tag Pets
                </button>
                <button
                  type="button"
                  className="absolute top-1 left-1 h-7 px-2 rounded bg-black/50 text-white text-xs flex items-center gap-1"
                  onClick={() => openEditor(img)}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <div className="absolute bottom-1 right-1 text-white text-xs bg-black/40 rounded px-1 py-0.5 hidden group-hover:block">
                  <GripVertical className="inline h-3 w-3 mr-1" /> Drag
                </div>
              </div>
              <div className="p-2 border-t">
                <Input
                  value={img.caption || ""}
                  onChange={(e) => updateCaption(img.id, e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="h-8 text-xs"
                  maxLength={200}
                />
                <div className="text-[10px] text-right text-muted-foreground mt-1">{(img.caption?.length || 0)} / 200</div>
                {img.taggedPetIds && img.taggedPetIds.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {img.taggedPetIds.map((pid) => (
                      <span key={pid} className="px-1.5 py-0.5 rounded-full bg-accent text-[10px]">@{pid}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video preview */}
      {value.video && (
        <div className="rounded-md border overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            <VideoIcon className="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium flex items-center gap-2">
                Video
                <span className="text-xs text-muted-foreground">{formatMediaDuration(value.video.duration)}</span>
                <span className="text-xs text-muted-foreground">{formatCacheSize(value.video.size)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Preview only; upload happens when posting.</div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={removeVideo} aria-label="Remove video">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="compress" className="text-sm">Compress large video</Label>
              <Switch id="compress" checked={value.video.compress} onCheckedChange={(v) => onChange({ images: value.images, video: { ...value.video!, compress: v } })} />
            </div>
            {value.video.compress && (
              <div className="text-xs text-muted-foreground">Estimated final size: {formatCacheSize(estimatedCompressedSize)}</div>
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => {
                try {
                  const vid = document.createElement('video')
                  vid.crossOrigin = 'anonymous'
                  vid.preload = 'metadata'
                  vid.src = value.video!.src
                  vid.onloadeddata = () => {
                    try {
                      const canvas = document.createElement('canvas')
                      canvas.width = vid.videoWidth
                      canvas.height = vid.videoHeight
                      const ctx = canvas.getContext('2d')!
                      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
                      const dataUrl = canvas.toDataURL('image/png')
                      onChange({ ...value, videoThumbnail: dataUrl })
                    } catch {}
                  }
                } catch {}
              }}>Use current frame as thumbnail</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const vtt = window.prompt('Paste WebVTT subtitles (optional):')
                if (typeof vtt === 'string') onChange({ ...value, videoCaptionsVtt: vtt })
              }}>Edit Subtitles</Button>
            </div>
            {value.videoThumbnail && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Thumbnail preview</div>
                <img src={value.videoThumbnail} alt="Video thumbnail" className="h-28 rounded border" />
              </div>
            )}
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <video className="absolute inset-0 h-full w-full" controls src={value.video.src} />
            </div>
          </div>
        </div>
      )}

      {/* Editor modal */}
      <PhotoEditor
        imageSrc={editing.src || ''}
        isOpen={editing.open}
        onClose={() => setEditing({ open: false })}
        onSave={applyEdit}
      />
      {taggingFor && (
        <PetTagSelector open={true} onOpenChange={() => setTaggingFor(null)} selected={taggingFor.taggedPetIds || []} onChange={applyTags} />
      )}
    </div>
  )
}

export default PostMediaAttachments
