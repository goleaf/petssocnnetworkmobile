import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const bestAnswerSchema = z.object({
  commentId: z.string(),
});

/**
 * POST /api/posts/[postId]/best-answer - Mark a comment as the best answer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;
    const body = await request.json();
    const { commentId } = bestAnswerSchema.parse(body);

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorUserId: true,
        postType: true,
        questionData: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.authorUserId !== userId) {
      return NextResponse.json(
        { error: 'Only the question author can mark the best answer' },
        { status: 403 }
      );
    }

    if (post.postType !== 'question') {
      return NextResponse.json(
        { error: 'Post is not a question' },
        { status: 400 }
      );
    }

    // Verify the comment exists and belongs to this post
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        postId: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.postId !== postId) {
      return NextResponse.json(
        { error: 'Comment does not belong to this post' },
        { status: 400 }
      );
    }

    // Update question data
    const questionData = (post.questionData as any) || {};
    const updatedQuestionData = {
      ...questionData,
      bestAnswerCommentId: commentId,
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        questionData: updatedQuestionData,
      },
    });

    return NextResponse.json({
      success: true,
      question: updatedQuestionData,
    });

  } catch (error) {
    console.error('Error marking best answer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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
 * DELETE /api/posts/[postId]/best-answer - Remove best answer marking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorUserId: true,
        postType: true,
        questionData: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.authorUserId !== userId) {
      return NextResponse.json(
        { error: 'Only the question author can remove the best answer' },
        { status: 403 }
      );
    }

    if (post.postType !== 'question') {
      return NextResponse.json(
        { error: 'Post is not a question' },
        { status: 400 }
      );
    }

    // Update question data
    const questionData = (post.questionData as any) || {};
    const updatedQuestionData = {
      ...questionData,
      bestAnswerCommentId: null,
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        questionData: updatedQuestionData,
      },
    });

    return NextResponse.json({
      success: true,
      question: updatedQuestionData,
    });

  } catch (error) {
    console.error('Error removing best answer:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
