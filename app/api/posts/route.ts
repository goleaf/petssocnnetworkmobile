import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { postRepository } from '@/lib/repositories/post-repository';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// Validation schema for post creation
const createPostSchema = z.object({
  textContent: z.string().max(5000).optional(),
  postType: z.enum(['standard', 'photo_album', 'video', 'poll', 'shared', 'question', 'event', 'marketplace']).default('standard'),
  media: z.array(z.object({
    id: z.string().optional(),
    url: z.string(),
    type: z.enum(['photo', 'video', 'gif']),
    thumbnail: z.string().optional(),
    caption: z.string().optional(),
    order: z.number(),
  })).max(10).optional(),
  petTags: z.array(z.string()).optional(),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    placeId: z.string().optional(),
  }).optional(),
  visibility: z.enum(['public', 'friends', 'private', 'custom', 'followers_only']).default('public'),
  visibilityUserIds: z.array(z.string()).optional(),
  commentsEnabled: z.boolean().default(true),
  sharesEnabled: z.boolean().default(true),
  // Poll data
  pollOptions: z.array(z.object({
    id: z.string(),
    text: z.string().max(50),
    votes: z.number().default(0),
  })).min(2).max(4).optional(),
  pollQuestion: z.string().optional(),
  pollExpiresAt: z.string().datetime().optional(),
  pollAllowMultiple: z.boolean().default(false),
  // Event data
  eventTitle: z.string().optional(),
  eventStartAt: z.string().datetime().optional(),
  eventDurationMinutes: z.number().optional(),
  eventTimezone: z.string().optional(),
  eventLocation: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  // Marketplace data
  marketplacePrice: z.number().optional(),
  marketplaceCurrency: z.string().default('USD'),
  marketplaceCondition: z.enum(['New', 'Like New', 'Good', 'Fair']).optional(),
  marketplaceCategory: z.enum(['Toys', 'Food', 'Clothing', 'Accessories', 'Furniture', 'Healthcare', 'Books', 'Other']).optional(),
  marketplaceShipping: z.object({
    localPickup: z.boolean().optional(),
    shippingAvailable: z.boolean().optional(),
  }).optional(),
  marketplacePaymentMethods: z.array(z.string()).optional(),
  // Question data
  questionCategory: z.enum(['Training', 'Health', 'Behavior', 'Products', 'General']).optional(),
  // Shared post
  sharedPostId: z.string().optional(),
  shareComment: z.string().optional(),
  scheduledPublishAt: z.string().datetime().optional(),
});

/**
 * Extract @mentions from text content
 * Returns array of usernames without @ symbol
 */
function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) {
      mentions.push(match[1]);
    }
  }
  
  return Array.from(new Set(mentions)); // Remove duplicates
}

/**
 * Extract #hashtags from text content
 * Returns array of hashtags without # symbol
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    if (match[1]) {
      hashtags.push(match[1].toLowerCase());
    }
  }
  
  return Array.from(new Set(hashtags)); // Remove duplicates
}

/**
 * Validate mentioned users exist and return their IDs
 */
async function validateAndResolveMentions(usernames: string[]): Promise<{ userIds: string[]; validUsernames: string[] }> {
  if (usernames.length === 0) {
    return { userIds: [], validUsernames: [] };
  }
  
  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      username: true,
    },
  });
  
  return {
    userIds: users.map((u: { id: string; username: string }) => u.id),
    validUsernames: users.map((u: { id: string; username: string }) => u.username),
  };
}

/**
 * Send notifications to mentioned users
 */
async function notifyMentionedUsers(
  mentionedUserIds: string[],
  postId: string,
  authorId: string,
  authorName: string,
  postPreview: string
) {
  for (const userId of mentionedUserIds) {
    // Don't notify the author if they mentioned themselves
    if (userId === authorId) continue;
    
    createNotification({
      userId,
      type: 'mention',
      actorId: authorId,
      targetId: postId,
      targetType: 'post',
      message: `${authorName} mentioned you in a post`,
      priority: 'normal',
      category: 'social',
      channels: ['in_app', 'push', 'email'],
      metadata: {
        actorName: authorName,
        targetTitle: postPreview,
        targetTypeLabel: 'post',
      },
      batchKey: `mention_${userId}_post`,
    });
  }
}

/**
 * Broadcast new post to followers via WebSocket
 * Note: This is a placeholder - actual WebSocket implementation would go here
 */
async function broadcastNewPost(postId: string, authorId: string) {
  // TODO: Implement WebSocket broadcasting
  // This would typically:
  // 1. Get list of followers
  // 2. Send WebSocket message to each follower's channel
  // 3. Include post data in the message
  
  // For now, we'll just log it
  console.log(`[WebSocket] Broadcasting new post ${postId} from author ${authorId}`);
}

