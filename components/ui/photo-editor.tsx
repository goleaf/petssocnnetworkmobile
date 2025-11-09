"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import Cropper, { Area, Point } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, RotateCw, RotateCcw, Check, X as XIcon, Sun, Contrast as ContrastIcon, Image as ImageIcon } from "lucide-react"
import { getCroppedImg } from "@/lib/utils/image-crop"

interface PhotoEditorProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onSave: (editedImage: string) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function PhotoEditor({ imageSrc, isOpen, onClose, onSave }: PhotoEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [preset, setPreset] = useState<'none' | 'bw' | 'vintage' | 'warm' | 'cool'>('none')
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("")
  const cropContainerRef = useRef<HTMLDivElement | null>(null)
  const instructionsId = "photo-editor-instructions"

  const onCropComplete = useCallback((_: Area, area: Area) => setCroppedAreaPixels(area), [])

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setIsProcessing(true)
    try {
      const edited = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, { brightness, contrast, preset: preset === 'none' ? undefined : preset })
      onSave(edited)
      handleClose()
    } catch (e) {
      console.error('Photo edit failed', e)
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setIsProcessing(false)
    setBrightness(1)
    setContrast(1)
    setPreset('none')
    setPreviewDataUrl("")
    onClose()
  }

  // Live preview
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!imageSrc || !croppedAreaPixels) return
      try {
        const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, { brightness, contrast, preset: preset === 'none' ? undefined : preset })
        if (!cancelled) setPreviewDataUrl(dataUrl)
      } catch {}
    }
    run()
    return () => { cancelled = true }
  }, [imageSrc, croppedAreaPixels, rotation, brightness, contrast, preset])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={cropContainerRef}
            className="relative w-full h-[420px] bg-muted rounded-lg overflow-hidden focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Photo cropping area"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown + - [ ] Enter R"
            aria-describedby={instructionsId}
            onKeyDown={(e) => {
              const NUDGE = e.shiftKey ? 12 : 6
              if (e.key === 'ArrowLeft') { e.preventDefault(); setCrop((c) => ({ x: c.x - NUDGE, y: c.y })) }
              else if (e.key === 'ArrowRight') { e.preventDefault(); setCrop((c) => ({ x: c.x + NUDGE, y: c.y })) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setCrop((c) => ({ x: c.x, y: c.y - NUDGE })) }
              else if (e.key === 'ArrowDown') { e.preventDefault(); setCrop((c) => ({ x: c.x, y: c.y + NUDGE })) }
              else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom((z) => Math.min(MAX_ZOOM, z + 0.1)) }
              else if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom((z) => Math.max(MIN_ZOOM, z - 0.1)) }
              else if (e.key.toLowerCase() === 'r') { e.preventDefault(); setRotation((r) => (r + 90) % 360) }
              else if (e.key === 'Enter') { e.preventDefault(); handleSave() }
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={false}
              restrictPosition={false}
              style={{ containerStyle: { width: '100%', height: '100%', position: 'relative' } }}
            />
          </div>
          <p id={instructionsId} className="text-xs text-muted-foreground">
            Keyboard: Arrows to nudge, Shift+Arrows for larger steps, [+]/[-] to zoom, R to rotate, Enter to apply.
          </p>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" /> Zoom
                </label>
                <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider value={[zoom]} min={MIN_ZOOM} max={MAX_ZOOM} step={0.1} onValueChange={(v) => setZoom(v[0])} aria-label="Zoom" />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4" /> Rotate
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setRotation((r) => (r - 90 + 360) % 360)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Sun className="h-4 w-4" /> Brightness
              </div>
              <Slider value={[brightness]} min={0.5} max={1.5} step={0.05} onValueChange={(v) => setBrightness(v[0])} aria-label="Brightness" />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <ContrastIcon className="h-4 w-4" /> Contrast
              </div>
              <Slider value={[contrast]} min={0.5} max={1.5} step={0.05} onValueChange={(v) => setContrast(v[0])} aria-label="Contrast" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Presets
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'none', label: 'Original' },
                  { key: 'bw', label: 'B&W' },
                  { key: 'vintage', label: 'Vintage' },
                  { key: 'warm', label: 'Warm' },
                  { key: 'cool', label: 'Cool' },
                ] as const).map((p) => (
                  <Button key={p.key} type="button" size="sm" variant={preset === p.key ? 'default' : 'outline'} onClick={() => setPreset(p.key)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Preview</div>
            <div className="w-full max-h-64 overflow-hidden rounded border bg-muted">
              {previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewDataUrl} alt="Preview" className="w-full h-auto object-contain" />
              ) : (
                <div className="h-40" />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing} aria-label="Cancel editing">
            <XIcon className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isProcessing || !croppedAreaPixels} aria-label="Apply edits">
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PhotoEditor

