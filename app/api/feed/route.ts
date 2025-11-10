/**
 * Feed API Endpoint
 * 
 * GET /api/feed - Get personalized feed for user
 * 
 * Query Parameters:
 * - type: Feed type (home, explore, following, local, my-pets)
 * - limit: Number of posts to return (default: 20, max: 50)
 * - cursor: Cursor for pagination
 * - contentTypes: Filter by content types (comma-separated)
 * - dateStart: Filter by start date (ISO string)
 * - dateEnd: Filter by end date (ISO string)
 * - topics: Filter by hashtags (comma-separated)
 * - petIds: Filter by pet IDs (comma-separated)
 * - highQualityOnly: Filter for high quality posts only (boolean)
 * 
 * Requirements: 1.1, 1.2, 13.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { feedService, FeedOptions } from '@/lib/services/feed-service';
import { getCurrentUser } from '@/lib/auth-server';

// Request validation schema
const getFeedSchema = z.object({
  type: z.enum(['home', 'explore', 'following', 'local', 'my-pets']).default('home'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  contentTypes: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  topics: z.string().optional(),
  petIds: z.string().optional(),
  highQualityOnly: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      type: searchParams.get('type') || 'home',
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
      contentTypes: searchParams.get('contentTypes') || undefined,
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined,
      topics: searchParams.get('topics') || undefined,
      petIds: searchParams.get('petIds') || undefined,
      highQualityOnly: searchParams.get('highQualityOnly') || undefined,
    };

    const validation = getFeedSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      type,
      limit,
      cursor,
      contentTypes,
      dateStart,
      dateEnd,
      topics,
      petIds,
      highQualityOnly,
    } = validation.data;

    // Build feed options
    const options: FeedOptions = {
      type,
      limit,
      cursor,
      filters: {},
    };

    // Parse filters
    if (contentTypes) {
      options.filters!.contentTypes = contentTypes.split(',').map((t) => t.trim());
    }

    if (dateStart || dateEnd) {
      options.filters!.dateRange = {};
      if (dateStart) {
        options.filters!.dateRange.start = new Date(dateStart);
      }
      if (dateEnd) {
        options.filters!.dateRange.end = new Date(dateEnd);
      }
    }

    if (topics) {
      options.filters!.topics = topics.split(',').map((t) => t.trim());
    }

    if (petIds) {
      options.filters!.petIds = petIds.split(',').map((id) => id.trim());
    }

    if (highQualityOnly) {
      options.filters!.highQualityOnly = highQualityOnly;
    }

    // Get feed
    const feed = await feedService.getFeed(user.id, options);

    return NextResponse.json(feed);
  } catch (error) {
    console.error('Error getting feed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
