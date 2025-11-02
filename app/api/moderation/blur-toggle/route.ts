import { NextRequest, NextResponse } from 'next/server';
import { toggleBlurOnWarning } from '@/lib/moderation';
import { z } from 'zod';

const toggleSchema = z.object({
  moderationId: z.string(),
  blurOnWarning: z.boolean(),
});

/**
 * POST /api/moderation/blur-toggle
 * Toggle blur-on-warning setting for a moderation item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = toggleSchema.parse(body);

    const moderation = await toggleBlurOnWarning(
      validated.moderationId,
      validated.blurOnWarning
    );

    return NextResponse.json({ moderation }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error toggling blur setting:', error);
    return NextResponse.json(
      { error: 'Failed to toggle blur setting' },
      { status: 500 }
    );
  }
}