/**
 * POST /api/posts - Create a new post
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    // TODO: Replace with actual auth check
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);
    
    // Extract mentions and hashtags from text content
    const mentions = validatedData.textContent ? extractMentions(validatedData.textContent) : [];
    const hashtags = validatedData.textContent ? extractHashtags(validatedData.textContent) : [];
    
    // Validate mentioned users exist
    const { userIds: mentionedUserIds } = await validateAndResolveMentions(mentions);
    
    // Validate media limits based on post type
    if (validatedData.media && validatedData.media.length > 0) {
      const photoCount = validatedData.media.filter(m => m.type === 'photo').length;
      const videoCount = validatedData.media.filter(m => m.type === 'video').length;
      
      if (videoCount > 1) {
        return NextResponse.json(
          { error: 'Only one video per post is allowed' },
          { status: 400 }
        );
      }
      
      if (photoCount > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 photos per post' },
          { status: 400 }
        );
      }
    }
    
    // Validate poll options if poll post
    if (validatedData.postType === 'poll' && !validatedData.pollOptions) {
      return NextResponse.json(
        { error: 'Poll posts require poll options and question' },
        { status: 400 }
      );
    }
    
    // Validate event data if event post
    if (validatedData.postType === 'event' && (!validatedData.eventTitle || !validatedData.eventStartAt)) {
      return NextResponse.json(
        { error: 'Event posts require title and start time' },
        { status: 400 }
      );
    }
    
    // Validate marketplace data if marketplace post
    if (validatedData.postType === 'marketplace' && (!validatedData.marketplacePrice || !validatedData.marketplaceCondition || !validatedData.marketplaceCategory)) {
      return NextResponse.json(
        { error: 'Marketplace posts require price, condition, and category' },
        { status: 400 }
      );
    }
    
    // Validate question category if question post
    if (validatedData.postType === 'question' && !validatedData.questionCategory) {
      return NextResponse.json(
        { error: 'Question posts require a category' },
        { status: 400 }
      );
    }
    
    // Validate shared post exists if shared post
    if (validatedData.postType === 'shared' && validatedData.sharedPostId) {
      const sharedPost = await postRepository.getPost(validatedData.sharedPostId);
      if (!sharedPost) {
        return NextResponse.json(
          { error: 'Shared post not found' },
          { status: 404 }
        );
      }
    }
    
    // Prepare poll data
    const pollData = validatedData.postType === 'poll' && validatedData.pollOptions ? {
      question: validatedData.pollQuestion || '',
      options: validatedData.pollOptions,
      totalVotes: 0,
      expiresAt: validatedData.pollExpiresAt,
      allowMultiple: validatedData.pollAllowMultiple,
    } : undefined;

    // Prepare event data
    const eventData = validatedData.postType === 'event' ? {
      title: validatedData.eventTitle!,
      startAt: validatedData.eventStartAt!,
      durationMinutes: validatedData.eventDurationMinutes,
      timezone: validatedData.eventTimezone,
      location: validatedData.eventLocation,
      rsvps: {
        going: [],
        interested: [],
        cantGo: [],
      },
    } : undefined;

    // Prepare marketplace data
    const marketplaceData = validatedData.postType === 'marketplace' ? {
      price: validatedData.marketplacePrice!,
      currency: validatedData.marketplaceCurrency,
      condition: validatedData.marketplaceCondition!,
      category: validatedData.marketplaceCategory!,
      shipping: validatedData.marketplaceShipping,
      paymentMethods: validatedData.marketplacePaymentMethods,
    } : undefined;

    // Prepare question data
    const questionData = validatedData.postType === 'question' ? {
      category: validatedData.questionCategory!,
    } : undefined;

    // Create post record
    const post = await postRepository.createPost({
      authorUserId: userId,
      postType: validatedData.postType,
      textContent: validatedData.textContent,
      media: validatedData.media,
      petTags: validatedData.petTags || [],
      mentionedUserIds,
      hashtags,
      location: validatedData.location,
      visibility: validatedData.visibility,
      visibilityUserIds: validatedData.visibilityUserIds || [],
      commentsEnabled: validatedData.commentsEnabled,
      sharesEnabled: validatedData.sharesEnabled,
      pollData,
      eventData,
      marketplaceData,
      questionData,
      sharedPostId: validatedData.sharedPostId,
      shareComment: validatedData.shareComment,
      scheduledPublishAt: validatedData.scheduledPublishAt ? new Date(validatedData.scheduledPublishAt) : undefined,
      publishedAt: validatedData.scheduledPublishAt ? undefined : new Date(),
    });
    
    // Get author info for notifications
    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
      },
    });
    
    const authorName = author?.displayName || author?.username || 'Someone';
    
    // Send notifications to mentioned users
    if (mentionedUserIds.length > 0) {
      const postPreview = validatedData.textContent?.substring(0, 100) || 'a post';
      await notifyMentionedUsers(mentionedUserIds, post.id, userId, authorName, postPreview);
    }
    
    // Broadcast new post to followers via WebSocket
    await broadcastNewPost(post.id, userId);
    
    // Return created post with engagement counts
    const postWithCounts = await postRepository.getPostWithCounts(post.id);
    
    return NextResponse.json(
      {
        success: true,
        post: postWithCounts,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating post:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
