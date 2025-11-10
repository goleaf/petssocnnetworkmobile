/**
 * FeedService - Orchestrates feed generation and ranking
 * 
 * Handles different feed types:
 * - Home: Ranked feed using RankingEngine
 * - Explore: Discovery feed for new content
 * - Following: Chronological feed from followed users
 * - Local: Geographic-based feed
 * - My Pets: Posts from user's pets
 * 
 * Requirements: 1.1, 1.2, 13.1
 */

import { postRepository, PostWithRelations } from '@/lib/repositories/post-repository';
import { rankingEngine, RankingContext } from '@/lib/services/ranking-engine';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface FeedOptions {
  type: 'home' | 'explore' | 'following' | 'local' | 'my-pets';
  limit?: number;
  cursor?: string;
  filters?: FeedFilters;
}

export interface FeedFilters {
  contentTypes?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  topics?: string[];
  petIds?: string[];
  highQualityOnly?: boolean;
}

export interface FeedResponse {
  posts: EnrichedPost[];
  nextCursor?: string;
  hasMore: boolean;
}

type PostWithCounts = Prisma.PostGetPayload<{
  include: {
    _count: {
      select: {
        likes: true;
        comments: true;
        shares: true;
        saves: true;
        views: true;
      };
    };
  };
}>;

export interface EnrichedPost extends PostWithCounts {
  author?: {
    id: string;
    username: string;
    fullName?: string | null;
    avatar?: string | null;
  };
  pet?: {
    id: string;
    name: string;
    avatar?: string | null;
    species: string;
  } | null;
}

/**
 * FeedService class
 */
export class FeedService {
  /**
   * Get feed for a user based on feed type
   */
  async getFeed(userId: string, options: FeedOptions): Promise<FeedResponse> {
    const { type, limit = 20, cursor, filters } = options;

    switch (type) {
      case 'home':
        return this.getHomeFeed(userId, limit, cursor, filters);
      case 'explore':
        return this.getExploreFeed(userId, limit, cursor, filters);
      case 'following':
        return this.getFollowingFeed(userId, limit, cursor, filters);
      case 'local':
        return this.getLocalFeed(userId, limit, cursor, filters);
      case 'my-pets':
        return this.getMyPetsFeed(userId, limit, cursor, filters);
      default:
        throw new Error(`Unknown feed type: ${type}`);
    }
  }

  /**
   * Home Feed - Ranked feed using RankingEngine
   * Shows posts from followed users and pets, ranked by relevance
   */
  private async getHomeFeed(
    userId: string,
    limit: number,
    cursor?: string,
    filters?: FeedFilters
  ): Promise<FeedResponse> {
    // Get user's following list
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        following: true,
        mutedUsers: true,
        displayPreferences: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get followed pet IDs
    const followedPets = await prisma.pet.findMany({
      where: {
        followers: {
          has: userId,
        },
      },
      select: { ownerId: true },
    });

    const followedPetOwnerIds = followedPets.map((p: { ownerId: string }) => p.ownerId);

    // Combine followed user IDs and pet owner IDs
    const followedUserIds = Array.from(
      new Set([...(user.following || []), ...followedPetOwnerIds])
    );

    if (followedUserIds.length === 0) {
      // No followed users, return empty feed
      return { posts: [], hasMore: false };
    }

    // Build filters
    const postFilters = this.buildPostFilters(filters, followedUserIds);

    // Fetch posts
    const { posts, nextCursor, hasMore } = await postRepository.getPosts(
      postFilters,
      { limit: limit * 3, cursor } // Fetch more for ranking
    );

    // Get posts with engagement counts
    const postIds = posts.map((p: { id: string }) => p.id);
    const postsWithCounts = await postRepository.batchGetPostsWithCounts(postIds);

    // Build ranking context
    const rankingContext: RankingContext = {
      userId,
      mutedUserIds: user.mutedUsers || [],
      mutedWords: (user.displayPreferences as any)?.mutedKeywords || [],
    };

    // Compute scores and rank
    const scoredPosts = postsWithCounts.map((post: PostWithCounts) => ({
      post,
      score: rankingEngine.computeScore(
        {
          id: post.id,
          authorUserId: post.authorUserId,
          postType: post.postType,
          textContent: post.textContent,
          hashtags: post.hashtags,
          likesCount: post._count?.likes || 0,
          commentsCount: post._count?.comments || 0,
          sharesCount: post._count?.shares || 0,
          savesCount: post._count?.saves || 0,
          createdAt: post.createdAt,
          publishedAt: post.publishedAt,
        },
        rankingContext
      ),
    }));

    // Sort by score descending
    scoredPosts.sort((a, b) => b.score - a.score);

    // Take top posts up to limit
    const rankedPosts = scoredPosts.slice(0, limit).map((sp) => sp.post);

    // Enrich with author and pet data
    const enrichedPosts = await this.enrichPosts(rankedPosts);

    return {
      posts: enrichedPosts,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
    };
  }

