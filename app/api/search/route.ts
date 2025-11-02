import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { calculateDistance, filterPlacesByRadius, type LatLng } from "@/lib/utils/geo-search"

// Entity types that can be searched
export type EntityType = "pets" | "posts" | "wiki" | "places" | "groups"

// Request validation schema
const searchSchema = z.object({
  q: z.string().min(1).max(200),
  types: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (!val) return undefined
      const types = val.split(",").map((t) => t.trim().toLowerCase())
      const validTypes: EntityType[] = ["pets", "posts", "wiki", "places", "groups"]
      return types.filter((t) => validTypes.includes(t as EntityType)) as EntityType[]
    })
    .optional(),
  limit: z
    .union([z.null(), z.undefined(), z.coerce.number().int().min(1).max(100)])
    .transform((val) => (val === null || val === undefined ? 20 : val)),
  offset: z
    .union([z.null(), z.undefined(), z.coerce.number().int().min(0)])
    .transform((val) => (val === null || val === undefined ? 0 : val)),
  species: z.union([z.string(), z.null(), z.undefined()]).transform((val) => val || undefined).optional(),
  tags: z.union([z.string(), z.null(), z.undefined()]).transform((val) => val || undefined).optional(),
  type: z.union([z.string(), z.null(), z.undefined()]).transform((val) => val || undefined).optional(), // Post type filter
  lat: z.union([z.string(), z.null(), z.undefined()]).transform((val) => (val ? parseFloat(val) : undefined)).optional(),
  lng: z.union([z.string(), z.null(), z.undefined()]).transform((val) => (val ? parseFloat(val) : undefined)).optional(),
  radius: z.union([z.string(), z.null(), z.undefined()]).transform((val) => (val ? parseFloat(val) : undefined)).optional(), // Radius in km
})

