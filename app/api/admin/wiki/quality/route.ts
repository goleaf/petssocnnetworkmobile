import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Request validation schema
const qualityQuerySchema = z.object({
  tab: z.enum(["citations", "reviews", "links", "orphaned"]).optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  type: z.string().optional(),
  search: z.string().optional(),
});

const PAGE_SIZE = 20;

/**
 * GET /api/admin/wiki/quality
 * Fetches quality dashboard data with filters and pagination:
 * - Pages needing citations
 * - Stale health reviews (>12 months)
 * - Broken links
 * - Orphaned pages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "citations";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString(), 10);
    const typeFilter = searchParams.get("type") || "";
    const searchQuery = searchParams.get("search") || "";

    const validation = qualityQuerySchema.safeParse({
      tab,
      page: page.toString(),
      pageSize: pageSize.toString(),
      type: typeFilter,
      search: searchQuery,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    const skip = (page - 1) * pageSize;

    // Build where clause for filtering
    const buildWhereClause = (baseWhere: any) => {
      let where = { ...baseWhere };
      if (typeFilter) {
        where.type = typeFilter;
      }
      if (searchQuery) {
        where.title = {
          contains: searchQuery,
          mode: "insensitive" as const,
        };
      }
      return where;
    };

    if (tab === "citations") {
      // Pages needing citations (articles with no sources)
      const where = buildWhereClause({
        sources: {
          none: {},
        },
        status: "approved",
      });

      const [items, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: {
            revisions: {
              orderBy: { rev: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ]);

      return NextResponse.json({
        citations: items.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          type: article.type,
          updatedAt: article.updatedAt.toISOString(),
          lastRevisionRev: article.revisions[0]?.rev || 0,
          assignedTo: article.assignedTo,
        })),
        reviews: [],
        links: [],
        orphaned: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    if (tab === "reviews") {
      // Stale health reviews (>12 months since last expert review)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const where = buildWhereClause({
        status: "approved",
        type: "Health", // Only health pages need expert review
        OR: [
          {
            revisions: {
              some: {
                approvedAt: {
                  lt: twelveMonthsAgo,
                },
              },
            },
          },
          {
            revisions: {
              none: {
                approvedAt: {
                  not: null,
                },
              },
            },
          },
        ],
      });

      const [items, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: {
            revisions: {
              orderBy: { rev: "desc" },
              take: 1,
              where: {
                approvedAt: {
                  lt: twelveMonthsAgo,
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ]);

      return NextResponse.json({
        citations: [],
        reviews: items.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          type: article.type,
          updatedAt: article.updatedAt.toISOString(),
          lastReviewedAt: article.revisions[0]?.approvedAt?.toISOString() || null,
          lastRevisionRev: article.revisions[0]?.rev || 0,
          assignedTo: article.assignedTo,
        })),
        links: [],
        orphaned: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    if (tab === "links") {
      // Broken links (sources with isValid: false or brokenAt set)
      const baseWhere: any = {
        OR: [
          { isValid: false },
          { brokenAt: { not: null } },
        ],
      };

      let items, total;
      
      if (typeFilter || searchQuery) {
        // Need to filter by article properties
        const articleWhere: any = {};
        if (typeFilter) {
          articleWhere.type = typeFilter;
        }
        if (searchQuery) {
          articleWhere.title = {
            contains: searchQuery,
            mode: "insensitive" as const,
          };
        }

        const [sources, totalCount] = await Promise.all([
          prisma.source.findMany({
            where: {
              ...baseWhere,
              article: articleWhere,
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
            skip,
            take: pageSize,
          }),
          prisma.source.count({
            where: {
              ...baseWhere,
              article: articleWhere,
            },
          }),
        ]);

        items = sources;
        total = totalCount;
      } else {
        const [sources, totalCount] = await Promise.all([
          prisma.source.findMany({
            where: baseWhere,
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
            skip,
            take: pageSize,
          }),
          prisma.source.count({ where: baseWhere }),
        ]);

        items = sources;
        total = totalCount;
      }

      return NextResponse.json({
        citations: [],
        reviews: [],
        links: items.map((source) => ({
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
          assignedTo: source.article.assignedTo,
        })),
        orphaned: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    if (tab === "orphaned") {
      // Orphaned pages (articles that don't link to/from other articles)
      // This is a simplified check - in a real system, you'd parse content for internal links
      const where = buildWhereClause({
        status: "approved",
      });

      const allArticles = await prisma.article.findMany({
        where,
        include: {
          revisions: {
            orderBy: { rev: "desc" },
            take: 1,
          },
        },
      });

      // Find articles that might be orphaned (no incoming links)
      // In a full implementation, we'd check for links in content
      // For now, return empty array or implement a more sophisticated check
      const orphanedPages = allArticles.filter((article) => {
        // Placeholder: In a real system, check if any other article links to this one
        // For now, return empty array
        return false;
      });

      // Apply pagination manually for orphaned pages
      const paginatedItems = orphanedPages.slice(skip, skip + pageSize);

      return NextResponse.json({
        citations: [],
        reviews: [],
        links: [],
        orphaned: paginatedItems.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          type: article.type,
          updatedAt: article.updatedAt.toISOString(),
          assignedTo: article.assignedTo,
        })),
        total: orphanedPages.length,
        page,
        pageSize,
        totalPages: Math.ceil(orphanedPages.length / pageSize),
      });
    }

    // Default: return all data (first page)
    return NextResponse.json({
      citations: [],
      reviews: [],
      links: [],
      orphaned: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    });
  } catch (error) {
    console.error("Error fetching quality data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality data" },
      { status: 500 }
    );
  }
}

