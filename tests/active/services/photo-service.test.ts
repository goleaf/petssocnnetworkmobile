/**
 * Unit tests for Photo Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import sharp from 'sharp'
import {
  validatePhotoFile,
  validatePhotoOptions,
  processPhoto,
  uploadPhoto,
  updatePhotoCaption,
  updatePhotoTags,
  validatePhotoOrder,
  generatePhotoOrder,
  getImageDimensions,
  needsRotation,
  calculateAspectRatio,
  isLandscape,
  isPortrait,
  isSquare,
  formatFileSize,
  generatePhotoFilename,
  PHOTO_CONSTANTS,
  type PhotoUploadOptions,
} from '@/lib/services/photo-service'

// Helper to create a test image buffer
async function createTestImage(
  width: number = 800,
  height: number = 600,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<Buffer> {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .toFormat(format)
    .toBuffer()
}

describe('Photo Service - Validation', () => {
  describe('validatePhotoFile', () => {
    it('should validate a valid JPEG image', async () => {
      const buffer = await createTestImage(800, 600, 'jpeg')
      const result = await validatePhotoFile(buffer, 0)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate a valid PNG image', async () => {
      const buffer = await createTestImage(800, 600, 'png')
      const result = await validatePhotoFile(buffer, 0)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject image when photo count limit reached', async () => {
      const buffer = await createTestImage()
      const result = await validatePhotoFile(buffer, PHOTO_CONSTANTS.MAX_PHOTOS_PER_PET)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(`Maximum ${PHOTO_CONSTANTS.MAX_PHOTOS_PER_PET} photos allowed per pet`)
    })

    it('should reject image that is too small', async () => {
      const buffer = await createTestImage(50, 50)
      const result = await validatePhotoFile(buffer, 0)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('at least 100x100'))).toBe(true)
    })

    it('should reject image that is too large in dimensions', async () => {
      const buffer = await createTestImage(11000, 11000)
      const result = await validatePhotoFile(buffer, 0)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('must not exceed 10000x10000'))).toBe(true)
    })

    it('should accept image with valid dimensions', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await validatePhotoFile(buffer, 0)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validatePhotoOptions', () => {
    it('should validate valid options', () => {
      const options = {
        petId: 'pet-123',
        caption: 'My cute pet',
        tags: ['cute', 'playful'],
        isPrimary: true,
      }

      const result = validatePhotoOptions(options)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing petId', () => {
      const options = {
        caption: 'My cute pet',
      }

      const result = validatePhotoOptions(options)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject caption that is too long', () => {
      const options = {
        petId: 'pet-123',
        caption: 'a'.repeat(201),
      }

      const result = validatePhotoOptions(options)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('200 characters'))).toBe(true)
    })

    it('should reject too many tags', () => {
      const options = {
        petId: 'pet-123',
        tags: Array(11).fill('tag'),
      }

      const result = validatePhotoOptions(options)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('10 tags'))).toBe(true)
    })
  })
})

describe('Photo Service - Processing', () => {
  describe('processPhoto', () => {
    it('should process image and create multiple sizes', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await processPhoto(buffer)

      expect(result.sizes.thumbnail).toBeDefined()
      expect(result.sizes.medium).toBeDefined()
      expect(result.sizes.large).toBeDefined()

      expect(result.sizes.thumbnail.jpeg).toBeInstanceOf(Buffer)
      expect(result.sizes.thumbnail.webp).toBeInstanceOf(Buffer)
      expect(result.sizes.medium.jpeg).toBeInstanceOf(Buffer)
      expect(result.sizes.medium.webp).toBeInstanceOf(Buffer)
      expect(result.sizes.large.jpeg).toBeInstanceOf(Buffer)
      expect(result.sizes.large.webp).toBeInstanceOf(Buffer)
    })

    it('should include metadata', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await processPhoto(buffer)

      expect(result.metadata.width).toBe(1920)
      expect(result.metadata.height).toBe(1080)
      expect(result.metadata.format).toBeDefined()
      expect(result.metadata.size).toBeGreaterThan(0)
    })

    it('should create thumbnail with correct dimensions', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await processPhoto(buffer)

      const thumbnailMeta = await sharp(result.sizes.thumbnail.jpeg).metadata()
      expect(thumbnailMeta.width).toBe(PHOTO_CONSTANTS.IMAGE_SIZES.thumbnail.width)
      expect(thumbnailMeta.height).toBe(PHOTO_CONSTANTS.IMAGE_SIZES.thumbnail.height)
    })

    it('should create medium size with correct max dimensions', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await processPhoto(buffer)

      const mediumMeta = await sharp(result.sizes.medium.jpeg).metadata()
      expect(mediumMeta.width).toBeLessThanOrEqual(PHOTO_CONSTANTS.IMAGE_SIZES.medium.width)
      expect(mediumMeta.height).toBeLessThanOrEqual(PHOTO_CONSTANTS.IMAGE_SIZES.medium.height)
    })

    it('should create large size with correct max dimensions', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await processPhoto(buffer)

      const largeMeta = await sharp(result.sizes.large.jpeg).metadata()
      expect(largeMeta.width).toBeLessThanOrEqual(PHOTO_CONSTANTS.IMAGE_SIZES.large.width)
      expect(largeMeta.height).toBeLessThanOrEqual(PHOTO_CONSTANTS.IMAGE_SIZES.large.height)
    })

    it('should not upscale small images', async () => {
      const buffer = await createTestImage(400, 300)
      const result = await processPhoto(buffer)

      const largeMeta = await sharp(result.sizes.large.jpeg).metadata()
      expect(largeMeta.width).toBeLessThanOrEqual(400)
      expect(largeMeta.height).toBeLessThanOrEqual(300)
    })
  })

  describe('uploadPhoto', () => {
    it('should process and return photo data', async () => {
      const buffer = await createTestImage(1920, 1080)
      const options: PhotoUploadOptions = {
        file: buffer,
        petId: 'pet-123',
        caption: 'Test photo',
        tags: ['test'],
        isPrimary: false,
      }

      const result = await uploadPhoto(options, 0)

      expect(result.processed).toBeDefined()
      expect(result.options).toEqual(options)
    })

    it('should reject invalid options', async () => {
      const buffer = await createTestImage()
      const options = {
        file: buffer,
        petId: '',
      } as PhotoUploadOptions

      await expect(uploadPhoto(options, 0)).rejects.toThrow('Invalid options')
    })

    it('should reject invalid file', async () => {
      const buffer = await createTestImage(50, 50)
      const options: PhotoUploadOptions = {
        file: buffer,
        petId: 'pet-123',
      }

      await expect(uploadPhoto(options, 0)).rejects.toThrow('Invalid file')
    })

    it('should reject when photo limit reached', async () => {
      const buffer = await createTestImage()
      const options: PhotoUploadOptions = {
        file: buffer,
        petId: 'pet-123',
      }

      await expect(uploadPhoto(options, PHOTO_CONSTANTS.MAX_PHOTOS_PER_PET)).rejects.toThrow()
    })
  })
})

describe('Photo Service - Management', () => {
  describe('updatePhotoCaption', () => {
    it('should accept valid caption', () => {
      const result = updatePhotoCaption('My cute pet')

      expect(result.valid).toBe(true)
      expect(result.caption).toBe('My cute pet')
    })

    it('should trim caption', () => {
      const result = updatePhotoCaption('  My cute pet  ')

      expect(result.valid).toBe(true)
      expect(result.caption).toBe('My cute pet')
    })

    it('should reject caption that is too long', () => {
      const result = updatePhotoCaption('a'.repeat(201))

      expect(result.valid).toBe(false)
      expect(result.error).toContain('200 characters')
    })

    it('should accept empty caption', () => {
      const result = updatePhotoCaption('')

      expect(result.valid).toBe(true)
      expect(result.caption).toBe('')
    })
  })

  describe('updatePhotoTags', () => {
    it('should accept valid tags', () => {
      const result = updatePhotoTags(['cute', 'playful', 'happy'])

      expect(result.valid).toBe(true)
      expect(result.tags).toEqual(['cute', 'playful', 'happy'])
    })

    it('should reject too many tags', () => {
      const result = updatePhotoTags(Array(11).fill('tag'))

      expect(result.valid).toBe(false)
      expect(result.error).toContain('10 tags')
    })

    it('should filter out empty tags', () => {
      const result = updatePhotoTags(['cute', '', 'playful'])

      expect(result.valid).toBe(false)
    })

    it('should trim tags', () => {
      const result = updatePhotoTags(['  cute  ', '  playful  '])

      expect(result.valid).toBe(true)
      expect(result.tags).toEqual(['cute', 'playful'])
    })
  })

  describe('validatePhotoOrder', () => {
    it('should validate correct order', () => {
      const photoIds = ['photo-1', 'photo-2', 'photo-3']
      const existingIds = ['photo-1', 'photo-2', 'photo-3']

      const result = validatePhotoOrder(photoIds, existingIds)

      expect(result.valid).toBe(true)
    })

    it('should reject mismatched count', () => {
      const photoIds = ['photo-1', 'photo-2']
      const existingIds = ['photo-1', 'photo-2', 'photo-3']

      const result = validatePhotoOrder(photoIds, existingIds)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('count mismatch')
    })

    it('should reject invalid IDs', () => {
      const photoIds = ['photo-1', 'photo-2', 'photo-4']
      const existingIds = ['photo-1', 'photo-2', 'photo-3']

      const result = validatePhotoOrder(photoIds, existingIds)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid photo IDs')
    })

    it('should reject duplicate IDs', () => {
      const photoIds = ['photo-1', 'photo-2', 'photo-2']
      const existingIds = ['photo-1', 'photo-2', 'photo-3']

      const result = validatePhotoOrder(photoIds, existingIds)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Duplicate')
    })
  })

  describe('generatePhotoOrder', () => {
    it('should generate order map', () => {
      const photoIds = ['photo-3', 'photo-1', 'photo-2']
      const result = generatePhotoOrder(photoIds)

      expect(result).toEqual({
        'photo-3': 0,
        'photo-1': 1,
        'photo-2': 2,
      })
    })

    it('should handle empty array', () => {
      const result = generatePhotoOrder([])

      expect(result).toEqual({})
    })
  })
})

describe('Photo Service - Utilities', () => {
  describe('getImageDimensions', () => {
    it('should return correct dimensions', async () => {
      const buffer = await createTestImage(1920, 1080)
      const result = await getImageDimensions(buffer)

      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
    })
  })

  describe('needsRotation', () => {
    it('should return false for image without orientation', async () => {
      const buffer = await createTestImage()
      const result = await needsRotation(buffer)

      expect(result).toBe(false)
    })
  })

  describe('calculateAspectRatio', () => {
    it('should calculate correct aspect ratio', () => {
      expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(1.778, 2)
      expect(calculateAspectRatio(1080, 1920)).toBeCloseTo(0.5625, 2)
      expect(calculateAspectRatio(1000, 1000)).toBe(1)
    })
  })

  describe('isLandscape', () => {
    it('should identify landscape images', () => {
      expect(isLandscape(1920, 1080)).toBe(true)
      expect(isLandscape(1080, 1920)).toBe(false)
      expect(isLandscape(1000, 1000)).toBe(false)
    })
  })

  describe('isPortrait', () => {
    it('should identify portrait images', () => {
      expect(isPortrait(1080, 1920)).toBe(true)
      expect(isPortrait(1920, 1080)).toBe(false)
      expect(isPortrait(1000, 1000)).toBe(false)
    })
  })

  describe('isSquare', () => {
    it('should identify square images', () => {
      expect(isSquare(1000, 1000)).toBe(true)
      expect(isSquare(1920, 1080)).toBe(false)
      expect(isSquare(1080, 1920)).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('generatePhotoFilename', () => {
    it('should generate correct filename', () => {
      const filename = generatePhotoFilename('pet-123', 'medium', 'jpeg', 1234567890)

      expect(filename).toBe('pet-pet-123-medium-1234567890.jpeg')
    })

    it('should generate filename with current timestamp', () => {
      const filename = generatePhotoFilename('pet-123', 'thumbnail', 'webp')

      expect(filename).toMatch(/^pet-pet-123-thumbnail-\d+\.webp$/)
    })
  })

  describe('PHOTO_CONSTANTS', () => {
    it('should export constants', () => {
      expect(PHOTO_CONSTANTS.MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
      expect(PHOTO_CONSTANTS.MAX_PHOTOS_PER_PET).toBe(20)
      expect(PHOTO_CONSTANTS.IMAGE_SIZES.thumbnail.width).toBe(150)
      expect(PHOTO_CONSTANTS.IMAGE_SIZES.medium.width).toBe(800)
      expect(PHOTO_CONSTANTS.IMAGE_SIZES.large.width).toBe(1600)
    })
  })
})
