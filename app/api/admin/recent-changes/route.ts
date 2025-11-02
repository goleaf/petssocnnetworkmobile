import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentChanges,
  addRecentChange,
  updateRecentChange,
  getRecentChangeById,
} from '@/lib/moderation-storage';
import { calculateDiff, compareObjects } from '@/lib/diff-utils';
import type { RecentChange, ChangeType, ChangeStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ChangeType | null;
    const status = searchParams.get('status') as ChangeStatus | null;
    const contentType = searchParams.get('contentType') as RecentChange['contentType'] | null;
    const changedBy = searchParams.get('changedBy') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const changes = getRecentChanges({
      type: type || undefined,
      status: status || undefined,
      contentType: contentType || undefined,
      changedBy,
      limit,
      offset,
    });

    return NextResponse.json({ changes, total: changes.length });
  } catch (error) {
    console.error('Error fetching recent changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent changes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      contentType,
      contentId,
      contentTitle,
      contentSlug,
      oldContent,
      newContent,
      summary,
      changedBy,
      changedByName,
      isMinor,
      isRevert,
      revertedChangeId,
    } = body;

    // Calculate diffs
    let changes: RecentChange['changes'] = [];
    
    if (typeof oldContent === 'string' && typeof newContent === 'string') {
      // Simple text diff
      const diff = calculateDiff(oldContent, newContent);
      changes = [diff];
    } else if (typeof oldContent === 'object' && typeof newContent === 'object') {
      // Object diff
      changes = compareObjects(oldContent as Record<string, unknown>, newContent as Record<string, unknown>);
    }

    const change = addRecentChange({
      type: type as ChangeType,
      status: 'pending',
      contentType: contentType as RecentChange['contentType'],
      contentId,
      contentTitle,
      contentSlug,
      changes,
      summary,
      changedBy,
      changedByName,
      changedAt: new Date().toISOString(),
      isMinor: isMinor || false,
      isRevert: isRevert || false,
      revertedChangeId,
    });

    return NextResponse.json({ change }, { status: 201 });
  } catch (error) {
    console.error('Error creating recent change:', error);
    return NextResponse.json(
      { error: 'Failed to create recent change' },
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
        { error: 'Change ID is required' },
        { status: 400 }
      );
    }

    const updated = updateRecentChange(id, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Change not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ change: updated });
  } catch (error) {
    console.error('Error updating recent change:', error);
    return NextResponse.json(
      { error: 'Failed to update recent change' },
      { status: 500 }
    );
  }
}

