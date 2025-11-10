/**
 * GET /api/stories/archive - Get archived stories for a user
 * 
 * Requirements: 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get archived stories with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Build where clause
    const where: any = {
      creatorUserId: userId,
      isArchived: true,
      deletedAt: null,
    };

    // Filter by year/month if provided
    if (year) {
      const yearNum = parseInt(year, 10);
      const startDate = new Date(yearNum, month ? parseInt(month, 10) - 1 : 0, 1);
      const endDate = month 
        ? new Date(yearNum, parseInt(month, 10), 0, 23, 59, 59)
        : new Date(yearNum, 11, 31, 23, 59, 59);

      where.archivedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Add cursor pagination
    if (cursor) {
      where.id = {
        lt: cursor,
      };
    }

    // Fetch stories
    const stories = await prisma.story.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there are more
    });

    const hasMore = stories.length > limit;
    const results = hasMore ? stories.slice(0, limit) : stories;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    // Group stories by month/year for easier display
    type StoryType = typeof results[number];
    const groupedStories: Record<string, StoryType[]> = {};
    
    results.forEach((story: StoryType) => {
      if (story.archivedAt) {
        const date = new Date(story.archivedAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!groupedStories[key]) {
          groupedStories[key] = [];
        }
        groupedStories[key].push(story);
      }
    });

    return NextResponse.json({
      success: true,
      stories: results,
      groupedStories,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching archived stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived stories' },
      { status: 500 }
    );
  }
}
