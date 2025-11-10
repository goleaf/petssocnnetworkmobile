/**
 * Tests for Close Friends Service
 * 
 * Requirements: 9.1, 9.2
 */

import { closeFriendsService } from '@/lib/services/close-friends-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    closeFriend: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('CloseFriendsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCloseFriends', () => {
    it('should return array of friend user IDs', async () => {
      const mockCloseFriends = [
        { friendUserId: 'user-2' },
        { friendUserId: 'user-3' },
        { friendUserId: 'user-4' },
      ];

      (prisma.closeFriend.findMany as jest.Mock).mockResolvedValue(mockCloseFriends);

      const result = await closeFriendsService.getCloseFriends('user-1');

      expect(result).toEqual(['user-2', 'user-3', 'user-4']);
      expect(prisma.closeFriend.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { friendUserId: true },
      });
    });

    it('should return empty array when no close friends', async () => {
      (prisma.closeFriend.findMany as jest.Mock).mockResolvedValue([]);

      const result = await closeFriendsService.getCloseFriends('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('isCloseFriend', () => {
    it('should return true if user is in close friends', async () => {
      (prisma.closeFriend.findUnique as jest.Mock).mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        friendUserId: 'user-2',
      });

      const result = await closeFriendsService.isCloseFriend('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false if user is not in close friends', async () => {
      (prisma.closeFriend.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await closeFriendsService.isCloseFriend('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('addCloseFriend', () => {
    it('should add user to close friends', async () => {
      (prisma.closeFriend.create as jest.Mock).mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        friendUserId: 'user-2',
        addedAt: new Date(),
      });

      await closeFriendsService.addCloseFriend('user-1', 'user-2');

      expect(prisma.closeFriend.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          friendUserId: 'user-2',
        },
      });
    });
  });

  describe('removeCloseFriend', () => {
    it('should remove user from close friends', async () => {
      (prisma.closeFriend.delete as jest.Mock).mockResolvedValue({});

      await closeFriendsService.removeCloseFriend('user-1', 'user-2');

      expect(prisma.closeFriend.delete).toHaveBeenCalledWith({
        where: {
          userId_friendUserId: {
            userId: 'user-1',
            friendUserId: 'user-2',
          },
        },
      });
    });
  });

  describe('updateCloseFriendsList', () => {
    it('should replace entire close friends list', async () => {
      const newFriendIds = ['user-2', 'user-3', 'user-4'];

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          closeFriend: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      await closeFriendsService.updateCloseFriendsList('user-1', newFriendIds);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle empty list', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          closeFriend: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      await closeFriendsService.updateCloseFriendsList('user-1', []);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getCloseFriendsCount', () => {
    it('should return count of close friends', async () => {
      (prisma.closeFriend.count as jest.Mock).mockResolvedValue(5);

      const result = await closeFriendsService.getCloseFriendsCount('user-1');

      expect(result).toBe(5);
      expect(prisma.closeFriend.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return 0 when no close friends', async () => {
      (prisma.closeFriend.count as jest.Mock).mockResolvedValue(0);

      const result = await closeFriendsService.getCloseFriendsCount('user-1');

      expect(result).toBe(0);
    });
  });
});
