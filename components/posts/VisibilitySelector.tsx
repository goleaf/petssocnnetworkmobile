"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Users, Lock, ShieldCheck, UserCog2, CalendarClock } from "lucide-react"
import type { PrivacyLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUsers } from "@/lib/storage"

export type VisibilityMode = "public" | "followers" | "friends" | "private" | "custom"

export interface VisibilityValue {
  mode: VisibilityMode
  privacy: PrivacyLevel
  allowedUserIds?: string[]
  scheduledAt?: string | null
}

export interface VisibilitySelectorProps {
  value: VisibilityValue
  onChange: (value: VisibilityValue) => void
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const [openCustom, setOpenCustom] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)
  const [search, setSearch] = useState("")
  const [picked, setPicked] = useState<string[]>(value.allowedUserIds || [])
  const [schedule, setSchedule] = useState<string>(value.scheduledAt || "")
  const users = useMemo(() => getUsers(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = users
    if (!q) return list
    return list.filter((u) => `${u.fullName} ${u.username}`.toLowerCase().includes(q))
  }, [users, search])

  const current = useMemo(() => {
    switch (value.mode) {
      case "public":
        return { icon: Globe, label: "Public", color: "text-green-600" }
      case "followers":
        return { icon: Users, label: "Followers Only", color: "text-blue-600" }
      case "friends":
        return { icon: ShieldCheck, label: "Friends (mutual)", color: "text-violet-600" }
      case "private":
        return { icon: Lock, label: "Private", color: "text-red-600" }
      case "custom":
        return { icon: UserCog2, label: "Custom", color: "text-amber-600" }
    }
  }, [value.mode])

  const setMode = (mode: VisibilityMode) => {
    let privacy: PrivacyLevel = "public"
    if (mode === "followers") privacy = "followers-only"
    if (mode === "private") privacy = "private"
    if (mode === "friends") privacy = "followers-only" // narrow subset but compatible with existing privacy checks
    if (mode === "custom") privacy = "private" // enforce private, allow custom list in UI

    onChange({ mode, privacy, allowedUserIds: value.allowedUserIds, scheduledAt: value.scheduledAt })
    if (mode === "custom") setOpenCustom(true)
  }

  const applyCustom = () => {
    onChange({ ...value, allowedUserIds: picked })
    setOpenCustom(false)
  }

  const openScheduleDialog = () => {
    setSchedule(value.scheduledAt || new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16))
    setOpenSchedule(true)
  }
  const applySchedule = () => {
    onChange({ ...value, scheduledAt: schedule })
    setOpenSchedule(false)
  }

  const CurrentIcon = current.icon

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="justify-between">
            <span className={cn("flex items-center gap-2", current.color)}>
              <CurrentIcon className="h-4 w-4" /> {current.label}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Visibility</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setMode("public")}>
            <Globe className="h-4 w-4 mr-2 text-green-600" /> Public (anyone)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("followers")}>
            <Users className="h-4 w-4 mr-2 text-blue-600" /> Followers Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("friends")}>
            <ShieldCheck className="h-4 w-4 mr-2 text-violet-600" /> Friends (mutual)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("private")}>
            <Lock className="h-4 w-4 mr-2 text-red-600" /> Private (only me)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("custom")}>
            <UserCog2 className="h-4 w-4 mr-2 text-amber-600" /> Custom (specific people)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openScheduleDialog}>
            <CalendarClock className="h-4 w-4 mr-2" /> Schedule for later
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom audience dialog */}
      <Dialog open={openCustom} onOpenChange={setOpenCustom}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose people who can view</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-72 overflow-auto divide-y rounded border">
              {filtered.map((u) => (
                <label key={u.id} className="flex items-center gap-3 p-2 cursor-pointer">
                  <Checkbox checked={picked.includes(u.id)} onCheckedChange={() => setPicked((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))} />
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.avatar || '/placeholder.svg'} alt={u.fullName} />
                    <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCustom(false)}>Cancel</Button>
            <Button onClick={applyCustom}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Publish at</label>
            <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
            <p className="text-xs text-muted-foreground">Post will be saved as scheduled and auto-published at the selected time.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSchedule(false)}>Cancel</Button>
            <Button onClick={applySchedule}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VisibilitySelector

