import { NextRequest, NextResponse } from 'next/server';
import { getQueueItems, addQueueItem, updateQueueItem } from '@/lib/moderation-storage';
import type { QueueType } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queueType = searchParams.get('queueType') as QueueType | null;

    const items = getQueueItems(queueType || undefined);

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('Error fetching queue items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      queueType,
      changeId,
      priority,
      assignedTo,
      notes,
      change,
    } = body;

    const item = addQueueItem({
      queueType: queueType as QueueType,
      changeId,
      priority: priority || 'medium',
      assignedTo,
      status: 'pending',
      notes,
      change,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating queue item:', error);
    return NextResponse.json(
      { error: 'Failed to create queue item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Queue item ID is required' },
        { status: 400 }
      );
    }

    const updated = updateQueueItem(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Error updating queue item:', error);
    return NextResponse.json(
      { error: 'Failed to update queue item' },
      { status: 500 }
    );
  }
}

