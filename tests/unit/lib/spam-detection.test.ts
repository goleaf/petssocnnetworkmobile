// Mock Date.now() for time control
const mockNow = jest.spyOn(Date, 'now')

// Need to import after mock setup to avoid state persistence
let trackActivity: any
let detectSuspiciousActivity: any
let clearUserActivity: any
let getRecentContent: any

beforeEach(() => {
  jest.resetModules()
  const spamDetectionModule = require('@/lib/spam-detection')
  trackActivity = spamDetectionModule.trackActivity
  detectSuspiciousActivity = spamDetectionModule.detectSuspiciousActivity
  clearUserActivity = spamDetectionModule.clearUserActivity
  getRecentContent = spamDetectionModule.getRecentContent
  jest.clearAllMocks()
  mockNow.mockReturnValue(1000000)
})

afterEach(() => {
  jest.resetModules()
})

afterAll(() => {
  mockNow.mockRestore()
})

describe('trackActivity', () => {

  it('should track user activity', () => {
    trackActivity('user1', 'post_create', 'Test content')
    
    const recent = getRecentContent('user1')
    expect(recent).toContain('Test content')
  })

  it('should track activity without content', () => {
    clearUserActivity('user1') // Clear any previous state
    trackActivity('user1', 'like')
    
    const recent = getRecentContent('user1')
    expect(recent).toEqual([])
  })

  it('should keep only last 50 activities', () => {
    for (let i = 0; i < 60; i++) {
      mockNow.mockReturnValue(1000000 + i * 1000)
      trackActivity('user1', 'action', `content${i}`)
    }

    const recent = getRecentContent('user1')
    // Should keep last 10 content items (content50-59)
    expect(recent.length).toBeLessThanOrEqual(10)
    expect(recent[recent.length - 1]).toContain('content59')
  })

  it('should keep only last 10 content items', () => {
    for (let i = 0; i < 15; i++) {
      trackActivity('user1', 'post_create', `content${i}`)
    }

    const recent = getRecentContent('user1')
    expect(recent.length).toBeLessThanOrEqual(10)
    expect(recent[0]).toContain('content5') // First item should be content5 (after removing first 5)
  })
})

describe('detectSuspiciousActivity', () => {
  beforeEach(() => {
    clearUserActivity('user1') // Clear state before each test
  })

  it('should return not suspicious for normal activity', () => {
    for (let i = 0; i < 5; i++) {
      mockNow.mockReturnValue(1000000 + i * 5000)
      trackActivity('user1', 'like')
    }

    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(false)
    expect(result.reasons).toEqual([])
  })

  it('should detect rapid action rate', () => {
    // More than 10 actions in last minute
    for (let i = 0; i < 15; i++) {
      mockNow.mockReturnValue(1000000 + i * 1000) // All within 15 seconds
      trackActivity('user1', 'like')
    }

    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(true)
    expect(result.reasons).toContain('Rapid action rate detected')
  })

  it('should detect repeated identical actions', () => {
    // More than 5 of the same action in last minute
    for (let i = 0; i < 6; i++) {
      mockNow.mockReturnValue(1000000 + i * 2000)
      trackActivity('user1', 'spam_action')
    }

    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(true)
    expect(result.reasons).toContain('Repeated spam_action actions')
  })

  it('should detect duplicate content', () => {
    const duplicateContent = 'Same content'
    
    // Create content with low uniqueness (more than 3 items, less than 50% unique)
    for (let i = 0; i < 5; i++) {
      trackActivity('user1', 'post_create', duplicateContent)
    }

    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(true)
    expect(result.reasons).toContain('Duplicate content detected')
  })

  it('should not detect duplicates for unique content', () => {
    for (let i = 0; i < 5; i++) {
      trackActivity('user1', 'post_create', `unique content ${i}`)
    }

    const result = detectSuspiciousActivity('user1')
    // All content is unique, so should not detect duplicates
    expect(result.reasons).not.toContain('Duplicate content detected')
  })

  it('should combine multiple suspicious patterns', () => {
    // Create rapid, repeated actions with duplicate content
    for (let i = 0; i < 12; i++) {
      mockNow.mockReturnValue(1000000 + i * 3000)
      trackActivity('user1', 'spam_action', 'same content')
    }

    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(true)
    expect(result.reasons.length).toBeGreaterThan(1)
  })

  it('should ignore old activities (outside 1 minute window)', () => {
    // Create old activity
    mockNow.mockReturnValue(1000000)
    trackActivity('user1', 'spam_action')
    trackActivity('user1', 'spam_action')
    trackActivity('user1', 'spam_action')
    trackActivity('user1', 'spam_action')
    trackActivity('user1', 'spam_action')

    // Move time forward beyond 1 minute
    mockNow.mockReturnValue(1000000 + 61000)

    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(false)
  })
})

describe('clearUserActivity', () => {

  it('should clear user activity', () => {
    trackActivity('user1', 'action', 'content')
    
    expect(getRecentContent('user1')).toContain('content')
    
    clearUserActivity('user1')
    
    expect(getRecentContent('user1')).toEqual([])
    
    const result = detectSuspiciousActivity('user1')
    expect(result.isSuspicious).toBe(false)
  })

  it('should clear only specified user activity', () => {
    trackActivity('user1', 'action', 'content1')
    trackActivity('user2', 'action', 'content2')
    
    clearUserActivity('user1')
    
    expect(getRecentContent('user1')).toEqual([])
    expect(getRecentContent('user2')).toContain('content2')
  })
})

describe('getRecentContent', () => {
  beforeEach(() => {
    clearUserActivity('user1')
    clearUserActivity('new-user')
  })

  it('should return empty array for user with no content', () => {
    const recent = getRecentContent('new-user')
    expect(recent).toEqual([])
  })

  it('should return recent content for user', () => {
    trackActivity('user1', 'post_create', 'content1')
    trackActivity('user1', 'post_create', 'content2')
    trackActivity('user1', 'post_create', 'content3')
    
    const recent = getRecentContent('user1')
    expect(recent.length).toBe(3)
    expect(recent).toContain('content1')
    expect(recent).toContain('content2')
    expect(recent).toContain('content3')
  })
})
