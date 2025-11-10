/**
 * RankingEngine - Intelligent feed ranking system
 * 
 * Computes relevance scores for posts based on multiple signals:
 * - Engagement (likes, comments, shares, saves)
 * - Recency (exponential decay)
 * - Affinity (relationship strength)
 * - Content type preferences
 * - Diversity injection
 * - Negative signals (muted users, hidden posts, muted words)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { prisma } from '@/lib/prisma';

// Types
export interface Post {
  id: string;
  authorUserId: string;
  postType: string;
  textContent?: string | null;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  createdAt: Date;
  publishedAt?: Date | null;
}

export interface RankingContext {
  userId: string;
  userPreferences?: UserPreferences;
  recentInteractions?: Interaction[];
  mutedUserIds?: string[];
  hiddenPostIds?: string[];
  mutedWords?: string[];
}

export interface UserPreferences {
  preferredContentTypes?: Record<string, number>; // postType -> preference score (0-1)
}

export interface Interaction {
  targetUserId: string;
  type: 'like' | 'comment' | 'share' | 'view' | 'message';
  timestamp: Date;
}

export interface RankingSignals {
  engagementScore: number;
  recencyMultiplier: number;
  affinityBoost: number;
  contentTypeBoost: number;
  diversityPenalty: number;
  negativeSignals: number;
  finalScore: number;
}

export interface AffinityFactors {
  mutualFollowing: boolean;
  interactionFrequency: number; // interactions per week
  timeSpentViewing: number; // average seconds per post
  messagesExchanged: number; // total messages
  petCoOwnership: boolean;
}

/**
 * RankingEngine class
 */
export class RankingEngine {
  // Engagement weights (Requirement 4.1)
  private readonly ENGAGEMENT_WEIGHTS = {
    likes: 0.2,
    comments: 0.3,
    shares: 0.25,
    saves: 0.15,
  };

  // Recency decay multipliers (Requirement 4.2)
  private readonly RECENCY_DECAY = {
    UNDER_1_HOUR: 1.0,
    HOUR_1_TO_3: 0.9,
    HOUR_3_TO_6: 0.7,
    HOUR_6_TO_12: 0.5,
    HOUR_12_TO_24: 0.3,
    DAY_1_TO_2: 0.1,
    OVER_2_DAYS: 0.05,
  };

  // Diversity constraints (Requirement 4.5)
  private readonly MAX_CONSECUTIVE_POSTS = 3;
  private readonly DIVERSITY_WINDOW = 10;

  /**
   * Compute relevance score for a single post
   */
  computeScore(post: Post, context: RankingContext): number {
    const signals = this.computeSignals(post, context);
    return signals.finalScore;
  }

  /**
   * Compute detailed ranking signals for a post
   */
  computeSignals(post: Post, context: RankingContext): RankingSignals {
    // Check negative signals first
    const negativeSignals = this.computeNegativeSignals(post, context);
    if (negativeSignals < 0) {
      return {
        engagementScore: 0,
        recencyMultiplier: 0,
        affinityBoost: 0,
        contentTypeBoost: 0,
        diversityPenalty: 0,
        negativeSignals,
        finalScore: 0,
      };
    }

    // Compute positive signals
    const engagementScore = this.computeEngagementScore(post);
    const recencyMultiplier = this.computeRecencyMultiplier(post);
    const affinityBoost = this.computeAffinityBoost(post.authorUserId, context);
    const contentTypeBoost = this.computeContentTypeBoost(post, context);

    // Combine signals
    const baseScore = engagementScore * recencyMultiplier;
    const boostedScore = baseScore * (1 + affinityBoost + contentTypeBoost);
    const finalScore = Math.max(0, Math.min(1, boostedScore));

    return {
      engagementScore,
      recencyMultiplier,
      affinityBoost,
      contentTypeBoost,
      diversityPenalty: 0, // Applied at batch level
      negativeSignals,
      finalScore,
    };
  }

  /**
   * Batch compute scores for multiple posts
   * Applies diversity injection to prevent same-user domination
   */
  batchComputeScores(
    posts: Post[],
    context: RankingContext
  ): Map<string, number> {
    const scores = new Map<string, number>();
    const authorCounts = new Map<string, number>();
    const recentAuthors: string[] = [];

    // First pass: compute base scores
    const postScores = posts.map((post) => ({
      post,
      score: this.computeScore(post, context),
    }));

    // Sort by score descending
    postScores.sort((a, b) => b.score - a.score);

    // Second pass: apply diversity penalty (Requirement 4.5)
    for (const { post, score } of postScores) {
      const authorId = post.authorUserId;
      const authorCount = authorCounts.get(authorId) || 0;

      // Check if author appears too frequently in recent window
      const recentWindow = recentAuthors.slice(-this.DIVERSITY_WINDOW);
      const recentCount = recentWindow.filter((id) => id === authorId).length;

      let finalScore = score;

      // Apply penalty if author has too many consecutive posts
      if (recentCount >= this.MAX_CONSECUTIVE_POSTS) {
        finalScore *= 0.5; // 50% penalty
      }

      scores.set(post.id, finalScore);
      authorCounts.set(authorId, authorCount + 1);
      recentAuthors.push(authorId);
    }

    return scores;
  }

