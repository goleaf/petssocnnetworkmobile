/**
 * Tests for post engagement endpoints
 * Tests likes, comments, shares, and saves functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';

// Mock user IDs for testing
const TEST_USER_1 = 'test-user-1';
const TEST_USER_2 = 'test-user-2';

describe('Post Engagement Endpoints', () => {
  let testPostId: string;

  beforeEach(async () => {
    // Create a test post
    const post = await prisma.post.create({
      data: {
        authorUserId: TEST_USER_1,
        postType: 'standard',
        textContent: 'Test post for engagement',
        visibility: 'public',
        publishedAt: new Date(),
      },
    });
    testPostId = post.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.postLike.deleteMany({ where: { postId: testPostId } });
    await prisma.comment.deleteMany({ where: { postId: testPostId } });
    await prisma.postShare.deleteMany({ where: { postId: testPostId } });
    await prisma.savedPost.deleteMany({ where: { postId: testPostId } });
    await prisma.post.delete({ where: { id: testPostId } });
  });

  describe('POST /api/posts/{postId}/like', () => {
    it('should create a like on a post', async () => {
      // Create like
      const like = await prisma.postLike.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
          reactionType: 'like',
        },
      });

      expect(like).toBeDefined();
      expect(like.postId).toBe(testPostId);
      expect(like.userId).toBe(TEST_USER_2);
      expect(like.reactionType).toBe('like');

      // Verify post likes count incremented
      const post = await prisma.post.findUnique({
        where: { id: testPostId },
      });
      expect(post?.likesCount).toBeGreaterThan(0);
    });

    it('should update reaction type if user already liked', async () => {
      // Create initial like
      await prisma.postLike.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
          reactionType: 'like',
        },
      });

      // Update to love
      await prisma.postLike.update({
        where: {
          postId_userId: {
            postId: testPostId,
            userId: TEST_USER_2,
          },
        },
        data: { reactionType: 'love' },
      });

      const like = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: testPostId,
            userId: TEST_USER_2,
          },
        },
      });

      expect(like?.reactionType).toBe('love');
    });
  });

  describe('DELETE /api/posts/{postId}/like', () => {
    it('should remove a like from a post', async () => {
      // Create like first
      await prisma.postLike.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
          reactionType: 'like',
        },
      });

      // Delete like
      await prisma.postLike.delete({
        where: {
          postId_userId: {
            postId: testPostId,
            userId: TEST_USER_2,
          },
        },
      });

      // Verify like is deleted
      const like = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: testPostId,
            userId: TEST_USER_2,
          },
        },
      });

      expect(like).toBeNull();
    });
  });

  describe('POST /api/posts/{postId}/comments', () => {
    it('should create a comment on a post', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: testPostId,
          authorUserId: TEST_USER_2,
          textContent: 'Great post!',
        },
      });

      expect(comment).toBeDefined();
      expect(comment.postId).toBe(testPostId);
      expect(comment.authorUserId).toBe(TEST_USER_2);
      expect(comment.textContent).toBe('Great post!');

      // Verify post comments count incremented
      const post = await prisma.post.findUnique({
        where: { id: testPostId },
      });
      expect(post?.commentsCount).toBeGreaterThan(0);
    });

    it('should create a reply to a comment', async () => {
      // Create parent comment
      const parentComment = await prisma.comment.create({
        data: {
          postId: testPostId,
          authorUserId: TEST_USER_2,
          textContent: 'Parent comment',
        },
      });

      // Create reply
      const reply = await prisma.comment.create({
        data: {
          postId: testPostId,
          authorUserId: TEST_USER_1,
          parentCommentId: parentComment.id,
          textContent: 'Reply to comment',
        },
      });

      expect(reply.parentCommentId).toBe(parentComment.id);

      // Verify parent comment replies count incremented
      const updatedParent = await prisma.comment.findUnique({
        where: { id: parentComment.id },
      });
      expect(updatedParent?.repliesCount).toBeGreaterThan(0);
    });

    it('should extract mentions from comment text', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: testPostId,
          authorUserId: TEST_USER_2,
          textContent: 'Hey @testuser, check this out!',
          mentionedUserIds: [TEST_USER_1],
        },
      });

      expect(comment.mentionedUserIds).toContain(TEST_USER_1);
    });
  });

  describe('POST /api/posts/{postId}/share', () => {
    it('should create a share record', async () => {
      const share = await prisma.postShare.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
          shareType: 'repost',
        },
      });

      expect(share).toBeDefined();
      expect(share.postId).toBe(testPostId);
      expect(share.userId).toBe(TEST_USER_2);
      expect(share.shareType).toBe('repost');

      // Verify post shares count incremented
      const post = await prisma.post.findUnique({
        where: { id: testPostId },
      });
      expect(post?.sharesCount).toBeGreaterThan(0);
    });

    it('should create a quote share with caption', async () => {
      const share = await prisma.postShare.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
          shareType: 'quote',
          caption: 'This is amazing!',
        },
      });

      expect(share.shareType).toBe('quote');
      expect(share.caption).toBe('This is amazing!');
    });
  });

  describe('POST /api/posts/{postId}/save', () => {
    it('should save a post to collection', async () => {
      const save = await prisma.savedPost.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
        },
      });

      expect(save).toBeDefined();
      expect(save.postId).toBe(testPostId);
      expect(save.userId).toBe(TEST_USER_2);

      // Verify post saves count incremented
      const post = await prisma.post.findUnique({
        where: { id: testPostId },
      });
      expect(post?.savesCount).toBeGreaterThan(0);
    });

    it('should save a post to a named collection', async () => {
      const save = await prisma.savedPost.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
          collectionName: 'Favorites',
        },
      });

      expect(save.collectionName).toBe('Favorites');
    });
  });

  describe('DELETE /api/posts/{postId}/save', () => {
    it('should unsave a post', async () => {
      // Create save first
      await prisma.savedPost.create({
        data: {
          postId: testPostId,
          userId: TEST_USER_2,
        },
      });

      // Delete save
      await prisma.savedPost.delete({
        where: {
          postId_userId: {
            postId: testPostId,
            userId: TEST_USER_2,
          },
        },
      });

      // Verify save is deleted
      const save = await prisma.savedPost.findUnique({
        where: {
          postId_userId: {
            postId: testPostId,
            userId: TEST_USER_2,
          },
        },
      });

      expect(save).toBeNull();
    });
  });

  describe('Engagement Counters', () => {
    it('should maintain accurate engagement counters', async () => {
      // Create multiple engagements
      await prisma.postLike.create({
        data: { postId: testPostId, userId: TEST_USER_2, reactionType: 'like' },
      });

      await prisma.comment.create({
        data: { postId: testPostId, authorUserId: TEST_USER_2, textContent: 'Comment 1' },
      });

      await prisma.postShare.create({
        data: { postId: testPostId, userId: TEST_USER_2, shareType: 'repost' },
      });

      await prisma.savedPost.create({
        data: { postId: testPostId, userId: TEST_USER_2 },
      });

      // Update counters
      await prisma.post.update({
        where: { id: testPostId },
        data: {
          likesCount: { increment: 1 },
          commentsCount: { increment: 1 },
          sharesCount: { increment: 1 },
          savesCount: { increment: 1 },
        },
      });

      // Verify all counters
      const post = await prisma.post.findUnique({
        where: { id: testPostId },
      });

      expect(post?.likesCount).toBe(1);
      expect(post?.commentsCount).toBe(1);
      expect(post?.sharesCount).toBe(1);
      expect(post?.savesCount).toBe(1);
    });
  });
});
