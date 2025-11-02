import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { getWikiTranslationById, updateWikiTranslation } from "@/lib/storage-server"
import type { WikiTranslation } from "@/lib/types"

/**
 * POST /api/admin/translation/[id]/assign
 * Assigns a translator to a translation
 * Requires admin role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { translatorId } = body

    if (!translatorId || typeof translatorId !== "string") {
      return NextResponse.json(
        { error: "translatorId is required" },
        { status: 400 }
      )
    }

    // Get translation
    const translation = getWikiTranslationById(id)
    if (!translation) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      )
    }

    // Update translation with translatorId
    updateWikiTranslation(id, {
      translatorId,
      updatedAt: new Date().toISOString(),
    } as Partial<WikiTranslation & { translatorId?: string }>)

    return NextResponse.json({
      success: true,
      translation: {
        ...translation,
        translatorId,
      },
    })
  } catch (error) {
    console.error("Error assigning translator:", error)
    return NextResponse.json(
      { error: "Failed to assign translator" },
      { status: 500 }
    )
  }
}