// Expand query with synonyms (bidirectional)
async function expandQueryWithSynonyms(query: string): Promise<string> {
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

    // Also check reverse direction - find entries where this word is a synonym
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

// Search Blog Posts
async function searchPosts(
  query: string,
  limit: number,
  offset: number,
  filters?: {
    species?: string
    tags?: string
    type?: string
  }
) {
  const tsQuery = buildFTSQuery(query)
  const filterConditions: string[] = []
  const filterParams: any[] = []
  let paramCounter = 3

  if (filters?.tags) {
    const tagList = filters.tags.split(",").map((t) => t.trim())
    filterConditions.push(
      `bp.id IN (SELECT bpt."postId" FROM blog_post_tags bpt WHERE bpt.tag = ANY($${++paramCounter}))`
    )
    filterParams.push(tagList)
  }

  if (filters?.type) {
    filterConditions.push(`bp.type = $${++paramCounter}`)
    filterParams.push(filters.type)
  }

  const whereClause = filterConditions.length > 0 ? `AND ${filterConditions.join(" AND ")}` : ""

  const results = (await db.$queryRawUnsafe(
    `
    WITH ranked_posts AS (
      SELECT 
        bp.id,
        bp."petId",
        bp."authorId",
        bp.title,
        bp.content,
        bp.type,
        bp.tags,
        bp."hashtags",
        bp."createdAt",
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
        AND (bp."deletedAt" IS NULL)
        ${whereClause}
    )
    SELECT 
      rp.id,
      rp."petId",
      rp."authorId",
      rp.title,
      rp.content,
      rp.type,
      rp.tags,
      rp."hashtags",
      rp."createdAt",
      ts_rank_cd(rp.search_vector, to_tsquery('english', $1)) AS rank,
      ts_headline('english', rp.content, to_tsquery('english', $1), 'MaxWords=30, MinWords=10') AS snippet
    FROM ranked_posts rp
    WHERE rp.search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC, rp."createdAt" DESC
    LIMIT $2 OFFSET $3
  `,
    tsQuery,
    limit,
    offset,
    ...filterParams
  )) as Array<{
    id: string
    petId: string
    authorId: string
    title: string
    content: string
    type: string
    tags: string[]
    hashtags: string[]
    createdAt: Date
    rank: number
    snippet: string
  }>

  return results.map((r) => ({
    entityType: "posts" as EntityType,
    id: r.id,
    petId: r.petId,
    authorId: r.authorId,
    title: r.title,
    snippet: r.snippet,
    type: r.type,
    tags: r.tags,
    hashtags: r.hashtags,
    relevance: r.rank,
    createdAt: r.createdAt.toISOString(),
  }))
}

// Search Wiki Articles
async function searchWiki(
  query: string,
  limit: number,
  offset: number,
  filters?: {
    tags?: string
  }
) {
  const tsQuery = buildFTSQuery(query)
  const filterConditions: string[] = []
  const filterParams: any[] = []
  let paramCounter = 3

  if (filters?.tags) {
    const tagList = filters.tags.split(",").map((t) => t.trim())
    filterConditions.push(
      `a.id IN (SELECT at."articleId" FROM article_tags at WHERE at.tag = ANY($${++paramCounter}))`
    )
    filterParams.push(tagList)
  }

  const whereClause = filterConditions.length > 0 ? `AND ${filterConditions.join(" AND ")}` : ""

  const results = (await db.$queryRawUnsafe(
    `
    WITH ranked_articles AS (
      SELECT 
        a.id,
        a.slug,
        a.title,
        a.type,
        a."createdAt",
        COALESCE(
          (
            setweight(to_tsvector('english', a.title), 'A') ||
            setweight(to_tsvector('english', COALESCE(a.type, '')), 'B')
          ),
          to_tsvector('')
        ) AS search_vector
      FROM articles a
      WHERE a.status = 'approved'
        AND (a."deletedAt" IS NULL)
        ${whereClause}
    )
    SELECT 
      ra.id,
      ra.slug,
      ra.title,
      ra.type,
      ra."createdAt",
      ts_rank_cd(ra.search_vector, to_tsquery('english', $1)) AS rank,
      ts_headline('english', ra.title, to_tsquery('english', $1), 'MaxWords=20') AS snippet
    FROM ranked_articles ra
    WHERE ra.search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC, ra."createdAt" DESC
    LIMIT $2 OFFSET $3
  `,
    tsQuery,
    limit,
    offset,
    ...filterParams
  )) as Array<{
    id: string
    slug: string
    title: string
    type: string
    createdAt: Date
    rank: number
    snippet: string
  }>

  return results.map((r) => ({
    entityType: "wiki" as EntityType,
    id: r.id,
    slug: r.slug,
    title: r.title,
    snippet: r.snippet || r.title,
    type: r.type,
    relevance: r.rank,
    createdAt: r.createdAt.toISOString(),
  }))
}

// Search Places
async function searchPlaces(
  query: string,
  limit: number,
  offset: number,
  latLng?: LatLng,
  radiusKm?: number
) {
  const queryLower = query.toLowerCase()
  const queryTerms = queryLower.split(/\s+/).filter(Boolean)

  let places = await db.place.findMany({
    where: {
      moderationStatus: "approved",
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        ...queryTerms.map((term) => ({
          amenities: { has: term },
        })),
      ],
    },
    include: {
      city: true,
    },
    take: limit * 2, // Get more results for geo filtering
    skip: offset,
    orderBy: { name: "asc" },
  })

  // Apply geo filtering if latLng and radius provided
  if (latLng && radiusKm) {
    const placesWithDistance = filterPlacesByRadius(
      places.map((p) => ({
        ...p,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      latLng,
      radiusKm
    )

    return placesWithDistance.slice(0, limit).map((p) => ({
      entityType: "places" as EntityType,
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city.name,
      latitude: p.latitude,
      longitude: p.longitude,
      amenities: p.amenities,
      distance: p.distance,
      relevance: 1 - p.distance / (radiusKm * 2), // Normalize distance to relevance score
      createdAt: p.createdAt.toISOString(),
    }))
  }

  return places.slice(0, limit).map((p) => ({
    entityType: "places" as EntityType,
    id: p.id,
    name: p.name,
    address: p.address,
    city: p.city.name,
    latitude: p.latitude,
    longitude: p.longitude,
    amenities: p.amenities,
    relevance: 1.0,
    createdAt: p.createdAt.toISOString(),
  }))
}

// Search Pets (from localStorage - client-side or via storage API)
async function searchPets(
  query: string,
  limit: number,
  offset: number,
  filters?: {
    species?: string
  }
) {
  try {
    const { getPets } = await import("@/lib/storage")
    const allPets = getPets()
    const queryLower = query.toLowerCase()
    const queryTerms = queryLower.split(/\s+/).filter(Boolean)

    let results = allPets.filter((pet) => {
      // Filter by species if provided
      if (filters?.species && pet.species !== filters.species) {
        return false
      }

      // Search in name, breed, bio
      const searchableText = [
        pet.name,
        pet.breed,
        pet.bio,
        pet.species,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return queryTerms.some((term) => searchableText.includes(term))
    })

    // Sort by relevance (exact name match first, then breed, then bio)
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(queryLower) ? 1 : 0
      const bNameMatch = b.name.toLowerCase().includes(queryLower) ? 1 : 0
      if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch

      const aBreedMatch = a.breed?.toLowerCase().includes(queryLower) ? 1 : 0
      const bBreedMatch = b.breed?.toLowerCase().includes(queryLower) ? 1 : 0
      if (aBreedMatch !== bBreedMatch) return bBreedMatch - aBreedMatch

      return 0
    })

    return results.slice(offset, offset + limit).map((pet) => ({
      entityType: "pets" as EntityType,
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      bio: pet.bio,
      avatar: pet.avatar,
      relevance: 1.0,
    }))
  } catch (error) {
    console.error("Error searching pets:", error)
    return []
  }
}

// Search Groups (from localStorage)
async function searchGroups(
  query: string,
  limit: number,
  offset: number
) {
  try {
    const { getGroups } = await import("@/lib/storage")
    const allGroups = getGroups()
    const queryLower = query.toLowerCase()
    const queryTerms = queryLower.split(/\s+/).filter(Boolean)

    let results = allGroups.filter((group) => {
      const searchableText = [
        group.name,
        group.description,
        ...(group.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return queryTerms.some((term) => searchableText.includes(term))
    })

    // Sort by relevance (name match first)
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(queryLower) ? 1 : 0
      const bNameMatch = b.name.toLowerCase().includes(queryLower) ? 1 : 0
      return bNameMatch - aNameMatch
    })

    return results.slice(offset, offset + limit).map((group) => ({
      entityType: "groups" as EntityType,
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      coverImage: group.coverImage,
      tags: group.tags,
      relevance: 1.0,
      createdAt: group.createdAt,
    }))
  } catch (error) {
    console.error("Error searching groups:", error)
    return []
  }
}

// Perform cross-entity search
export async function performCrossEntitySearch(
  query: string,
  entityTypes: EntityType[] | undefined,
  limit: number,
  offset: number,
  filters?: {
    species?: string
    tags?: string
    type?: string
  },
  latLng?: LatLng,
  radiusKm?: number
) {
  const typesToSearch = entityTypes && entityTypes.length > 0 ? entityTypes : (["pets", "posts", "wiki", "places", "groups"] as EntityType[])
  const resultsPerType = Math.ceil(limit / typesToSearch.length)

  const searchPromises: Promise<any[]>[] = []

  if (typesToSearch.includes("posts")) {
    searchPromises.push(searchPosts(query, resultsPerType, 0, filters))
  }
  if (typesToSearch.includes("wiki")) {
    searchPromises.push(searchWiki(query, resultsPerType, 0, filters))
  }
  if (typesToSearch.includes("places")) {
    searchPromises.push(searchPlaces(query, resultsPerType, 0, latLng, radiusKm))
  }
  if (typesToSearch.includes("pets")) {
    searchPromises.push(searchPets(query, resultsPerType, 0, filters))
  }
  if (typesToSearch.includes("groups")) {
    searchPromises.push(searchGroups(query, resultsPerType, 0))
  }

  const allResults = await Promise.all(searchPromises)
  const flatResults = allResults.flat()

  // Sort by relevance across all entities
  flatResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0))

  // Apply pagination
  return flatResults.slice(offset, offset + limit)
}

