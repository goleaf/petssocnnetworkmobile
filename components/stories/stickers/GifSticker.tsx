"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import type { GifStickerData } from "./types"

interface GifStickerProps {
  onSelect: (data: GifStickerData) => void
}

interface GifResult {
  id: string
  title: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
  }
}

export function GifSticker({ onSelect }: GifStickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrendingGifs()
  }, [])

  const loadTrendingGifs = async () => {
    setLoading(true)
    setError(null)
    try {
      // Using Tenor API (free tier)
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"}&limit=20`
      )
      
      if (!response.ok) {
        throw new Error("Failed to load GIFs")
      }

      const data = await response.json()
      setGifs(data.results || [])
    } catch (err) {
      setError("Failed to load GIFs")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"}&limit=20`
      )
      
      if (!response.ok) {
        throw new Error("Failed to search GIFs")
      }

      const data = await response.json()
      setGifs(data.results || [])
    } catch (err) {
      setError("Failed to search GIFs")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchGifs(searchQuery)
  }

  const handleSelectGif = (gif: GifResult) => {
    const gifData: GifStickerData = {
      url: gif.images.fixed_height.url,
      width: parseInt(gif.images.fixed_height.width),
      height: parseInt(gif.images.fixed_height.height),
      title: gif.title,
    }
    onSelect(gifData)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <form onSubmit={handleSearch} className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search GIFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>

      {/* GIF Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-destructive p-4">
            {error}
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground p-4">
            No GIFs found
          </div>
        )}

        {!loading && !error && gifs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => handleSelectGif(gif)}
                className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t text-xs text-center text-muted-foreground">
        Powered by Tenor
      </div>
    </div>
  )
}
