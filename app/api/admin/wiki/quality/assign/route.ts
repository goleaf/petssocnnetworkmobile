import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Request validation schema
const assignSchema = z.object({
  articleId: z.string().uuid(),
  reviewerId: z.string().optional(),
  section: z.string().optional(),
});

/**
 * POST /api/admin/wiki/quality/assign
 * Assigns a reviewer to an article (persists assignedTo field)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = assignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { articleId, reviewerId, section } = validation.data;

    // Verify article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Update the article with assignedTo
    // If reviewerId is provided, use it; otherwise, you might want to get current user
    // For now, we'll require reviewerId or use a placeholder
    const assignedTo = reviewerId || null;

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        assignedTo,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reviewer assigned successfully",
      assignment: {
        articleId: updatedArticle.id,
        assignedTo: updatedArticle.assignedTo,
        section: section || null,
      },
    });
  } catch (error) {
    console.error("Error assigning reviewer:", error);
    return NextResponse.json(
      { error: "Failed to assign reviewer" },
      { status: 500 }
    );
  }
}

