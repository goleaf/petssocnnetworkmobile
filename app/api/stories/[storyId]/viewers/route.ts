/**
 * GET /api/stories/{storyId}/viewers - Get list of viewers for a story
 * 
 * Requirements: 10.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { storyService } from '@/lib/services/story-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'user-1';
    const { storyId } = params;

    // Verify story ownership
    const story = await storyService.getStoryById(storyId);
    
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (story.creatorUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - only story creator can view viewers' },
        { status: 403 }
      );
    }

    // Get viewers list
    const viewers = await storyService.getStoryViewers(storyId);

    return NextResponse.json({
      success: true,
      storyId,
      totalViewers: viewers.length,
      viewers: viewers.map(view => ({
        userId: view.viewerUserId,
        viewedAt: view.viewedAt.toISOString(),
        duration: view.duration,
        completed: view.completed,
      })),
    });

  } catch (error) {
    console.error('Error fetching story viewers:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch story viewers' },
      { status: 500 }
    );
  }
}
