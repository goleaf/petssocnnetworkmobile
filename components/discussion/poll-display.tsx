"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Vote } from "lucide-react"
import type { DiscussionPoll } from "@/lib/types/discussion"
import { voteOnPoll, getDiscussionPollById } from "@/lib/storage-discussion"
import { useAuth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"

interface PollDisplayProps {
  poll: DiscussionPoll
}

export function PollDisplay({ poll }: PollDisplayProps) {
  const { user } = useAuth()
  const [currentPoll, setCurrentPoll] = useState(poll)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const hasVoted = user && currentPoll.votes.some((v) => v.userId === user.id)
  const userVote = user ? currentPoll.votes.find((v) => v.userId === user.id) : null

  const handleVote = () => {
    if (!user || !selectedOptions.length) return

    const updatedPoll = voteOnPoll(currentPoll.id, user.id, selectedOptions)
    if (updatedPoll) {
      setCurrentPoll(updatedPoll)
    }
  }

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted) return

    if (currentPoll.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const getPercentage = (voteCount: number) => {
    if (currentPoll.totalVotes === 0) return 0
    return Math.round((voteCount / currentPoll.totalVotes) * 100)
  }

  const isExpired = currentPoll.expiresAt
    ? new Date(currentPoll.expiresAt) < new Date()
    : false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              {currentPoll.title}
            </CardTitle>
            {currentPoll.description && (
              <CardDescription className="mt-2">{currentPoll.description}</CardDescription>
            )}
          </div>
          {currentPoll.isClosed || isExpired ? (
            <span className="text-sm text-muted-foreground">Closed</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(currentPoll.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPoll.options.map((option) => {
          const percentage = getPercentage(option.voteCount)
          const isSelected = selectedOptions.includes(option.id)
          const isUserVote = userVote?.optionIds.includes(option.id)

          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOptionToggle(option.id)}
                  disabled={hasVoted || currentPoll.isClosed || isExpired}
                  className={`flex-1 text-left p-3 rounded-md border transition-colors ${
                    isSelected || isUserVote
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  } ${hasVoted || currentPoll.isClosed || isExpired ? "cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.text}</span>
                    {(isSelected || isUserVote) && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
                {hasVoted && (
                  <div className="ml-4 text-sm font-medium w-16 text-right">
                    {percentage}%
                  </div>
                )}
              </div>
              {hasVoted && (
                <Progress value={percentage} className="h-2" />
              )}
              {hasVoted && (
                <div className="text-xs text-muted-foreground">
                  {option.voteCount} {option.voteCount === 1 ? "vote" : "votes"}
                </div>
              )}
            </div>
          )
        })}

        {!hasVoted && !currentPoll.isClosed && !isExpired && user && (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
            className="w-full"
          >
            Vote
          </Button>
        )}

        {hasVoted && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            Total votes: {currentPoll.totalVotes}
          </div>
        )}

        {!user && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Sign in to vote
          </div>
        )}
      </CardContent>
    </Card>
  )
}

