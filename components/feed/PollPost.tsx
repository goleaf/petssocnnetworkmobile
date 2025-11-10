"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface PollData {
  question: string
  options: PollOption[]
  totalVotes: number
  expiresAt?: string
  allowMultiple?: boolean
  userVote?: string[] // Option IDs the current user voted for
}

interface PollPostProps {
  postId: string
  poll: PollData
  onVote?: (postId: string, optionIds: string[]) => Promise<void>
  disabled?: boolean
}

export function PollPost({ postId, poll, onVote, disabled = false }: PollPostProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.userVote || [])
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(!!poll.userVote && poll.userVote.length > 0)

  const handleOptionClick = (optionId: string) => {
    if (hasVoted || disabled) return

    if (poll.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !onVote) return

    setIsVoting(true)
    try {
      await onVote(postId, selectedOptions)
      setHasVoted(true)
    } catch (error) {
      console.error("Failed to vote:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      {/* Poll Question */}
      <div className="font-medium text-sm">{poll.question}</div>

      {/* Poll Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes)
          const isSelected = selectedOptions.includes(option.id)
          const isUserVote = poll.userVote?.includes(option.id)

          return (
            <div key={option.id} className="relative">
              {hasVoted || isExpired ? (
                // Show results
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(isUserVote && "font-semibold")}>
                        {option.text}
                      </span>
                      {isUserVote && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ) : (
                // Show voting buttons
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleOptionClick(option.id)}
                  disabled={disabled}
                >
                  {option.text}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Vote Button and Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <div>
          {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
          {isExpired && " • Poll ended"}
          {!isExpired && poll.expiresAt && " • Ends soon"}
        </div>
        {!hasVoted && !isExpired && selectedOptions.length > 0 && (
          <Button
            size="sm"
            onClick={handleVote}
            disabled={isVoting || disabled}
          >
            {isVoting ? "Voting..." : "Vote"}
          </Button>
        )}
      </div>
    </div>
  )
}
