/**
 * Tests for story analytics endpoints
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GET as getViewers } from '@/app/api/stories/[storyId]/viewers/route';
import { GET as getInsights } from '@/app/api/stories/[storyId]/insights/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock the story service
jest.mock('@/lib/services/story-service', () => ({
  storyService: {
    getStoryById: jest.fn(),
    getStoryViewers: jest.fn(),
    getStoryInsights: jest.fn(),
  },
}));

const { storyService } = require('@/lib/services/story-service');

describe('Story Analytics Endpoints', () => {
  const testStoryId = 'test-story-123';
  const testUserId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stories/[storyId]/viewers', () => {
    it('should return viewers list for story creator', async () => {
      // Mock story ownership
      storyService.getStoryById.mockResolvedValue({
        id: testStoryId,
        creatorUserId: testUserId,
      });

      // Mock viewers data
      const mockViewers = [
        {
          viewerUserId: 'viewer-1',
          viewedAt: new Date('2024-01-01T10:00:00Z'),
          duration: 5,
          completed: true,
        },
        {
          viewerUserId: 'viewer-2',
          viewedAt: new Date('2024-01-01T11:00:00Z'),
          duration: 3,
          completed: false,
        },
      ];
      storyService.getStoryViewers.mockResolvedValue(mockViewers);

      const request = new NextRequest(`http://localhost:3000/api/stories/${testStoryId}/viewers`, {
        method: 'GET',
        headers: {
          'x-user-id': testUserId,
        },
      });

      const response = await getViewers(request, { params: { storyId: testStoryId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.storyId).toBe(testStoryId);
      expect(data.totalViewers).toBe(2);
      expect(data.viewers).toHaveLength(2);
      expect(data.viewers[0].userId).toBe('viewer-1');
      expect(data.viewers[0].completed).toBe(true);
    });

    it('should return 404 for non-existent story', async () => {
      storyService.getStoryById.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/stories/${testStoryId}/viewers`, {
        method: 'GET',
        headers: {
          'x-user-id': testUserId,
        },
      });

      const response = await getViewers(request, { params: { storyId: testStoryId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Story not found');
    });

    it('should return 403 for non-creator', async () => {
      storyService.getStoryById.mockResolvedValue({
        id: testStoryId,
        creatorUserId: 'other-user',
      });

      const request = new NextRequest(`http://localhost:3000/api/stories/${testStoryId}/viewers`, {
        method: 'GET',
        headers: {
          'x-user-id': testUserId,
        },
      });

      const response = await getViewers(request, { params: { storyId: testStoryId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('GET /api/stories/[storyId]/insights', () => {
    it('should return comprehensive insights for story creator', async () => {
      // Mock story ownership
      storyService.getStoryById.mockResolvedValue({
        id: testStoryId,
        creatorUserId: testUserId,
      });

      // Mock insights data
      const mockInsights = {
        totalViews: 100,
        reach: 85,
        impressions: 100,
        completionRate: 75.5,
        averageWatchTime: 4.2,
        exitsHeatmap: [
          { second: 2, exitCount: 10, exitPercentage: 10 },
          { second: 3, exitCount: 15, exitPercentage: 15 },
        ],
        engagement: {
          replies: 5,
          reactions: 20,
          shares: 3,
          pollVotes: 10,
          questionResponses: 2,
          quizAnswers: 8,
          linkClicks: 4,
          totalInteractions: 52,
        },
        audience: {
          followerViewers: 70,
          nonFollowerViewers: 15,
          followerPercentage: 82.35,
          geographicDistribution: [
            { country: 'US', count: 50, percentage: 58.82 },
            { country: 'UK', count: 20, percentage: 23.53 },
          ],
          deviceTypes: [
            { type: 'mobile', count: 60, percentage: 70.59 },
            { type: 'desktop', count: 25, percentage: 29.41 },
          ],
        },
        performance: {
          viewsVsAverage: 15,
          engagementVsAverage: 20,
          completionRateVsAverage: 5,
        },
        storyMetadata: {
          createdAt: '2024-01-01T10:00:00Z',
          expiresAt: '2024-01-02T10:00:00Z',
          mediaType: 'photo',
          hasCaption: true,
          stickerCount: 2,
          visibility: 'everyone',
        },
      };
      storyService.getStoryInsights.mockResolvedValue(mockInsights);

      const request = new NextRequest(`http://localhost:3000/api/stories/${testStoryId}/insights`, {
        method: 'GET',
        headers: {
          'x-user-id': testUserId,
        },
      });

      const response = await getInsights(request, { params: { storyId: testStoryId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.storyId).toBe(testStoryId);
      expect(data.insights).toBeDefined();
      expect(data.insights.totalViews).toBe(100);
      expect(data.insights.reach).toBe(85);
      expect(data.insights.completionRate).toBe(75.5);
      expect(data.insights.engagement.totalInteractions).toBe(52);
      expect(data.insights.exitsHeatmap).toHaveLength(2);
    });

    it('should return 404 for non-existent story', async () => {
      storyService.getStoryById.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/stories/${testStoryId}/insights`, {
        method: 'GET',
        headers: {
          'x-user-id': testUserId,
        },
      });

      const response = await getInsights(request, { params: { storyId: testStoryId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Story not found');
    });

    it('should return 403 for non-creator', async () => {
      storyService.getStoryById.mockResolvedValue({
        id: testStoryId,
        creatorUserId: 'other-user',
      });

      const request = new NextRequest(`http://localhost:3000/api/stories/${testStoryId}/insights`, {
        method: 'GET',
        headers: {
          'x-user-id': testUserId,
        },
      });

      const response = await getInsights(request, { params: { storyId: testStoryId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Unauthorized');
    });
  });
});
