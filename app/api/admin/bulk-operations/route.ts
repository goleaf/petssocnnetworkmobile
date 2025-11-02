import { NextRequest, NextResponse } from 'next/server';
import {
  addBulkOperation,
  getBulkOperations,
  getRecentChanges,
  updateRecentChange,
  addRangeBlock,
} from '@/lib/moderation-storage';
import type { BulkOperation, RangeBlock } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const operations = getBulkOperations(limit);

    return NextResponse.json({ operations, total: operations.length });
  } catch (error) {
    console.error('Error fetching bulk operations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk operations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      targetIds,
      filters,
      performedBy,
      metadata,
    } = body;

    let succeeded = 0;
    let failed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    if (type === 'revert') {
      // Revert changes
      for (const id of targetIds) {
        try {
          const change = getRecentChanges({ limit: 1, offset: 0 }).find(c => c.id === id);
          if (change && change.revertedChangeId) {
            const originalChange = getRecentChanges({ limit: 1, offset: 0 }).find(
              c => c.id === change.revertedChangeId
            );
            if (originalChange) {
              // Revert by creating a new change that undoes the reverted change
              updateRecentChange(id, { status: 'rejected' });
              succeeded++;
            } else {
              failed++;
              errors.push({ id, error: 'Original change not found' });
            }
          } else {
            updateRecentChange(id, { status: 'rejected' });
            succeeded++;
          }
        } catch (error) {
          failed++;
          errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    } else if (type === 'range-block') {
      // Create range blocks
      const { ipRange, reason, expiresAt } = metadata as {
        ipRange: string;
        reason: string;
        expiresAt?: string;
      };

      try {
        const block = addRangeBlock({
          ipRange,
          reason,
          expiresAt,
          createdBy: performedBy,
          isActive: true,
          affectedChanges: targetIds,
        });
        succeeded = targetIds.length;
      } catch (error) {
        failed = targetIds.length;
        errors.push({
          id: 'range-block',
          error: error instanceof Error ? error.message : 'Failed to create range block',
        });
      }
    } else if (type === 'approve' || type === 'reject') {
      // Bulk approve/reject
      for (const id of targetIds) {
        try {
          updateRecentChange(id, {
            status: type === 'approve' ? 'approved' : 'rejected',
            reviewedBy: performedBy,
            reviewedAt: new Date().toISOString(),
          });
          succeeded++;
        } catch (error) {
          failed++;
          errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    } else if (type === 'assign-category') {
      // This would require category assignment logic
      succeeded = targetIds.length;
    }

    const operation = addBulkOperation({
      type: type as BulkOperation['type'],
      targetIds,
      filters,
      performedBy,
      result: {
        succeeded,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      },
      metadata,
    });

    return NextResponse.json({ operation }, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk operation' },
      { status: 500 }
    );
  }
}

