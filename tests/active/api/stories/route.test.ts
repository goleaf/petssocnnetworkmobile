/**
 * Tests for POST /api/stories endpoint
 * 
 * Requirements: 9.1, 13.4
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST } from '@/app/api/stories/route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockValidateMedia = jest.fn();
const mockCreateStory = jest.fn();
const mockGetFollowerIds = jest.fn();
const mockBroadcastNewPost = jest.fn();
const mockCreateNotification = jest.fn();

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    story: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    closeFriend: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/story-service', () => ({
  storyService: {
    validateMedia: mockValidateMedia,
    createStory: mockCreateStory,
    getFollowerIds: mockGetFollowerIds,
  },
}));

jest.mock('@/lib/services/websocket-service', () => ({
  websocketService: {
    broadcastNewPost: mockBroadcastNewPost,
  },
}));

jest.mock('@/lib/notifications', () => ({
  createNotification: mockCreateNotification,
}));

describe('POST /api/stories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a photo story successfully', async () => {
    const mockStory = {
      id: 'story-1',
      creatorUserId: 'user-1',
      mediaUrl: 'https://cdn.example.com/story.jpg',
      mediaType: 'photo' as const,
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      mediaDimensions: { width: 1080, height: 1920 },
      videoDuration: null,
      caption: 'Test story',
      stickers: null,
      musicTrackId: null,
      linkUrl: null,
      visibility: 'everyone',
      visibilityUserIds: [],
      isSensitiveContent: false,
      viewsCount: 0,
      uniqueViewersCount: 0,
      repliesCount: 0,
      reactionsCount: 0,
      sharesCount: 0,
      linkClicksCount: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      expiresAt: new Date('2024-01-02T00:00:00.000Z'),
      deletedAt: null,
      isArchived: false,
      archivedAt: null,
    };

    mockValidateMedia.mockReturnValue({
      valid: true,
      errors: [],
    });

    mockCreateStory.mockResolvedValue(mockStory);
    mockGetFollowerIds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'photo',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 5242880, // 5MB
        caption: 'Test story',
        visibility: 'everyone',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.story.id).toBe('story-1');
    expect(data.story.mediaType).toBe('photo');
    expect(mockCreateStory).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorUserId: 'user-1',
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'photo',
      })
    );
  });

  it('should create a video story with duration', async () => {
    const mockStory = {
      id: 'story-2',
      creatorUserId: 'user-1',
      mediaUrl: 'https://cdn.example.com/story.mp4',
      mediaType: 'video' as const,
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      mediaDimensions: { width: 1080, height: 1920 },
      videoDuration: 10,
      caption: null,
      stickers: null,
      musicTrackId: null,
      linkUrl: null,
      visibility: 'everyone',
      visibilityUserIds: [],
      isSensitiveContent: false,
      viewsCount: 0,
      uniqueViewersCount: 0,
      repliesCount: 0,
      reactionsCount: 0,
      sharesCount: 0,
      linkClicksCount: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      expiresAt: new Date('2024-01-02T00:00:00.000Z'),
      deletedAt: null,
      isArchived: false,
      archivedAt: null,
    };

    mockValidateMedia.mockReturnValue({
      valid: true,
      errors: [],
    });

    mockCreateStory.mockResolvedValue(mockStory);
    mockGetFollowerIds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.mp4',
        mediaType: 'video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 50000000, // 50MB
        videoDuration: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.story.mediaType).toBe('video');
    expect(data.story.videoDuration).toBe(10);
  });

  it('should reject photo larger than 10MB', async () => {
    mockValidateMedia.mockReturnValue({
      valid: false,
      errors: ['Photo size must be less than 10MB'],
    });

    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'photo',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 15000000, // 15MB - exceeds limit
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Photo size must be less than 10MB');
  });

  it('should reject video larger than 100MB', async () => {
    mockValidateMedia.mockReturnValue({
      valid: false,
      errors: ['Video size must be less than 100MB'],
    });

    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.mp4',
        mediaType: 'video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 150000000, // 150MB - exceeds limit
        videoDuration: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Video size must be less than 100MB');
  });

  it('should reject video longer than 15 seconds', async () => {
    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.mp4',
        mediaType: 'video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 50000000,
        videoDuration: 20, // Exceeds 15 second limit
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Video duration must be 15 seconds or less');
  });

  it('should create story with stickers', async () => {
    const stickers = [
      {
        type: 'poll',
        position: { x: 0.5, y: 0.7 },
        size: 1,
        rotation: 0,
        content: {
          question: 'What do you think?',
          options: ['Yes', 'No'],
        },
      },
    ];

    const mockStory = {
      id: 'story-3',
      creatorUserId: 'user-1',
      mediaUrl: 'https://cdn.example.com/story.jpg',
      mediaType: 'photo' as const,
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      mediaDimensions: { width: 1080, height: 1920 },
      videoDuration: null,
      caption: null,
      stickers: JSON.parse(JSON.stringify(stickers)),
      musicTrackId: null,
      linkUrl: null,
      visibility: 'everyone',
      visibilityUserIds: [],
      isSensitiveContent: false,
      viewsCount: 0,
      uniqueViewersCount: 0,
      repliesCount: 0,
      reactionsCount: 0,
      sharesCount: 0,
      linkClicksCount: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      expiresAt: new Date('2024-01-02T00:00:00.000Z'),
      deletedAt: null,
      isArchived: false,
      archivedAt: null,
    };

    mockValidateMedia.mockReturnValue({
      valid: true,
      errors: [],
    });

    mockCreateStory.mockResolvedValue(mockStory);
    mockGetFollowerIds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'photo',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 5000000,
        stickers,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.story.stickers).toEqual(stickers);
  });

  it('should create close friends story', async () => {
    const mockStory = {
      id: 'story-4',
      creatorUserId: 'user-1',
      mediaUrl: 'https://cdn.example.com/story.jpg',
      mediaType: 'photo' as const,
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      mediaDimensions: { width: 1080, height: 1920 },
      videoDuration: null,
      caption: 'Close friends only',
      stickers: null,
      musicTrackId: null,
      linkUrl: null,
      visibility: 'close_friends',
      visibilityUserIds: [],
      isSensitiveContent: false,
      viewsCount: 0,
      uniqueViewersCount: 0,
      repliesCount: 0,
      reactionsCount: 0,
      sharesCount: 0,
      linkClicksCount: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      expiresAt: new Date('2024-01-02T00:00:00.000Z'),
      deletedAt: null,
      isArchived: false,
      archivedAt: null,
    };

    mockValidateMedia.mockReturnValue({
      valid: true,
      errors: [],
    });

    mockCreateStory.mockResolvedValue(mockStory);
    mockGetFollowerIds.mockResolvedValue(['user-2', 'user-3']);

    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'photo',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 5000000,
        caption: 'Close friends only',
        visibility: 'close_friends',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.story.visibility).toBe('close_friends');
  });

  it('should reject missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaType: 'photo',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Media URL is required');
  });

  it('should reject invalid media type', async () => {
    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'invalid',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 5000000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Valid media type is required');
  });

  it('should reject custom visibility without user IDs', async () => {
    const request = new NextRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1',
      },
      body: JSON.stringify({
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'photo',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        fileSize: 5000000,
        visibility: 'custom',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Custom visibility requires at least one user ID');
  });
});
