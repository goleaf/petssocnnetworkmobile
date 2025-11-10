import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const rsvpSchema = z.object({
  status: z.enum(['going', 'interested', 'cant_go']),
});

/**
 * POST /api/posts/[postId]/event-rsvp - RSVP to an event
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
    const { status } = rsvpSchema.parse(body);

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        postType: true,
        eventData: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.postType !== 'event') {
      return NextResponse.json(
        { error: 'Post is not an event' },
        { status: 400 }
      );
    }

    const eventData = post.eventData as any;
    if (!eventData) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Check if event has passed
    if (eventData.startAt && new Date(eventData.startAt) < new Date()) {
      return NextResponse.json(
        { error: 'Event has already passed' },
        { status: 400 }
      );
    }

    // Initialize rsvps if not present
    const rsvps = eventData.rsvps || {
      going: [],
      interested: [],
      cantGo: [],
    };

    // Remove user from all RSVP lists
    const updatedRsvps = {
      going: rsvps.going.filter((id: string) => id !== userId),
      interested: rsvps.interested.filter((id: string) => id !== userId),
      cantGo: rsvps.cantGo.filter((id: string) => id !== userId),
    };

    // Add user to the selected RSVP list
    if (status === 'going') {
      updatedRsvps.going.push(userId);
    } else if (status === 'interested') {
      updatedRsvps.interested.push(userId);
    } else if (status === 'cant_go') {
      updatedRsvps.cantGo.push(userId);
    }

    // Update event data
    const updatedEventData = {
      ...eventData,
      rsvps: updatedRsvps,
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        eventData: updatedEventData,
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEventData,
    });

  } catch (error) {
    console.error('Error updating RSVP:', error);
    
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
 * DELETE /api/posts/[postId]/event-rsvp - Remove RSVP from an event
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
        postType: true,
        eventData: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.postType !== 'event') {
      return NextResponse.json(
        { error: 'Post is not an event' },
        { status: 400 }
      );
    }

    const eventData = post.eventData as any;
    if (!eventData || !eventData.rsvps) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Remove user from all RSVP lists
    const updatedRsvps = {
      going: eventData.rsvps.going.filter((id: string) => id !== userId),
      interested: eventData.rsvps.interested.filter((id: string) => id !== userId),
      cantGo: eventData.rsvps.cantGo.filter((id: string) => id !== userId),
    };

    // Update event data
    const updatedEventData = {
      ...eventData,
      rsvps: updatedRsvps,
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        eventData: updatedEventData,
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEventData,
    });

  } catch (error) {
    console.error('Error removing RSVP:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
