import { cn } from '../utils'
import { stripHtml } from '../utils/strip-html'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar')
    })

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, 'bar', null)).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4 p-2', 'p-6')).toBe('p-6')
    })

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags from string', () => {
      expect(stripHtml('<p>Hello world</p>')).toBe('Hello world')
    })

    it('should remove multiple HTML tags', () => {
      expect(stripHtml('<h1>Title</h1><p>Content</p>')).toBe('TitleContent')
    })

    it('should handle nested HTML tags', () => {
      expect(stripHtml('<div><p>Text</p></div>')).toBe('Text')
    })

    it('should handle HTML entities', () => {
      expect(stripHtml('&nbsp; &amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'')
    })

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('')
    })

    it('should handle string with only HTML tags', () => {
      expect(stripHtml('<p></p>')).toBe('')
    })

    it('should trim whitespace', () => {
      expect(stripHtml('<p>  Text  </p>')).toBe('Text')
    })

    it('should handle paragraph tag example from user', () => {
      const example = '<p>Im so proud of Kiwi! After weeks of training, he finally learned to wave hello. Every morning now, he greets me with a little wing wave and it absolutely melts my heart. Training birds requires patience, but the bond you build is so worth it. Next, were working on teaching him to ring a bell!</p>'
      const expected = 'Im so proud of Kiwi! After weeks of training, he finally learned to wave hello. Every morning now, he greets me with a little wing wave and it absolutely melts my heart. Training birds requires patience, but the bond you build is so worth it. Next, were working on teaching him to ring a bell!'
      expect(stripHtml(example)).toBe(expected)
    })
  })
})

