/**
 * Photo Service for Pet Profile System
 * 
 * Handles photo upload, validation, processing, and management for pet profiles.
 * Implements requirements 3.1-3.9 from the pet profile system specification.
 */

import sharp from 'sharp'
import { z } from 'zod'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PhotoUploadOptions {
  file: File | Buffer
  petId: string
  caption?: string
  tags?: string[]
  isPrimary?: boolean
}

export interface ProcessedPhoto {
  original: string
  large: string
  medium: string
  thumbnail: string
  webp: {
    large: string
    medium: string
    thumbnail: string
  }
}

export interface PhotoMetadata {
  id: string
  petId: string
  url: string
  thumbnailUrl: string
  mediumUrl: string
  largeUrl: string
  webpUrls: {
    thumbnail: string
    medium: string
    large: string
  }
  caption?: string
  tags?: string[]
  isPrimary: boolean
  order: number
  width: number
  height: number
  format: string
  size: number
  uploadedAt: string
}

export interface PhotoValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PHOTOS_PER_PET = 20

const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 800, height: 800 },
  large: { width: 1600, height: 1600 },
} as const

const JPEG_QUALITY = 85
const WEBP_QUALITY = 85

// ============================================================================
// Validation
// ============================================================================

const photoUploadSchema = z.object({
  petId: z.string().min(1, 'Pet ID is required'),
  caption: z.string().max(200, 'Caption must be 200 characters or less').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  isPrimary: z.boolean().optional(),
})

/**
 * Validate photo file before processing
 * Requirements: 3.2, 3.3
 */
export async function validatePhotoFile(
  file: File | Buffer,
  existingPhotoCount: number = 0
): Promise<PhotoValidationResult> {
  const errors: string[] = []

  try {
    // Check photo count limit
    if (existingPhotoCount >= MAX_PHOTOS_PER_PET) {
      errors.push(`Maximum ${MAX_PHOTOS_PER_PET} photos allowed per pet`)
      return { valid: false, errors }
    }

    // Get file buffer
    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer())

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Validate image using sharp
    try {
      const metadata = await sharp(buffer).metadata()

      // Check if it's a valid image format
      if (!metadata.format) {
        errors.push('Invalid image format')
        return { valid: false, errors }
      }

      // Check dimensions (minimum 100x100, maximum 10000x10000)
      if (metadata.width && metadata.height) {
        if (metadata.width < 100 || metadata.height < 100) {
          errors.push('Image dimensions must be at least 100x100 pixels')
        }
        if (metadata.width > 10000 || metadata.height > 10000) {
          errors.push('Image dimensions must not exceed 10000x10000 pixels')
        }
      }

      // Validate format
      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif']
      if (!validFormats.includes(metadata.format)) {
        errors.push(`Unsupported format: ${metadata.format}. Allowed: ${validFormats.join(', ')}`)
      }
    } catch (error) {
      errors.push('Unable to process image. File may be corrupted.')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  } catch (error) {
    return {
      valid: false,
      errors: ['Failed to validate file'],
    }
  }
}

/**
 * Validate photo upload options
 */
export function validatePhotoOptions(options: Partial<PhotoUploadOptions>): PhotoValidationResult {
  try {
    photoUploadSchema.parse(options)
    return { valid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => e.message),
      }
    }
    return {
      valid: false,
      errors: ['Invalid photo options'],
    }
  }
}

// ============================================================================
// Image Processing
// ============================================================================

/**
 * Strip EXIF data except orientation
 * Requirement: 3.5
 */
async function stripExifData(buffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Preserve orientation, strip everything else
    if (metadata.orientation) {
      return await image
        .rotate() // Auto-rotate based on EXIF orientation
        .withMetadata({
          orientation: metadata.orientation,
        })
        .toBuffer()
    }

    // No orientation data, just strip all EXIF
    return await image.withMetadata({}).toBuffer()
  } catch (error) {
    console.error('Error stripping EXIF data:', error)
    throw new Error('Failed to process image metadata')
  }
}

