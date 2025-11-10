"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Upload,
  X,
  GripVertical,
  Crop,
  RotateCw,
  Sun,
  Contrast,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ============================================================================
// Types
// ============================================================================

export interface PhotoData {
  id: string
  file: File
  preview: string
  caption?: string
  uploadProgress?: number
  uploadError?: string
  isUploading?: boolean
  isPrimary?: boolean
  // Editing state
  brightness?: number
  contrast?: number
  rotation?: number
  filter?: "none" | "vintage" | "bw" | "warm" | "cool"
  cropData?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface Step2FormData {
  photos: PhotoData[]
  primaryPhotoId?: string
}

interface Step2PhotosProps {
  formData: Step2FormData
  onChange: (data: Partial<Step2FormData>) => void
  errors?: Record<string, string>
}

// ============================================================================
// Constants
// ============================================================================

const MAX_PHOTOS = 20
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"]
const PRIMARY_PHOTO_SIZE = 500 // 500x500px square

const FILTERS = [
  { value: "none", label: "None" },
  { value: "vintage", label: "Vintage" },
  { value: "bw", label: "Black & White" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
] as const

// ============================================================================
// Sortable Photo Item Component
// ============================================================================

interface SortablePhotoItemProps {
  photo: PhotoData
  onRemove: () => void
  onEdit: () => void
  onCaptionChange: (caption: string) => void
  onSetPrimary: () => void
  isPrimary: boolean
}

function SortablePhotoItem({
  photo,
  onRemove,
  onEdit,
  onCaptionChange,
  onSetPrimary,
  isPrimary,
}: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group border rounded-lg overflow-hidden bg-card",
        isDragging && "opacity-50 z-50",
        isPrimary && "ring-2 ring-primary"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
          Primary
        </div>
      )}

      {/* Photo Preview */}
      <div className="aspect-square relative">
        <img
          src={photo.preview}
          alt={photo.caption || "Pet photo"}
          className="w-full h-full object-cover"
          style={{
            filter: getFilterStyle(photo.filter || "none", photo.brightness, photo.contrast),
            transform: `rotate(${photo.rotation || 0}deg)`,
          }}
        />

