/**
 * GET /api/close-friends - Get user's close friends list
 * PUT /api/close-friends - Update user's close friends list
 * 
 * Requirements: 9.1, 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Retrieve close friends list for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'user-1';

    // Get all close friends for this user
    const closeFriends = await prisma.closeFriend.findMany({
      where: {
        userId,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      friendIds: closeFriends.map(cf => cf.friendUserId),
      count: closeFriends.length,
    });

  } catch (error) {
    console.error('Error fetching close friends:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch close friends' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update close friends list (replace entire list)
 */
export async function PUT(request: NextRequest) {
  try {
    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'user-1';

    const body = await request.json();
    const { friendIds } = body;

    // Validate input
    if (!Array.isArray(friendIds)) {
      return NextResponse.json(
        { error: 'friendIds must be an array' },
        { status: 400 }
      );
    }

    // Validate that all friend IDs are valid users
    if (friendIds.length > 0) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: {
            in: friendIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (validUsers.length !== friendIds.length) {
        return NextResponse.json(
          { error: 'One or more user IDs are invalid' },
          { status: 400 }
        );
      }
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all existing close friends
      await tx.closeFriend.deleteMany({
        where: {
          userId,
        },
      });

      // Add new close friends
      if (friendIds.length > 0) {
        await tx.closeFriend.createMany({
          data: friendIds.map(friendUserId => ({
            userId,
            friendUserId,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      friendIds,
      count: friendIds.length,
      message: 'Close friends list updated successfully',
    });

  } catch (error) {
    console.error('Error updating close friends:', error);
    
    return NextResponse.json(
      { error: 'Failed to update close friends' },
      { status: 500 }
    );
  }
}
