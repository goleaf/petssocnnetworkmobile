"use client"

import React, { useState, useCallback, useRef } from "react"
import Cropper, { Area, Point } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCw, Check, X as XIcon } from "lucide-react"
import { getCroppedImg } from "@/lib/utils/image-crop"

interface AvatarEditorProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImage: string) => void
  minWidth?: number
  minHeight?: number
}

const ASPECT_RATIO = 1 // Square for avatar
const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function AvatarEditor({
  imageSrc,
  isOpen,
  onClose,
  onSave,
  minWidth = 200,
  minHeight = 200,
}: AvatarEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )

      // Validate cropped image dimensions
      const img = new window.Image()
      img.onload = () => {
        if (img.width < minWidth || img.height < minHeight) {
          alert(
            `Cropped image is too small. Minimum required: ${minWidth}x${minHeight}px. Current: ${img.width}x${img.height}px`
          )
          setIsProcessing(false)
          return
        }
        onSave(croppedImage)
        handleClose()
      }
      img.onerror = () => {
        alert("Failed to process image. Please try again.")
        setIsProcessing(false)
      }
      img.src = croppedImage
    } catch (error) {
      console.error("Error cropping image:", error)
      alert("Failed to crop image. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setIsProcessing(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Container */}
          <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={ASPECT_RATIO}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
              style={{
                containerStyle: {
                  width: "100%",
                  height: "100%",
                  position: "relative",
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </label>
                <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => prev + 90)}
                className="flex-1"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
              Minimum size: {minWidth}x{minHeight}px
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            <XIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Avatar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

