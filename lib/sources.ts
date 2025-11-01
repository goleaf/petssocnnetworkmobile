import type { Source, Citation } from "./types"

const STORAGE_KEYS = {
  SOURCES: "pet_social_sources",
  CITATIONS: "pet_social_citations",
}

const isBrowser = typeof window !== "undefined"

/**
 * Generate a unique storage ID
 */
function generateStorageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  const randomPart = Math.random().toString(16).slice(2)
  return `${prefix}_${Date.now()}_${randomPart}`
}

/**
 * Normalize URL for comparison (removes trailing slashes, converts to lowercase, etc.)
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Normalize protocol to lowercase
    urlObj.protocol = urlObj.protocol.toLowerCase()
    // Normalize hostname to lowercase
    urlObj.hostname = urlObj.hostname.toLowerCase()
    // Remove trailing slash from pathname (unless it's just "/")
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1)
    }
    // Remove default ports
    if (
      (urlObj.protocol === "http:" && urlObj.port === "80") ||
      (urlObj.protocol === "https:" && urlObj.port === "443")
    ) {
      urlObj.port = ""
    }
    return urlObj.toString()
  } catch {
    // If URL parsing fails, return normalized string version
    return url.trim().toLowerCase().replace(/\/+$/, "")
  }
}

/**
 * Check if two sources are identical (based on normalized URL)
 */
function areSourcesIdentical(source1: Source, source2: Source): boolean {
  return normalizeUrl(source1.url) === normalizeUrl(source2.url)
}

/**
 * Read all sources from storage
 */
function readSources(): Source[] {
  if (!isBrowser) return []
  const data = localStorage.getItem(STORAGE_KEYS.SOURCES)
  return data ? JSON.parse(data) : []
}

/**
 * Write sources to storage
 */
function writeSources(sources: Source[]): void {
  if (!isBrowser) return
  localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources))
}

/**
 * Read all citations from storage
 */
function readCitations(): Citation[] {
  if (!isBrowser) return []
  const data = localStorage.getItem(STORAGE_KEYS.CITATIONS)
  return data ? JSON.parse(data) : []
}

/**
 * Write citations to storage
 */
function writeCitations(citations: Citation[]): void {
  if (!isBrowser) return
  localStorage.setItem(STORAGE_KEYS.CITATIONS, JSON.stringify(citations))
}

/**
 * Get all sources
 */
export function getSources(): Source[] {
  return readSources()
}

/**
 * Get a source by ID
 */
export function getSourceById(id: string): Source | undefined {
  const sources = readSources()
  return sources.find((s) => s.id === id)
}

/**
 * Get a source by URL (checks normalized URL)
 */
export function getSourceByUrl(url: string): Source | undefined {
  const sources = readSources()
  const normalized = normalizeUrl(url)
  return sources.find((s) => normalizeUrl(s.url) === normalized)
}

/**
 * Create or update a source, with deduplication
 * If a source with the same normalized URL exists, returns the existing source
 */
export function createOrUpdateSource(source: Omit<Source, "id"> & { id?: string }): Source {
  const sources = readSources()
  const normalizedUrl = normalizeUrl(source.url)

  // Check for existing source with same URL
  const existingIndex = sources.findIndex((s) => normalizeUrl(s.url) === normalizedUrl)

  if (existingIndex >= 0) {
    // Update existing source, preserving ID and merging data
    const existing = sources[existingIndex]
    const updated: Source = {
      ...existing,
      ...source,
      id: existing.id, // Preserve original ID
      url: existing.url, // Preserve original URL format
      brokenAt: source.brokenAt !== undefined ? source.brokenAt : existing.brokenAt, // Only update brokenAt if explicitly set
    }
    sources[existingIndex] = updated
    writeSources(sources)
    return updated
  }

  // Create new source
  const newSource: Source = {
    ...source,
    id: source.id || generateStorageId("src"),
  }
  sources.push(newSource)
  writeSources(sources)
  return newSource
}

/**
 * Update an existing source by ID
 */
export function updateSource(id: string, updates: Partial<Omit<Source, "id">>): Source | null {
  const sources = readSources()
  const index = sources.findIndex((s) => s.id === id)

  if (index < 0) {
    return null
  }

  const updated: Source = {
    ...sources[index],
    ...updates,
    id, // Ensure ID doesn't change
  }

  // Check if URL changed and would cause duplication
  if (updates.url && normalizeUrl(updates.url) !== normalizeUrl(sources[index].url)) {
    const existingByUrl = sources.find(
      (s) => s.id !== id && normalizeUrl(s.url) === normalizeUrl(updates.url)
    )
    if (existingByUrl) {
      throw new Error(
        `A source with URL "${updates.url}" already exists (ID: ${existingByUrl.id}). Use createOrUpdateSource for automatic deduplication.`
      )
    }
  }

  sources[index] = updated
  writeSources(sources)
  return updated
}

/**
 * Delete a source by ID
 */
export function deleteSource(id: string): boolean {
  const sources = readSources()
  const index = sources.findIndex((s) => s.id === id)

  if (index < 0) {
    return false
  }

  // Check if source is referenced by any citations
  const citations = readCitations()
  const hasCitations = citations.some((c) => c.sourceId === id)

  if (hasCitations) {
    throw new Error(
      `Cannot delete source "${id}" because it is referenced by one or more citations. Remove citations first.`
    )
  }

  sources.splice(index, 1)
  writeSources(sources)
  return true
}

