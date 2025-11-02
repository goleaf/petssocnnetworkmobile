/**
 * Mapping functions between WikiArticle/WikiRevision types and Prisma models
 */

import type { WikiArticle, WikiRevision, Source } from "@/lib/types"
import type { Article, Revision, Source as PrismaSource } from "@prisma/client"

/**
 * Map Prisma Article to WikiArticle
 */
export function mapPrismaArticleToWikiArticle(
  prismaArticle: Article & {
    revisions: Revision[]
    tags: { tag: string }[]
    props: { key: string; value: any }[]
    sources: PrismaSource[]
  },
  latestRevision?: Revision
): WikiArticle {
  // Get the latest revision content or use from latestRevision
  const contentRevision = latestRevision || prismaArticle.revisions[prismaArticle.revisions.length - 1]
  const content = contentRevision
    ? (contentRevision.contentJSON as { content?: string })?.content || ""
    : ""

  // Extract article properties
  const props = prismaArticle.props.reduce((acc, prop) => {
    acc[prop.key] = prop.value
    return acc
  }, {} as Record<string, any>)

  const wikiArticle: WikiArticle = {
    id: prismaArticle.id,
    title: prismaArticle.title,
    slug: prismaArticle.slug,
    category: (prismaArticle.type as WikiArticle["category"]) || "care",
    subcategory: props.subcategory as string | undefined,
    species: (props.species as string[]) || [],
    content,
    coverImage: props.coverImage as string | undefined,
    authorId: prismaArticle.createdById,
    views: (props.views as number) || 0,
    likes: (props.likes as string[]) || [],
    tags: prismaArticle.tags.map((t) => t.tag),
    relatedArticles: (props.relatedArticles as string[]) || [],
    createdAt: prismaArticle.createdAt.toISOString(),
    updatedAt: prismaArticle.updatedAt.toISOString(),
    currentRevisionId: contentRevision?.id || undefined,
    stableRevisionId: prismaArticle.revisions.find((r) => {
      const revProps = (r.contentJSON as any)?.status === "stable"
      return revProps || r.approvedAt !== null
    })?.id || undefined,
    revisions: prismaArticle.revisions.map(mapPrismaRevisionToWikiRevision),
    baseLanguage: (props.baseLanguage as string) || "en",
    approvedAt: props.approvedAt as string | undefined,
    healthData: props.healthData as WikiArticle["healthData"],
  }

  return wikiArticle
}

/**
 * Map Prisma Revision to WikiRevision
 */
export function mapPrismaRevisionToWikiRevision(prismaRevision: Revision): WikiRevision {
  const contentJSON = prismaRevision.contentJSON as any
  return {
    id: prismaRevision.id,
    articleId: prismaRevision.articleId,
    content: contentJSON?.content || "",
    status: (contentJSON?.status as WikiRevision["status"]) || "draft",
    authorId: prismaRevision.authorId,
    verifiedBy: contentJSON?.verifiedBy as string | undefined,
    createdAt: prismaRevision.createdAt.toISOString(),
    updatedAt: prismaRevision.createdAt.toISOString(), // Prisma Revision doesn't have updatedAt
    healthData: contentJSON?.healthData as WikiRevision["healthData"],
  }
}

/**
 * Map WikiArticle to Prisma Article data
 */
export function mapWikiArticleToPrismaArticle(wikiArticle: WikiArticle) {
  return {
    id: wikiArticle.id,
    slug: wikiArticle.slug,
    title: wikiArticle.title,
    type: wikiArticle.category,
    status: "published",
    createdById: wikiArticle.authorId,
  }
}

/**
 * Map WikiRevision to Prisma Revision data
 */
export function mapWikiRevisionToPrismaRevision(
  wikiRevision: WikiRevision,
  articleId: string,
  rev: number
) {
  const contentJSON = {
    content: wikiRevision.content,
    status: wikiRevision.status,
    verifiedBy: wikiRevision.verifiedBy,
    healthData: wikiRevision.healthData,
  }

  return {
    id: wikiRevision.id,
    articleId,
    rev,
    authorId: wikiRevision.authorId,
    summary: null,
    contentJSON,
    infoboxJSON: null,
    approvedById: wikiRevision.status === "stable" ? wikiRevision.verifiedBy || wikiRevision.authorId : null,
    approvedAt: wikiRevision.status === "stable" ? new Date(wikiRevision.createdAt) : null,
  }
}

/**
 * Map Source to Prisma Source data
 */
export function mapSourceToPrismaSource(source: Source, articleId: string) {
  return {
    articleId,
    sourceId: source.id,
    title: source.title,
    url: source.url,
    publisher: source.publisher || null,
    date: source.date || null,
    license: source.license || null,
    brokenAt: source.brokenAt ? new Date(source.brokenAt) : null,
    isValid: source.isValid || null,
    lastChecked: source.lastChecked ? new Date(source.lastChecked) : null,
  }
}

/**
 * Map Prisma Source to Source
 */
export function mapPrismaSourceToSource(prismaSource: PrismaSource): Source {
  return {
    id: prismaSource.sourceId,
    title: prismaSource.title,
    url: prismaSource.url,
    publisher: prismaSource.publisher || undefined,
    date: prismaSource.date || undefined,
    license: prismaSource.license || undefined,
    brokenAt: prismaSource.brokenAt?.toISOString() || undefined,
    isValid: prismaSource.isValid || undefined,
    lastChecked: prismaSource.lastChecked?.toISOString() || undefined,
  }
}

