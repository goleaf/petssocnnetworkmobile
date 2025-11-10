"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PollStickerData } from "./stickers/types"

interface InteractivePollStickerProps {
  storyId: string
  userId: string
  pollData: PollStickerData
  onVote: (optionId: string) => void
  position: { x: number; y: number }
  scale?: number
}

export function InteractivePollSticker({
  storyId,
  userId,
  pollData,
  onVote,
  position,
  scale = 1,
}: InteractivePollStickerProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [results, setResults] = useState<Record<string, number>>({})

  useEffect(() => {
    // Fetch existing vote and results
    fetchVoteStatus()
    fetchResults()
  }, [storyId, userId])

  const fetchVoteStatus = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}/interactions?type=poll_vote`)
      const data = await response.json()
      
      const userVote = data.interactions?.find((i: any) => i.userId === userId)
      if (userVote) {
        setSelectedOption(userVote.data?.optionId)
        setHasVoted(true)
      }
    } catch (error) {
      console.error('Error fetching vote status:', error)
    }
  }

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}/interactions?type=poll_vote`)
      const data = await response.json()
      
      const voteCounts: Record<string, number> = {}
      data.interactions?.forEach((interaction: any) => {
        const optionId = interaction.data?.optionId
        if (optionId) {
          voteCounts[optionId] = (voteCounts[optionId] || 0) + 1
        }
      })
      
      setResults(voteCounts)
    } catch (error) {
      console.error('Error fetching results:', error)
    }
  }

  const handleVote = async (optionId: string) => {
    if (hasVoted) return

    setSelectedOption(optionId)
    setHasVoted(true)
    onVote(optionId)

    // Update local results optimistically
    setResults(prev => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + 1,
    }))
  }

  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)

  return (
    <div
      className="absolute bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[280px] max-w-[320px]"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <div className="text-sm font-semibold mb-3 text-gray-900">
        {pollData.question}
      </div>

      <div className="space-y-2">
        {pollData.options.map((option) => {
          const voteCount = results[option.id] || 0
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
          const isSelected = selectedOption === option.id

          return (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "w-full justify-start relative overflow-hidden h-auto py-3 px-4 text-left",
                isSelected && "border-primary border-2",
                hasVoted && "cursor-default"
              )}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Option text and percentage */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="text-sm font-medium">{option.text}</span>
                {hasVoted && (
                  <span className="text-xs font-semibold ml-2">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </Button>
          )
        })}
      </div>

      {hasVoted && totalVotes > 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </div>
      )}
    </div>
  )
}
