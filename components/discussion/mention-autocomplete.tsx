"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { getUsers } from "@/lib/storage"

interface MentionAutocompleteProps {
  query: string
  onSelect: (username: string) => void
  onClose: () => void
}

export function MentionAutocomplete({
  query,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<Array<{ id: string; username: string; fullName: string }>>([])
  const [filteredUsers, setFilteredUsers] = useState<typeof users>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const allUsers = getUsers()
    const userList = allUsers
      .filter((u) => u.id !== currentUser?.id)
      .map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
      }))
    setUsers(userList)
  }, [currentUser])

  useEffect(() => {
    if (!query) {
      setFilteredUsers(users.slice(0, 5))
      return
    }

    const filtered = users.filter(
      (u) =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.fullName.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredUsers(filtered.slice(0, 5))
    setSelectedIndex(0)
  }, [query, users])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredUsers[selectedIndex]) {
        onSelect(filteredUsers[selectedIndex].username)
      }
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  if (filteredUsers.length === 0) {
    return null
  }

  return (
    <Card
      className="absolute z-50 w-full mt-1 shadow-lg max-h-[200px] overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="p-2 space-y-1">
        {filteredUsers.map((user, index) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.username)}
            className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors ${
              index === selectedIndex ? "bg-muted" : ""
            }`}
          >
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">@{user.username}</div>
              <div className="text-xs text-muted-foreground">{user.fullName}</div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}

