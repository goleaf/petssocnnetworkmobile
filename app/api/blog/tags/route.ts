import { NextRequest, NextResponse } from "next/server"
import { getTagsSuggest } from "@/lib/actions/blog"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const prefix = searchParams.get("prefix") || ""
    const maxResults = parseInt(searchParams.get("max") || "10", 10)
    
    const suggestions = await getTagsSuggest(prefix, maxResults)
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error fetching tag suggestions:", error)
    return NextResponse.json(
      { error: "Failed to fetch tag suggestions" },
      { status: 500 }
    )
  }
}

