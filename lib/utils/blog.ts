import type { BlogPost } from "@/lib/types"

/**
 * Generate a URL-friendly slug from a blog post title
 */
export function generateBlogSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

/**
 * Check for slug collisions in existing blog posts
 * Returns the next available slug with a number suffix if collision exists
 */
export function generateUniqueBlogSlug(
  title: string,
  existingPosts: BlogPost[],
  excludePostId?: string
): string {
  const baseSlug = generateBlogSlug(title)
  
  // Filter out the current post if editing
  const otherPosts = existingPosts.filter(
    (post) => post.id !== excludePostId
  )
  
  // Get all existing slugs
  const existingSlugs = new Set(otherPosts.map((post) => post.slug || ""))
  
  // Check if base slug is available
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug
  }
  
  // Try with numbers
  let counter = 2
  let newSlug = `${baseSlug}-${counter}`
  
  while (existingSlugs.has(newSlug)) {
    counter++
    newSlug = `${baseSlug}-${counter}`
  }
  
  return newSlug
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Generate tag suggestions based on prefix
 * Returns suggestions sorted by relevance (exact match > starts with > contains)
 */
export function getTagSuggestions(
  prefix: string,
  existingTags: string[],
  maxResults: number = 10
): string[] {
  if (!prefix.trim()) {
    return existingTags.slice(0, maxResults)
  }
  
  const lowerPrefix = prefix.toLowerCase().trim()
  const uniqueTags = Array.from(new Set(existingTags))
  
  // Categorize matches
  const exactMatches: string[] = []
  const startsWithMatches: string[] = []
  const containsMatches: string[] = []
  
  uniqueTags.forEach((tag) => {
    const lowerTag = tag.toLowerCase()
    
    if (lowerTag === lowerPrefix) {
      exactMatches.push(tag)
    } else if (lowerTag.startsWith(lowerPrefix)) {
      startsWithMatches.push(tag)
    } else if (lowerTag.includes(lowerPrefix)) {
      containsMatches.push(tag)
    }
  })
  
  // Combine results in priority order
  const results = [
    ...exactMatches.sort(),
    ...startsWithMatches.sort(),
    ...containsMatches.sort(),
  ]
  
  return results.slice(0, maxResults)
}

/**
 * Extract sections from blog post content that could be promoted to wiki
 * Looks for common markdown patterns and headings
 */
export interface PromoteableSection {
  blockId: string
  title: string
  content: string
  level: number
  startLine: number
  endLine: number
}

export function extractPromoteableSections(
  content: string
): PromoteableSection[] {
  const lines = content.split("\n")
  const sections: PromoteableSection[] = []
  let currentSection: PromoteableSection | null = null
  let lineNumber = 0
  
  lines.forEach((line, index) => {
    lineNumber = index + 1
    
    // Check for markdown headers (H2, H3, H4)
    const headerMatch = line.match(/^(#{2,4})\s+(.+)$/)
    
    if (headerMatch) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.endLine = lineNumber - 1
        sections.push(currentSection)
      }
      
      // Start new section
      const level = headerMatch[1].length
      const title = headerMatch[2].trim()
      const blockId = `block_${lineNumber}_${title.toLowerCase().replace(/\s+/g, "_")}`
      
      currentSection = {
        blockId,
        title,
        content: line + "\n",
        level,
        startLine: lineNumber,
        endLine: lineNumber,
      }
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + "\n"
    }
  })
  
  // Don't forget the last section
  if (currentSection) {
    currentSection.endLine = lineNumber
    sections.push(currentSection)
  }
  
  return sections
}

/**
 * Convert a blog post section to wiki content format
 */
export function convertSectionToWikiContent(
  title: string,
  content: string,
  originalPost: {
    id: string
    title: string
    authorId: string
    tags?: string[]
  }
): string {
  const citation = `\n\n---\n\n*Source: [${originalPost.title}](/blog/${originalPost.id})*`
  
  return `${title}\n\n${content}${citation}`
}

/**
 * Generate wiki article metadata from blog post section
 */
export function generateWikiMetadata(
  sectionTitle: string,
  originalPost: BlogPost
): {
  title: string
  slug: string
  category: "care" | "health" | "training" | "nutrition" | "behavior" | "breeds"
  tags: string[]
} {
  // Determine category from blog post categories/tags
  const categories = originalPost.categories || []
  const tags = originalPost.tags || []
  
  let category: "care" | "health" | "training" | "nutrition" | "behavior" | "breeds" = "care"
  
  // Simple heuristic to determine category
  const categoryMap: Record<string, "care" | "health" | "training" | "nutrition" | "behavior" | "breeds"> = {
    health: "health",
    medical: "health",
    vet: "health",
    training: "training",
    behavior: "behavior",
    nutrition: "nutrition",
    diet: "nutrition",
    breed: "breeds",
    breed: "breeds",
  }
  
  const allLowerText = [...categories, ...tags].map((s) => s.toLowerCase()).join(" ")
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (allLowerText.includes(key)) {
      category = value
      break
    }
  }
  
  // Generate slug from section title
  const slug = sectionTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  
  // Combine relevant tags
  const wikiTags = [...categories, ...tags].slice(0, 10)
  
  return {
    title: sectionTitle,
    slug,
    category,
    tags: wikiTags,
  }
}

