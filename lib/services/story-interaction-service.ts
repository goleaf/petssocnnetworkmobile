/**
 * Story Interaction Service
 * Handles story interactions including reactions, poll votes, question responses, etc.
 * 
 * Requirements: 10.4, 10.5
 */

import { prisma } from '@/lib/prisma';

export interface StoryInteractionInput {
  storyId: string;
  userId: string;
  interactionType: 'poll_vote' | 'question_response' | 'quiz_answer' | 'reaction' | 'reply' | 'link_click';
  data?: any;
}

export interface PollVoteData {
  optionId: string;
}

export interface QuestionResponseData {
  text: string;
}

export interface QuizAnswerData {
  questionId: string;
  answerId: string;
  isCorrect?: boolean;
}

export interface ReactionData {
  reactionType: 'heart' | 'laughing' | 'surprised' | 'crying' | 'fire' | 'clap';
}

export interface ReplyData {
  text: string;
  mediaUrl?: string;
}

/**
 * Story Interaction Service class
 */
export class StoryInteractionService {
  /**
   * Record a poll vote
   */
  async recordPollVote(
    storyId: string,
    userId: string,
    optionId: string
  ): Promise<void> {
    // Check if user already voted
    const existingVote = await prisma.storyInteraction.findFirst({
      where: {
        storyId,
        userId,
        interactionType: 'poll_vote',
      },
    });

    if (existingVote) {
      // Update existing vote
      await prisma.storyInteraction.update({
        where: { id: existingVote.id },
        data: {
          data: { optionId },
        },
      });
    } else {
      // Create new vote
      await prisma.storyInteraction.create({
        data: {
          storyId,
          userId,
          interactionType: 'poll_vote',
          data: { optionId },
        },
      });
    }
  }

  /**
   * Get poll results for a story
   */
  async getPollResults(storyId: string): Promise<Record<string, number>> {
    const votes = await prisma.storyInteraction.findMany({
      where: {
        storyId,
        interactionType: 'poll_vote',
      },
    });

    const results: Record<string, number> = {};
    for (const vote of votes) {
      const optionId = (vote.data as any)?.optionId;
      if (optionId) {
        results[optionId] = (results[optionId] || 0) + 1;
      }
    }

    return results;
  }

  /**
   * Check if user has voted in a poll
   */
  async hasUserVoted(storyId: string, userId: string): Promise<boolean> {
    const vote = await prisma.storyInteraction.findFirst({
      where: {
        storyId,
        userId,
        interactionType: 'poll_vote',
      },
    });

    return !!vote;
  }

  /**
   * Get user's vote in a poll
   */
  async getUserVote(storyId: string, userId: string): Promise<string | null> {
    const vote = await prisma.storyInteraction.findFirst({
      where: {
        storyId,
        userId,
        interactionType: 'poll_vote',
      },
    });

    return vote ? (vote.data as any)?.optionId : null;
  }

  /**
   * Record a question response
   */
  async recordQuestionResponse(
    storyId: string,
    userId: string,
    text: string
  ): Promise<void> {
    await prisma.storyInteraction.create({
      data: {
        storyId,
        userId,
        interactionType: 'question_response',
        data: { text },
      },
    });

    // Increment replies count
    await prisma.story.update({
      where: { id: storyId },
      data: {
        repliesCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get question responses for a story
   */
  async getQuestionResponses(storyId: string): Promise<Array<{
    id: string;
    userId: string;
    text: string;
    createdAt: Date;
  }>> {
    const responses = await prisma.storyInteraction.findMany({
      where: {
        storyId,
        interactionType: 'question_response',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return responses.map(r => ({
      id: r.id,
      userId: r.userId,
      text: (r.data as any)?.text || '',
      createdAt: r.createdAt,
    }));
  }

  /**
   * Record a quiz answer
   */
  async recordQuizAnswer(
    storyId: string,
    userId: string,
    questionId: string,
    answerId: string,
    isCorrect: boolean
  ): Promise<void> {
    await prisma.storyInteraction.create({
      data: {
        storyId,
        userId,
        interactionType: 'quiz_answer',
        data: {
          questionId,
          answerId,
          isCorrect,
        },
      },
    });
  }

  /**
   * Record a reaction
   */
  async recordReaction(
    storyId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    // Check if user already reacted
    const existingReaction = await prisma.storyInteraction.findFirst({
      where: {
        storyId,
        userId,
        interactionType: 'reaction',
      },
    });

    if (existingReaction) {
      // Update existing reaction
      await prisma.storyInteraction.update({
        where: { id: existingReaction.id },
        data: {
          data: { reactionType },
        },
      });
    } else {
      // Create new reaction
      await prisma.storyInteraction.create({
        data: {
          storyId,
          userId,
          interactionType: 'reaction',
          data: { reactionType },
        },
      });

      // Increment reactions count
      await prisma.story.update({
        where: { id: storyId },
        data: {
          reactionsCount: {
            increment: 1,
          },
        },
      });
    }
  }

  /**
   * Get reaction counts for a story
   */
  async getReactionCounts(storyId: string): Promise<Record<string, number>> {
    const reactions = await prisma.storyInteraction.findMany({
      where: {
        storyId,
        interactionType: 'reaction',
      },
    });

    const counts: Record<string, number> = {};
    for (const reaction of reactions) {
      const type = (reaction.data as any)?.reactionType;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    }

    return counts;
  }

  /**
   * Record a reply (swipe-up)
   */
  async recordReply(
    storyId: string,
    userId: string,
    text: string,
    mediaUrl?: string
  ): Promise<void> {
    await prisma.storyInteraction.create({
      data: {
        storyId,
        userId,
        interactionType: 'reply',
        data: {
          text,
          mediaUrl,
        },
      },
    });

    // Increment replies count
    await prisma.story.update({
      where: { id: storyId },
      data: {
        repliesCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Record a link click
   */
  async recordLinkClick(storyId: string, userId: string): Promise<void> {
    await prisma.storyInteraction.create({
      data: {
        storyId,
        userId,
        interactionType: 'link_click',
        data: {},
      },
    });

    // Increment link clicks count
    await prisma.story.update({
      where: { id: storyId },
      data: {
        linkClicksCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Schedule countdown notification
   */
  async scheduleCountdownNotification(
    storyId: string,
    userId: string,
    targetDate: Date
  ): Promise<void> {
    // Store subscription in interaction
    await prisma.storyInteraction.create({
      data: {
        storyId,
        userId,
        interactionType: 'countdown_subscription',
        data: {
          targetDate: targetDate.toISOString(),
          notificationScheduled: true,
        },
      },
    });

    // TODO: Integrate with notification scheduling system
    // This would typically create a scheduled job to send notification at targetDate
  }
}

// Export singleton instance
export const storyInteractionService = new StoryInteractionService();
