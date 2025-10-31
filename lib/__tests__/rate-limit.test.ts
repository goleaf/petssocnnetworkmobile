// Mock Date.now() for time control
const mockNow = jest.spyOn(Date, 'now')

// Need to import after mock setup to avoid state persistence
let checkRateLimit: any
let RATE_LIMITS: any
let getRateLimitKey: any

beforeEach(() => {
  jest.resetModules()
  const rateLimitModule = require('../rate-limit')
  checkRateLimit = rateLimitModule.checkRateLimit
  RATE_LIMITS = rateLimitModule.RATE_LIMITS
  getRateLimitKey = rateLimitModule.getRateLimitKey
  jest.clearAllMocks()
  mockNow.mockReturnValue(1000000)
})

afterEach(() => {
  jest.resetModules()
})

afterAll(() => {
  mockNow.mockRestore()
})

describe('checkRateLimit', () => {

  it('should allow first request', () => {
    const result = checkRateLimit('test-key', {
      maxAttempts: 5,
      windowMs: 60000,
    })

    expect(result.allowed).toBe(true)
    expect(result.retryAfter).toBeUndefined()
  })

  it('should allow requests within limit', () => {
    const config = { maxAttempts: 5, windowMs: 60000 }
    const key = 'test-key'

    // Make 4 requests (under limit)
    for (let i = 0; i < 4; i++) {
      mockNow.mockReturnValue(1000000 + i * 1000)
      const result = checkRateLimit(key, config)
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests exceeding limit', () => {
    const config = { maxAttempts: 3, windowMs: 60000 }
    const key = 'test-key'

    // Make 3 requests (at limit)
    for (let i = 0; i < 3; i++) {
      mockNow.mockReturnValue(1000000 + i * 1000)
      checkRateLimit(key, config)
    }

    // 4th request should be blocked
    mockNow.mockReturnValue(1000000 + 3000)
    const result = checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeDefined()
  })

  it('should reset count after window expires', () => {
    const config = { maxAttempts: 3, windowMs: 60000 }
    const key = 'test-key'

    // Make 3 requests
    for (let i = 0; i < 3; i++) {
      mockNow.mockReturnValue(1000000 + i * 1000)
      checkRateLimit(key, config)
    }

    // Wait for window to expire
    mockNow.mockReturnValue(1000000 + 61000)
    const result = checkRateLimit(key, config)

    expect(result.allowed).toBe(true)
  })

  it('should block for specified duration when limit exceeded', () => {
    const config = {
      maxAttempts: 2,
      windowMs: 60000,
      blockDurationMs: 120000,
    }
    const key = 'test-key'

    // Make 2 requests (at limit)
    mockNow.mockReturnValue(1000000)
    checkRateLimit(key, config)
    mockNow.mockReturnValue(1000001)
    checkRateLimit(key, config)

    // 3rd request should be blocked
    mockNow.mockReturnValue(1000002)
    const result = checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeDefined()
    expect(result.retryAfter).toBeGreaterThan(0)

    // Should still be blocked within block duration
    mockNow.mockReturnValue(1000002 + 60000)
    const result2 = checkRateLimit(key, config)
    expect(result2.allowed).toBe(false)

    // Should be allowed after block duration
    mockNow.mockReturnValue(1000002 + 121000)
    const result3 = checkRateLimit(key, config)
    expect(result3.allowed).toBe(true)
  })

  it('should use default block duration when not specified', () => {
    const config = { maxAttempts: 2, windowMs: 60000 }
    const key = 'test-key'

    // Make 2 requests
    mockNow.mockReturnValue(1000000)
    checkRateLimit(key, config)
    mockNow.mockReturnValue(1000001)
    checkRateLimit(key, config)

    // 3rd request should be blocked with default duration (2x windowMs)
    mockNow.mockReturnValue(1000002)
    const result = checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeDefined()
  })

  it('should handle multiple keys independently', () => {
    const config = { maxAttempts: 2, windowMs: 60000 }

    // Make 2 requests for key1
    mockNow.mockReturnValue(1000000)
    checkRateLimit('key1', config)
    mockNow.mockReturnValue(1000001)
    checkRateLimit('key1', config)

    // Make 2 requests for key2
    mockNow.mockReturnValue(1000002)
    checkRateLimit('key2', config)
    mockNow.mockReturnValue(1000003)
    checkRateLimit('key2', config)

    // Both should be blocked on 3rd request
    mockNow.mockReturnValue(1000004)
    const result1 = checkRateLimit('key1', config)
    const result2 = checkRateLimit('key2', config)

    expect(result1.allowed).toBe(false)
    expect(result2.allowed).toBe(false)
  })
})

describe('RATE_LIMITS', () => {
  it('should have predefined rate limit configs', () => {
    expect(RATE_LIMITS?.POST_CREATE).toBeDefined()
    expect(RATE_LIMITS?.COMMENT_CREATE).toBeDefined()
    expect(RATE_LIMITS?.FOLLOW_ACTION).toBeDefined()
    expect(RATE_LIMITS?.LIKE_ACTION).toBeDefined()
    expect(RATE_LIMITS?.SEARCH_QUERY).toBeDefined()
    expect(RATE_LIMITS?.LOGIN_ATTEMPT).toBeDefined()
    expect(RATE_LIMITS?.PROFILE_UPDATE).toBeDefined()
  })

  it('should have appropriate limits for each action', () => {
    expect(RATE_LIMITS?.POST_CREATE?.maxAttempts).toBe(5)
    expect(RATE_LIMITS?.COMMENT_CREATE?.maxAttempts).toBe(10)
    expect(RATE_LIMITS?.FOLLOW_ACTION?.maxAttempts).toBe(20)
    expect(RATE_LIMITS?.LIKE_ACTION?.maxAttempts).toBe(30)
    expect(RATE_LIMITS?.SEARCH_QUERY?.maxAttempts).toBe(30)
    expect(RATE_LIMITS?.LOGIN_ATTEMPT?.maxAttempts).toBe(5)
    expect(RATE_LIMITS?.PROFILE_UPDATE?.maxAttempts).toBe(3)
  })
})

describe('getRateLimitKey', () => {
  it('should generate rate limit key from userId and action', () => {
    const key = getRateLimitKey('user123', 'post_create')
    expect(key).toBe('user123:post_create')
  })

  it('should handle different userIds and actions', () => {
    const key1 = getRateLimitKey('user1', 'like')
    const key2 = getRateLimitKey('user2', 'like')

    expect(key1).toBe('user1:like')
    expect(key2).toBe('user2:like')
    expect(key1).not.toBe(key2)
  })
})

