"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface EmojiStickerProps {
  onSelect: (emoji: string) => void
}

const EMOJI_CATEGORIES = {
  "Smileys & People": [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
    "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
    "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
  ],
  "Animals & Nature": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
    "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  ],
  "Food & Drink": [
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈",
    "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦",
    "🥬", "🥒", "🌶", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐",
  ],
  "Activities": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
    "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🏹", "🎣",
    "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸", "🥌", "🎿", "⛷",
  ],
  "Travel & Places": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎", "🚓", "🚑", "🚒", "🚐",
    "🚚", "🚛", "🚜", "🛴", "🚲", "🛵", "🏍", "🛺", "🚨", "🚔",
    "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝",
  ],
  "Objects": [
    "⌚", "📱", "📲", "💻", "⌨", "🖥", "🖨", "🖱", "🖲", "🕹",
    "🗜", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥",
    "📽", "🎞", "📞", "☎", "📟", "📠", "📺", "📻", "🎙", "🎚",
  ],
  "Symbols": [
    "❤", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮",
    "✝", "☪", "🕉", "☸", "✡", "🔯", "🕎", "☯", "☦", "🛐",
  ],
}

export function EmojiSticker({ onSelect }: EmojiStickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>(
    Object.keys(EMOJI_CATEGORIES)[0]
  )

  const categories = Object.keys(EMOJI_CATEGORIES)
  const emojis = EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap text-xs"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-8 gap-2">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onSelect(emoji)}
              className="text-2xl hover:bg-accent rounded p-2 transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