        {/* Upload Progress */}
        {photo.isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="w-3/4">
              <Progress value={photo.uploadProgress || 0} className="h-2" />
              <p className="text-xs text-center mt-2">{photo.uploadProgress || 0}%</p>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {photo.uploadError && (
          <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center p-2">
            <div className="text-center text-destructive-foreground">
              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">{photo.uploadError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={onEdit}
            disabled={photo.isUploading}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={onRemove}
            disabled={photo.isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Caption Input */}
      <div className="p-2 space-y-2">
        <Input
          placeholder="Add caption (optional)"
          value={photo.caption || ""}
          onChange={(e) => onCaptionChange(e.target.value)}
          maxLength={200}
          disabled={photo.isUploading}
          className="text-sm"
        />
        {!isPrimary && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={onSetPrimary}
            disabled={photo.isUploading}
          >
            Set as Primary
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Photo Editor Modal Component
// ============================================================================

interface PhotoEditorProps {
  photo: PhotoData
  onSave: (updates: Partial<PhotoData>) => void
  onClose: () => void
}

function PhotoEditor({ photo, onSave, onClose }: PhotoEditorProps) {
  const [brightness, setBrightness] = useState(photo.brightness || 100)
  const [contrast, setContrast] = useState(photo.contrast || 100)
  const [rotation, setRotation] = useState(photo.rotation || 0)
  const [filter, setFilter] = useState(photo.filter || "none")

  const handleSave = () => {
    onSave({
      brightness,
      contrast,
      rotation,
      filter,
    })
    onClose()
  }

  const handleReset = () => {
    setBrightness(100)
    setContrast(100)
    setRotation(0)
    setFilter("none")
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Photo</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview */}
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            <img
              src={photo.preview}
              alt="Preview"
              className="w-full h-full object-contain"
              style={{
                filter: getFilterStyle(filter, brightness, contrast),
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Editing Tools */}
          <div className="space-y-4">
            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Rotation
                </Label>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                >
                  -90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                >
                  +90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(0)}
                  className="ml-auto"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Brightness
                </Label>
                <span className="text-sm text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([value]) => setBrightness(value)}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  Contrast
                </Label>
                <span className="text-sm text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([value]) => setContrast(value)}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <Label>Filters</Label>
              <div className="grid grid-cols-5 gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "aspect-square rounded-lg border-2 overflow-hidden transition-all",
                      filter === f.value
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500"
                      style={{
                        filter: getFilterStyle(f.value, 100, 100),
                      }}
                    />
                    <span className="sr-only">{f.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {FILTERS.map((f) => (
                  <span key={f.value} className={cn(filter === f.value && "text-foreground font-medium")}>
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Reset All
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function Step2Photos({ formData, onChange, errors = {} }: Step2PhotosProps) {
  const [editingPhoto, setEditingPhoto] = useState<PhotoData | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const photos = formData.photos || []
  const primaryPhoto = photos.find((p) => p.id === formData.primaryPhotoId)
  const hasPrimaryPhoto = !!primaryPhoto

  // ============================================================================
  // File Validation
  // ============================================================================

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: JPEG, PNG, WebP, HEIC`
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }

    return null
  }

  // ============================================================================
  // File Handling
  // ============================================================================

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const currentPhotoCount = photos.length

      // Check photo limit
      if (currentPhotoCount + fileArray.length > MAX_PHOTOS) {
        alert(`Maximum ${MAX_PHOTOS} photos allowed. You can add ${MAX_PHOTOS - currentPhotoCount} more.`)
        return
      }

      const newPhotos: PhotoData[] = []

      for (const file of fileArray) {
        // Validate file
        const error = validateFile(file)
        if (error) {
          alert(`${file.name}: ${error}`)
          continue
        }

        // Create preview
        const preview = URL.createObjectURL(file)

        // Create photo data
        const photoData: PhotoData = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview,
          caption: "",
          uploadProgress: 0,
          isUploading: false,
          isPrimary: false,
          brightness: 100,
          contrast: 100,
          rotation: 0,
          filter: "none",
        }

        newPhotos.push(photoData)
      }

      // Add new photos
      const updatedPhotos = [...photos, ...newPhotos]
      
      // Set first photo as primary if no primary exists
      if (!hasPrimaryPhoto && newPhotos.length > 0) {
        onChange({
          photos: updatedPhotos,
          primaryPhotoId: newPhotos[0].id,
        })
      } else {
        onChange({ photos: updatedPhotos })
      }
    },
    [photos, hasPrimaryPhoto, onChange]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  // ============================================================================
  // Photo Management
  // ============================================================================

  const handleRemovePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId)
    
    // If removing primary photo, set first remaining photo as primary
    if (photoId === formData.primaryPhotoId && updatedPhotos.length > 0) {
      onChange({
        photos: updatedPhotos,
        primaryPhotoId: updatedPhotos[0].id,
      })
    } else {
      onChange({ photos: updatedPhotos })
    }

    // Revoke object URL to free memory
    const photo = photos.find((p) => p.id === photoId)
    if (photo) {
      URL.revokeObjectURL(photo.preview)
    }
  }

  const handleSetPrimary = (photoId: string) => {
    onChange({ primaryPhotoId: photoId })
  }

  const handleCaptionChange = (photoId: string, caption: string) => {
    const updatedPhotos = photos.map((p) =>
      p.id === photoId ? { ...p, caption } : p
    )
    onChange({ photos: updatedPhotos })
  }

  const handleEditPhoto = (photo: PhotoData) => {
    setEditingPhoto(photo)
  }

  const handleSaveEdit = (photoId: string, updates: Partial<PhotoData>) => {
    const updatedPhotos = photos.map((p) =>
      p.id === photoId ? { ...p, ...updates } : p
    )
    onChange({ photos: updatedPhotos })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id)
      const newIndex = photos.findIndex((p) => p.id === over.id)

      const reorderedPhotos = arrayMove(photos, oldIndex, newIndex)
      onChange({ photos: reorderedPhotos })
    }
  }

  return (
    <div className="space-y-6">
      {/* Primary Photo Requirement */}
      {!hasPrimaryPhoto && (
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Primary Photo Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload at least one photo to use as your pet&apos;s primary profile picture.
                The first photo you upload will be set as primary automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive && "border-primary bg-primary/5",
          photos.length >= MAX_PHOTOS && "opacity-50 cursor-not-allowed",
          errors.photos && "border-destructive"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileInput}
          className="hidden"
          disabled={photos.length >= MAX_PHOTOS}
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        
        <h3 className="text-lg font-medium mb-2">
          {photos.length === 0 ? "Upload Pet Photos" : "Add More Photos"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Drag photos here or click to browse
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= MAX_PHOTOS}
        >
          Browse Files
        </Button>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>Accepts: JPEG, PNG, WebP, HEIC</p>
          <p>Max size: 10MB per photo</p>
          <p>
            Max photos: {photos.length}/{MAX_PHOTOS}
          </p>
        </div>
      </div>

      {errors.photos && (
        <p className="text-sm text-destructive">{errors.photos}</p>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">
              Your Photos ({photos.length}/{MAX_PHOTOS})
            </Label>
            <p className="text-sm text-muted-foreground">
              Drag to reorder
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photos.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <SortablePhotoItem
                    key={photo.id}
                    photo={photo}
                    isPrimary={photo.id === formData.primaryPhotoId}
                    onRemove={() => handleRemovePhoto(photo.id)}
                    onEdit={() => handleEditPhoto(photo)}
                    onCaptionChange={(caption) => handleCaptionChange(photo.id, caption)}
                    onSetPrimary={() => handleSetPrimary(photo.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Photo Editor Modal */}
      {editingPhoto && (
        <PhotoEditor
          photo={editingPhoto}
          onSave={(updates) => handleSaveEdit(editingPhoto.id, updates)}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

function getFilterStyle(
  filter: string,
  brightness: number = 100,
  contrast: number = 100
): string {
  const filters: string[] = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
  ]

  switch (filter) {
    case "vintage":
      filters.push("sepia(40%)", "saturate(80%)")
      break
    case "bw":
      filters.push("grayscale(100%)")
      break
    case "warm":
      filters.push("sepia(20%)", "saturate(120%)")
      break
    case "cool":
      filters.push("hue-rotate(180deg)", "saturate(90%)")
      break
  }

  return filters.join(" ")
}
