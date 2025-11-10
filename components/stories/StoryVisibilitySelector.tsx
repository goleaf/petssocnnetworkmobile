"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Heart, UserCog2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUsers } from "@/lib/storage"

export type StoryVisibility = "everyone" | "close_friends" | "custom"

export interface StoryVisibilityValue {
  visibility: StoryVisibility
  visibilityUserIds?: string[]
}

export interface StoryVisibilitySelectorProps {
  value: StoryVisibilityValue
  onChange: (value: StoryVisibilityValue) => void
  closeFriendIds?: string[]
}

export function StoryVisibilitySelector({ value, onChange, closeFriendIds = [] }: StoryVisibilitySelectorProps) {
  const [openCustom, setOpenCustom] = useState(false)
  const [search, setSearch] = useState("")
  const [picked, setPicked] = useState<string[]>(value.visibilityUserIds || [])
  const users = useMemo(() => getUsers(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = users
    if (!q) return list
    return list.filter((u) => `${u.fullName} ${u.username}`.toLowerCase().includes(q))
  }, [users, search])

  const current = useMemo(() => {
    switch (value.visibility) {
      case "everyone":
        return { icon: Globe, label: "Everyone", color: "text-blue-600" }
      case "close_friends":
        return { icon: Heart, label: "Close Friends", color: "text-green-600" }
      case "custom":
        return { icon: UserCog2, label: "Custom", color: "text-amber-600" }
    }
  }, [value.visibility])

  const setVisibility = (visibility: StoryVisibility) => {
    onChange({ visibility, visibilityUserIds: value.visibilityUserIds })
    if (visibility === "custom") {
      setOpenCustom(true)
    }
  }

  const applyCustom = () => {
    onChange({ ...value, visibilityUserIds: picked })
    setOpenCustom(false)
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
          <DropdownMenuLabel>Story Visibility</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setVisibility("everyone")}>
            <Globe className="h-4 w-4 mr-2 text-blue-600" /> Everyone
            <span className="ml-auto text-xs text-muted-foreground">All followers</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setVisibility("close_friends")}>
            <Heart className="h-4 w-4 mr-2 text-green-600 fill-current" /> Close Friends
            <span className="ml-auto text-xs text-muted-foreground">{closeFriendIds.length} people</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setVisibility("custom")}>
            <UserCog2 className="h-4 w-4 mr-2 text-amber-600" /> Custom
            <span className="ml-auto text-xs text-muted-foreground">Specific people</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom audience dialog */}
      <Dialog open={openCustom} onOpenChange={setOpenCustom}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose who can view this story</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-72 overflow-auto divide-y rounded border">
              {filtered.map((u) => (
                <label key={u.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50">
                  <Checkbox 
                    checked={picked.includes(u.id)} 
                    onCheckedChange={() => setPicked((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))} 
                  />
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.avatar || '/placeholder.svg'} alt={u.fullName} />
                    <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {picked.length} {picked.length === 1 ? 'person' : 'people'} selected
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCustom(false)}>Cancel</Button>
            <Button onClick={applyCustom}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StoryVisibilitySelector
