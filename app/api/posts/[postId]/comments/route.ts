import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { postRepository } from '@/lib/repositories/post-repository';
import { createNotification } from '@/lib/notifications';
import { invalidateContentCache } from '@/lib/scalability/cache-layer';

// Validation schema for comment creation
const createCommentSchema = z.object({
  textContent: z.string().min(1).max(5000),
  parentCommentId: z.string().optional(),
  mediaUrl: z.string().url().optional(),
});

/**
 * Extract @mentions from text content
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
  
  return Array.from(new Set(mentions));
}

/**
 * Validate mentioned users exist and return their IDs
 */
async function validateAndResolveMentions(usernames: string[]): Promise<string[]> {
  if (usernames.length === 0) {
    return [];
  }
  
  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });
  
  return users.map((u: { id: string }) => u.id);
}

/**
 * POST /api/posts/{postId}/comments - Create a comment
 * Creates comment, handles replies, notifies relevant users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
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
    const validatedData = createCommentSchema.parse(body);
    
    // Check if post exists and comments are enabled
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (!post.commentsEnabled) {
      return NextResponse.json(
        { error: 'Comments are disabled for this post' },
        { status: 403 }
      );
    }
    
    // If this is a reply, validate parent comment exists
    if (validatedData.parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentCommentId },
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
      
      if (parentComment.postId !== postId) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this post' },
          { status: 400 }
        );
      }
    }
    
    // Extract and validate mentions
    const mentions = extractMentions(validatedData.textContent);
    const mentionedUserIds = await validateAndResolveMentions(mentions);
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorUserId: userId,
        parentCommentId: validatedData.parentCommentId,
        textContent: validatedData.textContent,
        mediaUrl: validatedData.mediaUrl,
        mentionedUserIds,
      },
    });
    
    // Increment comment counter on post
    await postRepository.incrementCommentsCount(postId);
    
    // If this is a reply, increment replies counter on parent comment
    if (validatedData.parentCommentId) {
      await prisma.comment.update({
        where: { id: validatedData.parentCommentId },
        data: {
          repliesCount: { increment: 1 },
        },
      });
    }
    
    // Invalidate cache
    await invalidateContentCache('post', postId);
    
    // Get commenter info for notifications
    const commenter = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
      },
    });
    
    const commenterName = commenter?.displayName || commenter?.username || 'Someone';
    const commentPreview = validatedData.textContent.substring(0, 100);
    
    // Notify post author (if not the commenter)
    if (post.authorUserId !== userId) {
      createNotification({
        userId: post.authorUserId,
        type: 'comment',
        actorId: userId,
        targetId: comment.id,
        targetType: 'comment',
        message: `${commenterName} commented on your post`,
        priority: 'normal',
        category: 'social',
        channels: ['in_app', 'push'],
        metadata: {
          actorName: commenterName,
          targetTitle: commentPreview,
          targetTypeLabel: 'comment',
          postId,
        },
        batchKey: `comment_${post.authorUserId}_post`,
      });
    }
    
    // If this is a reply, notify parent comment author
    if (validatedData.parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentCommentId },
        select: { authorUserId: true },
      });
      
      if (parentComment && parentComment.authorUserId !== userId) {
        createNotification({
          userId: parentComment.authorUserId,
          type: 'reply',
          actorId: userId,
          targetId: comment.id,
          targetType: 'comment',
          message: `${commenterName} replied to your comment`,
          priority: 'normal',
          category: 'social',
          channels: ['in_app', 'push'],
          metadata: {
            actorName: commenterName,
            targetTitle: commentPreview,
            targetTypeLabel: 'reply',
            postId,
          },
          batchKey: `reply_${parentComment.authorUserId}_comment`,
        });
      }
    }
    
    // Notify mentioned users
    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId !== userId) {
        createNotification({
          userId: mentionedUserId,
          type: 'mention',
          actorId: userId,
          targetId: comment.id,
          targetType: 'comment',
          message: `${commenterName} mentioned you in a comment`,
          priority: 'normal',
          category: 'social',
          channels: ['in_app', 'push'],
          metadata: {
            actorName: commenterName,
            targetTitle: commentPreview,
            targetTypeLabel: 'comment',
            postId,
          },
          batchKey: `mention_${mentionedUserId}_comment`,
        });
      }
    }
    
    // Broadcast real-time update via WebSocket
    const { websocketService } = await import('@/lib/services/websocket-service');
    await websocketService.broadcastComment(postId, comment.id, userId, post.commentsCount + 1);
    
    // Return created comment with author info
    const commentWithAuthor = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: {
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });
    
    return NextResponse.json(
      {
        success: true,
        comment: {
          ...commentWithAuthor,
          author: {
            id: userId,
            username: commenter?.username,
            displayName: commenter?.displayName,
          },
        },
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating comment:', error);
    
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
 * GET /api/posts/{postId}/comments - Get comments for a post
 * Returns paginated list of comments with replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
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
      deletedAt: null,
      parentCommentId: null, // Only top-level comments
    };
    
    if (cursor) {
      where.id = { lt: cursor };
    }
    
    // Fetch comments
    const comments = await prisma.comment.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit + 1,
      include: {
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });
    
    const hasMore = comments.length > limit;
    const resultComments = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? resultComments[resultComments.length - 1].id : undefined;
    
    // Get author info for all comments
    const authorIds = Array.from(new Set(resultComments.map(c => c.authorUserId)));
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });
    
    const authorMap = new Map(authors.map(a => [a.id, a]));
    
    // Enrich comments with author data
    const enrichedComments = resultComments.map(comment => ({
      ...comment,
      author: authorMap.get(comment.authorUserId),
    }));
    
    return NextResponse.json({
      comments: enrichedComments,
      nextCursor,
      hasMore,
    });
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
