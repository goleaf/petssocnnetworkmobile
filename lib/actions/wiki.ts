"use server"

/**
 * Server Actions for Wiki operations
 * Handles CRUD operations for Article, Revision, and Source models
 */

import { prisma } from "@/lib/prisma"
import {
  mapPrismaArticleToWikiArticle,
  mapPrismaRevisionToWikiRevision,
  mapWikiArticleToPrismaArticle,
  mapWikiRevisionToPrismaRevision,
  mapSourceToPrismaSource,
  mapPrismaSourceToSource,
} from "@/lib/utils/wiki-mapping"
import type { WikiArticle, WikiRevision, Source } from "@/lib/types"

/**
 * Get all wiki articles
 */
export async function getWikiArticlesAction(): Promise<WikiArticle[]> {
  try {
    const articles = await prisma.article.findMany({
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        tags: true,
        props: true,
        sources: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return articles.map((article) => {
      const latestRevision = article.revisions[0]
      return mapPrismaArticleToWikiArticle(article, latestRevision)
    })
  } catch (error) {
    console.error("Error fetching wiki articles:", error)
    return []
  }
}

/**
 * Get wiki article by slug
 */
export async function getWikiArticleBySlugAction(slug: string): Promise<WikiArticle | null> {
  try {
    const article = await prisma.article.findFirst({
      where: { slug },
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        tags: true,
        props: true,
        sources: true,
      },
    })

    if (!article) {
      return null
    }

    const latestRevision = article.revisions[0]
    return mapPrismaArticleToWikiArticle(article, latestRevision)
  } catch (error) {
    console.error("Error fetching wiki article by slug:", error)
    return null
  }
}

/**
 * Get wiki article by ID
 */
export async function getWikiArticleByIdAction(articleId: string): Promise<WikiArticle | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        tags: true,
        props: true,
        sources: true,
      },
    })

    if (!article) {
      return null
    }

    const latestRevision = article.revisions[0]
    return mapPrismaArticleToWikiArticle(article, latestRevision)
  } catch (error) {
    console.error("Error fetching wiki article by ID:", error)
    return null
  }
}

/**
 * Get wiki articles by category
 */
export async function getWikiArticlesByCategoryAction(
  category: string
): Promise<WikiArticle[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { type: category },
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        tags: true,
        props: true,
        sources: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return articles.map((article) => {
      const latestRevision = article.revisions[0]
      return mapPrismaArticleToWikiArticle(article, latestRevision)
    })
  } catch (error) {
    console.error("Error fetching wiki articles by category:", error)
    return []
  }
}

/**
 * Create a new wiki article
 */
export async function createWikiArticleAction(
  article: WikiArticle
): Promise<{ success: boolean; error?: string; article?: WikiArticle }> {
  try {
    const prismaArticleData = mapWikiArticleToPrismaArticle(article)

    // Get the latest revision number
    const existingRevisions = await prisma.revision.findMany({
      where: { articleId: article.id },
      orderBy: { rev: "desc" },
      take: 1,
    })

    const nextRev = existingRevisions.length > 0 ? existingRevisions[0].rev + 1 : 1

    // Create article with first revision
    const createdArticle = await prisma.article.create({
      data: {
        ...prismaArticleData,
        revisions: {
          create: article.revisions && article.revisions.length > 0
            ? article.revisions.map((rev, idx) =>
                mapWikiRevisionToPrismaRevision(rev, article.id, nextRev + idx)
              )
            : [
                mapWikiRevisionToPrismaRevision(
                  {
                    id: article.currentRevisionId || `rev_${Date.now()}`,
                    articleId: article.id,
                    content: article.content,
                    status: "draft",
                    authorId: article.authorId,
                    createdAt: article.createdAt,
                    updatedAt: article.updatedAt,
                  },
                  article.id,
                  nextRev
                ),
              ],
        },
        tags: {
          create: (article.tags || []).map((tag) => ({ tag })),
        },
        props: {
          create: [
            { key: "subcategory", value: article.subcategory || null },
            { key: "species", value: article.species || [] },
            { key: "coverImage", value: article.coverImage || null },
            { key: "views", value: article.views || 0 },
            { key: "likes", value: article.likes || [] },
            { key: "relatedArticles", value: article.relatedArticles || [] },
            { key: "baseLanguage", value: article.baseLanguage || "en" },
            { key: "approvedAt", value: article.approvedAt || null },
            { key: "healthData", value: article.healthData || null },
          ],
        },
        sources: {
          create: [], // Sources will be added separately if needed
        },
      },
      include: {
        revisions: true,
        tags: true,
        props: true,
        sources: true,
      },
    })

    const latestRevision = createdArticle.revisions[0]
    const mappedArticle = mapPrismaArticleToWikiArticle(createdArticle, latestRevision)

    return { success: true, article: mappedArticle }
  } catch (error) {
    console.error("Error creating wiki article:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create article",
    }
  }
}