/**
 * Get all citations for a revision
 */
export function getCitationsByRevision(revisionId: string): Citation[] {
  const citations = readCitations()
  return citations.filter((c) => c.revisionId === revisionId)
}

/**
 * Get all citations for a source
 */
export function getCitationsBySource(sourceId: string): Citation[] {
  const citations = readCitations()
  return citations.filter((c) => c.sourceId === sourceId)
}

/**
 * Create a citation
 */
export function createCitation(citation: Citation): Citation {
  const citations = readCitations()

  // Verify source exists
  const source = getSourceById(citation.sourceId)
  if (!source) {
    throw new Error(`Source with ID "${citation.sourceId}" does not exist`)
  }

  citations.push(citation)
  writeCitations(citations)
  return citation
}

/**
 * Delete a citation
 */
export function deleteCitation(revisionId: string, sourceId: string): boolean {
  const citations = readCitations()
  const index = citations.findIndex(
    (c) => c.revisionId === revisionId && c.sourceId === sourceId
  )

  if (index < 0) {
    return false
  }

  citations.splice(index, 1)
  writeCitations(citations)
  return true
}

/**
 * Delete all citations for a revision
 */
export function deleteCitationsByRevision(revisionId: string): number {
  const citations = readCitations()
  const initialLength = citations.length
  const filtered = citations.filter((c) => c.revisionId !== revisionId)
  writeCitations(filtered)
  return initialLength - filtered.length
}

/**
 * Delete all citations for a source
 */
export function deleteCitationsBySource(sourceId: string): number {
  const citations = readCitations()
  const initialLength = citations.length
  const filtered = citations.filter((c) => c.sourceId !== sourceId)
  writeCitations(filtered)
  return initialLength - filtered.length
}

/**
 * Check if a URL is accessible (broken link checker)
 * Returns true if accessible, false if broken
 */
async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    // In browser environment, use fetch with HEAD request
    if (typeof window !== "undefined") {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors", // Allow cross-origin, but can't read status
        cache: "no-cache",
      })
      // With no-cors, we can't check status, but if it doesn't throw, assume it's accessible
      return true
    }

    // In Node.js environment, this would need a different approach
    // For now, return true (would need to use a library like node-fetch or axios)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Check all sources for broken links and update brokenAt field
 * This should be run periodically or on demand
 */
export async function checkBrokenLinks(): Promise<{ checked: number; broken: number }> {
  const sources = readSources()
  let brokenCount = 0

  for (const source of sources) {
    // Skip if already marked as broken recently (within last 24 hours)
    if (source.brokenAt) {
      const brokenTime = new Date(source.brokenAt).getTime()
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      if (brokenTime > dayAgo) {
        continue
      }
    }

    const isAccessible = await checkUrlAccessibility(source.url)
    if (!isAccessible) {
      source.brokenAt = new Date().toISOString()
      brokenCount++
    } else {
      // If previously broken but now accessible, clear brokenAt
      if (source.brokenAt) {
        delete source.brokenAt
      }
    }
  }

  writeSources(sources)

  return {
    checked: sources.length,
    broken: brokenCount,
  }
}

/**
 * Get all broken sources
 */
export function getBrokenSources(): Source[] {
  const sources = readSources()
  return sources.filter((s) => s.brokenAt !== undefined)
}

/**
 * Get source statistics
 */
export function getSourceStats(): {
  total: number
  broken: number
  withCitations: number
  totalCitations: number
} {
  const sources = readSources()
  const citations = readCitations()

  const sourceIdsWithCitations = new Set(citations.map((c) => c.sourceId))
  const brokenSources = sources.filter((s) => s.brokenAt !== undefined)

  return {
    total: sources.length,
    broken: brokenSources.length,
    withCitations: sourceIdsWithCitations.size,
    totalCitations: citations.length,
  }
}

/**
 * Merge duplicate sources (manual deduplication)
 * Merges duplicate sources into one and updates all citations
 */
export function mergeDuplicateSources(
  sourceIdToKeep: string,
  sourceIdToMerge: string
): { merged: boolean; citationsUpdated: number } {
  const sources = readSources()
  const sourceToKeep = sources.find((s) => s.id === sourceIdToKeep)
  const sourceToMerge = sources.find((s) => s.id === sourceIdToMerge)

  if (!sourceToKeep || !sourceToMerge) {
    throw new Error("One or both sources not found")
  }

  if (normalizeUrl(sourceToKeep.url) !== normalizeUrl(sourceToMerge.url)) {
    throw new Error("Sources are not duplicates (different URLs)")
  }

  // Update all citations that reference the source to merge
  const citations = readCitations()
  let citationsUpdated = 0
  for (const citation of citations) {
    if (citation.sourceId === sourceIdToMerge) {
      citation.sourceId = sourceIdToKeep
      citationsUpdated++
    }
  }
  writeCitations(citations)

  // Delete the source to merge
  const index = sources.findIndex((s) => s.id === sourceIdToMerge)
  if (index >= 0) {
    sources.splice(index, 1)
    writeSources(sources)
  }

  return {
    merged: true,
    citationsUpdated,
  }
}
