/**
 * Wiki Article Management Functions
 * 
 * Core functions for creating, editing, and managing wiki articles
 * with support for infoboxed types (Breed, Health, Place, Product)
 * and revision tracking with diffs.
 */

import type {
  WikiArticle,
  WikiRevision,
  WikiContentBlock,
  WikiArticleType,
  WikiRevisionStatus,
  Citation,
  Source,
  HealthArticleData,
  PlaceInfoboxData,
  ProductInfoboxData,
  RevisionDiff,
} from "./types"
import {
  generateStorageId,
  getWikiArticles,
  addWikiArticle,
  updateWikiArticle,
  getWikiRevisionsByArticleId,
  addWikiRevision,
  getWikiRevisionById,
  updateWikiRevision,
  getWikiArticleById,
} from "./storage"

/**
 * Create a new wiki article
 * 
 * @param params - Article creation parameters
 * @returns Created article
 */
export function createArticle(params: {
  type: WikiArticleType
  title: string
  infobox?: Record<string, unknown>
  blocks?: WikiContentBlock[]
  content?: string // Fallback for backward compatibility
  category?: string
  subcategory?: string
  species?: string[]
  coverImage?: string
  authorId: string
  tags?: string[]
}): WikiArticle {
  // Generate slug from title
  const slug = params.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  // Build infobox based on type
  const typeInfoboxes: Record<string, Record<string, unknown>> = {}
  
  if (params.type === "breed" && params.infobox) {
    typeInfoboxes.breedData = params.infobox
  } else if (params.type === "health" && params.infobox) {
    typeInfoboxes.healthData = params.infobox as HealthArticleData
  } else if (params.type === "place" && params.infobox) {
    typeInfoboxes.placeData = params.infobox as PlaceInfoboxData
  } else if (params.type === "product" && params.infobox) {
    typeInfoboxes.productData = params.infobox as ProductInfoboxData
  }

  const article: WikiArticle = {
    id: generateStorageId("wiki"),
    title: params.title,
    slug,
    type: params.type,
    category: (params.category as any) || params.type === "breed" ? "breeds" : params.type,
    subcategory: params.subcategory,
    species: params.species,
    content: params.content || "",
    blocks: params.blocks || [],
    coverImage: params.coverImage,
    authorId: params.authorId,
    views: 0,
    likes: [],
    tags: params.tags || [],
    relatedArticleIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...typeInfoboxes,
  }

  addWikiArticle(article)

  // Create initial revision
  const revision = createRevision(article.id, article.id, {
    authorId: params.authorId,
    blocks: params.blocks || [],
    infobox: params.infobox,
    summary: "Initial version",
    status: "approved",
  })

  // Link revision to article
  updateWikiArticle({
    ...article,
    currentRevisionId: revision.id,
  })

  return article
}

/**
 * Create a new revision for an article
 * 
 * @param articleId - Article ID
 * @param previousRevisionId - Previous revision ID for diff calculation
 * @param params - Revision parameters
 * @returns Created revision with diff
 */
export function createRevision(
  articleId: string,
  previousRevisionId: string,
  params: {
    authorId: string
    blocks: WikiContentBlock[]
    infobox?: Record<string, unknown>
    citations?: Citation[]
    summary?: string
    status?: WikiRevisionStatus
  }
): WikiRevision {
  const article = getWikiArticleById(articleId)
  if (!article) {
    throw new Error("Article not found")
  }

  const previousRevision = getWikiRevisionById(previousRevisionId)
  const revisions = getWikiRevisionsByArticleId(articleId)
  const nextRev = revisions.length > 0 ? Math.max(...revisions.map((r) => r.rev)) + 1 : 1

  // Calculate diff if previous revision exists
  const diff = previousRevision ? calculateDiff(previousRevision, params.blocks || [], params.infobox) : undefined

  const revision: WikiRevision = {
    id: generateStorageId("rev"),
    articleId,
    rev: nextRev,
    authorId: params.authorId,
    summary: params.summary,
    blocks: params.blocks || [],
    infobox: params.infobox,
    citations: params.citations || [],
    status: params.status || "pending",
    createdAt: new Date().toISOString(),
    diff,
  }

  addWikiRevision(revision)

  return revision
}

