import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Request validation schema
const qualityQuerySchema = z.object({
  type: z.enum(["citations", "reviews", "links", "orphaned"]).optional(),
});

/**
 * GET /api/wiki/quality
 * Fetches quality dashboard data including:
 * - Pages needing citations
 * - Stale reviews
 * - Broken links
 * - Orphaned pages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const type = typeParam || undefined;

    const validation = qualityQuerySchema.safeParse({ type });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Pages needing citations (articles with no sources or empty sources)
    const pagesNeedingCitations = await prisma.article.findMany({
      where: {
        sources: {
          none: {},
        },
        status: "approved",
      },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Stale reviews (approved articles that haven't been reviewed in 6+ months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const staleReviews = await prisma.article.findMany({
      where: {
        status: "approved",
        revisions: {
          some: {
            approvedAt: {
              lt: sixMonthsAgo,
            },
          },
        },
      },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
          where: {
            approvedAt: {
              lt: sixMonthsAgo,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Broken links (sources with isValid: false or brokenAt set)
    const brokenLinks = await prisma.source.findMany({
      where: {
        OR: [
          { isValid: false },
          { brokenAt: { not: null } },
        ],
      },
      include: {
        article: {
          include: {
            revisions: {
              orderBy: { rev: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { lastChecked: "desc" },
      take: 100,
    });

    // Orphaned pages (articles that don't link to/from any other articles)
    // This is a simplified check - in a real system, you'd parse content for internal links
    const allArticles = await prisma.article.findMany({
      where: {
        status: "approved",
      },
      include: {
        revisions: {
          orderBy: { rev: "desc" },
          take: 1,
        },
      },
    });

    // Find articles that might be orphaned (no incoming links)
    // In a full implementation, we'd check for links in content
    const orphanedPages = allArticles.filter((article) => {
      // Placeholder: In a real system, check if any other article links to this one
      // For now, return empty array or implement a more sophisticated check
      return false;
    });

    // Format response based on type filter
    const validatedType = validation.data.type;
    if (validatedType === "citations") {
      return NextResponse.json({
        citations: pagesNeedingCitations.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          type: article.type,
          updatedAt: article.updatedAt.toISOString(),
          lastRevisionRev: article.revisions[0]?.rev || 0,
        })),
      });
    }

    if (validatedType === "reviews") {
      return NextResponse.json({
        reviews: staleReviews.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          type: article.type,
          updatedAt: article.updatedAt.toISOString(),
          lastReviewedAt: article.revisions[0]?.approvedAt?.toISOString() || null,
          lastRevisionRev: article.revisions[0]?.rev || 0,
        })),
      });
    }

    if (validatedType === "links") {
      return NextResponse.json({
        links: brokenLinks.map((source) => ({
          id: source.id,
          sourceId: source.sourceId,
          title: source.title,
          url: source.url,
          isValid: source.isValid,
          brokenAt: source.brokenAt?.toISOString() || null,
          lastChecked: source.lastChecked?.toISOString() || null,
          article: {
            id: source.article.id,
            slug: source.article.slug,
            title: source.article.title,
            type: source.article.type,
          },
        })),
      });
    }

    if (validatedType === "orphaned") {
      return NextResponse.json({
        orphaned: orphanedPages.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          type: article.type,
          updatedAt: article.updatedAt.toISOString(),
        })),
      });
    }

    // Return all data if no type specified
    return NextResponse.json({
      citations: pagesNeedingCitations.map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        type: article.type,
        updatedAt: article.updatedAt.toISOString(),
        lastRevisionRev: article.revisions[0]?.rev || 0,
      })),
      reviews: staleReviews.map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        type: article.type,
        updatedAt: article.updatedAt.toISOString(),
        lastReviewedAt: article.revisions[0]?.approvedAt?.toISOString() || null,
        lastRevisionRev: article.revisions[0]?.rev || 0,
      })),
      links: brokenLinks.map((source) => ({
        id: source.id,
        sourceId: source.sourceId,
        title: source.title,
        url: source.url,
        isValid: source.isValid,
        brokenAt: source.brokenAt?.toISOString() || null,
        lastChecked: source.lastChecked?.toISOString() || null,
        article: {
          id: source.article.id,
          slug: source.article.slug,
          title: source.article.title,
          type: source.article.type,
        },
      })),
      orphaned: orphanedPages.map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        type: article.type,
        updatedAt: article.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching quality data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality data" },
      { status: 500 }
    );
  }
}

