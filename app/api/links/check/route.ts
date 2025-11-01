import { NextRequest, NextResponse } from "next/server"
import type { LinkValidationResult } from "@/lib/types"

export const runtime = "nodejs"

async function checkUrl(url: string): Promise<LinkValidationResult> {
  try {
    // Validate URL format
    const urlObj = new URL(url)

    // Only allow http/https URLs
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return {
        url,
        isValid: false,
        error: "Invalid protocol. Only http and https are allowed.",
        checkedAt: new Date().toISOString(),
      }
    }

    // Perform HEAD request to check if URL is accessible
    // Using fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "PetSocialNetwork/1.0",
        },
      })

      clearTimeout(timeoutId)

      const statusCode = response.status

      // Consider 2xx and 3xx as valid
      const isValid = statusCode >= 200 && statusCode < 400

      return {
        url,
        isValid,
        statusCode,
        error: isValid ? undefined : `HTTP ${statusCode}`,
        checkedAt: new Date().toISOString(),
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return {
          url,
          isValid: false,
          error: "Request timeout",
          checkedAt: new Date().toISOString(),
        }
      }

      return {
        url,
        isValid: false,
        error: fetchError instanceof Error ? fetchError.message : "Unknown error",
        checkedAt: new Date().toISOString(),
      }
    }
  } catch (urlError) {
    return {
      url,
      isValid: false,
      error: urlError instanceof Error ? urlError.message : "Invalid URL format",
      checkedAt: new Date().toISOString(),
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, urls } = body

    // Support both single URL and multiple URLs
    if (urls && Array.isArray(urls)) {
      // Batch validation
      const results = await Promise.allSettled(urls.map((u: string) => checkUrl(u)))

      return NextResponse.json({
        results: results.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value
          } else {
            return {
              url: urls[index],
              isValid: false,
              error: result.reason?.message || "Validation failed",
              checkedAt: new Date().toISOString(),
            }
          }
        }),
      })
    } else if (url) {
      // Single URL validation
      const result = await checkUrl(url)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: "Missing 'url' or 'urls' parameter" },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    )
  }
}

// GET endpoint for single URL validation (query parameter)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 })
  }

  const result = await checkUrl(url)
  return NextResponse.json(result)
}

