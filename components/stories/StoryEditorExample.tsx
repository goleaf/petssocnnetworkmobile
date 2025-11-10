"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StoryEditor } from "@/components/stories/StoryEditor"
import type { StoryOverlay } from "@/lib/types"

/**
 * Example component demonstrating how to use the StoryEditor
 * This is for documentation purposes and can be used as a reference
 */
export function StoryEditorExample() {
  const [isEditing, setIsEditing] = useState(false)
  const [savedStory, setSavedStory] = useState<{
    overlays: StoryOverlay[]
    filter?: string
    filterIntensity?: number
  } | null>(null)

  const handleSave = (
    overlays: StoryOverlay[],
    filter?: string,
    filterIntensity?: number
  ) => {
    setSavedStory({ overlays, filter, filterIntensity })
    setIsEditing(false)
    console.log("Story saved:", { overlays, filter, filterIntensity })
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Story Editor Example</h2>

      {!isEditing ? (
        <div className="space-y-4">
          <Button onClick={() => setIsEditing(true)}>
            Create Story
          </Button>

          {savedStory && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Saved Story Data:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(savedStory, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <StoryEditor
          mediaUrl="/placeholder.jpg"
          mediaType="image"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
