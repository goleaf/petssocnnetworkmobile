/**
 * Replaces text emoticons with emoji Unicode characters
 * Example: :) becomes 😊
 */
export function replaceEmoticons(text: string): string {
  if (!text) return text

  // Common emoticon to emoji mappings
  const emoticonMap: Record<string, string> = {
    // Happy emoticons
    ':)': '😊',
    ':-)': '😊',
    '(:': '😊',
    '(-:': '😊',
    ':D': '😃',
    ':-D': '😃',
    'xD': '😆',
    'XD': '😆',
    ':))': '😄',
    ':)))': '😄',
    
    // Wink
    ';)': '😉',
    ';-)': '😉',
    '(;': '😉',
    '(-;': '😉',
    
    // Tongue out
    ':P': '😛',
    ':-P': '😛',
    ':p': '😛',
    ':-p': '😛',
    'XP': '😝',
    'xp': '😝',
    
    // Sad emoticons
    ':(': '😢',
    ':-(': '😢',
    '):': '😢',
    ')-:': '😢',
    ':\'(': '😭',
    ':-\'(': '😭',
    ':(': '😞',
    
    // Neutral
    ':|': '😐',
    ':-|': '😐',
    ':/': '😕',
    ':-/': '😕',
    ':\\': '😕',
    ':-\\': '😕',
    
    // Surprised
    ':O': '😮',
    ':-O': '😮',
    ':o': '😮',
    ':-o': '😮',
    'O_O': '😲',
    'o_O': '😲',
    
    // Love
    '<3': '❤️',
    '</3': '💔',
    '<33': '❤️',
    
    // Cool
    'B)': '😎',
    'B-)': '😎',
    '8)': '😎',
    '8-)': '😎',
    
    // Devil
    '>:)': '😈',
    '>:-)': '😈',
    
    // Angel
    'O:)': '😇',
    'O:-)': '😇',
    
    // Confused
    ':S': '😕',
    ':-S': '😕',
    ':s': '😕',
    ':-s': '😕',
    
    // Kiss
    ':*': '😘',
    ':-*': '😘',
    ':x': '😘',
    ':-x': '😘',
    ':X': '😘',
    ':-X': '😘',
    
    // Thumbs
    '(y)': '👍',
    '(Y)': '👍',
    '(n)': '👎',
    '(N)': '👎',
    
    // Sleepy
    '-_-': '😑',
    'z_z': '😴',
    'Z_Z': '😴',
    ':zzz:': '😴',
  }

  let result = text

  // Sort emoticons by length (longest first) to avoid partial matches
  const sortedKeys = Object.keys(emoticonMap).sort((a, b) => b.length - a.length)

  // Replace each emoticon
  for (const emoticon of sortedKeys) {
    // Use word boundaries or whitespace to avoid replacing emoticons that are part of words
    // Match emoticon at word boundaries, after whitespace, or at start/end of string
    const regex = new RegExp(
      `(^|\\s|(?<![\\w:]))${escapeRegex(emoticon)}(?![\\w:])`,
      'g'
    )
    result = result.replace(regex, (match, prefix) => {
      // Preserve the prefix (whitespace or start)
      return prefix + emoticonMap[emoticon]
    })
  }

  return result
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Hook to replace emoticons in text as user types
 */
export function useEmoticonReplacer() {
  const handleTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setValue: (value: string) => void
  ) => {
    const value = e.target.value
    setValue(value)
    
    // Auto-replace emoticons on space, enter, or punctuation
    const lastChar = value[value.length - 1]
    if (lastChar === ' ' || lastChar === '\n' || /[.,!?;:]/.test(lastChar)) {
      const replaced = replaceEmoticons(value)
      if (replaced !== value) {
        setValue(replaced)
      }
    }
  }

  return { handleTextChange, replaceEmoticons }
}

