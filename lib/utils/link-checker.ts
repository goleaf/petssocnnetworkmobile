import type { Source, LinkValidationResult } from "@/lib/types"
import { getSources, updateSource } from "@/lib/sources"

/**
 * Check a single URL using the API endpoint
 */
export async function checkLink(url: string): Promise<LinkValidationResult> {
  try {
    const response = await fetch("/api/links/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error(`Failed to check link: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format")
    }

    return await response.json()
  } catch (error) {
    return {
      url,
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
      checkedAt: new Date().toISOString(),
    }
  }
}

/**
 * Check multiple URLs in batch
 */
export async function checkLinks(urls: string[]): Promise<LinkValidationResult[]> {
  if (urls.length === 0) {
    return []
  }

  try {
    const response = await fetch("/api/links/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    })

    if (!response.ok) {
      throw new Error(`Failed to check links: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format")
    }

    const data = await response.json()
    return data.results || [data]
  } catch (error) {
    // Return failed results for all URLs
    return urls.map((url) => ({
      url,
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
      checkedAt: new Date().toISOString(),
    }))
  }
}

/**
 * Check all sources and update their status
 */
export async function checkAllSources(): Promise<{
  checked: number
  broken: number
  fixed: number
}> {
  const sources = getSources()
  let brokenCount = 0
  let fixedCount = 0

  // Collect URLs to check (skip recently checked ones)
  const urlsToCheck: string[] = []
  const sourceMap = new Map<string, Source>()

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

  for (const source of sources) {
    if (!source.url) continue

    // Skip if checked recently (within 7 days) and is valid
    if (source.lastChecked && source.isValid !== false) {
      const lastChecked = new Date(source.lastChecked).getTime()
      if (lastChecked > sevenDaysAgo) {
        continue
      }
    }

    // Always recheck broken links
    if (source.brokenAt) {
      const brokenTime = new Date(source.brokenAt).getTime()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      // Recheck broken links after 24 hours
      if (brokenTime < oneDayAgo) {
        urlsToCheck.push(source.url)
        sourceMap.set(source.url, source)
      }
      continue
    }

    urlsToCheck.push(source.url)
    sourceMap.set(source.url, source)
  }

  if (urlsToCheck.length === 0) {
    return {
      checked: sources.length,
      broken: sources.filter((s) => s.brokenAt).length,
      fixed: 0,
    }
  }

  // Check all URLs in batch
  const results = await checkLinks(urlsToCheck)

  // Update sources with results
  for (const result of results) {
    const source = sourceMap.get(result.url)
    if (!source) continue

    const wasBroken = !!source.brokenAt
    const isNowBroken = !result.isValid

    if (isNowBroken) {
      // Mark as broken
      updateSource(source.id, {
        isValid: false,
        brokenAt: result.checkedAt,
        lastChecked: result.checkedAt,
      })
      if (!wasBroken) {
        brokenCount++
      }
    } else {
      // Link is valid
      updateSource(source.id, {
        isValid: true,
        lastChecked: result.checkedAt,
        brokenAt: undefined,
      })
      if (wasBroken) {
        fixedCount++
      }
    }
  }

  return {
    checked: urlsToCheck.length,
    broken: brokenCount,
    fixed: fixedCount,
  }
}

/**
 * Get sources that need rechecking
 */
export function getSourcesNeedingCheck(): Source[] {
  const sources = getSources()
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  return sources.filter((source) => {
    if (!source.url) return false

    // Always recheck broken links after 24 hours
    if (source.brokenAt) {
      const brokenTime = new Date(source.brokenAt).getTime()
      return brokenTime < oneDayAgo
    }

    // Recheck valid links after 7 days
    if (source.lastChecked) {
      const lastChecked = new Date(source.lastChecked).getTime()
      return lastChecked < sevenDaysAgo
    }

    // Never checked
    return true
  })
}

/**
 * Get count of broken sources
 */
export function getBrokenLinksCount(): number {
  const sources = getSources()
  return sources.filter((s) => s.brokenAt).length
}