  /**
   * Explore Feed - Discovery feed for new content
   * Shows trending and high-quality posts from all users
   */
  private async getExploreFeed(
    userId: string,
    limit: number,
    cursor?: string,
    filters?: FeedFilters
  ): Promise<FeedResponse> {
    // Get user's muted users and words
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mutedUsers: true,
        displayPreferences: true,
      },
    });

    // Build filters - exclude muted users
    const postFilters = this.buildPostFilters(filters);
    if (user?.mutedUsers && user.mutedUsers.length > 0) {
      // We need to fetch all and filter, or use NOT IN query
      // For now, we'll fetch and filter
    }

    // Fetch posts sorted by relevance score
    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        visibility: 'public',
        publishedAt: { not: null },
        ...(filters?.contentTypes && filters.contentTypes.length > 0
          ? { postType: { in: filters.contentTypes } }
          : {}),
        ...(filters?.dateRange?.start || filters?.dateRange?.end
          ? {
              publishedAt: {
                ...(filters.dateRange.start ? { gte: filters.dateRange.start } : {}),
                ...(filters.dateRange.end ? { lte: filters.dateRange.end } : {}),
              },
            }
          : {}),
        ...(filters?.topics && filters.topics.length > 0
          ? { hashtags: { hasSome: filters.topics } }
          : {}),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit + 1,
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
    });

    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].id : undefined;

    // Filter out muted users and words
    const filteredPosts = this.filterMutedContent(
      resultPosts,
      user?.mutedUsers || [],
      (user?.displayPreferences as any)?.mutedKeywords || []
    );

    // Enrich with author and pet data
    const enrichedPosts = await this.enrichPosts(filteredPosts);

    return {
      posts: enrichedPosts,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Following Feed - Chronological feed from followed users
   * Shows posts in reverse chronological order
   */
  private async getFollowingFeed(
    userId: string,
    limit: number,
    cursor?: string,
    filters?: FeedFilters
  ): Promise<FeedResponse> {
    // Get user's following list
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        following: true,
        mutedUsers: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get followed pet IDs
    const followedPets = await prisma.pet.findMany({
      where: {
        followers: {
          has: userId,
        },
      },
      select: { ownerId: true },
    });

    const followedPetOwnerIds = followedPets.map((p: { ownerId: string }) => p.ownerId);

    // Combine followed user IDs and pet owner IDs
    const followedUserIds = Array.from(
      new Set([...(user.following || []), ...followedPetOwnerIds])
    );

    if (followedUserIds.length === 0) {
      return { posts: [], hasMore: false };
    }

    // Build filters
    const postFilters = this.buildPostFilters(filters, followedUserIds);

    // Fetch posts in chronological order
    const { posts, nextCursor, hasMore } = await postRepository.getPosts(
      postFilters,
      { limit, cursor }
    );

    // Get posts with engagement counts
    const postIds = posts.map((p: { id: string }) => p.id);
    const postsWithCounts = await postRepository.batchGetPostsWithCounts(postIds);

    // Enrich with author and pet data
    const enrichedPosts = await this.enrichPosts(postsWithCounts);

    return {
      posts: enrichedPosts,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Local Feed - Geographic-based feed
   * Shows posts from nearby locations
   */
  private async getLocalFeed(
    userId: string,
    limit: number,
    cursor?: string,
    filters?: FeedFilters
  ): Promise<FeedResponse> {
    // Get user's location
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        location: true,
        mutedUsers: true,
      },
    });

    if (!user?.location) {
      // No location set, return empty feed
      return { posts: [], hasMore: false };
    }

    // For now, we'll return posts with any location
    // In a real implementation, we'd use PostGIS or similar for geo queries
    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        visibility: { in: ['public', 'followers_only'] },
        publishedAt: { not: null },
        location: { not: null },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: [
        { publishedAt: 'desc' },
      ],
      take: limit + 1,
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
    });

    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].id : undefined;

    // Filter out muted users
    const filteredPosts = this.filterMutedContent(
      resultPosts,
      user.mutedUsers || [],
      []
    );

    // Enrich with author and pet data
    const enrichedPosts = await this.enrichPosts(filteredPosts);

    return {
      posts: enrichedPosts,
      nextCursor,
      hasMore,
    };
  }

  /**
   * My Pets Feed - Posts from user's pets
   * Shows posts tagged with user's pets
   */
  private async getMyPetsFeed(
    userId: string,
    limit: number,
    cursor?: string,
    filters?: FeedFilters
  ): Promise<FeedResponse> {
    // Get user's pets
    const pets = await prisma.pet.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const petIds = pets.map((p: { id: string }) => p.id);

    if (petIds.length === 0) {
      return { posts: [], hasMore: false };
    }

    // Build filters
    const postFilters = this.buildPostFilters(filters);
    postFilters.petTags = petIds;

    // Fetch posts
    const { posts, nextCursor, hasMore } = await postRepository.getPosts(
      postFilters,
      { limit, cursor }
    );

    // Get posts with engagement counts
    const postIds = posts.map((p: { id: string }) => p.id);
    const postsWithCounts = await postRepository.batchGetPostsWithCounts(postIds);

    // Enrich with author and pet data
    const enrichedPosts = await this.enrichPosts(postsWithCounts);

    return {
      posts: enrichedPosts,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Build post filters from feed filters
   */
  private buildPostFilters(
    filters?: FeedFilters,
    authorUserIds?: string[]
  ) {
    return {
      ...(authorUserIds ? { authorUserIds } : {}),
      ...(filters?.contentTypes ? { postTypes: filters.contentTypes } : {}),
      ...(filters?.dateRange ? { dateRange: filters.dateRange } : {}),
      ...(filters?.topics ? { hashtags: filters.topics } : {}),
      ...(filters?.petIds ? { petTags: filters.petIds } : {}),
      excludeDeleted: true,
    };
  }

  /**
   * Filter out muted content
   */
  private filterMutedContent(
    posts: PostWithCounts[],
    mutedUserIds: string[],
    mutedWords: string[]
  ): PostWithCounts[] {
    return posts.filter((post: PostWithCounts) => {
      // Filter muted users
      if (mutedUserIds.includes(post.authorUserId)) {
        return false;
      }

      // Filter muted words
      if (mutedWords.length > 0 && post.textContent) {
        const content = post.textContent.toLowerCase();
        for (const word of mutedWords) {
          if (content.includes(word.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Enrich posts with author and pet data
   */
  private async enrichPosts(
    posts: PostWithCounts[]
  ): Promise<EnrichedPost[]> {
    // Get unique author IDs
    const authorIds = Array.from(new Set(posts.map((p: PostWithCounts) => p.authorUserId)));

    // Get unique pet IDs
    const petIds = Array.from(
      new Set(
        posts
          .flatMap((p: PostWithCounts) => p.petTags)
          .filter((id): id is string => id !== null && id !== undefined)
      )
    );

    // Batch fetch authors
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    const authorMap = new Map(authors.map((a: { id: string; username: string; fullName: string | null; avatar: string | null }) => [a.id, a]));

    // Batch fetch pets
    const pets = await prisma.pet.findMany({
      where: { id: { in: petIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        species: true,
      },
    });

    const petMap = new Map(pets.map((p: { id: string; name: string; avatar: string | null; species: string }) => [p.id, p]));

    // Enrich posts
    return posts.map((post: PostWithCounts) => {
      const author = authorMap.get(post.authorUserId);
      const petId = post.petTags[0]; // Use first pet tag
      const pet = petId ? petMap.get(petId) : null;

      return {
        ...post,
        author: author
          ? {
              id: author.id,
              username: author.username,
              fullName: author.fullName,
              avatar: author.avatar,
            }
          : undefined,
        pet: pet
          ? {
              id: pet.id,
              name: pet.name,
              avatar: pet.avatar,
              species: pet.species,
            }
          : null,
      };
    });
  }
}

// Export singleton instance
export const feedService = new FeedService();
