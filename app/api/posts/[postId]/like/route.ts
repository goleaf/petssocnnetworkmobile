import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { postRepository } from '@/lib/repositories/post-repository';
import { createNotification } from '@/lib/notifications';
import { invalidateContentCache } from '@/lib/scalability/cache-layer';

/**
 * POST /api/posts/{postId}/like - Like a post
 * Creates a like record, increments counter, notifies author
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
    
    // Get reaction type from body (default to 'like')
    const body = await request.json().catch(() => ({}));
    const reactionType = body.reactionType || 'like';
    
    // Validate reaction type
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'paw'];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      );
    }
    
    // Check if post exists
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    
    if (existingLike) {
      // Update reaction type if different
      if (existingLike.reactionType !== reactionType) {
        await prisma.postLike.update({
          where: { id: existingLike.id },
          data: { reactionType },
        });
        
        // Invalidate cache
        await invalidateContentCache('post', postId);
        
        return NextResponse.json({
          success: true,
          message: 'Reaction updated',
          reactionType,
        });
      }
      
      return NextResponse.json(
        { error: 'Already liked this post' },
        { status: 409 }
      );
    }
    
    // Create like record
    await prisma.postLike.create({
      data: {
        postId,
        userId,
        reactionType,
      },
    });
    
    // Increment likes counter
    await postRepository.incrementLikesCount(postId);
    
    // Update reactions breakdown
    const reactions = (post.reactions as Record<string, number>) || {};
    reactions[reactionType] = (reactions[reactionType] || 0) + 1;
    
    await prisma.post.update({
      where: { id: postId },
      data: { reactions },
    });
    
    // Invalidate cache
    await invalidateContentCache('post', postId);
    
    // Send notification to post author (throttled)
    if (post.authorUserId !== userId) {
      // Get author and liker info
      const [author, liker] = await Promise.all([
        prisma.user.findUnique({
          where: { id: post.authorUserId },
          select: { username: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, displayName: true },
        }),
      ]);
      
      const likerName = liker?.displayName || liker?.username || 'Someone';
      const postPreview = post.textContent?.substring(0, 50) || 'your post';
      
      createNotification({
        userId: post.authorUserId,
        type: 'like',
        actorId: userId,
        targetId: postId,
        targetType: 'post',
        message: `${likerName} reacted to your post`,
        priority: 'low',
        category: 'social',
        channels: ['in_app'],
        metadata: {
          actorName: likerName,
          targetTitle: postPreview,
          targetTypeLabel: 'post',
          reactionType,
        },
        batchKey: `like_${post.authorUserId}_post`,
      });
    }
    
    // TODO: Broadcast real-time update via WebSocket
    console.log(`[WebSocket] Broadcasting like on post ${postId} by user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Post liked successfully',
      reactionType,
      likesCount: post.likesCount + 1,
    });
    
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/{postId}/like - Unlike a post
 * Removes like record, decrements counter
 */
export async function DELETE(
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
    
    // Check if post exists
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user has liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    
    if (!existingLike) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }
    
    // Delete like record
    await prisma.postLike.delete({
      where: { id: existingLike.id },
    });
    
    // Decrement likes counter
    await postRepository.decrementLikesCount(postId);
    
    // Update reactions breakdown
    const reactions = (post.reactions as Record<string, number>) || {};
    const reactionType = existingLike.reactionType;
    if (reactions[reactionType]) {
      reactions[reactionType] = Math.max(0, reactions[reactionType] - 1);
    }
    
    await prisma.post.update({
      where: { id: postId },
      data: { reactions },
    });
    
    // Invalidate cache
    await invalidateContentCache('post', postId);
    
    // TODO: Broadcast real-time update via WebSocket
    console.log(`[WebSocket] Broadcasting unlike on post ${postId} by user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Post unliked successfully',
      likesCount: Math.max(0, post.likesCount - 1),
    });
    
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
