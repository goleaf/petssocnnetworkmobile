import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const voteSchema = z.object({
  optionIds: z.array(z.string()).min(1),
});

/**
 * POST /api/posts/[postId]/poll-vote - Vote on a poll
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
    const { optionIds } = voteSchema.parse(body);

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        postType: true,
        pollOptions: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.postType !== 'poll') {
      return NextResponse.json(
        { error: 'Post is not a poll' },
        { status: 400 }
      );
    }

    const pollData = post.pollOptions as any;
    if (!pollData || !pollData.options) {
      return NextResponse.json(
        { error: 'Invalid poll data' },
        { status: 400 }
      );
    }

    // Check if poll has expired
    if (pollData.expiresAt && new Date(pollData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 400 }
      );
    }

    // Validate option IDs
    const validOptionIds = pollData.options.map((opt: any) => opt.id);
    const invalidOptions = optionIds.filter((id) => !validOptionIds.includes(id));
    
    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid option IDs' },
        { status: 400 }
      );
    }

    // Check if multiple votes allowed
    if (!pollData.allowMultiple && optionIds.length > 1) {
      return NextResponse.json(
        { error: 'This poll only allows one vote' },
        { status: 400 }
      );
    }

    // Create vote records
    await prisma.$transaction(
      optionIds.map((optionId) =>
        prisma.pollVote.create({
          data: {
            postId,
            userId,
            optionId,
          },
        })
      )
    );

    // Update poll data with new vote counts
    const updatedOptions = pollData.options.map((option: any) => ({
      ...option,
      votes: option.votes + (optionIds.includes(option.id) ? 1 : 0),
    }));

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      totalVotes: pollData.totalVotes + 1,
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        pollOptions: updatedPollData,
      },
    });

    return NextResponse.json({
      success: true,
      poll: updatedPollData,
    });

  } catch (error) {
    console.error('Error voting on poll:', error);
    
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
