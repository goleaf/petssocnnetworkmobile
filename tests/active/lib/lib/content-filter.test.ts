import {
  filterProfanity,
  detectSpam,
  checkDuplicateContent,
  validateContent,
} from '../content-filter'

describe('content-filter', () => {
  describe('filterProfanity', () => {
    it('should filter profanity from text', () => {
      const result = filterProfanity('This is a damn good text')
      expect(result.isClean).toBe(false)
      expect(result.filtered).toContain('****')
      expect(result.violations.length).toBeGreaterThan(0)
    })

    it('should return clean result for text without profanity', () => {
      const result = filterProfanity('This is a clean text')
      expect(result.isClean).toBe(true)
      expect(result.filtered).toBe('This is a clean text')
      expect(result.violations).toHaveLength(0)
    })

    it('should handle multiple profanity words', () => {
      const result = filterProfanity('This is damn stupid crap')
      expect(result.isClean).toBe(false)
      expect(result.violations.length).toBeGreaterThan(1)
    })

    it('should be case insensitive', () => {
      const result = filterProfanity('This is DAMN text')
      expect(result.isClean).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
    })
  })

  describe('detectSpam', () => {
    it('should detect repeated characters', () => {
      const result = detectSpam('This is aaaaa spam')
      expect(result.isClean).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
    })

    it('should detect multiple URLs', () => {
      const result = detectSpam('Visit http://example.com and http://test.com and http://another.com and http://more.com')
      expect(result.isClean).toBe(false)
      expect(result.violations.some(v => v.includes('URL'))).toBe(true)
    })

    it('should detect spam keywords', () => {
      const result = detectSpam('Click here to buy free prize money')
      expect(result.isClean).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
    })

    it('should detect excessive capitalization', () => {
      const result = detectSpam('THIS IS ALL CAPS AND VERY LONG TEXT THAT EXCEEDS TWENTY CHARACTERS')
      expect(result.isClean).toBe(false)
      expect(result.violations.some(v => v.includes('capitalization'))).toBe(true)
      expect(result.filtered).toBe(result.filtered.toLowerCase())
    })

    it('should return clean result for normal text', () => {
      const result = detectSpam('This is a normal text without spam')
      expect(result.isClean).toBe(true)
      expect(result.violations).toHaveLength(0)
    })
  })

  describe('checkDuplicateContent', () => {
    it('should detect duplicate content', () => {
      const recentContent = ['This is a post', 'Another post']
      const result = checkDuplicateContent('This is a post', recentContent)
      expect(result).toBe(true)
    })

    it('should not detect non-duplicate content', () => {
      const recentContent = ['This is a post', 'Another post']
      const result = checkDuplicateContent('This is a different post', recentContent)
      expect(result).toBe(false)
    })

    it('should be case insensitive', () => {
      const recentContent = ['This is a post']
      const result = checkDuplicateContent('THIS IS A POST', recentContent)
      expect(result).toBe(true)
    })

    it('should handle whitespace differences', () => {
      const recentContent = ['This is a post']
      const result = checkDuplicateContent('  This is a post  ', recentContent)
      expect(result).toBe(true)
    })
  })

  describe('validateContent', () => {
    it('should validate minimum length', () => {
      const result = validateContent('Short', { minLength: 10 })
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('at least'))).toBe(true)
    })

    it('should validate maximum length', () => {
      const longText = 'a'.repeat(200)
      const result = validateContent(longText, { maxLength: 100 })
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('less than'))).toBe(true)
    })

    it('should check profanity by default', () => {
      const result = validateContent('This is damn good')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should skip profanity check when disabled', () => {
      const result = validateContent('This is damn good', { checkProfanity: false })
      expect(result.isValid).toBe(true)
    })

    it('should check spam by default', () => {
      const result = validateContent('Click here to buy free prize')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should skip spam check when disabled', () => {
      const result = validateContent('Click here to buy free prize', { checkSpam: false })
      expect(result.isValid).toBe(true)
    })

    it('should return valid for clean content', () => {
      const result = validateContent('This is a clean and valid content', {
        minLength: 5,
        maxLength: 100,
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should filter profanity in result', () => {
      const result = validateContent('This is damn good')
      expect(result.filtered).not.toContain('damn')
      expect(result.filtered).toContain('****')
    })
  })
})

