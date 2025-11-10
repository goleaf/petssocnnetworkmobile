"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, X, UserPlus } from "lucide-react"
import { getUsers } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface CloseFriendsManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  closeFriendIds: string[]
  onUpdate: (friendIds: string[]) => void
}

export function CloseFriendsManager({ open, onOpenChange, closeFriendIds, onUpdate }: CloseFriendsManagerProps) {
  const [search, setSearch] = useState("")
  const [localFriendIds, setLocalFriendIds] = useState<string[]>(closeFriendIds)
  const users = useMemo(() => getUsers(), [])

  const closeFriends = useMemo(() => {
    return users.filter(u => localFriendIds.includes(u.id))
  }, [users, localFriendIds])

  const availableUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = users.filter(u => !localFriendIds.includes(u.id))
    if (!q) return list
    return list.filter((u) => `${u.fullName} ${u.username}`.toLowerCase().includes(q))
  }, [users, localFriendIds, search])

  const addFriend = (userId: string) => {
    setLocalFriendIds(prev => [...prev, userId])
  }

  const removeFriend = (userId: string) => {
    setLocalFriendIds(prev => prev.filter(id => id !== userId))
  }

  const handleSave = async () => {
    try {
      // TODO: Call API to update close friends list
      // await fetch('/api/close-friends', { method: 'PUT', body: JSON.stringify({ friendIds: localFriendIds }) })
      
      onUpdate(localFriendIds)
      toast.success(`Close Friends list updated (${localFriendIds.length} ${localFriendIds.length === 1 ? 'person' : 'people'})`)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update Close Friends list')
      console.error('Error updating close friends:', error)
    }
  }

  const handleCancel = () => {
    setLocalFriendIds(closeFriendIds)
    setSearch("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600 fill-current" />
            Close Friends
          </DialogTitle>
          <DialogDescription>
            Share stories with your closest friends. Only people on this list will see stories marked as "Close Friends".
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Current close friends */}
          {closeFriends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Close Friends ({closeFriends.length})
              </h3>
              <div className="max-h-48 overflow-auto divide-y rounded border">
                {closeFriends.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || '/placeholder.svg'} alt={user.fullName} />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriend(user.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add friends */}
          <div className="space-y-2 flex-1 flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground">
              Add Friends
            </h3>
            <Input 
              placeholder="Search users to add..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex-1 overflow-auto divide-y rounded border">
              {availableUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {search ? 'No users found' : 'All users are already in your Close Friends list'}
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || '/placeholder.svg'} alt={user.fullName} />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addFriend(user.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Heart className="h-4 w-4 mr-2 fill-current" />
            Save Close Friends
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CloseFriendsManager
