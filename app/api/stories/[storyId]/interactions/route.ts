/**
 * Story Interactions API
 * Handles all types of story interactions: reactions, poll votes, question responses, etc.
 * 
 * Requirements: 10.4, 10.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;
    const body = await request.json();
    const { userId, interactionType, data } = body;

    if (!userId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify story exists and is not expired
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story || story.deletedAt) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (new Date() > story.expiresAt) {
      return NextResponse.json(
        { error: 'Story has expired' },
        { status: 410 }
      );
    }

    // Create interaction record
    const interaction = await prisma.storyInteraction.create({
      data: {
        storyId,
        userId,
        interactionType,
        data: data || {},
      },
    });

    // Update story counters based on interaction type
    if (interactionType === 'reaction') {
      await prisma.story.update({
        where: { id: storyId },
        data: {
          reactionsCount: {
            increment: 1,
          },
        },
      });
    } else if (interactionType === 'reply') {
      await prisma.story.update({
        where: { id: storyId },
        data: {
          repliesCount: {
            increment: 1,
          },
        },
      });
    } else if (interactionType === 'link_click') {
      await prisma.story.update({
        where: { id: storyId },
        data: {
          linkClicksCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      interaction,
    });
  } catch (error) {
    console.error('Error creating story interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;
    const { searchParams } = new URL(request.url);
    const interactionType = searchParams.get('type');

    const where: any = { storyId };
    if (interactionType) {
      where.interactionType = interactionType;
    }

    const interactions = await prisma.storyInteraction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      interactions,
    });
  } catch (error) {
    console.error('Error fetching story interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
