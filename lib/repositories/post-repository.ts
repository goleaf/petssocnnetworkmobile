import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Type alias for Post from Prisma
type Post = Prisma.PostGetPayload<{}>;

/**
 * PostRepository - Core data access layer for posts
 * Handles CRUD operations, filtering, and pagination for the feed system
 */

// Types for repository operations
export interface CreatePostInput {
  authorUserId: string;
  postType?: string;
  textContent?: string;
  media?: any;
  petTags?: string[];
  mentionedUserIds?: string[];
  hashtags?: string[];
  location?: any;
  visibility?: string;
  visibilityUserIds?: string[];
  commentsEnabled?: boolean;
  sharesEnabled?: boolean;
  pollOptions?: any;
  eventData?: any;
  marketplaceData?: any;
  sharedPostId?: string;
  scheduledPublishAt?: Date;
  publishedAt?: Date;
}

export interface UpdatePostInput {
  textContent?: string;
  media?: any;
  petTags?: string[];
  mentionedUserIds?: string[];
  hashtags?: string[];
  location?: any;
  visibility?: string;
  visibilityUserIds?: string[];
  commentsEnabled?: boolean;
  sharesEnabled?: boolean;
  pollOptions?: any;
  eventData?: any;
  marketplaceData?: any;
  editedAt?: Date;
}

export interface PostFilters {
  authorUserIds?: string[];
  postTypes?: string[];
  visibility?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  hashtags?: string[];
  petTags?: string[];
  excludeDeleted?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string; // Post ID for cursor-based pagination
}

export interface PostWithRelations extends Post {
  _count?: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
  };
}

/**
 * PostRepository class
 */