// Get facets for search results
async function getFacets(query: string, entityTypes: EntityType[] | undefined) {
  const typesToSearch = entityTypes && entityTypes.length > 0 ? entityTypes : (["pets", "posts", "wiki", "places", "groups"] as EntityType[])
  const facets: {
    species?: Record<string, number>
    tags?: Record<string, number>
    postTypes?: Record<string, number>
  } = {}

  // Get species counts (for pets and posts)
  if (typesToSearch.includes("pets") || typesToSearch.includes("posts")) {
    try {
      const { getPets } = await import("@/lib/storage")
      const pets = getPets()
      const speciesCounts: Record<string, number> = {}
      pets.forEach((pet) => {
        speciesCounts[pet.species] = (speciesCounts[pet.species] || 0) + 1
      })
      facets.species = speciesCounts
    } catch (error) {
      console.error("Error getting species facets:", error)
    }
  }

  // Get tag counts (for posts and wiki)
  if (typesToSearch.includes("posts") || typesToSearch.includes("wiki")) {
    try {
      const postTags = await db.blogPostTag.groupBy({
        by: ["tag"],
        _count: { tag: true },
        orderBy: { _count: { tag: "desc" } },
        take: 50,
      })
      const tagCounts: Record<string, number> = {}
      postTags.forEach((item) => {
        tagCounts[item.tag] = item._count.tag
      })

      // Add wiki tags
      const wikiTags = await db.articleTag.groupBy({
        by: ["tag"],
        _count: { tag: true },
        orderBy: { _count: { tag: "desc" } },
        take: 50,
      })
      wikiTags.forEach((item) => {
        tagCounts[item.tag] = (tagCounts[item.tag] || 0) + item._count.tag
      })

      facets.tags = tagCounts
    } catch (error) {
      console.error("Error getting tag facets:", error)
    }
  }

  // Get post type counts
  if (typesToSearch.includes("posts")) {
    try {
      const postTypes = await db.blogPost.groupBy({
        by: ["type"],
        _count: { type: true },
        where: {
          isDraft: false,
          privacy: "public",
          deletedAt: null,
        },
      })
      const typeCounts: Record<string, number> = {}
      postTypes.forEach((item) => {
        typeCounts[item.type] = item._count.type
      })
      facets.postTypes = typeCounts
    } catch (error) {
      console.error("Error getting post type facets:", error)
    }
  }

  return facets
}

