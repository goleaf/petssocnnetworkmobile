import { NextRequest, NextResponse } from "next/server"
import { promoteBlogSectionToWiki } from "@/lib/actions/blog"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, blockId, options } = body
    
    if (!postId || !blockId) {
      return NextResponse.json(
        { error: "postId and blockId are required" },
        { status: 400 }
      )
    }
    
    const result = await promoteBlogSectionToWiki(postId, blockId, options)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to promote section" },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ article: result.article })
  } catch (error) {
    console.error("Error promoting blog section to wiki:", error)
    return NextResponse.json(
      { error: "Failed to promote section to wiki" },
      { status: 500 }
    )
  }
}

