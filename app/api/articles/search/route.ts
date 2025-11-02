import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

// Request validation schema
const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1).max(100).default(20)
  ),
  offset: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0).default(0)
  ),
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

// Extract text from JSONB content for snippets
function extractTextFromContentJSON(contentJSON: any): string {
  if (!contentJSON) return ""
  
  try {
    if (typeof contentJSON === 'string') {
      return contentJSON
    }
    
    if (typeof contentJSON !== 'object') {
      return ""
    }

    let text = ""
    
    // Handle array of blocks
    if (Array.isArray(contentJSON)) {
      for (const block of contentJSON) {
        if (typeof block !== 'object') continue
        
        // Check for 'content' property
        if (block.content && Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.text) {
              text += " " + item.text
            }
          }
        } else if (block.text) {
          text += " " + block.text
        }
      }
    }
    
    return text.trim()
  } catch (error) {
    console.error("Error extracting text from JSON:", error)
    return ""
  }
}

// Perform FTS search with ranking for articles
async function performArticlesFTSSearch(
  query: string,
  limit: number,
  offset: number
) {
  // Convert query to tsvector format for ranking
  const tsQuery = buildFTSQuery(query)

  // Build ranked search query with weights
  // Weights: A=title(1.0), B=type(0.5), C=content(0.25)
  const results = (await db.$queryRawUnsafe(`
    WITH ranked_articles AS (
      SELECT 
        a.id,
        a.slug,
        a.title,
        a.type,
        a.status,
        a."createdById",
        a."createdAt",
        a."updatedAt",
        COALESCE(
          (
            setweight(to_tsvector('english', a.title), 'A') ||
            setweight(to_tsvector('english', COALESCE(a.type, '')), 'B')
          ),
          to_tsvector('')
        ) AS search_vector
      FROM articles a
      WHERE a.status = 'approved'
    )
    SELECT 
      ra.id,
      ra.slug,
      ra.title,
      ra.type,
      ra.status,
      ra."createdById",
      ra."createdAt",
      ra."updatedAt",
      ts_rank_cd(ra.search_vector, to_tsquery('english', $1)) AS rank
    FROM ranked_articles ra
    WHERE ra.search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC, ra."createdAt" DESC
    LIMIT $2 OFFSET $3
  `, tsQuery, limit, offset)) as Array<{
    id: string
    slug: string
    title: string
    type: string
    status: string
    createdById: string
    createdAt: Date
    updatedAt: Date
    rank: number
  }>

  return results
}

// Enhanced search that also searches revision content
async function performFullArticlesFTSSearch(
  query: string,
  limit: number,
  offset: number
) {
  const tsQuery = buildFTSQuery(query)

  // First try the basic search
  const basicResults = await performArticlesFTSSearch(query, limit * 2, offset)
  
  // Then search in revision content JSON
  const revisionResults = (await db.$queryRawUnsafe(`
    WITH revision_content AS (
      SELECT DISTINCT ON (r.article_id)
        r.article_id,
        r.content_json,
        r.rev,
        r."createdAt"
      FROM revisions r
      WHERE r.approved_at IS NOT NULL
      ORDER BY r.article_id, r.rev DESC
    ),
    searchable_content AS (
      SELECT 
        rc.article_id,
        jsonb_to_text(rc.content_json) AS content_text,
        rc."createdAt"
      FROM revision_content rc
    ),
    ranked_articles AS (
      SELECT 
        a.id,
        a.slug,
        a.title,
        a.type,
        a.status,
        a."createdById",
        a."createdAt",
        a."updatedAt",
        sc.content_text,
        COALESCE(
          (
            setweight(to_tsvector('english', a.title), 'A') ||
            setweight(to_tsvector('english', COALESCE(a.type, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(sc.content_text, '')), 'C')
          ),
          to_tsvector('')
        ) AS search_vector
      FROM articles a
      JOIN searchable_content sc ON a.id = sc.article_id
      WHERE a.status = 'approved'
    )
    SELECT 
      ra.id,
      ra.slug,
      ra.title,
      ra.type,
      ra.status,
      ra."createdById",
      ra."createdAt",
      ra."updatedAt",
      ts_rank_cd(ra.search_vector, to_tsquery('english', $1)) AS rank
    FROM ranked_articles ra
    WHERE ra.search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC, ra."createdAt" DESC
    LIMIT $2 OFFSET $3
  `, tsQuery, limit, offset)) as Array<{
    id: string
    slug: string
    title: string
    type: string
    status: string
    createdById: string
    createdAt: Date
    updatedAt: Date
    rank: number
  }>

  // Combine and deduplicate results
  const resultMap = new Map<string, any>()
  
  // Add basic results first (higher weight)
  for (const result of basicResults) {
    resultMap.set(result.id, { ...result, rank: result.rank * 1.5 })
  }
  
  // Add/update with revision results
  for (const result of revisionResults) {
    const existing = resultMap.get(result.id)
    if (existing) {
      // Keep the higher rank
      if (result.rank > existing.rank) {
        resultMap.set(result.id, result)
      }
    } else {
      resultMap.set(result.id, result)
    }
  }
  
  return Array.from(resultMap.values())
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
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
    const results = await performFullArticlesFTSSearch(expandedQuery, limit, offset)

    // Log telemetry
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")
    await logSearchTelemetry(q, results.length, ipAddress, userAgent)

    // Return results
    return NextResponse.json({
      query: q,
      results: results.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        relevance: r.rank,
      })),
      pagination: {
        total: results.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Article search API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

