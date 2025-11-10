"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StoryViewer } from "./StoryViewer"
import { Play } from "lucide-react"

/**
 * Example component demonstrating the StoryViewer
 * 
 * Features demonstrated:
 * - Fullscreen story display with 9:16 aspect ratio
 * - Progress bars at top (one per story segment)
 * - Auto-advance after 5 seconds (photos) or full duration (videos)
 * - Tap left/right for navigation
 * - Swipe up to exit
 * - Pause on hold gesture
 * - Story ring indicators (colored for new, grey for viewed)
 * - "Close Friends" badge for close friends stories
 */
export function StoryViewerExample() {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [startUserId, setStartUserId] = useState<string | null>(null)

  const handleOpenStory = (userId: string) => {
    setStartUserId(userId)
    setViewerOpen(true)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Story Viewer Demo</h2>
        <p className="text-muted-foreground mb-6">
          Click on a user to view their stories. The viewer includes all required features:
        </p>
        
        <div className="space-y-2 mb-6">
          <h3 className="font-semibold">Features:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Fullscreen display with 9:16 aspect ratio</li>
            <li>Progress bars at top showing current story position</li>
            <li>Auto-advance: 5 seconds for photos, full duration for videos</li>
            <li>Tap left side to go to previous story</li>
            <li>Tap right side to go to next story</li>
            <li>Swipe up to exit the viewer</li>
            <li>Hold (press and hold) to pause the current story</li>
            <li>Story ring indicators: colored gradient for new stories, grey for viewed</li>
            <li>Green "Close Friends" badge for close friends stories</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Mock user story rings */}
          <button
            onClick={() => handleOpenStory("user1")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="relative">
              {/* Story ring - gradient for new stories */}
              <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <img
                    src="/placeholder-user.jpg"
                    alt="User 1"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Play className="h-3 w-3 fill-current" />
              </div>
            </div>
            <span className="text-sm font-medium">User 1</span>
            <span className="text-xs text-muted-foreground">3 new stories</span>
          </button>

          <button
            onClick={() => handleOpenStory("user2")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="relative">
              {/* Story ring - grey for viewed stories */}
              <div className="w-20 h-20 rounded-full p-0.5 bg-gray-400">
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <img
                    src="/placeholder-user.jpg"
                    alt="User 2"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
            <span className="text-sm font-medium">User 2</span>
            <span className="text-xs text-muted-foreground">All viewed</span>
          </button>

          <button
            onClick={() => handleOpenStory("user3")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="relative">
              {/* Story ring with close friends indicator */}
              <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <img
                    src="/placeholder-user.jpg"
                    alt="User 3"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-1">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-medium">User 3</span>
            <span className="text-xs text-green-600 font-medium">Close Friend</span>
          </button>

          <button
            onClick={() => handleOpenStory("user4")}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <img
                    src="/placeholder-user.jpg"
                    alt="User 4"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
            <span className="text-sm font-medium">User 4</span>
            <span className="text-xs text-muted-foreground">2 new stories</span>
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-3">Usage Instructions:</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Desktop:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Click left side of story to go back</li>
            <li>Click right side of story to go forward</li>
            <li>Click and hold middle area to pause</li>
            <li>Click X button to close</li>
          </ul>
          
          <p className="mt-4"><strong>Mobile:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Tap left side to go back</li>
            <li>Tap right side to go forward</li>
            <li>Press and hold middle area to pause</li>
            <li>Swipe up to exit</li>
          </ul>
        </div>
      </div>

      {/* Story Viewer */}
      <StoryViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        startUserId={startUserId}
      />
    </div>
  )
}