/**
 * Resize image to specified dimensions
 * Requirement: 3.3
 */
async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number,
  fit: 'cover' | 'contain' | 'inside' = 'inside'
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(width, height, {
        fit,
        withoutEnlargement: true, // Don't upscale small images
      })
      .toBuffer()
  } catch (error) {
    console.error('Error resizing image:', error)
    throw new Error('Failed to resize image')
  }
}

/**
 * Convert image to WebP format
 * Requirement: 3.4
 */
async function convertToWebP(buffer: Buffer, quality: number = WEBP_QUALITY): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .webp({ quality, effort: 4 })
      .toBuffer()
  } catch (error) {
    console.error('Error converting to WebP:', error)
    throw new Error('Failed to convert image to WebP')
  }
}

/**
 * Convert image to JPEG format (fallback)
 * Requirement: 3.4
 */
async function convertToJPEG(buffer: Buffer, quality: number = JPEG_QUALITY): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
  } catch (error) {
    console.error('Error converting to JPEG:', error)
    throw new Error('Failed to convert image to JPEG')
  }
}

/**
 * Process photo: resize to multiple sizes and convert to WebP with JPEG fallback
 * Requirements: 3.3, 3.4, 3.5
 */
export async function processPhoto(
  file: File | Buffer
): Promise<{
  sizes: {
    thumbnail: { jpeg: Buffer; webp: Buffer }
    medium: { jpeg: Buffer; webp: Buffer }
    large: { jpeg: Buffer; webp: Buffer }
  }
  metadata: {
    width: number
    height: number
    format: string
    size: number
  }
}> {
  try {
    // Get file buffer
    const originalBuffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer())

    // Strip EXIF data (except orientation)
    const cleanBuffer = await stripExifData(originalBuffer)

    // Get metadata
    const metadata = await sharp(cleanBuffer).metadata()

    // Process each size
    const thumbnail = await resizeImage(
      cleanBuffer,
      IMAGE_SIZES.thumbnail.width,
      IMAGE_SIZES.thumbnail.height,
      'cover'
    )
    const medium = await resizeImage(
      cleanBuffer,
      IMAGE_SIZES.medium.width,
      IMAGE_SIZES.medium.height,
      'inside'
    )
    const large = await resizeImage(
      cleanBuffer,
      IMAGE_SIZES.large.width,
      IMAGE_SIZES.large.height,
      'inside'
    )

    // Convert to WebP and JPEG
    const [thumbnailWebP, thumbnailJPEG] = await Promise.all([
      convertToWebP(thumbnail),
      convertToJPEG(thumbnail),
    ])

    const [mediumWebP, mediumJPEG] = await Promise.all([
      convertToWebP(medium),
      convertToJPEG(medium),
    ])

    const [largeWebP, largeJPEG] = await Promise.all([
      convertToWebP(large),
      convertToJPEG(large),
    ])

    return {
      sizes: {
        thumbnail: { jpeg: thumbnailJPEG, webp: thumbnailWebP },
        medium: { jpeg: mediumJPEG, webp: mediumWebP },
        large: { jpeg: largeJPEG, webp: largeWebP },
      },
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: originalBuffer.length,
      },
    }
  } catch (error) {
    console.error('Error processing photo:', error)
    throw new Error('Failed to process photo')
  }
}

// ============================================================================
// Photo Management
// ============================================================================

/**
 * Upload and process a photo
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * Note: This function processes the image but does not handle storage.
 * The caller is responsible for uploading the processed buffers to storage
 * and creating database records.
 */
