/**
 * GET /api/stories/{storyId}/insights - Get comprehensive analytics for a story
 * 
 * Requirements: 10.2, 10.3
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
        { error: 'Unauthorized - only story creator can view insights' },
        { status: 403 }
      );
    }

    // Get comprehensive insights
    const insights = await storyService.getStoryInsights(storyId);

    return NextResponse.json({
      success: true,
      storyId,
      insights,
    });

  } catch (error) {
    console.error('Error fetching story insights:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch story insights' },
      { status: 500 }
    );
  }
}
