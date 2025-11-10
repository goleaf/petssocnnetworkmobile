import { POST } from '@/app/api/posts/route';
import { NextRequest } from 'next/server';
import { postRepository } from '@/lib/repositories/post-repository';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// Mock dependencies
jest.mock('@/lib/repositories/post-repository');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));
jest.mock('@/lib/notifications');

const mockPostRepository = postRepository as jest.Mocked<typeof postRepository>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCreateNotification = createNotification as jest.MockedFunction<typeof createNotification>;

describe('POST /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a post with text only', async () => {
    const userId = 'user1';
    const mockPost = {
      id: 'post1',
      authorUserId: userId,
      postType: 'standard',
      textContent: 'This is a test post',
      media: null,
      petTags: [],
      mentionedUserIds: [],
      hashtags: [],
      location: null,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      viewsCount: 0,
      reactions: null,
      visibility: 'public',
      visibilityUserIds: [],
      commentsEnabled: true,
      sharesEnabled: true,
      pollOptions: null,
      eventData: null,
      marketplaceData: null,
      sharedPostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      editedAt: null,
      deletedAt: null,
      scheduledPublishAt: null,
      publishedAt: new Date(),
      relevanceScore: 0,
      lastScoreComputedAt: null,
    };

    mockPostRepository.createPost.mockResolvedValue(mockPost);
    mockPostRepository.getPostWithCounts.mockResolvedValue({
      ...mockPost,
      _count: {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 0,
      },
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      username: 'testuser',
      displayName: 'Test User',
    } as any);

    const requestBody = {
      textContent: 'This is a test post',
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.post).toBeDefined();
    expect(data.post.textContent).toBe('This is a test post');
    expect(mockPostRepository.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        authorUserId: userId,
        textContent: 'This is a test post',
        visibility: 'public',
      })
    );
  });

  it('should extract and validate @mentions', async () => {
    const userId = 'user1';
    const mentionedUserId = 'user2';
    
    const mockPost = {
      id: 'post1',
      authorUserId: userId,
      postType: 'standard',
      textContent: 'Hello @testuser2 how are you?',
      mentionedUserIds: [mentionedUserId],
      hashtags: [],
      petTags: [],
      media: null,
      location: null,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      viewsCount: 0,
      reactions: null,
      visibility: 'public',
      visibilityUserIds: [],
      commentsEnabled: true,
      sharesEnabled: true,
      pollOptions: null,
      eventData: null,
      marketplaceData: null,
      sharedPostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      editedAt: null,
      deletedAt: null,
      scheduledPublishAt: null,
      publishedAt: new Date(),
      relevanceScore: 0,
      lastScoreComputedAt: null,
    };

    mockPostRepository.createPost.mockResolvedValue(mockPost);
    mockPostRepository.getPostWithCounts.mockResolvedValue({
      ...mockPost,
      _count: {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 0,
      },
    });

    mockPrisma.user.findMany.mockResolvedValue([
      { id: mentionedUserId, username: 'testuser2' },
    ] as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      username: 'testuser',
      displayName: 'Test User',
    } as any);

    const requestBody = {
      textContent: 'Hello @testuser2 how are you?',
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          username: expect.objectContaining({
            in: ['testuser2'],
          }),
        }),
      })
    );
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mentionedUserId,
        type: 'mention',
        actorId: userId,
      })
    );
  });

  it('should extract #hashtags from text', async () => {
    const userId = 'user1';
    
    const mockPost = {
      id: 'post1',
      authorUserId: userId,
      postType: 'standard',
      textContent: 'This is #awesome and #cool!',
      hashtags: ['awesome', 'cool'],
      mentionedUserIds: [],
      petTags: [],
      media: null,
      location: null,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      viewsCount: 0,
      reactions: null,
      visibility: 'public',
      visibilityUserIds: [],
      commentsEnabled: true,
      sharesEnabled: true,
      pollOptions: null,
      eventData: null,
      marketplaceData: null,
      sharedPostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      editedAt: null,
      deletedAt: null,
      scheduledPublishAt: null,
      publishedAt: new Date(),
      relevanceScore: 0,
      lastScoreComputedAt: null,
    };

    mockPostRepository.createPost.mockResolvedValue(mockPost);
    mockPostRepository.getPostWithCounts.mockResolvedValue({
      ...mockPost,
      _count: {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 0,
      },
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      username: 'testuser',
      displayName: 'Test User',
    } as any);

    const requestBody = {
      textContent: 'This is #awesome and #cool!',
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockPostRepository.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        hashtags: ['awesome', 'cool'],
      })
    );
  });

  it('should validate text content max length', async () => {
    const userId = 'user1';
    const longText = 'a'.repeat(5001);

    const requestBody = {
      textContent: longText,
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
  });

  it('should reject more than one video', async () => {
    const userId = 'user1';

    const requestBody = {
      textContent: 'Multiple videos',
      media: [
        { url: 'video1.mp4', type: 'video', order: 0 },
        { url: 'video2.mp4', type: 'video', order: 1 },
      ],
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Only one video per post is allowed');
  });

  it('should reject more than 10 photos', async () => {
    const userId = 'user1';

    const photos = Array.from({ length: 11 }, (_, i) => ({
      url: `photo${i}.jpg`,
      type: 'photo' as const,
      order: i,
    }));

    const requestBody = {
      textContent: 'Too many photos',
      media: photos,
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
    expect(data.details).toBeDefined();
  });

  it('should require poll options for poll posts', async () => {
    const userId = 'user1';

    const requestBody = {
      textContent: 'What do you think?',
      postType: 'poll',
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Poll posts require poll options');
  });

  it('should return 401 if not authenticated', async () => {
    const requestBody = {
      textContent: 'Test post',
      visibility: 'public',
    };

    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
