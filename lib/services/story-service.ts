/**
 * Story Service - Handles story creation, validation, and processing
 * 
 * Requirements: 9.1, 13.4
 */

import { prisma } from '@/lib/prisma';

// Type aliases for Prisma models
type PrismaStory = Awaited<ReturnType<typeof prisma.story.findUnique>>;
type StoryView = Awaited<ReturnType<typeof prisma.storyView.findUnique>>;
type StoryInteraction = Awaited<ReturnType<typeof prisma.storyInteraction.findUnique>>;

export interface CreateStoryInput {
  creatorUserId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  thumbnailUrl: string;
  mediaDimensions: { width: number; height: number };
  videoDuration?: number;
  caption?: string;
  stickers?: any[];
  musicTrackId?: string;
  linkUrl?: string;
  visibility?: 'everyone' | 'close_friends' | 'custom';
  visibilityUserIds?: string[];
  isSensitiveContent?: boolean;
}

export interface StoryValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Story Service class
 */
export class StoryService {
  /**
   * Validate story media constraints
   */
  validateMedia(
    mediaType: 'photo' | 'video',
    fileSize: number,
    videoDuration?: number
  ): StoryValidationResult {
    const errors: string[] = [];

    if (mediaType === 'photo') {
      // Photos max 10MB
      const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
      if (fileSize > MAX_PHOTO_SIZE) {
        errors.push('Photo size must be less than 10MB');
      }
    } else if (mediaType === 'video') {
      // Videos max 100MB
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
      if (fileSize > MAX_VIDEO_SIZE) {
        errors.push('Video size must be less than 100MB');
      }

      // Videos max 15 seconds
      if (videoDuration && videoDuration > 15) {
        errors.push('Video duration must be 15 seconds or less');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new story
   */
  async createStory(input: CreateStoryInput) {
    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Prepare stickers data
    const stickersData = input.stickers ? JSON.parse(JSON.stringify(input.stickers)) : null;

    // Create story record
    const story = await prisma.story.create({
      data: {
        creatorUserId: input.creatorUserId,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        thumbnailUrl: input.thumbnailUrl,
        mediaDimensions: input.mediaDimensions as any,
        videoDuration: input.videoDuration,
        caption: input.caption,
        stickers: stickersData,
        musicTrackId: input.musicTrackId,
        linkUrl: input.linkUrl,
        visibility: input.visibility || 'everyone',
        visibilityUserIds: input.visibilityUserIds || [],
        isSensitiveContent: input.isSensitiveContent || false,
        expiresAt,
      },
    });

    return story;
  }

  /**
   * Get active stories for a user
   */
  async getActiveStories(userId: string) {
    const now = new Date();

    return prisma.story.findMany({
      where: {
        creatorUserId: userId,
        expiresAt: {
          gt: now,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get follower IDs for a user
   * TODO: Implement actual follower lookup from social graph
   */
  async getFollowerIds(userId: string): Promise<string[]> {
    // Placeholder - in production, query the social graph
    // This would typically query a followers/following table
    return [];
  }

  /**
   * Get stories feed for a user (filtered by visibility permissions)
   */
  async getStoriesFeed(viewerUserId: string) {
    const now = new Date();

    // Get all active stories
    const allStories = await prisma.story.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter stories based on visibility permissions
    const visibleStories: typeof allStories = [];

    for (const story of allStories) {
      const canView = await this.canViewStory(story, viewerUserId);
      if (canView) {
        visibleStories.push(story);
      }
    }

    return visibleStories;
  }

  /**
   * Get stories by user IDs (filtered by visibility permissions)
   */
  async getStoriesByUserIds(userIds: string[], viewerUserId: string) {
    const now = new Date();

    // Get all active stories for these users
    const allStories = await prisma.story.findMany({
      where: {
        creatorUserId: {
          in: userIds,
        },
        expiresAt: {
          gt: now,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by user and filter by visibility
    const storiesByUser = new Map<string, typeof allStories>();

    for (const story of allStories) {
      const canView = await this.canViewStory(story, viewerUserId);
      if (canView) {
        const userStories = storiesByUser.get(story.creatorUserId) || [];
        userStories.push(story);
        storiesByUser.set(story.creatorUserId, userStories);
      }
    }

    return storiesByUser;
  }

  /**
   * Check if user can view story based on visibility settings
   */
  async canViewStory(story: NonNullable<PrismaStory>, viewerUserId: string): Promise<boolean> {
    // Creator can always view their own stories
    if (story.creatorUserId === viewerUserId) {
      return true;
    }

    // Check visibility settings
    if (story.visibility === 'everyone') {
      return true;
    }

    if (story.visibility === 'close_friends') {
      // Check if viewer is in close friends list
      const closeFriend = await prisma.closeFriend.findUnique({
        where: {
          userId_friendUserId: {
            userId: story.creatorUserId,
            friendUserId: viewerUserId,
          },
        },
      });
      return !!closeFriend;
    }

    if (story.visibility === 'custom') {
      // Check if viewer is in custom visibility list
      return story.visibilityUserIds.includes(viewerUserId);
    }

    return false;
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string, userId: string): Promise<void> {
    // Verify ownership
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story || story.creatorUserId !== userId) {
      throw new Error('Story not found or unauthorized');
    }

    // Soft delete
    await prisma.story.update({
      where: { id: storyId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Archive a story
   */
  async archiveStory(storyId: string, userId: string): Promise<void> {
    // Verify ownership
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story || story.creatorUserId !== userId) {
      throw new Error('Story not found or unauthorized');
    }

    await prisma.story.update({
      where: { id: storyId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string) {
    return prisma.story.findUnique({
      where: { id: storyId },
    });
  }

  /**
   * Get story viewers list
   */
  async getStoryViewers(storyId: string) {
    return prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
    });
  }

  /**
   * Get comprehensive story insights
   */
  async getStoryInsights(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    // Get all views
    const views = await prisma.storyView.findMany({
      where: { storyId },
    });

    // Get all interactions
    const interactions = await prisma.storyInteraction.findMany({
      where: { storyId },
    });

    // Calculate metrics
    const totalViews = views.length;
    const uniqueViewers = new Set(views.map((v: any) => v.viewerUserId)).size;
    const completedViews = views.filter((v: any) => v.completed).length;
    const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

    // Calculate average watch time
    const totalDuration = views.reduce((sum: number, v: any) => sum + v.duration, 0);
    const averageWatchTime = totalViews > 0 ? totalDuration / totalViews : 0;

    // Calculate exits heatmap (percentage of viewers who left at each second)
    const exitPoints: Record<number, number> = {};
    const videoDuration = story.videoDuration || 5; // Default 5 seconds for photos
    
    views.forEach((view: any) => {
      if (!view.completed && view.duration < videoDuration) {
        const exitSecond = Math.floor(view.duration);
        exitPoints[exitSecond] = (exitPoints[exitSecond] || 0) + 1;
      }
    });

    const exitsHeatmap = Object.entries(exitPoints).map(([second, count]) => ({
      second: parseInt(second),
      exitCount: count,
      exitPercentage: (count / totalViews) * 100,
    }));

    // Engagement breakdown
    const replies = interactions.filter((i: any) => i.interactionType === 'reply').length;
    const reactions = interactions.filter((i: any) => i.interactionType === 'reaction').length;
    const pollVotes = interactions.filter((i: any) => i.interactionType === 'poll_vote').length;
    const questionResponses = interactions.filter((i: any) => i.interactionType === 'question_response').length;
    const quizAnswers = interactions.filter((i: any) => i.interactionType === 'quiz_answer').length;
    const linkClicks = interactions.filter((i: any) => i.interactionType === 'link_click').length;

    // Audience insights
    // TODO: In production, fetch actual follower status and user data
    const followerViewers = 0; // Placeholder
    const nonFollowerViewers = uniqueViewers; // Placeholder

    // Geographic distribution (placeholder - would need user location data)
    const geographicDistribution = [
      { country: 'Unknown', count: uniqueViewers, percentage: 100 },
    ];

    // Device types (placeholder - would need device tracking)
    const deviceTypes = [
      { type: 'mobile', count: Math.floor(uniqueViewers * 0.7), percentage: 70 },
      { type: 'desktop', count: Math.floor(uniqueViewers * 0.2), percentage: 20 },
      { type: 'tablet', count: Math.floor(uniqueViewers * 0.1), percentage: 10 },
    ];

    // Performance comparison (placeholder - would compare to user's other stories)
    const performanceComparison = {
      viewsVsAverage: 0,
      engagementVsAverage: 0,
      completionRateVsAverage: 0,
    };

    return {
      // View metrics
      totalViews,
      reach: uniqueViewers,
      impressions: totalViews, // Same as views for stories
      completionRate: Math.round(completionRate * 100) / 100,
      averageWatchTime: Math.round(averageWatchTime * 100) / 100,
      
      // Exits heatmap
      exitsHeatmap,
      
      // Engagement breakdown
      engagement: {
        replies,
        reactions,
        shares: story.sharesCount,
        pollVotes,
        questionResponses,
        quizAnswers,
        linkClicks,
        totalInteractions: interactions.length,
      },
      
      // Audience insights
      audience: {
        followerViewers,
        nonFollowerViewers,
        followerPercentage: uniqueViewers > 0 ? (followerViewers / uniqueViewers) * 100 : 0,
        geographicDistribution,
        deviceTypes,
      },
      
      // Performance comparison
      performance: performanceComparison,
      
      // Story metadata
      storyMetadata: {
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
        mediaType: story.mediaType,
        videoDuration: story.videoDuration,
        hasCaption: !!story.caption,
        stickerCount: story.stickers ? (story.stickers as any[]).length : 0,
        visibility: story.visibility,
      },
    };
  }
}

// Export singleton instance
export const storyService = new StoryService();