/**
 * Update a wiki article
 */
export async function updateWikiArticleAction(
  article: WikiArticle
): Promise<{ success: boolean; error?: string; article?: WikiArticle }> {
  try {
    const prismaArticleData = mapWikiArticleToPrismaArticle(article)

    // Get existing article to check for revisions
    const existingArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: { revisions: true },
    })

    if (!existingArticle) {
      return { success: false, error: "Article not found" }
    }

    // Update article basic fields
    await prisma.article.update({
      where: { id: article.id },
      data: {
        slug: prismaArticleData.slug,
        title: prismaArticleData.title,
        type: prismaArticleData.type,
        status: prismaArticleData.status,
      },
    })

    // Update props
    const propsToUpdate = [
      { key: "subcategory", value: article.subcategory || null },
      { key: "species", value: article.species || [] },
      { key: "coverImage", value: article.coverImage || null },
      { key: "views", value: article.views || 0 },
      { key: "likes", value: article.likes || [] },
      { key: "relatedArticles", value: article.relatedArticles || [] },
      { key: "baseLanguage", value: article.baseLanguage || "en" },
      { key: "approvedAt", value: article.approvedAt || null },
      { key: "healthData", value: article.healthData || null },
    ]

    // Delete existing props and recreate
    await prisma.articleProp.deleteMany({
      where: { articleId: article.id },
    })

    await prisma.articleProp.createMany({
      data: propsToUpdate.map((prop) => ({
        articleId: article.id,
        key: prop.key,
        value: prop.value,
      })),
    })

    // Update tags
    await prisma.articleTag.deleteMany({
      where: { articleId: article.id },
    })

    if (article.tags && article.tags.length > 0) {
      await prisma.articleTag.createMany({
        data: article.tags.map((tag) => ({
          articleId: article.id,
          tag,
        })),
      })
    }

    // Fetch updated article
    const updatedArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
        },
        tags: true,
        props: true,
        sources: true,
      },
    })

    if (!updatedArticle) {
      return { success: false, error: "Failed to fetch updated article" }
    }

    const latestRevision = updatedArticle.revisions[0]
    const mappedArticle = mapPrismaArticleToWikiArticle(updatedArticle, latestRevision)

    return { success: true, article: mappedArticle }
  } catch (error) {
    console.error("Error updating wiki article:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update article",
    }
  }
}

/**
 * Get wiki revisions by article ID
 */
export async function getWikiRevisionsByArticleIdAction(
  articleId: string
): Promise<WikiRevision[]> {
  try {
    const revisions = await prisma.revision.findMany({
      where: { articleId },
      orderBy: { createdAt: "desc" },
    })

    return revisions.map(mapPrismaRevisionToWikiRevision)
  } catch (error) {
    console.error("Error fetching wiki revisions:", error)
    return []
  }
}

/**
 * Get wiki revision by ID
 */
