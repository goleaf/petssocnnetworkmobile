import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

// Request validation schema
const autocompleteSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1).max(20).default(10)
  ),
})

// Expand query with synonyms for autocomplete
async function expandQueryWithSynonyms(query: string): Promise<string[]> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const expandedTerms: string[] = []

  for (const word of words) {
    expandedTerms.push(word)
    
    // Look up synonyms for this term
    const synonymEntry = await db.synonym.findUnique({
      where: { term: word },
    })

    if (synonymEntry && synonymEntry.synonyms.length > 0) {
      // Add synonyms to search terms
      expandedTerms.push(...synonymEntry.synonyms)
    }
  }

  // Deduplicate and return as array
  return Array.from(new Set(expandedTerms))
}

// Perform type-ahead search on article titles
async function performArticleAutocomplete(
  queries: string[],
  limit: number
): Promise<Array<{ id: string; title: string; slug: string; type: string }>> {
  if (queries.length === 0) {
    return []
  }

  // Use ILIKE for case-insensitive prefix matching on titles
  const conditions = queries.map((q, idx) => 
    `a.title ILIKE $${idx + 1}`
  ).join(' OR ')
  
  const searchTerms = queries.map(q => `${q}%`)
  const primaryQuery = queries[0]
  const primaryQueryPrefix = `${primaryQuery}%`
  const primaryQueryAnywhere = `%${primaryQuery}%`
  
  // Use parameterized query for ORDER BY to prevent SQL injection
  const results = (await db.$queryRawUnsafe(`
    SELECT DISTINCT
      a.id,
      a.title,
      a.slug,
      a.type
    FROM articles a
    WHERE a.status = 'approved'
      AND (${conditions})
    ORDER BY 
      CASE 
        WHEN a.title ILIKE $${queries.length + 1} THEN 1
        WHEN a.title ILIKE $${queries.length + 2} THEN 2
        ELSE 3
      END,
      LENGTH(a.title) ASC,
      a.title ASC
    LIMIT $${queries.length + 3}
  `, ...searchTerms, primaryQueryPrefix, primaryQueryAnywhere, limit)) as Array<{
    id: string
    title: string
    slug: string
    type: string
  }>

  return results
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = {
      q: searchParams.get("q") ?? "",
      limit: searchParams.get("limit"),
    }

    const validation = autocompleteSchema.safeParse(params)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { q, limit } = validation.data

    // Expand query with synonyms
    const expandedQueries = await expandQueryWithSynonyms(q)

    // Perform autocomplete search
    const results = await performArticleAutocomplete(expandedQueries, limit)

    // Return results
    return NextResponse.json({
      query: q,
      suggestions: results.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        type: r.type,
      })),
    })
  } catch (error) {
    console.error("Article autocomplete API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

