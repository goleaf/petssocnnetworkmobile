/**
 * Tests for Story Interaction Service
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { StoryInteractionService } from '@/lib/services/story-interaction-service';

describe('StoryInteractionService', () => {
  let service: StoryInteractionService;
  let testStoryId: string;
  let testUserId: string;

  beforeEach(async () => {
    service = new StoryInteractionService();

    // Create test story
    const story = await prisma.story.create({
      data: {
        creatorUserId: 'creator-123',
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'photo',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        mediaDimensions: { width: 1080, height: 1920 },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    testStoryId = story.id;
    testUserId = 'user-123';
  });

  afterEach(async () => {
    // Clean up
    await prisma.storyInteraction.deleteMany({
      where: { storyId: testStoryId },
    });
    await prisma.story.delete({
      where: { id: testStoryId },
    });
  });

  describe('Poll Voting', () => {
    it('should record a poll vote', async () => {
      await service.recordPollVote(testStoryId, testUserId, 'option-1');

      const hasVoted = await service.hasUserVoted(testStoryId, testUserId);
      expect(hasVoted).toBe(true);

      const userVote = await service.getUserVote(testStoryId, testUserId);
      expect(userVote).toBe('option-1');
    });

    it('should update existing vote', async () => {
      await service.recordPollVote(testStoryId, testUserId, 'option-1');
      await service.recordPollVote(testStoryId, testUserId, 'option-2');

      const userVote = await service.getUserVote(testStoryId, testUserId);
      expect(userVote).toBe('option-2');

      // Should still have only one vote record
      const interactions = await prisma.storyInteraction.findMany({
        where: {
          storyId: testStoryId,
          userId: testUserId,
          interactionType: 'poll_vote',
        },
      });
      expect(interactions.length).toBe(1);
    });

    it('should get poll results', async () => {
      await service.recordPollVote(testStoryId, 'user-1', 'option-1');
      await service.recordPollVote(testStoryId, 'user-2', 'option-1');
      await service.recordPollVote(testStoryId, 'user-3', 'option-2');

      const results = await service.getPollResults(testStoryId);
      expect(results['option-1']).toBe(2);
      expect(results['option-2']).toBe(1);
    });
  });

  describe('Question Responses', () => {
    it('should record a question response', async () => {
      await service.recordQuestionResponse(
        testStoryId,
        testUserId,
        'This is my answer'
      );

      const responses = await service.getQuestionResponses(testStoryId);
      expect(responses.length).toBe(1);
      expect(responses[0].text).toBe('This is my answer');
      expect(responses[0].userId).toBe(testUserId);
    });

    it('should increment replies count', async () => {
      await service.recordQuestionResponse(
        testStoryId,
        testUserId,
        'Response 1'
      );

      const story = await prisma.story.findUnique({
        where: { id: testStoryId },
      });
      expect(story?.repliesCount).toBe(1);
    });

    it('should allow multiple responses from different users', async () => {
      await service.recordQuestionResponse(testStoryId, 'user-1', 'Answer 1');
      await service.recordQuestionResponse(testStoryId, 'user-2', 'Answer 2');

      const responses = await service.getQuestionResponses(testStoryId);
      expect(responses.length).toBe(2);
    });
  });

  describe('Quiz Answers', () => {
    it('should record a quiz answer', async () => {
      await service.recordQuizAnswer(
        testStoryId,
        testUserId,
        'question-1',
        'answer-a',
        true
      );

      const interactions = await prisma.storyInteraction.findMany({
        where: {
          storyId: testStoryId,
          userId: testUserId,
          interactionType: 'quiz_answer',
        },
      });

      expect(interactions.length).toBe(1);
      expect((interactions[0].data as any).questionId).toBe('question-1');
      expect((interactions[0].data as any).answerId).toBe('answer-a');
      expect((interactions[0].data as any).isCorrect).toBe(true);
    });
  });

  describe('Reactions', () => {
    it('should record a reaction', async () => {
      await service.recordReaction(testStoryId, testUserId, 'heart');

      const counts = await service.getReactionCounts(testStoryId);
      expect(counts['heart']).toBe(1);
    });

    it('should update existing reaction', async () => {
      await service.recordReaction(testStoryId, testUserId, 'heart');
      await service.recordReaction(testStoryId, testUserId, 'laughing');

      const counts = await service.getReactionCounts(testStoryId);
      expect(counts['heart']).toBeUndefined();
      expect(counts['laughing']).toBe(1);
    });

    it('should increment reactions count on first reaction', async () => {
      await service.recordReaction(testStoryId, testUserId, 'heart');

      const story = await prisma.story.findUnique({
        where: { id: testStoryId },
      });
      expect(story?.reactionsCount).toBe(1);
    });

    it('should not increment count when updating reaction', async () => {
      await service.recordReaction(testStoryId, testUserId, 'heart');
      await service.recordReaction(testStoryId, testUserId, 'laughing');

      const story = await prisma.story.findUnique({
        where: { id: testStoryId },
      });
      expect(story?.reactionsCount).toBe(1);
    });
  });

  describe('Replies', () => {
    it('should record a reply', async () => {
      await service.recordReply(testStoryId, testUserId, 'Great story!');

      const interactions = await prisma.storyInteraction.findMany({
        where: {
          storyId: testStoryId,
          userId: testUserId,
          interactionType: 'reply',
        },
      });

      expect(interactions.length).toBe(1);
      expect((interactions[0].data as any).text).toBe('Great story!');
    });

    it('should increment replies count', async () => {
      await service.recordReply(testStoryId, testUserId, 'Reply 1');

      const story = await prisma.story.findUnique({
        where: { id: testStoryId },
      });
      expect(story?.repliesCount).toBe(1);
    });

    it('should support media in replies', async () => {
      await service.recordReply(
        testStoryId,
        testUserId,
        'Check this out',
        'https://example.com/media.jpg'
      );

      const interactions = await prisma.storyInteraction.findMany({
        where: {
          storyId: testStoryId,
          userId: testUserId,
          interactionType: 'reply',
        },
      });

      expect((interactions[0].data as any).mediaUrl).toBe(
        'https://example.com/media.jpg'
      );
    });
  });

  describe('Link Clicks', () => {
    it('should record a link click', async () => {
      await service.recordLinkClick(testStoryId, testUserId);

      const story = await prisma.story.findUnique({
        where: { id: testStoryId },
      });
      expect(story?.linkClicksCount).toBe(1);
    });

    it('should allow multiple clicks from same user', async () => {
      await service.recordLinkClick(testStoryId, testUserId);
      await service.recordLinkClick(testStoryId, testUserId);

      const story = await prisma.story.findUnique({
        where: { id: testStoryId },
      });
      expect(story?.linkClicksCount).toBe(2);
    });
  });

  describe('Countdown Subscriptions', () => {
    it('should schedule countdown notification', async () => {
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await service.scheduleCountdownNotification(
        testStoryId,
        testUserId,
        targetDate
      );

      const interactions = await prisma.storyInteraction.findMany({
        where: {
          storyId: testStoryId,
          userId: testUserId,
          interactionType: 'countdown_subscription',
        },
      });

      expect(interactions.length).toBe(1);
      expect((interactions[0].data as any).targetDate).toBe(
        targetDate.toISOString()
      );
      expect((interactions[0].data as any).notificationScheduled).toBe(true);
    });
  });
});
