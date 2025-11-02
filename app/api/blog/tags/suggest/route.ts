import { NextRequest, NextResponse } from "next/server"
import { getTagsSuggest } from "@/lib/actions/blog"

/**
 * GET /api/blog/tags/suggest?prefix=...
 * Get tag suggestions based on prefix
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const prefix = searchParams.get("prefix") || ""

    const suggestions = await getTagsSuggest(prefix)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error fetching tag suggestions:", error)
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}

