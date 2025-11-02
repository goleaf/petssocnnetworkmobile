import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Request validation schema
const recheckSchema = z.object({
  sourceId: z.string().uuid(),
});

/**
 * POST /api/wiki/quality/recheck
 * Queues a broken link for recheck
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = recheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sourceId } = validation.data;

    // Find the source
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    // Reset the validation status and update lastChecked timestamp
    // In a production system, you'd queue this for background processing
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        lastChecked: new Date(),
        isValid: null, // Reset to null to indicate pending check
        brokenAt: null,
      },
    });

    // In a real implementation, you'd add this to a queue for background checking
    // For now, we'll simulate by immediately attempting a check
    try {
      // Simple fetch to check if URL is accessible
      const response = await fetch(source.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      const isValid = response.ok;
      const brokenAt = response.ok ? null : new Date();

      await prisma.source.update({
        where: { id: sourceId },
        data: {
          isValid,
          brokenAt,
          lastChecked: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        source: {
          id: source.id,
          isValid,
          brokenAt: brokenAt?.toISOString() || null,
          lastChecked: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Mark as broken if check fails
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          isValid: false,
          brokenAt: new Date(),
          lastChecked: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        source: {
          id: source.id,
          isValid: false,
          brokenAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Error rechecking link:", error);
    return NextResponse.json(
      { error: "Failed to recheck link" },
      { status: 500 }
    );
  }
}

