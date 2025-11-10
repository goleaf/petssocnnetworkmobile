"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Laugh, Surprise, Frown, Flame, HandClap } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoryReactionsProps {
  storyId: string
  userId: string
  onReact: (reactionType: string) => void
  className?: string
}

const reactions = [
  { type: "heart", icon: Heart, label: "Heart", color: "text-red-500" },
  { type: "laughing", icon: Laugh, label: "Laughing", color: "text-yellow-500" },
  { type: "surprised", icon: Surprise, label: "Surprised", color: "text-blue-500" },
  { type: "crying", icon: Frown, label: "Crying", color: "text-blue-400" },
  { type: "fire", icon: Flame, label: "Fire", color: "text-orange-500" },
  { type: "clap", icon: HandClap, label: "Clap", color: "text-green-500" },
]

export function StoryReactions({ storyId, userId, onReact, className }: StoryReactionsProps) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)

  const handleReact = (reactionType: string) => {
    setSelectedReaction(reactionType)
    onReact(reactionType)
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-black/50 rounded-full", className)}>
      {reactions.map((reaction) => {
        const Icon = reaction.icon
        const isSelected = selectedReaction === reaction.type

        return (
          <Button
            key={reaction.type}
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full hover:bg-white/20 transition-all",
              isSelected && "bg-white/30 scale-110"
            )}
            onClick={() => handleReact(reaction.type)}
            aria-label={reaction.label}
          >
            <Icon className={cn("h-5 w-5", reaction.color)} />
          </Button>
        )
      })}
    </div>
  )
}
