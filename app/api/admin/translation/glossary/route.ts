import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import {
  getTranslationGlossary,
  createTranslationGlossary,
  updateTranslationGlossary,
  deleteTranslationGlossary,
  getTranslationGlossaryById,
} from "@/lib/storage-server"
import type { TranslationGlossary } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

/**
 * GET /api/admin/translation/glossary
 * Returns glossary entries with optional filters
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const languageCode = searchParams.get("language") || ""
    const search = searchParams.get("search") || ""

    let glossary = getTranslationGlossary()

    // Apply language filter
    if (languageCode) {
      glossary = glossary.filter((g) => g.targetLanguage === languageCode)
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      glossary = glossary.filter(
        (g) =>
          g.sourceTerm.toLowerCase().includes(searchLower) ||
          g.targetTerm.toLowerCase().includes(searchLower) ||
          g.context?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      glossary,
      total: glossary.length,
    })
  } catch (error) {
    console.error("Error fetching glossary:", error)
    return NextResponse.json(
      { error: "Failed to fetch glossary" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/translation/glossary
 * Creates a new glossary entry
 * Requires admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { sourceTerm, targetLanguage, targetTerm, context, category } = body

    if (!sourceTerm || !targetLanguage || !targetTerm) {
      return NextResponse.json(
        { error: "sourceTerm, targetLanguage, and targetTerm are required" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const glossaryEntry: TranslationGlossary = {
      id: uuidv4(),
      sourceTerm,
      targetLanguage,
      targetTerm,
      context,
      category,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
    }

    createTranslationGlossary(glossaryEntry)

    return NextResponse.json({
      success: true,
      glossary: glossaryEntry,
    })
  } catch (error) {
    console.error("Error creating glossary entry:", error)
    return NextResponse.json(
      { error: "Failed to create glossary entry" },
      { status: 500 }
    )
  }
}

