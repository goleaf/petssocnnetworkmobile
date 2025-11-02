import { NextRequest, NextResponse } from 'next/server';
import { reviewModeration } from '@/lib/moderation';
import { z } from 'zod';

const reviewSchema = z.object({
  moderationId: z.string(),
  action: z.enum(['approve', 'reject', 'flag']),
  reviewedBy: z.string().optional(),
  reason: z
    .enum(['graphic_content', 'inappropriate', 'violence', 'explicit', 'other'])
    .optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/moderation/review
 * Review and update moderation status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const moderation = await reviewModeration(
      validated.moderationId,
      validated.action,
      validated.reviewedBy || 'system',
      validated.reason
    );

    return NextResponse.json({ moderation }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reviewing moderation:', error);
    return NextResponse.json(
      { error: 'Failed to review moderation' },
      { status: 500 }
    );
  }
}

