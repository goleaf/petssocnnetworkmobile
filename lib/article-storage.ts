import { prisma } from "./prisma"
import type { JSONContent } from "@tiptap/core"
import type { BreedInfoboxInput } from "./schemas/breed-infobox"
import type { HealthInfoboxInput } from "./schemas/health-infobox"
import type { PlaceInfoboxInput } from "./schemas/place-infobox"
import type { ProductInfoboxInput } from "./schemas/product-infobox"

export type ArticleType = "Breed" | "Health" | "Place" | "Product"
export type ArticleStatus = "draft" | "published" | "archived"

export interface ArticleData {
  id: string
  slug: string
  title: string
  type: ArticleType
  status: ArticleStatus
  createdById: string
  contentJSON: JSONContent
  infoboxJSON?: BreedInfoboxInput | HealthInfoboxInput | PlaceInfoboxInput | ProductInfoboxInput | null
  createdAt: Date
  updatedAt: Date
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createArticle(data: {
  title: string
  type: ArticleType
  contentJSON: JSONContent
  infoboxJSON?: BreedInfoboxInput | HealthInfoboxInput | PlaceInfoboxInput | ProductInfoboxInput | null
  createdById: string
  status?: ArticleStatus
}): Promise<{ success: boolean; error?: string; article?: ArticleData }> {
  try {
    const slug = generateSlug(data.title)
    const status = data.status || "draft"

    // Check if article with same slug and type already exists
    const existing = await prisma.article.findUnique({
      where: {
        slug_type: {
          slug,
          type: data.type,
        },
      },
    })

    let finalSlug = slug
    if (existing) {
      finalSlug = `${slug}-${Date.now()}`
    }

    // Create article with first revision
    const article = await prisma.article.create({
      data: {
        slug: finalSlug,
        title: data.title,
        type: data.type,
        status,
        createdById: data.createdById,
        revisions: {
          create: {
            rev: 1,
            authorId: data.createdById,
            contentJSON: data.contentJSON as any,
            infoboxJSON: data.infoboxJSON as any || null,
          },
        },
      },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
    })

    const latestRevision = article.revisions[0]

    return {
      success: true,
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        type: article.type as ArticleType,
        status: article.status as ArticleStatus,
        createdById: article.createdById,
        contentJSON: latestRevision.contentJSON as JSONContent,
        infoboxJSON: latestRevision.infoboxJSON as any,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error creating article:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create article",
    }
  }
}

export async function updateArticle(
  articleId: string,
  data: {
    title?: string
    contentJSON?: JSONContent
    infoboxJSON?: BreedInfoboxInput | HealthInfoboxInput | PlaceInfoboxInput | ProductInfoboxInput | null
    status?: ArticleStatus
    authorId: string
  }
): Promise<{ success: boolean; error?: string; article?: ArticleData }> {
  try {
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
    })

    if (!existingArticle) {
      return { success: false, error: "Article not found" }
    }

    // Get next revision number
    const nextRev = existingArticle.revisions.length > 0
      ? existingArticle.revisions[0].rev + 1
      : 1

    // Update article
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.title) {
      const newSlug = generateSlug(data.title)
      updateData.title = data.title
      // Only update slug if title changed
      if (data.title !== existingArticle.title) {
        // Check if new slug exists
        const slugExists = await prisma.article.findUnique({
          where: {
            slug_type: {
              slug: newSlug,
              type: existingArticle.type,
            },
          },
        })
        updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug
      }
    }

    if (data.status) {
      updateData.status = data.status
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        ...updateData,
        revisions: {
          create: {
            rev: nextRev,
            authorId: data.authorId,
            contentJSON: (data.contentJSON || existingArticle.revisions[0]?.contentJSON) as any,
            infoboxJSON: (data.infoboxJSON !== undefined ? data.infoboxJSON : existingArticle.revisions[0]?.infoboxJSON) as any || null,
          },
        },
      },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
    })

    const latestRevision = article.revisions[0]

    return {
      success: true,
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        type: article.type as ArticleType,
        status: article.status as ArticleStatus,
        createdById: article.createdById,
        contentJSON: latestRevision.contentJSON as JSONContent,
        infoboxJSON: latestRevision.infoboxJSON as any,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error updating article:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update article",
    }
  }
}

export async function getArticleById(articleId: string): Promise<ArticleData | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
    })

    if (!article) return null

    const latestRevision = article.revisions[0]
    if (!latestRevision) return null

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      type: article.type as ArticleType,
      status: article.status as ArticleStatus,
      createdById: article.createdById,
      contentJSON: latestRevision.contentJSON as JSONContent,
      infoboxJSON: latestRevision.infoboxJSON as any,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }
  } catch (error) {
    console.error("Error getting article:", error)
    return null
  }
}

export async function getArticleBySlug(slug: string, type: ArticleType): Promise<ArticleData | null> {
  try {
    const article = await prisma.article.findUnique({
      where: {
        slug_type: {
          slug,
          type,
        },
      },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
    })

    if (!article) return null

    const latestRevision = article.revisions[0]
    if (!latestRevision) return null

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      type: article.type as ArticleType,
      status: article.status as ArticleStatus,
      createdById: article.createdById,
      contentJSON: latestRevision.contentJSON as JSONContent,
      infoboxJSON: latestRevision.infoboxJSON as any,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }
  } catch (error) {
    console.error("Error getting article:", error)
    return null
  }
}

