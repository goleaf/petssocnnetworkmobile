/**
 * Image optimization utilities for responsive images and modern formats
 */

export interface ImageSize {
  width: number
  height?: number
}

export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 267 },
  small: { width: 360 },
  medium: { width: 720 },
  large: { width: 1080 },
  xlarge: { width: 1920 },
} as const

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: ImageSize[] = [
    IMAGE_SIZES.small,
    IMAGE_SIZES.medium,
    IMAGE_SIZES.large,
  ]
): string {
  return sizes
    .map((size) => {
      const url = getOptimizedImageUrl(baseUrl, size.width, size.height)
      return `${url} ${size.width}w`
    })
    .join(", ")
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(
  breakpoints: { maxWidth: string; size: string }[] = [
    { maxWidth: "640px", size: "100vw" },
    { maxWidth: "1024px", size: "720px" },
    { maxWidth: "1280px", size: "1080px" },
  ]
): string {
  const sizeStrings = breakpoints.map(
    (bp) => `(max-width: ${bp.maxWidth}) ${bp.size}`
  )
  // Add default size at the end
  sizeStrings.push("1080px")
  return sizeStrings.join(", ")
}

/**
 * Get optimized image URL with width/height parameters
 * This assumes your CDN or image service supports query parameters
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  format?: "webp" | "avif" | "jpeg"
): string {
  // If using Next.js Image Optimization API
  if (url.startsWith("/")) {
    const params = new URLSearchParams()
    if (width) params.set("w", width.toString())
    if (height) params.set("h", height.toString())
    if (format) params.set("f", format)
    return `${url}?${params.toString()}`
  }

  // If using external CDN (e.g., Cloudinary, imgix)
  // Adjust this based on your CDN's URL structure
  const urlObj = new URL(url)
  if (width) urlObj.searchParams.set("w", width.toString())
  if (height) urlObj.searchParams.set("h", height.toString())
  if (format) urlObj.searchParams.set("fm", format)
  urlObj.searchParams.set("q", "85") // Quality
  
  return urlObj.toString()
}

/**
 * Generate blur data URL for placeholder
 * This creates a tiny base64-encoded image for blur-up effect
 */
export function generateBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  // Create a simple gray gradient as placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(200,200,200);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(150,150,150);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
    </svg>
  `
  const base64 = Buffer.from(svg).toString("base64")
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === "undefined") return false
  
  const canvas = document.createElement("canvas")
  if (canvas.getContext && canvas.getContext("2d")) {
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0
  }
  return false
}

/**
 * Check if browser supports AVIF
 */
export function supportsAVIF(): boolean {
  if (typeof window === "undefined") return false
  
  const canvas = document.createElement("canvas")
  if (canvas.getContext && canvas.getContext("2d")) {
    return canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0
  }
  return false
}

/**
 * Get best supported image format
 */
export function getBestImageFormat(): "avif" | "webp" | "jpeg" {
  if (supportsAVIF()) return "avif"
  if (supportsWebP()) return "webp"
  return "jpeg"
}

/**
 * Generate picture element sources for modern formats with fallback
 */
export function generatePictureSources(
  baseUrl: string,
  sizes: ImageSize[] = [IMAGE_SIZES.medium, IMAGE_SIZES.large]
): {
  avif: string
  webp: string
  jpeg: string
} {
  return {
    avif: generateSrcSet(
      baseUrl,
      sizes.map((s) => ({ ...s }))
    ),
    webp: generateSrcSet(
      baseUrl,
      sizes.map((s) => ({ ...s }))
    ),
    jpeg: generateSrcSet(
      baseUrl,
      sizes.map((s) => ({ ...s }))
    ),
  }
}