// Log search telemetry
async function logSearchTelemetry(
  query: string,
  resultCount: number,
  entityTypes: EntityType[] | undefined,
  filters?: any,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    await db.searchTelemetry.create({
      data: {
        query,
        resultCount,
        hasResults: resultCount > 0,
        zeroResultQuery: resultCount === 0,
        entityTypes: entityTypes || [],
        filters: filters ? JSON.parse(JSON.stringify(filters)) : null,
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
      types: searchParams.get("types"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      species: searchParams.get("species"),
      tags: searchParams.get("tags"),
      type: searchParams.get("type"),
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius"),
    }

    const validation = searchSchema.safeParse(params)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { q, types, limit, offset, species, tags, type, lat, lng, radius } = validation.data

    // Build filters object
    const filters = {
      species: species || undefined,
      tags: tags || undefined,
      type: type || undefined,
    }

    // Build latLng if provided
    const latLng: LatLng | undefined = lat && lng ? { lat, lng } : undefined

    // Expand query with synonyms
    const expandedQuery = await expandQueryWithSynonyms(q)

    // Perform cross-entity search
    const results = await performCrossEntitySearch(
      expandedQuery,
      types,
      limit,
      offset,
      filters,
      latLng,
      radius
    )

    // Get facets
    const facets = await getFacets(expandedQuery, types)

    // Log telemetry
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")
    await logSearchTelemetry(q, results.length, types, filters, ipAddress, userAgent)

    // Return results
    return NextResponse.json({
      query: q,
      hits: results,
      facets,
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
