/**
 * POST /api/close-friends/[friendId] - Add a user to close friends
 * DELETE /api/close-friends/[friendId] - Remove a user from close friends
 * 
 * Requirements: 9.1, 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: {
    friendId: string;
  };
}

/**
 * POST - Add a user to close friends
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'user-1';
    const { friendId } = params;

    // Validate that friend user exists
    const friendUser = await prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!friendUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already in close friends
    const existing = await prisma.closeFriend.findUnique({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId: friendId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already in close friends' },
        { status: 400 }
      );
    }

    // Add to close friends
    const closeFriend = await prisma.closeFriend.create({
      data: {
        userId,
        friendUserId: friendId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Added to close friends',
      closeFriend: {
        id: closeFriend.id,
        userId: closeFriend.userId,
        friendUserId: closeFriend.friendUserId,
        addedAt: closeFriend.addedAt.toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding to close friends:', error);
    
    return NextResponse.json(
      { error: 'Failed to add to close friends' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a user from close friends
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'user-1';
    const { friendId } = params;

    // Check if in close friends
    const existing = await prisma.closeFriend.findUnique({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId: friendId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'User is not in close friends' },
        { status: 404 }
      );
    }

    // Remove from close friends
    await prisma.closeFriend.delete({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId: friendId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from close friends',
    });

  } catch (error) {
    console.error('Error removing from close friends:', error);
    
    return NextResponse.json(
      { error: 'Failed to remove from close friends' },
      { status: 500 }
    );
  }
}
