import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { getWikiTranslations, getWikiArticles } from "@/lib/storage-server"
import type { WikiTranslation, TranslationStatus } from "@/lib/types"

/**
 * GET /api/admin/translation
 * Returns paginated list of translations with filters (language, status)
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
    const status = searchParams.get("status") || ""
    const translatorId = searchParams.get("translatorId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "updatedAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Get all translations
    let translations = getWikiTranslations()

    // Apply language filter
    if (languageCode) {
      translations = translations.filter((t) => t.languageCode === languageCode)
    }

    // Apply status filter
    if (status) {
      translations = translations.filter((t) => t.status === status)
    }

    // Apply translator filter
    if (translatorId) {
      translations = translations.filter(
        (t) => (t as WikiTranslation & { translatorId?: string }).translatorId === translatorId
      )
    }

    // Get articles for additional context
    const articles = getWikiArticles()
    const articlesMap = new Map(articles.map((a) => [a.id, a]))

    // Enrich translations with article info
    const enrichedTranslations = translations.map((translation) => {
      const article = articlesMap.get(translation.articleId)
      return {
        ...translation,
        articleTitle: article?.title || "Unknown Article",
        articleSlug: article?.slug || "",
      }
    })

    // Sort
    enrichedTranslations.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    })

    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTranslations = enrichedTranslations.slice(startIndex, endIndex)

    // Count translations by status for stats
    const translationsByStatus: Record<TranslationStatus | "missing", number> = {
      draft: 0,
      published: 0,
      review: 0,
      missing: 0,
    }

    const allArticles = getWikiArticles()
    const allTranslations = getWikiTranslations()
    const baseLanguage = "en" // Assuming English is base language

    // Count missing translations (articles without translation for each language)
    const languages = Array.from(new Set(allTranslations.map((t) => t.languageCode)))
    languages.forEach((lang) => {
      const translatedArticleIds = new Set(
        allTranslations.filter((t) => t.languageCode === lang && t.status === "published").map((t) => t.articleId)
      )
      const missingCount = allArticles.filter((a) => a.baseLanguage === baseLanguage && !translatedArticleIds.has(a.id)).length
      translationsByStatus.missing += missingCount
    })

    // Count by status
    allTranslations.forEach((t) => {
      translationsByStatus[t.status] = (translationsByStatus[t.status] || 0) + 1
    })

    return NextResponse.json({
      translations: paginatedTranslations,
      pagination: {
        page,
        limit,
        total: enrichedTranslations.length,
        totalPages: Math.ceil(enrichedTranslations.length / limit),
      },
      stats: {
        byStatus: translationsByStatus,
        totalTranslations: allTranslations.length,
        totalArticles: allArticles.length,
      },
    })
  } catch (error) {
    console.error("Error fetching translations:", error)
    return NextResponse.json(
      { error: "Failed to fetch translations" },
      { status: 500 }
    )
  }
}

