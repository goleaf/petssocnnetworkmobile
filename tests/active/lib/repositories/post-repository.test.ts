import { postRepository, CreatePostInput } from '@/lib/repositories/post-repository';
import { prisma } from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('PostRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post with required fields', async () => {
      const mockPost = {
        id: 'post-1',
        authorUserId: 'user-1',
        postType: 'standard',
        textContent: 'Hello world',
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

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      const input: CreatePostInput = {
        authorUserId: 'user-1',
        textContent: 'Hello world',
      };

      const result = await postRepository.createPost(input);

      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          authorUserId: 'user-1',
          textContent: 'Hello world',
          postType: 'standard',
          visibility: 'public',
        }),
      });
    });

    it('should create a post with hashtags and mentions', async () => {
      const mockPost = {
        id: 'post-2',
        authorUserId: 'user-1',
        postType: 'standard',
        textContent: 'Hello @user2 #pets',
        hashtags: ['pets'],
        mentionedUserIds: ['user-2'],
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

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      const input: CreatePostInput = {
        authorUserId: 'user-1',
        textContent: 'Hello @user2 #pets',
        hashtags: ['pets'],
        mentionedUserIds: ['user-2'],
      };

      const result = await postRepository.createPost(input);

      expect(result.hashtags).toEqual(['pets']);
      expect(result.mentionedUserIds).toEqual(['user-2']);
    });
  });

  describe('getPost', () => {
    it('should retrieve a post by ID', async () => {
      const mockPost = {
        id: 'post-1',
        authorUserId: 'user-1',
        deletedAt: null,
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      const result = await postRepository.getPost('post-1');

      expect(result).toEqual(mockPost);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('should return null for non-existent post', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await postRepository.getPost('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        textContent: 'Updated content',
        updatedAt: new Date(),
      };

      (prisma.post.update as jest.Mock).mockResolvedValue(mockUpdatedPost);

      const result = await postRepository.updatePost('post-1', {
        textContent: 'Updated content',
      });

      expect(result.textContent).toBe('Updated content');
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          textContent: 'Updated content',
        }),
      });
    });
  });

  describe('deletePost', () => {
    it('should soft delete a post', async () => {
      const mockDeletedPost = {
        id: 'post-1',
        deletedAt: new Date(),
      };

      (prisma.post.update as jest.Mock).mockResolvedValue(mockDeletedPost);

      const result = await postRepository.deletePost('post-1');

      expect(result.deletedAt).toBeTruthy();
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getPosts with pagination', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        { id: 'post-1', publishedAt: new Date('2024-01-03') },
        { id: 'post-2', publishedAt: new Date('2024-01-02') },
        { id: 'post-3', publishedAt: new Date('2024-01-01') },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await postRepository.getPosts({}, { limit: 2 });

      expect(result.posts).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('post-2');
    });

    it('should filter posts by author', async () => {
      const mockPosts = [
        { id: 'post-1', authorUserId: 'user-1' },
        { id: 'post-2', authorUserId: 'user-1' },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      await postRepository.getPosts({
        authorUserIds: ['user-1'],
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorUserId: { in: ['user-1'] },
          }),
        })
      );
    });

    it('should filter posts by hashtags', async () => {
      const mockPosts = [{ id: 'post-1', hashtags: ['pets', 'dogs'] }];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      await postRepository.getPosts({
        hashtags: ['pets'],
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hashtags: { hasSome: ['pets'] },
          }),
        })
      );
    });
  });

  describe('batchGetPosts', () => {
    it('should fetch multiple posts by IDs', async () => {
      const mockPosts = [
        { id: 'post-1', deletedAt: null },
        { id: 'post-2', deletedAt: null },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await postRepository.batchGetPosts(['post-1', 'post-2']);

      expect(result).toHaveLength(2);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['post-1', 'post-2'] },
          deletedAt: null,
        },
      });
    });
  });

  describe('engagement counters', () => {
    it('should increment likes count', async () => {
      const mockPost = { id: 'post-1', likesCount: 1 };
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      await postRepository.incrementLikesCount('post-1');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { likesCount: { increment: 1 } },
      });
    });

    it('should decrement likes count', async () => {
      const mockPost = { id: 'post-1', likesCount: 0 };
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      await postRepository.decrementLikesCount('post-1');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { likesCount: { decrement: 1 } },
      });
    });
  });

  describe('updateRelevanceScore', () => {
    it('should update relevance score and timestamp', async () => {
      const mockPost = {
        id: 'post-1',
        relevanceScore: 0.85,
        lastScoreComputedAt: new Date(),
      };

      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      const result = await postRepository.updateRelevanceScore('post-1', 0.85);

      expect(result.relevanceScore).toBe(0.85);
      expect(result.lastScoreComputedAt).toBeTruthy();
    });
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags from recent posts', async () => {
      const mockPosts = [
        { hashtags: ['pets', 'dogs'] },
        { hashtags: ['pets', 'cats'] },
        { hashtags: ['dogs'] },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await postRepository.getTrendingHashtags(2);

      expect(result).toHaveLength(2);
      expect(result[0].hashtag).toBe('pets');
      expect(result[0].count).toBe(2);
      expect(result[1].hashtag).toBe('dogs');
      expect(result[1].count).toBe(2);
    });
  });
});
