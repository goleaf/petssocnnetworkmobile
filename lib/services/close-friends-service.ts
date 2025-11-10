/**
 * Close Friends Service - Manages close friends list
 * 
 * Requirements: 9.1, 9.2
 */

import { prisma } from '@/lib/prisma';

export class CloseFriendsService {
  /**
   * Get close friends list for a user
   */
  async getCloseFriends(userId: string): Promise<string[]> {
    const closeFriends = await prisma.closeFriend.findMany({
      where: {
        userId,
      },
      select: {
        friendUserId: true,
      },
    });

    return closeFriends.map(cf => cf.friendUserId);
  }

  /**
   * Check if a user is in another user's close friends list
   */
  async isCloseFriend(userId: string, friendUserId: string): Promise<boolean> {
    const closeFriend = await prisma.closeFriend.findUnique({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId,
        },
      },
    });

    return !!closeFriend;
  }

  /**
   * Add a user to close friends
   */
  async addCloseFriend(userId: string, friendUserId: string): Promise<void> {
    await prisma.closeFriend.create({
      data: {
        userId,
        friendUserId,
      },
    });
  }

  /**
   * Remove a user from close friends
   */
  async removeCloseFriend(userId: string, friendUserId: string): Promise<void> {
    await prisma.closeFriend.delete({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId,
        },
      },
    });
  }

  /**
   * Update entire close friends list (replace)
   */
  async updateCloseFriendsList(userId: string, friendIds: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Delete all existing
      await tx.closeFriend.deleteMany({
        where: {
          userId,
        },
      });

      // Add new ones
      if (friendIds.length > 0) {
        await tx.closeFriend.createMany({
          data: friendIds.map(friendUserId => ({
            userId,
            friendUserId,
          })),
        });
      }
    });
  }

  /**
   * Get count of close friends for a user
   */
  async getCloseFriendsCount(userId: string): Promise<number> {
    return prisma.closeFriend.count({
      where: {
        userId,
      },
    });
  }
}

// Export singleton instance
export const closeFriendsService = new CloseFriendsService();
