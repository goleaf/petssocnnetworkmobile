"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { getOptimizedImageUrl, isCDNUrl } from "@/lib/performance/cdn"

interface AlbumLightboxProps {
  images: string[]
  startIndex?: number
  open: boolean
  onClose: () => void
  allowDownload?: boolean
}

export function AlbumLightbox({ images, startIndex = 0, open, onClose, allowDownload = true }: AlbumLightboxProps) {
  const [index, setIndex] = useState(startIndex)
  const [scale, setScale] = useState(1)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setIndex(startIndex)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === '+') zoomIn()
      if (e.key === '-') zoomOut()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [open, startIndex])

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25))
  const zoomOut = () => setScale((s) => Math.max(1, s - 0.25))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>

      <div className="relative w-full h-full max-w-6xl max-h-[92vh] p-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={prev}><ChevronLeft className="h-7 w-7" /></Button>
        )}

        <div
          className="h-full w-full flex items-center justify-center overflow-hidden"
          onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return
            const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
            if (Math.abs(dx) > 40) {
              if (dx > 0) prev(); else next()
            }
            touchStartX.current = null
          }}
        >
          {(() => {
            const src = images[index]
            if (isCDNUrl(src)) {
              const avif = getOptimizedImageUrl(src, { width: 2048, quality: 85, format: 'avif' })
              const webp = getOptimizedImageUrl(src, { width: 2048, quality: 85, format: 'webp' })
              const jpg = getOptimizedImageUrl(src, { width: 2048, quality: 85, format: 'jpg' })
              return (
                <picture>
                  <source type="image/avif" srcSet={avif} />
                  <source type="image/webp" srcSet={webp} />
                  <img
                    src={jpg}
                    alt={`Photo ${index+1}`}
                    className={cn("max-h-full max-w-full object-contain select-none", scale !== 1 && 'cursor-move')}
                    style={{ transform: `scale(${scale})` }}
                    draggable={false}
                  />
                </picture>
              )
            }
            return (
              <img
                src={src}
                alt={`Photo ${index+1}`}
                className={cn("max-h-full max-w-full object-contain select-none", scale !== 1 && 'cursor-move')}
                style={{ transform: `scale(${scale})` }}
                draggable={false}
              />
            )
          })()}
        </div>

        {images.length > 1 && (
          <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={next}><ChevronRight className="h-7 w-7" /></Button>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={zoomOut}><ZoomOut className="h-4 w-4 mr-1" />Zoom out</Button>
          <Button variant="secondary" size="sm" onClick={zoomIn}><ZoomIn className="h-4 w-4 mr-1" />Zoom in</Button>
          {allowDownload !== false && (
            <a href={images[index]} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md bg-white/10 text-white px-3 py-1.5 text-sm hover:bg-white/20">
              <Download className="h-4 w-4 mr-1" /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlbumLightbox
