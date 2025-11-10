"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2 } from "lucide-react"
import type { MentionStickerData } from "./types"

interface MentionStickerProps {
  onSelect: (data: MentionStickerData) => void
}

interface UserResult {
  id: string
  username: string
  fullName: string
  avatar?: string
}

export function MentionSticker({ onSelect }: MentionStickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&limit=20`
      )
      
      if (!response.ok) {
        throw new Error("Failed to search users")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError("Failed to search users")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleSelectUser = (user: UserResult) => {
    const mentionData: MentionStickerData = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    }
    onSelect(mentionData)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
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

        {!loading && !error && users.length === 0 && searchQuery && (
          <div className="text-center text-sm text-muted-foreground p-4">
            No users found
          </div>
        )}

        {!loading && !error && users.length === 0 && !searchQuery && (
          <div className="text-center text-sm text-muted-foreground p-4">
            Search for a user to mention
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="divide-y">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-3 hover:bg-accent transition-colors text-left flex items-center gap-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
