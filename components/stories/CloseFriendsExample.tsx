"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StoryVisibilitySelector } from "./StoryVisibilitySelector"
import { CloseFriendsManager } from "./CloseFriendsManager"
import { AddToCloseFriendsButton } from "./AddToCloseFriendsButton"
import { Heart, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * Example component demonstrating Close Friends features
 * 
 * Features:
 * - Story visibility selector (Everyone, Close Friends, Custom)
 * - Close Friends list management
 * - Add/Remove users from Close Friends
 * - Green ring indicator for Close Friends stories
 * 
 * Requirements: 9.1, 9.2
 */
export function CloseFriendsExample() {
  const [visibility, setVisibility] = useState<{ visibility: "everyone" | "close_friends" | "custom", visibilityUserIds?: string[] }>({
    visibility: "everyone",
    visibilityUserIds: [],
  })
  const [closeFriendIds, setCloseFriendIds] = useState<string[]>(['user-2', 'user-3'])
  const [showManager, setShowManager] = useState(false)

  // Mock users for demonstration
  const mockUsers = [
    { id: 'user-1', name: 'Alice Johnson', username: 'alice', avatar: '/placeholder-user.jpg', isCloseFriend: false },
    { id: 'user-2', name: 'Bob Smith', username: 'bob', avatar: '/placeholder-user.jpg', isCloseFriend: true },
    { id: 'user-3', name: 'Carol Davis', username: 'carol', avatar: '/placeholder-user.jpg', isCloseFriend: true },
    { id: 'user-4', name: 'David Wilson', username: 'david', avatar: '/placeholder-user.jpg', isCloseFriend: false },
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-600 fill-current" />
            Close Friends Features
          </CardTitle>
          <CardDescription>
            Manage your Close Friends list and control story visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Story Visibility Selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Story Visibility</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Choose who can see your story
            </p>
            <StoryVisibilitySelector
              value={visibility}
              onChange={setVisibility}
              closeFriendIds={closeFriendIds}
            />
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              <strong>Selected:</strong> {visibility.visibility === 'everyone' ? 'Everyone' : visibility.visibility === 'close_friends' ? `Close Friends (${closeFriendIds.length} people)` : `Custom (${visibility.visibilityUserIds?.length || 0} people)`}
            </div>
          </div>

          {/* Close Friends Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Close Friends List</h3>
                <p className="text-sm text-muted-foreground">
                  {closeFriendIds.length} {closeFriendIds.length === 1 ? 'person' : 'people'} in your Close Friends
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManager(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>

          {/* User List with Add to Close Friends */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Add Users to Close Friends</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Click the button to add or remove users from your Close Friends list
            </p>
            <div className="space-y-2">
              {mockUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                  </div>
                  <AddToCloseFriendsButton
                    userId={user.id}
                    isCloseFriend={closeFriendIds.includes(user.id)}
                    onToggle={(isCloseFriend) => {
                      if (isCloseFriend) {
                        setCloseFriendIds(prev => [...prev, user.id])
                      } else {
                        setCloseFriendIds(prev => prev.filter(id => id !== user.id))
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Story Ring Indicators */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Story Ring Indicators</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Close Friends stories show a green ring indicator
            </p>
            <div className="flex gap-4">
              {/* Regular story ring */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 mb-2">
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    <Avatar className="w-full h-full">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Regular Story</p>
              </div>

              {/* Close friends story ring */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-green-400 via-green-500 to-green-600 mb-2">
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    <Avatar className="w-full h-full">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
                  <Heart className="h-3 w-3 fill-current" />
                  Close Friend
                </div>
              </div>

              {/* Viewed story ring */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gray-400 mb-2">
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    <Avatar className="w-full h-full">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>V</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Viewed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Close Friends Manager Dialog */}
      <CloseFriendsManager
        open={showManager}
        onOpenChange={setShowManager}
        closeFriendIds={closeFriendIds}
        onUpdate={setCloseFriendIds}
      />
    </div>
  )
}

export default CloseFriendsExample
