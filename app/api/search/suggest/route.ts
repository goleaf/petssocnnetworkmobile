import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import type { EntityType } from "../route"

// Request validation schema
const suggestSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z
    .coerce.number()
    .int()
    .min(1)
    .max(20)
    .default(10),
})

// Expand query with synonyms (bidirectional)
async function expandQueryWithSynonyms(query: string): Promise<string[]> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const expandedTerms: string[] = []

  for (const word of words) {
    expandedTerms.push(word)
    
    // Look up synonyms for this term (forward direction)
    const synonymEntry = await db.synonym.findUnique({
      where: { term: word },
    })

    if (synonymEntry && synonymEntry.synonyms.length > 0) {
      expandedTerms.push(...synonymEntry.synonyms)
    }

    // Also check reverse direction
    const reverseSynonym = await db.synonym.findMany({
      where: {
        synonyms: {
          has: word,
        },
      },
    })

    for (const entry of reverseSynonym) {
      expandedTerms.push(entry.term)
      if (entry.synonyms.length > 0) {
        expandedTerms.push(...entry.synonyms.filter((s) => s !== word))
      }
    }
  }

  return Array.from(new Set(expandedTerms))
}

// Suggest entities for typeahead
async function suggestEntities(
  queries: string[],
  limit: number
): Promise<Array<{
  entityType: EntityType
  id: string
  title: string
  snippet: string
}>> {
  const suggestions: Array<{
    entityType: EntityType
    id: string
    title: string
    snippet: string
  }> = []

  // Search Posts
  const postConditions = queries.map((q, idx) => 
    `bp.title ILIKE $${idx + 1}`
  ).join(' OR ')
  
  const postSearchTerms = queries.map(q => `${q}%`)
  
  if (queries.length > 0) {
    const posts = (await db.$queryRawUnsafe(`
      SELECT DISTINCT
        bp.id,
        bp.title,
        LEFT(bp.content, 100) as snippet
      FROM blog_posts bp
      WHERE bp."isDraft" = false 
        AND bp.privacy = 'public'
        AND (bp."deletedAt" IS NULL)
        AND (${postConditions})
      ORDER BY 
        CASE 
          WHEN bp.title ILIKE '${queries[0]}%' THEN 1
          WHEN bp.title ILIKE '%${queries[0]}%' THEN 2
          ELSE 3
        END,
        LENGTH(bp.title) ASC,
        bp.title ASC
      LIMIT ${Math.ceil(limit / 2)}
    `, ...postSearchTerms)) as Array<{
      id: string
      title: string
      snippet: string
    }>

    suggestions.push(
      ...posts.map((p) => ({
        entityType: "posts" as EntityType,
        id: p.id,
        title: p.title,
        snippet: p.snippet || p.title,
      }))
    )
  }

  // Search Wiki Articles
  if (queries.length > 0 && suggestions.length < limit) {
    const wikiConditions = queries.map((q, idx) => 
      `a.title ILIKE $${postSearchTerms.length + idx + 1}`
    ).join(' OR ')
    
    const wikiSearchTerms = queries.map(q => `${q}%`)
    
    const articles = (await db.$queryRawUnsafe(`
      SELECT DISTINCT
        a.id,
        a.title,
        a.slug
      FROM articles a
      WHERE a.status = 'approved'
        AND (a."deletedAt" IS NULL)
        AND (${wikiConditions})
      ORDER BY 
        CASE 
          WHEN a.title ILIKE '${queries[0]}%' THEN 1
          WHEN a.title ILIKE '%${queries[0]}%' THEN 2
          ELSE 3
        END,
        LENGTH(a.title) ASC,
        a.title ASC
      LIMIT ${Math.ceil(limit / 2)}
    `, ...postSearchTerms, ...wikiSearchTerms)) as Array<{
      id: string
      title: string
      slug: string
    }>

    suggestions.push(
      ...articles.map((a) => ({
        entityType: "wiki" as EntityType,
        id: a.id,
        title: a.title,
        snippet: a.title, // Wiki articles don't have snippet in this query
      }))
    )
  }

  // Search Places
  if (queries.length > 0 && suggestions.length < limit) {
    const placeQuery = queries[0]
    const places = await db.place.findMany({
      where: {
        moderationStatus: "approved",
        deletedAt: null,
        OR: [
          { name: { contains: placeQuery, mode: "insensitive" } },
          { address: { contains: placeQuery, mode: "insensitive" } },
        ],
      },
      take: Math.ceil((limit - suggestions.length) / 3),
      orderBy: { name: "asc" },
    })

    suggestions.push(
      ...places.map((p) => ({
        entityType: "places" as EntityType,
        id: p.id,
        title: p.name,
        snippet: p.address,
      }))
    )
  }

  // Search Pets (from localStorage)
  if (queries.length > 0 && suggestions.length < limit) {
    try {
      const { getPets } = await import("@/lib/storage")
      const allPets = getPets()
      const petQuery = queries[0].toLowerCase()

      const matchingPets = allPets
        .filter((pet) => {
          const searchableText = [pet.name, pet.breed, pet.species].filter(Boolean).join(" ").toLowerCase()
          return searchableText.includes(petQuery)
        })
        .slice(0, Math.ceil((limit - suggestions.length) / 3))

      suggestions.push(
        ...matchingPets.map((pet) => ({
          entityType: "pets" as EntityType,
          id: pet.id,
          title: pet.name,
          snippet: pet.breed ? `${pet.species} - ${pet.breed}` : pet.species,
        }))
      )
    } catch (error) {
      console.error("Error searching pets in suggest:", error)
    }
  }

  // Search Groups (from localStorage)
  if (queries.length > 0 && suggestions.length < limit) {
    try {
      const { getGroups } = await import("@/lib/storage")
      const allGroups = getGroups()
      const groupQuery = queries[0].toLowerCase()

      const matchingGroups = allGroups
        .filter((group) => {
          const searchableText = [group.name, group.description].filter(Boolean).join(" ").toLowerCase()
          return searchableText.includes(groupQuery)
        })
        .slice(0, Math.ceil((limit - suggestions.length) / 3))

      suggestions.push(
        ...matchingGroups.map((group) => ({
          entityType: "groups" as EntityType,
          id: group.id,
          title: group.name,
          snippet: group.description || "",
        }))
      )
    } catch (error) {
      console.error("Error searching groups in suggest:", error)
    }
  }

  // Sort and limit results
  return suggestions.slice(0, limit)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      q: searchParams.get("q") ?? "",
      limit: searchParams.get("limit"),
    }

    const validation = suggestSchema.safeParse(params)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { q, limit } = validation.data

    // Expand query with synonyms
    const expandedQueries = await expandQueryWithSynonyms(q)

    // Get suggestions
    const entities = await suggestEntities(expandedQueries, limit)

    return NextResponse.json({
      query: q,
      suggestions: entities,
    })
  } catch (error) {
    console.error("Suggest API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