export async function getWikiRevisionByIdAction(
  revisionId: string
): Promise<WikiRevision | null> {
  try {
    const revision = await prisma.revision.findUnique({
      where: { id: revisionId },
    })

    if (!revision) {
      return null
    }

    return mapPrismaRevisionToWikiRevision(revision)
  } catch (error) {
    console.error("Error fetching wiki revision:", error)
    return null
  }
}

/**
 * Create a new wiki revision
 */
export async function createWikiRevisionAction(
  revision: WikiRevision
): Promise<{ success: boolean; error?: string; revision?: WikiRevision }> {
  try {
    // Get the latest revision number for this article
    const existingRevisions = await prisma.revision.findMany({
      where: { articleId: revision.articleId },
      orderBy: { rev: "desc" },
      take: 1,
    })

    const nextRev = existingRevisions.length > 0 ? existingRevisions[0].rev + 1 : 1

    const prismaRevisionData = mapWikiRevisionToPrismaRevision(
      revision,
      revision.articleId,
      nextRev
    )

    const createdRevision = await prisma.revision.create({
      data: prismaRevisionData,
    })

    const mappedRevision = mapPrismaRevisionToWikiRevision(createdRevision)

    return { success: true, revision: mappedRevision }
  } catch (error) {
    console.error("Error creating wiki revision:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create revision",
    }
  }
}

/**
 * Update a wiki revision
 */
export async function updateWikiRevisionAction(
  revisionId: string,
  updates: Partial<WikiRevision>
): Promise<{ success: boolean; error?: string; revision?: WikiRevision }> {
  try {
    const existingRevision = await prisma.revision.findUnique({
      where: { id: revisionId },
    })

    if (!existingRevision) {
      return { success: false, error: "Revision not found" }
    }

    const contentJSON = existingRevision.contentJSON as any
    const updatedContentJSON = {
      ...contentJSON,
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.verifiedBy !== undefined && { verifiedBy: updates.verifiedBy }),
      ...(updates.healthData !== undefined && { healthData: updates.healthData }),
    }

    const updatedRevision = await prisma.revision.update({
      where: { id: revisionId },
      data: {
        contentJSON: updatedContentJSON,
        ...(updates.status === "stable" &&
          !existingRevision.approvedAt && {
            approvedById: updates.verifiedBy || existingRevision.authorId,
            approvedAt: new Date(),
          }),
      },
    })

    const mappedRevision = mapPrismaRevisionToWikiRevision(updatedRevision)

    return { success: true, revision: mappedRevision }
  } catch (error) {
    console.error("Error updating wiki revision:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update revision",
    }
  }
}

/**
 * Get sources by article ID
 */
export async function getSourcesByArticleIdAction(articleId: string): Promise<Source[]> {
  try {
    const sources = await prisma.source.findMany({
      where: { articleId },
      orderBy: { createdAt: "asc" },
    })

    return sources.map(mapPrismaSourceToSource)
  } catch (error) {
    console.error("Error fetching sources:", error)
    return []
  }
}

/**
 * Create or update a source
 */
export async function upsertSourceAction(
  source: Source,
  articleId: string
): Promise<{ success: boolean; error?: string; source?: Source }> {
  try {
    const prismaSourceData = mapSourceToPrismaSource(source, articleId)

    const upsertedSource = await prisma.source.upsert({
      where: {
        articleId_sourceId: {
          articleId,
          sourceId: source.id,
        },
      },
      create: {
        ...prismaSourceData,
        id: undefined as any, // Let Prisma generate UUID
      },
      update: {
        title: prismaSourceData.title,
        url: prismaSourceData.url,
        publisher: prismaSourceData.publisher,
        date: prismaSourceData.date,
        license: prismaSourceData.license,
        brokenAt: prismaSourceData.brokenAt,
        isValid: prismaSourceData.isValid,
        lastChecked: prismaSourceData.lastChecked,
      },
    })

    const mappedSource = mapPrismaSourceToSource(upsertedSource)

    return { success: true, source: mappedSource }
  } catch (error) {
    console.error("Error upserting source:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upsert source",
    }
  }
}

