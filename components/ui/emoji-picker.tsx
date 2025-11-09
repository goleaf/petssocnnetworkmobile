"use client"

import { useEffect, useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smile } from "lucide-react"

const RECENTS_KEY = "pet_social_recent_emojis"

type EmojiItem = { char: string; name: string; keywords?: string[] }

// Minimal categorized emoji set to keep bundle small; extend as needed
const EMOJI_CATEGORIES: Record<string, EmojiItem[]> = {
  Smileys: [
    { char: "😀", name: "grinning" },
    { char: "😁", name: "beaming" },
    { char: "😂", name: "joy" },
    { char: "🤣", name: "rolling on the floor laughing" },
    { char: "😊", name: "smiling" },
    { char: "🙂", name: "slightly smiling" },
    { char: "😉", name: "winking" },
    { char: "😍", name: "heart eyes" },
    { char: "😎", name: "sunglasses" },
    { char: "😭", name: "crying" },
    { char: "😡", name: "angry" },
  ],
  Animals: [
    { char: "🐶", name: "dog" },
    { char: "🐱", name: "cat" },
    { char: "🐭", name: "mouse" },
    { char: "🐹", name: "hamster" },
    { char: "🐰", name: "rabbit" },
    { char: "🦊", name: "fox" },
    { char: "🐻", name: "bear" },
    { char: "🐼", name: "panda" },
    { char: "🐨", name: "koala" },
    { char: "🐯", name: "tiger" },
  ],
  Food: [
    { char: "🍎", name: "apple" },
    { char: "🍔", name: "burger" },
    { char: "🍕", name: "pizza" },
    { char: "🍣", name: "sushi" },
    { char: "🍪", name: "cookie" },
    { char: "🍩", name: "doughnut" },
    { char: "🍪", name: "cookie" },
    { char: "🍰", name: "cake" },
    { char: "🍫", name: "chocolate" },
    { char: "🍓", name: "strawberry" },
  ],
  Symbols: [
    { char: "❤️", name: "heart" },
    { char: "✨", name: "sparkles" },
    { char: "🔥", name: "fire" },
    { char: "⭐", name: "star" },
    { char: "✅", name: "check" },
    { char: "❗", name: "exclamation" },
    { char: "❓", name: "question" },
    { char: "🎉", name: "party" },
    { char: "👍", name: "thumbs up" },
    { char: "👎", name: "thumbs down" },
  ],
}

function loadRecents(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveRecents(list: string[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 24)))
  } catch {}
}

export interface EmojiPickerProps {
  onPick: (emoji: string) => void
  size?: "sm" | "md"
}

export function EmojiPicker({ onPick, size = "sm" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    setRecents(loadRecents())
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return EMOJI_CATEGORIES
    const out: Record<string, EmojiItem[]> = {}
    for (const [cat, list] of Object.entries(EMOJI_CATEGORIES)) {
      const f = list.filter((e) => e.name.toLowerCase().includes(q) || e.keywords?.some((k) => k.includes(q)))
      if (f.length) out[cat] = f
    }
    return out
  }, [query])

  const handlePick = (ch: string) => {
    onPick(ch)
    const next = [ch, ...recents.filter((r) => r !== ch)]
    setRecents(next)
    saveRecents(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={size === "sm" ? "sm" : "default"} type="button" aria-label="Add emoji">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,420px)] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Input
            placeholder="Search emojis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8"
          />
        </div>
        {recents.length > 0 && !query && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Recent</div>
            <div className="grid grid-cols-8 gap-1">
              {recents.map((r) => (
                <button key={r} className="h-8 w-8 rounded hover:bg-accent" onClick={() => handlePick(r)}>
                  <span className="text-xl leading-none">{r}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <Tabs defaultValue={Object.keys(filtered)[0]} className="w-full">
          <TabsList className="grid grid-cols-4 mb-2">
            {Object.keys(filtered).map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(filtered).map(([cat, list]) => (
            <TabsContent key={cat} value={cat} className="m-0">
              <div className="grid grid-cols-8 gap-1 max-h-64 overflow-auto">
                {list.map((e) => (
                  <button
                    key={`${cat}-${e.char}-${e.name}`}
                    className="h-8 w-8 rounded hover:bg-accent"
                    onClick={() => handlePick(e.char)}
                  >
                    <span className="text-xl leading-none">{e.char}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default EmojiPicker

