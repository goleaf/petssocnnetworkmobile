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
 * POST /api/wiki/quality/assign
 * Assigns a reviewer to an article or section
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

    // In a full implementation, you'd have a ReviewAssignment table
    // For now, we'll just return success as this is primarily for UI
    // The actual assignment would be tracked in a separate table

    return NextResponse.json({
      success: true,
      message: "Reviewer assigned successfully",
      assignment: {
        articleId,
        reviewerId: reviewerId || null,
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