export async function uploadPhoto(
  options: PhotoUploadOptions,
  existingPhotoCount: number = 0
): Promise<{
  processed: {
    sizes: {
      thumbnail: { jpeg: Buffer; webp: Buffer }
      medium: { jpeg: Buffer; webp: Buffer }
      large: { jpeg: Buffer; webp: Buffer }
    }
    metadata: {
      width: number
      height: number
      format: string
      size: number
    }
  }
  options: PhotoUploadOptions
}> {
  // Validate options
  const optionsValidation = validatePhotoOptions(options)
  if (!optionsValidation.valid) {
    throw new Error(`Invalid options: ${optionsValidation.errors.join(', ')}`)
  }

  // Validate file
  const fileValidation = await validatePhotoFile(options.file, existingPhotoCount)
  if (!fileValidation.valid) {
    throw new Error(`Invalid file: ${fileValidation.errors.join(', ')}`)
  }

  // Process photo
  const processed = await processPhoto(options.file)

  return {
    processed,
    options,
  }
}

/**
 * Update photo caption
 * Requirement: 3.7
 */
export function updatePhotoCaption(caption: string): { valid: boolean; caption?: string; error?: string } {
  if (caption.length > 200) {
    return {
      valid: false,
      error: 'Caption must be 200 characters or less',
    }
  }

  return {
    valid: true,
    caption: caption.trim(),
  }
}

/**
 * Update photo tags
 * Requirement: 3.7
 */
export function updatePhotoTags(tags: string[]): { valid: boolean; tags?: string[]; error?: string } {
  if (tags.length > 10) {
    return {
      valid: false,
      error: 'Maximum 10 tags allowed',
    }
  }

  // Trim and validate each tag
  const trimmedTags = tags.map((tag) => tag.trim())
  const validTags = trimmedTags.filter((tag) => {
    return tag.length > 0 && tag.length <= 50
  })

  if (validTags.length !== tags.length) {
    return {
      valid: false,
      error: 'Tags must be 1-50 characters',
    }
  }

  return {
    valid: true,
    tags: validTags,
  }
}

/**
 * Validate photo reordering
 * Requirement: 3.6
 */
export function validatePhotoOrder(
  photoIds: string[],
  existingPhotoIds: string[]
): { valid: boolean; error?: string } {
  // Check if all IDs are present
  if (photoIds.length !== existingPhotoIds.length) {
    return {
      valid: false,
      error: 'Photo count mismatch',
    }
  }

  // Check if all IDs are valid
  const existingSet = new Set(existingPhotoIds)
  const allValid = photoIds.every((id) => existingSet.has(id))

  if (!allValid) {
    return {
      valid: false,
      error: 'Invalid photo IDs',
    }
  }

  // Check for duplicates
  const uniqueIds = new Set(photoIds)
  if (uniqueIds.size !== photoIds.length) {
    return {
      valid: false,
      error: 'Duplicate photo IDs',
    }
  }

  return { valid: true }
}

/**
 * Generate new order values for photos
 * Requirement: 3.6
 */
export function generatePhotoOrder(photoIds: string[]): Record<string, number> {
  const orderMap: Record<string, number> = {}
  photoIds.forEach((id, index) => {
    orderMap[id] = index
  })
  return orderMap
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    }
  } catch (error) {
    throw new Error('Failed to get image dimensions')
  }
}

/**
 * Check if image needs rotation based on EXIF
 */
export async function needsRotation(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata()
    return metadata.orientation !== undefined && metadata.orientation > 1
  } catch (error) {
    return false
  }
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * Check if image is landscape
 */
export function isLandscape(width: number, height: number): boolean {
  return width > height
}

/**
 * Check if image is portrait
 */
export function isPortrait(width: number, height: number): boolean {
  return height > width
}

/**
 * Check if image is square
 */
export function isSquare(width: number, height: number): boolean {
  return width === height
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Generate photo filename
 */
export function generatePhotoFilename(
  petId: string,
  size: 'thumbnail' | 'medium' | 'large',
  format: 'jpeg' | 'webp',
  timestamp: number = Date.now()
): string {
  return `pet-${petId}-${size}-${timestamp}.${format}`
}

// ============================================================================
// Export constants for external use
// ============================================================================

export const PHOTO_CONSTANTS = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_PHOTOS_PER_PET,
  IMAGE_SIZES,
  JPEG_QUALITY,
  WEBP_QUALITY,
} as const
