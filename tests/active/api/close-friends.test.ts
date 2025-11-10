/**
 * Tests for Close Friends API endpoints
 * 
 * Requirements: 9.1, 9.2
 */

import { GET, PUT } from '@/app/api/close-friends/route';
import { POST, DELETE } from '@/app/api/close-friends/[friendId]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

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
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Close Friends API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/close-friends', () => {
    it('should return close friends list', async () => {
      const mockCloseFriends = [
        { id: 'cf-1', userId: 'user-1', friendUserId: 'user-2', addedAt: new Date() },
        { id: 'cf-2', userId: 'user-1', friendUserId: 'user-3', addedAt: new Date() },
      ];

      (prisma.closeFriend.findMany as jest.Mock).mockResolvedValue(mockCloseFriends);

      const request = new NextRequest('http://localhost/api/close-friends', {
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friendIds).toEqual(['user-2', 'user-3']);
      expect(data.count).toBe(2);
    });

    it('should return empty list when no close friends', async () => {
      (prisma.closeFriend.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/close-friends', {
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.friendIds).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('PUT /api/close-friends', () => {
    it('should update close friends list', async () => {
      const newFriendIds = ['user-2', 'user-3', 'user-4'];

      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-2' },
        { id: 'user-3' },
        { id: 'user-4' },
      ]);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          closeFriend: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        });
      });

      const request = new NextRequest('http://localhost/api/close-friends', {
        method: 'PUT',
        headers: { 'x-user-id': 'user-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendIds: newFriendIds }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friendIds).toEqual(newFriendIds);
      expect(data.count).toBe(3);
    });

    it('should validate friend IDs exist', async () => {
      const newFriendIds = ['user-2', 'user-3', 'invalid-user'];

      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-2' },
        { id: 'user-3' },
      ]);

      const request = new NextRequest('http://localhost/api/close-friends', {
        method: 'PUT',
        headers: { 'x-user-id': 'user-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendIds: newFriendIds }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('One or more user IDs are invalid');
    });

    it('should handle empty friend list', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          closeFriend: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        });
      });

      const request = new NextRequest('http://localhost/api/close-friends', {
        method: 'PUT',
        headers: { 'x-user-id': 'user-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendIds: [] }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.friendIds).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('POST /api/close-friends/[friendId]', () => {
    it('should add user to close friends', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.closeFriend.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.closeFriend.create as jest.Mock).mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        friendUserId: 'user-2',
        addedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/close-friends/user-2', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await POST(request, { params: { friendId: 'user-2' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.closeFriend.friendUserId).toBe('user-2');
    });

    it('should return error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/close-friends/invalid-user', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await POST(request, { params: { friendId: 'invalid-user' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return error if already in close friends', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.closeFriend.findUnique as jest.Mock).mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        friendUserId: 'user-2',
        addedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/close-friends/user-2', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await POST(request, { params: { friendId: 'user-2' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User is already in close friends');
    });
  });

  describe('DELETE /api/close-friends/[friendId]', () => {
    it('should remove user from close friends', async () => {
      (prisma.closeFriend.findUnique as jest.Mock).mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        friendUserId: 'user-2',
        addedAt: new Date(),
      });
      (prisma.closeFriend.delete as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/close-friends/user-2', {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await DELETE(request, { params: { friendId: 'user-2' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Removed from close friends');
    });

    it('should return error if not in close friends', async () => {
      (prisma.closeFriend.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/close-friends/user-2', {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await DELETE(request, { params: { friendId: 'user-2' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User is not in close friends');
    });
  });
});
