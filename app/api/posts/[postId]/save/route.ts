import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { postRepository } from '@/lib/repositories/post-repository';
import { invalidateContentCache } from '@/lib/scalability/cache-layer';

// Validation schema for save creation
const createSaveSchema = z.object({
  collectionName: z.string().max(100).optional(),
});

/**
 * POST /api/posts/{postId}/save - Save a post to collection
 * Creates save record, increments counter (private action, no notification)
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
    const body = await request.json().catch(() => ({}));
    const validatedData = createSaveSchema.parse(body);
    
    // Check if post exists
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user already saved this post
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    
    if (existingSave) {
      // Update collection name if provided
      if (validatedData.collectionName && existingSave.collectionName !== validatedData.collectionName) {
        await prisma.savedPost.update({
          where: { id: existingSave.id },
          data: { collectionName: validatedData.collectionName },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Post moved to collection',
          collectionName: validatedData.collectionName,
        });
      }
      
      return NextResponse.json(
        { error: 'Post already saved' },
        { status: 409 }
      );
    }
    
    // Create save record
    const save = await prisma.savedPost.create({
      data: {
        postId,
        userId,
        collectionName: validatedData.collectionName,
      },
    });
    
    // Increment saves counter
    await postRepository.incrementSavesCount(postId);
    
    // Invalidate cache
    await invalidateContentCache('post', postId);
    
    // Note: Saving is a private action, no notification sent
    
    // Broadcast real-time update via WebSocket (for counter only)
    const { websocketService } = await import('@/lib/services/websocket-service');
    await websocketService.broadcastSave(postId, userId, post.savesCount + 1);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Post saved successfully',
        save: {
          id: save.id,
          collectionName: save.collectionName,
          createdAt: save.createdAt,
        },
        savesCount: post.savesCount + 1,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error saving post:', error);
    
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
 * DELETE /api/posts/{postId}/save - Unsave a post
 * Removes save record, decrements counter
 */
export async function DELETE(
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
    
    // Check if post exists
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user has saved this post
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    
    if (!existingSave) {
      return NextResponse.json(
        { error: 'Save not found' },
        { status: 404 }
      );
    }
    
    // Delete save record
    await prisma.savedPost.delete({
      where: { id: existingSave.id },
    });
    
    // Decrement saves counter
    await postRepository.decrementSavesCount(postId);
    
    // Invalidate cache
    await invalidateContentCache('post', postId);
    
    // Broadcast real-time update via WebSocket (for counter only)
    const { websocketService } = await import('@/lib/services/websocket-service');
    await websocketService.broadcastSave(postId, userId, Math.max(0, post.savesCount - 1));
    
    return NextResponse.json({
      success: true,
      message: 'Post unsaved successfully',
      savesCount: Math.max(0, post.savesCount - 1),
    });
    
  } catch (error) {
    console.error('Error unsaving post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/{postId}/save - Check if user has saved a post
 * Returns save status for the authenticated user
 */
export async function GET(
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
    
    // Check if post exists
    const post = await postRepository.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user has saved this post
    const save = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    
    return NextResponse.json({
      isSaved: !!save,
      save: save ? {
        id: save.id,
        collectionName: save.collectionName,
        createdAt: save.createdAt,
      } : null,
    });
    
  } catch (error) {
    console.error('Error checking save status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
