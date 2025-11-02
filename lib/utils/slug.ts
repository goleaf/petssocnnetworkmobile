/**
 * Slug generation utilities with collision detection
 */

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Check if a slug is already in use
 */
export function isSlugTaken(
  slug: string,
  existingSlugs: string[],
  excludeId?: string
): boolean {
  return existingSlugs.some((existing) => existing === slug)
}

/**
 * Generate a unique slug with collision detection
 * If the base slug is taken, appends a number suffix
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[],
  excludeId?: string
): string {
  const baseSlug = generateSlug(text)
  let slug = baseSlug
  let counter = 1

  // Filter out the excluded ID's slug if provided
  const checkSlugs = excludeId
    ? existingSlugs.filter((s) => s !== excludeId)
    : existingSlugs

  while (isSlugTaken(slug, checkSlugs)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Generate a slug from a blog post title
 */
export function generateBlogPostSlug(
  title: string,
  existingSlugs: string[],
  excludePostId?: string
): string {
  if (!title || title.trim() === "") {
    // Fallback to timestamp-based slug if no title
    return `post-${Date.now()}`
  }

  return generateUniqueSlug(title, existingSlugs, excludePostId)
}

