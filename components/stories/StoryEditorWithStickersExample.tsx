"use client"

import { useState } from "react"
import { StoryEditor } from "./StoryEditor"
import { Button } from "@/components/ui/button"
import type { StoryOverlay } from "@/lib/types"

/**
 * Example component demonstrating the StoryEditor with stickers
 * 
 * This shows how to use the StoryEditor component with the new sticker system.
 * Users can add text, drawings, filters, and now stickers to their stories.
 */
export function StoryEditorWithStickersExample() {
  const [isEditing, setIsEditing] = useState(false)
  const [mediaUrl] = useState("/placeholder.jpg") // Replace with actual media

  const handleSave = (
    overlays: StoryOverlay[],
    filter?: string,
    filterIntensity?: number
  ) => {
    console.log("Story saved with overlays:", overlays)
    console.log("Filter:", filter, "Intensity:", filterIntensity)
    
    // Here you would:
    // 1. Upload the media to cloud storage
    // 2. Save the overlays, filter, and intensity to the database
    // 3. Create the story record
    // 4. Broadcast to followers
    
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Button onClick={() => setIsEditing(true)} size="lg">
          Create Story with Stickers
        </Button>
      </div>
    )
  }

  return (
    <StoryEditor
      mediaUrl={mediaUrl}
      mediaType="image"
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}

/**
 * Sticker Types Available:
 * 
 * 1. Emoji - Select from 210+ categorized emojis
 * 2. GIF - Search and add animated GIFs from Tenor
 * 3. Location - Add place with map pin
 * 4. Mention - Tag users with @username
 * 5. Hashtag - Add hashtag text
 * 6. Poll - Create interactive poll (2-4 options)
 * 7. Question - Ask viewers a question
 * 8. Countdown - Add timer to specific date/time
 * 9. Music - Coming soon
 * 10. Quiz - Coming soon
 * 11. Weather - Coming soon
 * 
 * All stickers support:
 * - Drag to reposition
 * - Ctrl+Wheel to resize (or pinch on mobile)
 * - Shift+Wheel to rotate (or two-finger rotation on mobile)
 * - Click X to delete
 */
