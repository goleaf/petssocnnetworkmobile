import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { postRepository } from '@/lib/repositories/post-repository';
import { createNotification } from '@/lib/notifications';
import { invalidateContentCache } from '@/lib/scalability/cache-layer';

// Validation schema for share creation
const createShareSchema = z.object({
  shareType: z.enum(['repost', 'quote', 'external']).default('repost'),
  caption: z.string().max(500).optional(),
});

/**
 * POST /api/posts/{postId}/share - Share a post
 * Creates share record, increments counter, notifies author
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    
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
    const body = await request.json().catch(() => ({}));
    const validatedData = createShareSchema.parse(body);
    
    // Check if post exists and shares are enabled
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (!post.sharesEnabled) {
      return NextResponse.json(
        { error: 'Sharing is disabled for this post' },
        { status: 403 }
      );
    }
    
    // Check if user already shared this post (for repost type)
    if (validatedData.shareType === 'repost') {
      const existingShare = await prisma.postShare.findFirst({
        where: {
          postId,
          userId,
          shareType: 'repost',
        },
      });
      
      if (existingShare) {
        return NextResponse.json(
          { error: 'Already shared this post' },
          { status: 409 }
        );
      }
    }
    
    // Create share record
    const share = await prisma.postShare.create({
      data: {
        postId,
        userId,
        shareType: validatedData.shareType,
        caption: validatedData.caption,
      },
    });
    
    // Increment shares counter
    await postRepository.incrementSharesCount(postId);
    
    // Invalidate cache
    await invalidateContentCache('post', postId);
    
    // Send notification to post author (if not the sharer)
    if (post.authorUserId !== userId) {
      const [author, sharer] = await Promise.all([
        prisma.user.findUnique({
          where: { id: post.authorUserId },
          select: { username: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, displayName: true },
        }),
      ]);
      
      const sharerName = sharer?.displayName || sharer?.username || 'Someone';
      const postPreview = post.textContent?.substring(0, 50) || 'your post';
      
      createNotification({
        userId: post.authorUserId,
        type: 'share',
        actorId: userId,
        targetId: postId,
        targetType: 'post',
        message: `${sharerName} shared your post`,
        priority: 'normal',
        category: 'social',
        channels: ['in_app'],
        metadata: {
          actorName: sharerName,
          targetTitle: postPreview,
          targetTypeLabel: 'post',
          shareType: validatedData.shareType,
        },
        batchKey: `share_${post.authorUserId}_post`,
      });
    }
    
    // TODO: Broadcast real-time update via WebSocket
    console.log(`[WebSocket] Broadcasting share on post ${postId} by user ${userId}`);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Post shared successfully',
        share: {
          id: share.id,
          shareType: share.shareType,
          createdAt: share.createdAt,
        },
        sharesCount: post.sharesCount + 1,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error sharing post:', error);
    
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

/**
 * GET /api/posts/{postId}/share - Get shares for a post
 * Returns list of users who shared the post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;
    
    // Check if post exists
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Build query
    const where: any = {
      postId,
    };
    
    if (cursor) {
      where.id = { lt: cursor };
    }
    
    // Fetch shares
    const shares = await prisma.postShare.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
    });
    
    const hasMore = shares.length > limit;
    const resultShares = hasMore ? shares.slice(0, limit) : shares;
    const nextCursor = hasMore ? resultShares[resultShares.length - 1].id : undefined;
    
    // Get user info for all shares
    const userIds = Array.from(new Set(resultShares.map(s => s.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Enrich shares with user data
    const enrichedShares = resultShares.map(share => ({
      ...share,
      user: userMap.get(share.userId),
    }));
    
    return NextResponse.json({
      shares: enrichedShares,
      nextCursor,
      hasMore,
    });
    
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
