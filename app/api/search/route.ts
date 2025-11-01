import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

// Request validation schema
const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  species: z.string().optional(),
  tags: z.string().optional(),
  type: z.string().optional(),
})

// Expand query with synonyms
async function expandQueryWithSynonyms(query: string): Promise<string> {
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

  // Deduplicate and return as a space-separated string
  return Array.from(new Set(expandedTerms)).join(" ")
}

// Build FTS query with ranking weights
function buildFTSQuery(expandedQuery: string): string {
  // Escape special characters for ts_query
  const escaped = expandedQuery
    .replace(/[():&!]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `${term}:*`)
    .join(" & ")

  return escaped
}

// Perform FTS search with ranking
async function performFTSSearch(
  query: string,
  limit: number,
  offset: number
) {
  // Convert query to tsvector format for ranking
  const tsQuery = buildFTSQuery(query)

  // Build ranked search query with weights
  // Weights: A=title(1.0), B=type(0.5), C=content(0.25)
  const results = (await db.$queryRawUnsafe(`
    WITH ranked_posts AS (
      SELECT 
        bp.id,
        bp."petId",
        bp."authorId",
        bp.title,
        bp.content,
        bp.type,
        COALESCE(
          (
            setweight(to_tsvector('english', bp.title), 'A') ||
            setweight(to_tsvector('english', COALESCE(bp.type, '')), 'B') ||
            setweight(to_tsvector('english', bp.content), 'C')
          ),
          to_tsvector('')
        ) AS search_vector
      FROM blog_posts bp
      WHERE bp."isDraft" = false 
        AND bp.privacy = 'public'
    )
    SELECT 
      rp.id,
      rp."petId",
      rp."authorId",
      rp.title,
      rp.content,
      rp.type,
      ts_rank_cd(rp.search_vector, to_tsquery('english', $1)) AS rank,
      ts_headline('english', rp.content, to_tsquery('english', $1), 'MaxWords=30, MinWords=10') AS snippet
    FROM ranked_posts rp
    WHERE rp.search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC, rp."createdAt" DESC
    LIMIT $2 OFFSET $3
  `, tsQuery, limit, offset)) as Array<{
    id: string
    petId: string
    authorId: string
    title: string
    content: string
    type: string
    rank: number
    snippet: string
  }>

  return results
}

// Log search telemetry
async function logSearchTelemetry(
  query: string,
  resultCount: number,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    await db.searchTelemetry.create({
      data: {
        query,
        resultCount,
        hasResults: resultCount > 0,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    })
  } catch (error) {
    console.error("Failed to log search telemetry:", error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = {
      q: searchParams.get("q") ?? "",
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    }

    const validation = searchSchema.safeParse(params)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { q, limit, offset } = validation.data

    // Expand query with synonyms
    const expandedQuery = await expandQueryWithSynonyms(q)

    // Perform FTS search
    const results = await performFTSSearch(expandedQuery, limit, offset)

    // Log telemetry
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")
    await logSearchTelemetry(q, results.length, ipAddress, userAgent)

    // Return results
    return NextResponse.json({
      query: q,
      results: results.map((r) => ({
        id: r.id,
        petId: r.petId,
        authorId: r.authorId,
        title: r.title,
        snippet: r.snippet,
        type: r.type,
        relevance: r.rank,
      })),
      pagination: {
        total: results.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST endpoint for creating/updating synonyms
const synonymSchema = z.object({
  term: z.string().min(1).max(50),
  synonyms: z.array(z.string()).min(1).max(20),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = synonymSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { term, synonyms } = validation.data

    // Upsert synonym entry
    const result = await db.synonym.upsert({
      where: { term: term.toLowerCase() },
      update: { synonyms: synonyms.map((s) => s.toLowerCase()) },
      create: {
        term: term.toLowerCase(),
        synonyms: synonyms.map((s) => s.toLowerCase()),
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Synonym creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

