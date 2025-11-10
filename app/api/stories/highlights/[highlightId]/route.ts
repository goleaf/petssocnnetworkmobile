/**
 * GET /api/stories/highlights/[highlightId] - Get a specific highlight with stories
 * PATCH /api/stories/highlights/[highlightId] - Update a highlight
 * DELETE /api/stories/highlights/[highlightId] - Delete a highlight
 * 
 * Requirements: 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get a specific highlight with its stories
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { highlightId: string } }
) {
  try {
    const { highlightId } = params;

    const highlight = await prisma.storyHighlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Fetch the stories in this highlight
    const stories = await prisma.story.findMany({
      where: {
        id: { in: highlight.storyIds },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      highlight,
      stories,
    });
  } catch (error) {
    console.error('Error fetching highlight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch highlight' },
      { status: 500 }
    );
  }
}

/**
 * Update a highlight (edit name, cover, or stories)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { highlightId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { highlightId } = params;
    const body = await request.json();
    const { name, coverUrl, storyIds } = body;

    // Verify highlight exists and belongs to user
    const highlight = await prisma.storyHighlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    if (highlight.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate name length if provided
    if (name && name.length > 15) {
      return NextResponse.json(
        { error: 'Highlight name must be 15 characters or less' },
        { status: 400 }
      );
    }

    // If updating storyIds, verify all stories exist and belong to user
    if (storyIds && Array.isArray(storyIds)) {
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

      // Archive any expired stories being added
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
    }

    // Update the highlight
    const updatedHighlight = await prisma.storyHighlight.update({
      where: { id: highlightId },
      data: {
        ...(name && { name }),
        ...(coverUrl && { coverUrl }),
        ...(storyIds && { storyIds }),
      },
    });

    return NextResponse.json({
      success: true,
      highlight: updatedHighlight,
    });
  } catch (error) {
    console.error('Error updating highlight:', error);
    return NextResponse.json(
      { error: 'Failed to update highlight' },
      { status: 500 }
    );
  }
}

/**
 * Delete a highlight
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { highlightId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { highlightId } = params;

    // Verify highlight exists and belongs to user
    const highlight = await prisma.storyHighlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    if (highlight.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the highlight
    await prisma.storyHighlight.delete({
      where: { id: highlightId },
    });

    return NextResponse.json({
      success: true,
      message: 'Highlight deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json(
      { error: 'Failed to delete highlight' },
      { status: 500 }
    );
  }
}
