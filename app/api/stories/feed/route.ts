/**
 * GET /api/stories/feed - Get stories feed filtered by visibility permissions
 * 
 * Requirements: 9.1, 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { storyService } from '@/lib/services/story-service';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'user-1';

    // Get stories feed filtered by visibility
    const stories = await storyService.getStoriesFeed(userId);

    // Group stories by creator
    const storiesByCreator = stories.reduce((acc, story) => {
      if (!acc[story.creatorUserId]) {
        acc[story.creatorUserId] = [];
      }
      acc[story.creatorUserId].push(story);
      return acc;
    }, {} as Record<string, typeof stories>);

    return NextResponse.json({
      success: true,
      stories: stories.map(story => ({
        id: story.id,
        creatorUserId: story.creatorUserId,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        thumbnailUrl: story.thumbnailUrl,
        mediaDimensions: story.mediaDimensions,
        videoDuration: story.videoDuration,
        caption: story.caption,
        stickers: story.stickers,
        musicTrackId: story.musicTrackId,
        linkUrl: story.linkUrl,
        visibility: story.visibility,
        isSensitiveContent: story.isSensitiveContent,
        viewsCount: story.viewsCount,
        uniqueViewersCount: story.uniqueViewersCount,
        repliesCount: story.repliesCount,
        reactionsCount: story.reactionsCount,
        sharesCount: story.sharesCount,
        linkClicksCount: story.linkClicksCount,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
        isArchived: story.isArchived,
      })),
      storiesByCreator: Object.entries(storiesByCreator).map(([creatorId, userStories]) => ({
        creatorUserId: creatorId,
        storyCount: userStories.length,
        latestStoryAt: userStories[0]?.createdAt.toISOString(),
      })),
      totalCount: stories.length,
    });

  } catch (error) {
    console.error('Error fetching stories feed:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch stories feed' },
      { status: 500 }
    );
  }
}
