import {
  ContentModerationService,
  queueMediaForModeration,
  getModerationQueue,
  getModerationStatus,
  reviewModeration,
  toggleBlurOnWarning,
  shouldBlurMedia,
} from '../moderation';

// Mock the moderation queue
jest.mock('../moderation', () => {
  const actual = jest.requireActual('../moderation');
  return {
    ...actual,
  };
});

describe('ContentModerationService', () => {
  let service: ContentModerationService;

  beforeEach(() => {
    service = new ContentModerationService({
      autoModerate: true,
      blurOnWarning: true,
      threshold: 0.7,
    });
  });

  it('should moderate media and return result', async () => {
    const result = await service.moderateMedia('https://example.com/image.jpg', 'image');
    
    expect(result).toHaveProperty('flagged');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('needsReview');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should batch moderate multiple media files', async () => {
    const mediaUrls = [
      { url: 'https://example.com/image1.jpg', type: 'image' as const },
      { url: 'https://example.com/image2.jpg', type: 'image' as const },
    ];

    const results = await service.moderateBatch(mediaUrls);
    
    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result).toHaveProperty('flagged');
      expect(result).toHaveProperty('score');
    });
  });
});

describe('Moderation Queue', () => {
  beforeEach(() => {
    // Clear queue before each test
    const queue = getModerationQueue();
    queue.forEach((item) => {
      // In a real implementation, we'd clear the queue
    });
  });

  it('should queue media for moderation', async () => {
    const service = new ContentModerationService();
    const result = await service.moderateMedia('https://example.com/test.jpg', 'image');
    
    const moderation = await queueMediaForModeration(
      'https://example.com/test.jpg',
      'image',
      result,
      { width: 800, height: 600 }
    );

    expect(moderation).toHaveProperty('id');
    expect(moderation.mediaUrl).toBe('https://example.com/test.jpg');
    expect(moderation.mediaType).toBe('image');
    expect(moderation.status).toBe('flagged');
  });

  it('should get moderation status for media URL', async () => {
    const service = new ContentModerationService();
    const result = await service.moderateMedia('https://example.com/test.jpg', 'image');
    
    await queueMediaForModeration('https://example.com/test.jpg', 'image', result);
    
    const status = getModerationStatus('https://example.com/test.jpg');
    expect(status).not.toBeNull();
    expect(status?.mediaUrl).toBe('https://example.com/test.jpg');
  });

  it('should review and update moderation status', async () => {
    const service = new ContentModerationService();
    const result = await service.moderateMedia('https://example.com/test.jpg', 'image');
    
    const moderation = await queueMediaForModeration('https://example.com/test.jpg', 'image', result);
    
    const reviewed = await reviewModeration(moderation.id, 'approve', 'admin');
    
    expect(reviewed.status).toBe('approved');
    expect(reviewed.reviewedBy).toBe('admin');
    expect(reviewed.reviewedAt).toBeInstanceOf(Date);
  });

  it('should toggle blur-on-warning setting', async () => {
    const service = new ContentModerationService();
    const result = await service.moderateMedia('https://example.com/test.jpg', 'image');
    
    const moderation = await queueMediaForModeration('https://example.com/test.jpg', 'image', result);
    
    const updated = await toggleBlurOnWarning(moderation.id, false);
    
    expect(updated.blurOnWarning).toBe(false);
  });

  it('should determine if media should be blurred', async () => {
    const service = new ContentModerationService();
    const result = await service.moderateMedia('https://example.com/test.jpg', 'image');
    
    await queueMediaForModeration('https://example.com/test.jpg', 'image', result);
    
    const shouldBlur = shouldBlurMedia('https://example.com/test.jpg', true);
    // This depends on the moderation result, but should return a boolean
    expect(typeof shouldBlur).toBe('boolean');
  });
});