export class PostRepository {
  /**
   * Create a new post
   */
  async createPost(input: CreatePostInput): Promise<Post> {
    const post = await prisma.post.create({
      data: {
        authorUserId: input.authorUserId,
        postType: input.postType || 'standard',
        textContent: input.textContent,
        media: input.media,
        petTags: input.petTags || [],
        mentionedUserIds: input.mentionedUserIds || [],
        hashtags: input.hashtags || [],
        location: input.location,
        visibility: input.visibility || 'public',
        visibilityUserIds: input.visibilityUserIds || [],
        commentsEnabled: input.commentsEnabled ?? true,
        sharesEnabled: input.sharesEnabled ?? true,
        pollOptions: input.pollOptions,
        eventData: input.eventData,
        marketplaceData: input.marketplaceData,
        sharedPostId: input.sharedPostId,
        scheduledPublishAt: input.scheduledPublishAt,
        publishedAt: input.publishedAt || new Date(),
      },
    });

    return post;
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string, includeDeleted = false): Promise<Post | null> {
    const where: Prisma.PostWhereInput = {
      id: postId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return prisma.post.findUnique({
      where: { id: postId },
    });
  }

  /**
   * Get a post with engagement counts
   */
  async getPostWithCounts(postId: string): Promise<PostWithRelations | null> {
    const where: Prisma.PostWhereInput = {
      id: postId,
      deletedAt: null,
    };

    return prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            saves: true,
            views: true,
          },
        },
      },
    }) as Promise<PostWithRelations | null>;
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, input: UpdatePostInput): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a post
   */
  async deletePost(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete a post (permanent)
   */
  async hardDeletePost(postId: string): Promise<Post> {
    return prisma.post.delete({
      where: { id: postId },
    });
  }

  /**
   * Batch fetch posts by IDs (avoids N+1 queries)
   */
  async batchGetPosts(postIds: string[]): Promise<Post[]> {
    return prisma.post.findMany({
      where: {
        id: { in: postIds },
        deletedAt: null,
      },
    });
  }

  /**
   * Batch fetch posts with engagement counts
   */
  async batchGetPostsWithCounts(postIds: string[]): Promise<PostWithRelations[]> {
    return prisma.post.findMany({
      where: {
        id: { in: postIds },
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            saves: true,
            views: true,
          },
        },
      },
    }) as Promise<PostWithRelations[]>;
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(
    filters: PostFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    const limit = pagination.limit || 20;
    const where = this.buildWhereClause(filters);

    // Build cursor condition
    const cursorCondition: Prisma.PostWhereInput = pagination.cursor
      ? {
          id: {
            lt: pagination.cursor,
          },
        }
      : {};

    const posts = await prisma.post.findMany({
      where: {
        ...where,
        ...cursorCondition,
      },
      orderBy: [
        { publishedAt: 'desc' },
        { id: 'desc' }, // Secondary sort for stable pagination
      ],
      take: limit + 1, // Fetch one extra to determine if there are more
    });

    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].id : undefined;

    return {
      posts: resultPosts,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get posts by author
   */
  async getPostsByAuthor(
    authorUserId: string,
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    return this.getPosts(
      {
        authorUserIds: [authorUserId],
        excludeDeleted: true,
      },
      pagination
    );
  }

  /**
   * Get posts by multiple authors (for feed generation)
   */
  async getPostsByAuthors(
    authorUserIds: string[],
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    return this.getPosts(
      {
        authorUserIds,
        excludeDeleted: true,
      },
      pagination
    );
  }

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(
    hashtag: string,
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    return this.getPosts(
      {
        hashtags: [hashtag],
        excludeDeleted: true,
      },
      pagination
    );
  }

  /**
   * Get posts by pet tag
   */
  async getPostsByPetTag(
    petId: string,
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    return this.getPosts(
      {
        petTags: [petId],
        excludeDeleted: true,
      },
      pagination
    );
  }

  /**
   * Get posts by content type
   */
  async getPostsByType(
    postType: string,
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    return this.getPosts(
      {
        postTypes: [postType],
        excludeDeleted: true,
      },
      pagination
    );
  }

  /**
   * Get posts within a date range
   */
  async getPostsByDateRange(
    start: Date,
    end: Date,
    pagination: PaginationOptions = {}
  ): Promise<{ posts: Post[]; nextCursor?: string; hasMore: boolean }> {
    return this.getPosts(
      {
        dateRange: { start, end },
        excludeDeleted: true,
      },
      pagination
    );
  }

  /**
   * Update engagement counters
   */
  async incrementLikesCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: { increment: 1 },
      },
    });
  }

  async decrementLikesCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: { decrement: 1 },
      },
    });
  }

  async incrementCommentsCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        commentsCount: { increment: 1 },
      },
    });
  }

  async decrementCommentsCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        commentsCount: { decrement: 1 },
      },
    });
  }

  async incrementSharesCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        sharesCount: { increment: 1 },
      },
    });
  }

  async incrementSavesCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        savesCount: { increment: 1 },
      },
    });
  }

  async decrementSavesCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        savesCount: { decrement: 1 },
      },
    });
  }

  async incrementViewsCount(postId: string): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        viewsCount: { increment: 1 },
      },
    });
  }

  /**
   * Update relevance score for ranking
   */
  async updateRelevanceScore(postId: string, score: number): Promise<Post> {
    return prisma.post.update({
      where: { id: postId },
      data: {
        relevanceScore: score,
        lastScoreComputedAt: new Date(),
      },
    });
  }

  /**
   * Batch update relevance scores
   */
  async batchUpdateRelevanceScores(scores: { postId: string; score: number }[]): Promise<void> {
    await prisma.$transaction(
      scores.map((item) =>
        prisma.post.update({
          where: { id: item.postId },
          data: {
            relevanceScore: item.score,
            lastScoreComputedAt: new Date(),
          },
        })
      )
    );
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: PostFilters): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    // Exclude deleted posts by default
    if (filters.excludeDeleted !== false) {
      where.deletedAt = null;
    }

    // Filter by author
    if (filters.authorUserIds && filters.authorUserIds.length > 0) {
      where.authorUserId = { in: filters.authorUserIds };
    }

    // Filter by post type
    if (filters.postTypes && filters.postTypes.length > 0) {
      where.postType = { in: filters.postTypes };
    }

    // Filter by visibility
    if (filters.visibility && filters.visibility.length > 0) {
      where.visibility = { in: filters.visibility };
    }

    // Filter by date range
    if (filters.dateRange) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.dateRange.start) {
        dateFilter.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        dateFilter.lte = filters.dateRange.end;
      }
      if (Object.keys(dateFilter).length > 0) {
        where.publishedAt = dateFilter;
      }
    }

    // Filter by hashtags (array contains)
    if (filters.hashtags && filters.hashtags.length > 0) {
      where.hashtags = {
        hasSome: filters.hashtags,
      };
    }

    // Filter by pet tags (array contains)
    if (filters.petTags && filters.petTags.length > 0) {
      where.petTags = {
        hasSome: filters.petTags,
      };
    }

    return where;
  }

  /**
   * Count posts matching filters
   */
  async countPosts(filters: PostFilters = {}): Promise<number> {
    const where = this.buildWhereClause(filters);
    return prisma.post.count({ where });
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit = 10): Promise<{ hashtag: string; count: number }[]> {
    // Get posts from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const posts = await prisma.post.findMany({
      where: {
        publishedAt: { gte: oneDayAgo },
        deletedAt: null,
      },
      select: {
        hashtags: true,
      },
    });

    // Count hashtag occurrences
    const hashtagCounts = new Map<string, number>();
    posts.forEach((post) => {
      post.hashtags.forEach((tag: string) => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort and return top hashtags
    return Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// Export singleton instance
export const postRepository = new PostRepository();
