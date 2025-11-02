import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import {
  getTranslationGlossaryById,
  updateTranslationGlossary,
  deleteTranslationGlossary,
} from "@/lib/storage-server"
import type { TranslationGlossary } from "@/lib/types"

/**
 * GET /api/admin/translation/glossary/[id]
 * Returns a single glossary entry
 * Requires admin role
 */
export async function GET(
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
    const glossary = getTranslationGlossaryById(id)

    if (!glossary) {
      return NextResponse.json(
        { error: "Glossary entry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ glossary })
  } catch (error) {
    console.error("Error fetching glossary entry:", error)
    return NextResponse.json(
      { error: "Failed to fetch glossary entry" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/translation/glossary/[id]
 * Updates a glossary entry
 * Requires admin role
 */
export async function PATCH(
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

    const glossary = getTranslationGlossaryById(id)
    if (!glossary) {
      return NextResponse.json(
        { error: "Glossary entry not found" },
        { status: 404 }
      )
    }

    const updates: Partial<TranslationGlossary> = {}
    if (body.sourceTerm !== undefined) updates.sourceTerm = body.sourceTerm
    if (body.targetLanguage !== undefined) updates.targetLanguage = body.targetLanguage
    if (body.targetTerm !== undefined) updates.targetTerm = body.targetTerm
    if (body.context !== undefined) updates.context = body.context
    if (body.category !== undefined) updates.category = body.category

    updateTranslationGlossary(id, updates)

    const updated = getTranslationGlossaryById(id)
    return NextResponse.json({
      success: true,
      glossary: updated,
    })
  } catch (error) {
    console.error("Error updating glossary entry:", error)
    return NextResponse.json(
      { error: "Failed to update glossary entry" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/translation/glossary/[id]
 * Deletes a glossary entry
 * Requires admin role
 */
export async function DELETE(
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

    const glossary = getTranslationGlossaryById(id)
    if (!glossary) {
      return NextResponse.json(
        { error: "Glossary entry not found" },
        { status: 404 }
      )
    }

    deleteTranslationGlossary(id)

    return NextResponse.json({
      success: true,
      message: "Glossary entry deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting glossary entry:", error)
    return NextResponse.json(
      { error: "Failed to delete glossary entry" },
      { status: 500 }
    )
  }
}