/**
 * Approve a revision
 * 
 * @param revisionId - Revision ID to approve
 * @param approverId - User ID approving the revision
 * @returns Success status and error if failed
 */
export function approveRevision(
  revisionId: string,
  approverId: string
): { success: boolean; error?: string } {
  const revision = getWikiRevisionById(revisionId)
  if (!revision) {
    return { success: false, error: "Revision not found" }
  }

  if (revision.status === "approved" || revision.status === "stable") {
    return { success: false, error: "Revision already approved" }
  }

  const article = getWikiArticleById(revision.articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  // Update revision
  updateWikiRevision(revisionId, {
    status: "approved",
    approvedById: approverId,
    approvedAt: new Date().toISOString(),
  })

  // Update article
  updateWikiArticle({
    ...article,
    currentRevisionId: revisionId,
    updatedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  })

  return { success: true }
}

/**
 * Add a citation to a revision
 * 
 * @param revisionId - Revision ID
 * @param sourceId - Source ID (or create new source)
 * @param locator - Location reference (optional)
 * @returns Updated citations array
 */
export function addCitation(
  revisionId: string,
  sourceId: string,
  locator?: string
): { success: boolean; citationId?: string; error?: string } {
  const revision = getWikiRevisionById(revisionId)
  if (!revision) {
    return { success: false, error: "Revision not found" }
  }

  const citations = revision.citations || []
  const citationId = generateStorageId("cit")

  const newCitation: Citation = {
    id: citationId,
    sourceId,
    locator,
  }

  const updatedCitations = [...citations, newCitation]

  updateWikiRevision(revisionId, {
    citations: updatedCitations,
  })

  return { success: true, citationId }
}

/**
 * Get related articles using tags and link graph
 * 
 * @param articleId - Article ID
 * @param limit - Maximum number of related articles to return
 * @returns Array of related articles
 */
export function getRelatedArticles(articleId: string, limit: number = 10): WikiArticle[] {
  const article = getWikiArticleById(articleId)
  if (!article) {
    return []
  }

  const allArticles = getWikiArticles()
  const related: Array<{ article: WikiArticle; score: number }> = []

  for (const candidate of allArticles) {
    if (candidate.id === articleId) continue

    let score = 0

    // Score by tags
    if (article.tags && candidate.tags) {
      const commonTags = article.tags.filter((tag) => candidate.tags?.includes(tag))
      score += commonTags.length * 5
    }

    // Score by direct links
    if (article.relatedArticleIds?.includes(candidate.id)) {
      score += 10
    }

    // Score by category
    if (article.category === candidate.category) {
      score += 2
    }

    // Score by species overlap
    if (article.species && candidate.species) {
      const commonSpecies = article.species.filter((species) => candidate.species?.includes(species))
      score += commonSpecies.length * 3
    }

    // Score by type
    if (article.type === candidate.type) {
      score += 2
    }

    if (score > 0) {
      related.push({ article: candidate, score })
    }
  }

  // Sort by score and return top results
  related.sort((a, b) => b.score - a.score)

  return related.slice(0, limit).map((r) => r.article)
}

/**
 * Calculate diff between two revisions
 * 
 * @param previousRevision - Previous revision
 * @param currentBlocks - Current blocks
 * @param currentInfobox - Current infobox
 * @returns Revision diff
 */
function calculateDiff(
  previousRevision: WikiRevision,
  currentBlocks: WikiContentBlock[],
  currentInfobox?: Record<string, unknown>
): RevisionDiff {
  const prevBlocks = previousRevision.blocks || []
  const prevMap = new Map(prevBlocks.map((b) => [b.id, b]))
  const currMap = new Map(currentBlocks.map((b) => [b.id, b]))

  const added: WikiContentBlock[] = []
  const modified: Array<{ blockId: string; original: WikiContentBlock; modified: WikiContentBlock }> = []
  const deleted: WikiContentBlock[] = []

  // Find added and modified blocks
  for (const [id, currBlock] of currMap.entries()) {
    const prevBlock = prevMap.get(id)
    if (!prevBlock) {
      added.push(currBlock)
    } else if (JSON.stringify(prevBlock) !== JSON.stringify(currBlock)) {
      modified.push({
        blockId: id,
        original: prevBlock,
        modified: currBlock,
      })
    }
  }

  // Find deleted blocks
  for (const [id, prevBlock] of prevMap.entries()) {
    if (!currMap.has(id)) {
      deleted.push(prevBlock)
    }
  }

  // Calculate infobox changes
  const infoboxChanges: Record<string, { original?: unknown; modified?: unknown }> = {}
  if (currentInfobox && previousRevision.infobox) {
    const allKeys = new Set([
      ...Object.keys(currentInfobox),
      ...Object.keys(previousRevision.infobox),
    ])

    for (const key of allKeys) {
      const original = previousRevision.infobox[key]
      const modified = currentInfobox[key]

      if (JSON.stringify(original) !== JSON.stringify(modified)) {
        infoboxChanges[key] = { original, modified }
      }
    }
  } else if (currentInfobox && !previousRevision.infobox) {
    // All new infobox fields
    for (const [key, value] of Object.entries(currentInfobox)) {
      infoboxChanges[key] = { modified: value }
    }
  } else if (!currentInfobox && previousRevision.infobox) {
    // All removed infobox fields
    for (const [key, value] of Object.entries(previousRevision.infobox)) {
      infoboxChanges[key] = { original: value }
    }
  }

  return {
    added,
    modified,
    deleted,
    infoboxChanges: Object.keys(infoboxChanges).length > 0 ? infoboxChanges : undefined,
  }
}

/**
 * Get stable revision (for health articles)
 * 
 * @param articleId - Article ID
 * @returns Stable revision or undefined
 */
export function getStableRevision(articleId: string): WikiRevision | undefined {
  const article = getWikiArticleById(articleId)
  if (!article?.stableRevisionId) {
    return undefined
  }

  return getWikiRevisionById(article.stableRevisionId)
}

/**
 * Get latest revision (may be unstable for health articles)
 * 
 * @param articleId - Article ID
 * @returns Latest revision or undefined
 */
export function getLatestRevision(articleId: string): WikiRevision | undefined {
  const revisions = getWikiRevisionsByArticleId(articleId)
  if (revisions.length === 0) {
    return undefined
  }

  const activeRevisions = revisions.filter((r) => r.status !== "deprecated")
  if (activeRevisions.length === 0) {
    return undefined
  }

  return activeRevisions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
}

/**
 * Mark a revision as stable (expert-only for health articles)
 * 
 * @param articleId - Article ID
 * @param revisionId - Revision ID to mark as stable
 * @param userId - User ID attempting to publish
 * @returns Success status and error if failed
 */
export function markRevisionAsStable(
  articleId: string,
  revisionId: string,
  userId: string
): { success: boolean; error?: string } {
  const article = getWikiArticleById(articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  const revision = getWikiRevisionById(revisionId)
  if (!revision) {
    return { success: false, error: "Revision not found" }
  }

  // For health articles, require expert status
  if (article.type === "health") {
    const users = require("./storage").getUsers()
    const user = users.find((u: any) => u.id === userId)
    if (!user || user.badge !== "vet") {
      return {
        success: false,
        error: "Only verified experts can publish stable health revisions",
      }
    }
  }

  // Update revision
  updateWikiRevision(revisionId, {
    status: "stable",
    verifiedBy: article.type === "health" ? userId : undefined,
  })

  // Update article
  updateWikiArticle({
    ...article,
    stableRevisionId: revisionId,
    currentRevisionId: revisionId,
    approvedAt: new Date().toISOString(),
  })

  return { success: true }
}

