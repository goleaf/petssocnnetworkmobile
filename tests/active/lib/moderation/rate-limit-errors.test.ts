import {
  formatRetryAfter,
  getRateLimitErrorMessage,
  createRateLimitErrorResponse,
} from '@/lib/moderation/rate-limit-errors'

describe('rate limit error utilities', () => {
  describe('formatRetryAfter', () => {
    it('formats seconds correctly', () => {
      expect(formatRetryAfter(1000)).toBe('1 second')
      expect(formatRetryAfter(5000)).toBe('5 seconds')
      expect(formatRetryAfter(30000)).toBe('30 seconds')
    })

    it('formats minutes correctly', () => {
      expect(formatRetryAfter(60000)).toBe('1 minute')
      expect(formatRetryAfter(120000)).toBe('2 minutes')
      expect(formatRetryAfter(300000)).toBe('5 minutes')
    })

    it('formats hours correctly', () => {
      expect(formatRetryAfter(3600000)).toBe('1 hour')
      expect(formatRetryAfter(7200000)).toBe('2 hours')
      expect(formatRetryAfter(86400000)).toBe('24 hours')
    })

    it('rounds up to nearest unit', () => {
      expect(formatRetryAfter(1500)).toBe('2 seconds')
      expect(formatRetryAfter(90000)).toBe('2 minutes')
      expect(formatRetryAfter(5400000)).toBe('2 hours')
    })
  })

  describe('getRateLimitErrorMessage', () => {
    it('generates hourly limit message', () => {
      const message = getRateLimitErrorMessage(3600000, true)
      expect(message).toContain('hourly')
      expect(message).toContain('10 edits')
      expect(message).toContain('1 hour')
    })

    it('generates daily limit message', () => {
      const message = getRateLimitErrorMessage(86400000, false)
      expect(message).toContain('daily')
      expect(message).toContain('50 edits')
      expect(message).toContain('24 hours')
    })

    it('includes retry time in message', () => {
      const message = getRateLimitErrorMessage(300000, true)
      expect(message).toContain('5 minutes')
    })
  })

  describe('createRateLimitErrorResponse', () => {
    it('creates structured error response for hourly limit', () => {
      const response = createRateLimitErrorResponse(3600000, true)
      
      expect(response.error).toContain('hourly')
      expect(response.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.retryAfterMs).toBe(3600000)
      expect(response.retryAfter).toBe('1 hour')
    })

    it('creates structured error response for daily limit', () => {
      const response = createRateLimitErrorResponse(86400000, false)
      
      expect(response.error).toContain('daily')
      expect(response.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.retryAfterMs).toBe(86400000)
      expect(response.retryAfter).toBe('24 hours')
    })

    it('includes all required fields', () => {
      const response = createRateLimitErrorResponse(300000, true)
      
      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('code')
      expect(response).toHaveProperty('retryAfterMs')
      expect(response).toHaveProperty('retryAfter')
    })
  })
})
