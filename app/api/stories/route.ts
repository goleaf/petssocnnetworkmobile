/**
 * POST /api/stories - Create a new story
 * 
 * Requirements: 9.1, 13.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { storyService } from '@/lib/services/story-service';
import { websocketService } from '@/lib/services/websocket-service';
import { createNotification } from '@/lib/notifications';

// Validation schema
interface CreateStoryRequest {
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  thumbnailUrl: string;
  mediaDimensions: { width: number; height: number };
  videoDuration?: number;
  fileSize: number;
  caption?: string;
  stickers?: any[];
  musicTrackId?: string;
  linkUrl?: string;
  visibility?: 'everyone' | 'close_friends' | 'custom';
  visibilityUserIds?: string[];
  isSensitiveContent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get authenticated user from session
    // For now, using a placeholder user ID
    const userId = request.headers.get('x-user-id') || 'user-1';

    // Parse request body
    const body = await request.json() as CreateStoryRequest;

    // Validate required fields
    if (!body.mediaUrl) {
      return NextResponse.json(
        { error: 'Media URL is required' },
        { status: 400 }
      );
    }

    if (!body.mediaType || !['photo', 'video'].includes(body.mediaType)) {
      return NextResponse.json(
        { error: 'Valid media type is required (photo or video)' },
        { status: 400 }
      );
    }

    if (!body.thumbnailUrl) {
      return NextResponse.json(
        { error: 'Thumbnail URL is required' },
        { status: 400 }
      );
    }

    if (!body.mediaDimensions || !body.mediaDimensions.width || !body.mediaDimensions.height) {
      return NextResponse.json(
        { error: 'Media dimensions are required' },
        { status: 400 }
      );
    }

    if (!body.fileSize) {
      return NextResponse.json(
        { error: 'File size is required' },
        { status: 400 }
      );
    }

    // Validate media constraints
    const validation = storyService.validateMedia(
      body.mediaType,
      body.fileSize,
      body.videoDuration
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Validate video duration if video
    if (body.mediaType === 'video' && body.videoDuration) {
      if (body.videoDuration > 15) {
        return NextResponse.json(
          { error: 'Video duration must be 15 seconds or less' },
          { status: 400 }
        );
      }
    }

    // Validate stickers format if provided
    if (body.stickers && !Array.isArray(body.stickers)) {
      return NextResponse.json(
        { error: 'Stickers must be an array' },
        { status: 400 }
      );
    }

    // Validate visibility settings
    if (body.visibility && !['everyone', 'close_friends', 'custom'].includes(body.visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility setting' },
        { status: 400 }
      );
    }

    if (body.visibility === 'custom' && (!body.visibilityUserIds || body.visibilityUserIds.length === 0)) {
      return NextResponse.json(
        { error: 'Custom visibility requires at least one user ID' },
        { status: 400 }
      );
    }

    // Create story
    const story = await storyService.createStory({
      creatorUserId: userId,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      thumbnailUrl: body.thumbnailUrl,
      mediaDimensions: body.mediaDimensions,
      videoDuration: body.videoDuration,
      caption: body.caption,
      stickers: body.stickers,
      musicTrackId: body.musicTrackId,
      linkUrl: body.linkUrl,
      visibility: body.visibility,
      visibilityUserIds: body.visibilityUserIds,
      isSensitiveContent: body.isSensitiveContent,
    });

    // Get follower IDs for notifications
    const followerIds = await storyService.getFollowerIds(userId);

    // Broadcast notification to followers
    if (followerIds.length > 0) {
      // Send WebSocket notification
      await websocketService.broadcastNewPost(
        story.id,
        userId,
        followerIds
      );

      // Create in-app notifications for followers
      // Only notify for public stories or close friends stories
      if (story.visibility === 'everyone' || story.visibility === 'close_friends') {
        for (const followerId of followerIds.slice(0, 100)) { // Limit to first 100 to avoid overwhelming
          try {
            createNotification({
              userId: followerId,
              type: 'post',
              actorId: userId,
              targetId: story.id,
              targetType: 'story',
              message: `New story from user`,
              priority: 'low',
              category: 'social',
              channels: ['in_app'],
              metadata: {
                storyId: story.id,
                mediaType: story.mediaType,
                thumbnailUrl: story.thumbnailUrl,
              },
            });
          } catch (error) {
            console.error(`Failed to create notification for follower ${followerId}:`, error);
          }
        }
      }
    }

    // Return created story
    return NextResponse.json({
      success: true,
      story: {
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
        visibilityUserIds: story.visibilityUserIds,
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
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating story:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
