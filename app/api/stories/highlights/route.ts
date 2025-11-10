/**
 * POST /api/stories/highlights - Create a new story highlight
 * GET /api/stories/highlights - Get all highlights for a user
 * 
 * Requirements: 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Create a new story highlight
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, coverUrl, storyIds } = body;

    // Validate required fields
    if (!name || !coverUrl || !storyIds || !Array.isArray(storyIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, coverUrl, storyIds' },
        { status: 400 }
      );
    }

    // Validate name length (max 15 characters per requirement 9.4)
    if (name.length > 15) {
      return NextResponse.json(
        { error: 'Highlight name must be 15 characters or less' },
        { status: 400 }
      );
    }

    // Verify all stories exist and belong to the user
    const stories = await prisma.story.findMany({
      where: {
        id: { in: storyIds },
        creatorUserId: userId,
      },
    });

    if (stories.length !== storyIds.length) {
      return NextResponse.json(
        { error: 'Some stories not found or do not belong to user' },
        { status: 404 }
      );
    }

    // Copy expired stories to permanent storage (archive them if not already)
    const now = new Date();
    const expiredStories = stories.filter(story => story.expiresAt < now);
    
    if (expiredStories.length > 0) {
      await prisma.story.updateMany({
        where: {
          id: { in: expiredStories.map(s => s.id) },
          isArchived: false,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });
    }

    // Get the current max order for this user's highlights
    const maxOrderHighlight = await prisma.storyHighlight.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (maxOrderHighlight?.order ?? -1) + 1;

    // Create the highlight
    const highlight = await prisma.storyHighlight.create({
      data: {
        userId,
        name,
        coverUrl,
        storyIds,
        order: nextOrder,
      },
    });

    return NextResponse.json({
      success: true,
      highlight,
    });
  } catch (error) {
    console.error('Error creating story highlight:', error);
    return NextResponse.json(
      { error: 'Failed to create story highlight' },
      { status: 500 }
    );
  }
}

/**
 * Get all highlights for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const highlights = await prisma.storyHighlight.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      highlights,
    });
  } catch (error) {
    console.error('Error fetching story highlights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story highlights' },
      { status: 500 }
    );
  }
}