  /**
   * Compute engagement score (Requirement 4.1)
   * Weighted sum of engagement metrics normalized to 0-1
   */
  private computeEngagementScore(post: Post): number {
    const { likes, comments, shares, saves } = this.ENGAGEMENT_WEIGHTS;

    // Normalize engagement counts (using log scale to handle outliers)
    const normalizedLikes = Math.log10(post.likesCount + 1) / 4; // Max ~10k likes = 1.0
    const normalizedComments = Math.log10(post.commentsCount + 1) / 3; // Max ~1k comments = 1.0
    const normalizedShares = Math.log10(post.sharesCount + 1) / 3; // Max ~1k shares = 1.0
    const normalizedSaves = Math.log10(post.savesCount + 1) / 3; // Max ~1k saves = 1.0

    const score =
      normalizedLikes * likes +
      normalizedComments * comments +
      normalizedShares * shares +
      normalizedSaves * saves;

    return Math.min(1, score);
  }

  /**
   * Compute recency multiplier (Requirement 4.2)
   * Exponential decay based on post age
   */
  private computeRecencyMultiplier(post: Post): number {
    const postDate = post.publishedAt || post.createdAt;
    const ageMs = Date.now() - postDate.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    if (ageHours < 1) return this.RECENCY_DECAY.UNDER_1_HOUR;
    if (ageHours < 3) return this.RECENCY_DECAY.HOUR_1_TO_3;
    if (ageHours < 6) return this.RECENCY_DECAY.HOUR_3_TO_6;
    if (ageHours < 12) return this.RECENCY_DECAY.HOUR_6_TO_12;
    if (ageHours < 24) return this.RECENCY_DECAY.HOUR_12_TO_24;
    if (ageHours < 48) return this.RECENCY_DECAY.DAY_1_TO_2;
    return this.RECENCY_DECAY.OVER_2_DAYS;
  }

  /**
   * Compute affinity boost (Requirement 4.3)
   * Based on relationship strength between user and author
   */
  private computeAffinityBoost(
    authorId: string,
    context: RankingContext
  ): number {
    if (!context.recentInteractions) return 0;

    // Count interactions with this author
    const interactions = context.recentInteractions.filter(
      (i) => i.targetUserId === authorId
    );

    if (interactions.length === 0) return 0;

    // Weight different interaction types
    const weights = {
      message: 0.4,
      comment: 0.3,
      share: 0.2,
      like: 0.05,
      view: 0.05,
    };

    let affinityScore = 0;
    for (const interaction of interactions) {
      affinityScore += weights[interaction.type] || 0;
    }

    // Normalize to 0-1 range (cap at 10 interactions)
    return Math.min(1, affinityScore / 10);
  }

  /**
   * Compute affinity score from detailed factors (Requirement 4.3)
   * Used for more comprehensive affinity calculation
   */
  async getAffinityScore(
    userId: string,
    authorId: string
  ): Promise<number> {
    // This would query the database for relationship data
    // For now, return a placeholder
    // TODO: Implement full affinity calculation with:
    // - Mutual following check
    // - Interaction frequency analysis
    // - Time spent viewing posts
    // - Messages exchanged count
    // - Pet co-ownership check
    return 0;
  }

  /**
   * Compute content type boost (Requirement 4.4)
   * Boost posts of types the user engages with more
   */
  private computeContentTypeBoost(
    post: Post,
    context: RankingContext
  ): number {
    if (!context.userPreferences?.preferredContentTypes) return 0;

    const preference =
      context.userPreferences.preferredContentTypes[post.postType];
    return preference ? preference * 0.5 : 0; // Max 50% boost
  }

  /**
   * Compute negative signals (Requirement 4.5)
   * Returns negative value if post should be filtered out
   */
  private computeNegativeSignals(
    post: Post,
    context: RankingContext
  ): number {
    // Check muted users
    if (
      context.mutedUserIds &&
      context.mutedUserIds.includes(post.authorUserId)
    ) {
      return -1;
    }

    // Check hidden posts
    if (context.hiddenPostIds && context.hiddenPostIds.includes(post.id)) {
      return -1;
    }

    // Check muted words
    if (context.mutedWords && context.mutedWords.length > 0 && post.textContent) {
      const content = post.textContent.toLowerCase();
      for (const word of context.mutedWords) {
        if (content.includes(word.toLowerCase())) {
          return -1;
        }
      }
    }

    return 0;
  }

  /**
   * Get user preferences from interaction history
   * Analyzes recent engagement to determine content type preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Query user's recent interactions
    // This would analyze likes, comments, shares, and time spent
    // to determine which content types the user prefers
    // TODO: Implement preference learning algorithm
    return {
      preferredContentTypes: {},
    };
  }

  /**
   * Get recent interactions for affinity calculation
   */
  async getRecentInteractions(
    userId: string,
    days: number = 30
  ): Promise<Interaction[]> {
    // Query recent interactions from the database
    // This would include likes, comments, shares, views, and messages
    // TODO: Implement interaction history query
    return [];
  }
}

// Export singleton instance
export const rankingEngine = new RankingEngine();
