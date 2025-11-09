"use client"

import { useEffect, useMemo, useState } from "react"
import { getUsers, getUsers as getAllUsers } from "@/lib/storage"
import { getUsersWithActiveStories, getActiveStoriesByUserId } from "@/lib/storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { StoryViewer } from "@/components/stories/StoryViewer"

export function StoriesBar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [startUserId, setStartUserId] = useState<string | null>(null)
  const [tick, setTick] = useState(0) // trigger refresh

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const userIds = useMemo(() => getUsersWithActiveStories(), [tick])
  if (userIds.length === 0) return null

  const users = getAllUsers().filter((u) => userIds.includes(u.id))

  return (
    <div className="mb-4">
      <div className="flex items-center gap-4 overflow-x-auto py-2">
        {users.map((u) => (
          <button key={u.id} type="button" className="flex flex-col items-center gap-1" onClick={() => { setStartUserId(u.id); setOpen(true) }}>
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-pink-500 via-yellow-500 to-purple-500">
              <Avatar className="h-14 w-14 ring-2 ring-white">
                <AvatarImage src={u.avatar || '/placeholder.svg'} />
                <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] max-w-16 truncate">{u.fullName}</span>
          </button>
        ))}
      </div>
      <StoryViewer open={open} onOpenChange={setOpen} startUserId={startUserId} />
    </div>
  )
}

export default StoriesBar

