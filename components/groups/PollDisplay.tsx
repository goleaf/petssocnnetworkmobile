"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart3, CheckCircle2, Clock, Users } from "lucide-react"
import type { GroupPoll, PollOption } from "@/lib/types"
import {
  getUserPollVote,
  addPollVote,
  removePollVote,
  getGroupPollById,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { formatDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

interface PollDisplayProps {
  poll: GroupPoll
  onVoteChange?: () => void
}

export function PollDisplay({ poll, onVoteChange }: PollDisplayProps) {
  const { user } = useAuth()
  const [pollData, setPollData] = useState(poll)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!user) return

    const vote = getUserPollVote(poll.id, user.id)
    if (vote) {
      setHasVoted(true)
      setSelectedOptions(vote.optionIds)
    }
  }, [poll.id, user])

  useEffect(() => {
    // Update poll data from storage
    const updatedPoll = getGroupPollById(poll.id)
    if (updatedPoll) {
      setPollData(updatedPoll)
    }
  }, [poll.id])

  const handleVote = async (optionId: string) => {
    if (!user || pollData.isClosed) return

    let newSelectedOptions: string[]

    if (pollData.allowMultiple) {
      // Toggle selection for multiple choice
      if (selectedOptions.includes(optionId)) {
        newSelectedOptions = selectedOptions.filter((id) => id !== optionId)
      } else {
        newSelectedOptions = [...selectedOptions, optionId]
      }
    } else {
      // Single choice - replace selection
      if (selectedOptions.includes(optionId) && selectedOptions.length === 1) {
        // Deselect if clicking the same option
        newSelectedOptions = []
      } else {
        newSelectedOptions = [optionId]
      }
    }

    if (newSelectedOptions.length === 0) {
      // Remove vote
      if (hasVoted) {
        removePollVote(poll.id, user.id)
        setHasVoted(false)
        setSelectedOptions([])
        if (onVoteChange) onVoteChange()
      }
      return
    }

    // Add or update vote
    const now = new Date().toISOString()
    addPollVote({
      id: `vote-${poll.id}-${user.id}`,
      userId: user.id,
      pollId: poll.id,
      optionIds: newSelectedOptions,
      votedAt: now,
    })

    setHasVoted(true)
    setSelectedOptions(newSelectedOptions)

    // Refresh poll data
    const updatedPoll = getGroupPollById(poll.id)
    if (updatedPoll) {
      setPollData(updatedPoll)
    }

    if (onVoteChange) onVoteChange()
  }

  const getOptionPercentage = (option: PollOption): number => {
    if (pollData.voteCount === 0) return 0
    return Math.round((option.voteCount / pollData.voteCount) * 100)
  }

  const isExpired =
    pollData.expiresAt &&
    new Date(pollData.expiresAt) < new Date()

  const totalVotes = pollData.voteCount

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl">{pollData.question}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pollData.isClosed && (
              <Badge variant="secondary">Closed</Badge>
            )}
            {isExpired && !pollData.isClosed && (
              <Badge variant="outline">Expired</Badge>
            )}
            {pollData.expiresAt && !isExpired && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Expires {formatDate(pollData.expiresAt)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          </div>
          {pollData.allowMultiple && (
            <Badge variant="outline" className="text-xs">
              Multiple choice
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pollData.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          const percentage = getOptionPercentage(option)
          const canVote = user && !pollData.isClosed && !isExpired

          return (
            <div key={option.id} className="space-y-2">
              <Button
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-auto p-4",
                  isSelected && "ring-2 ring-primary",
                  canVote && "cursor-pointer hover:bg-accent",
                  (!canVote || pollData.isClosed) && "cursor-not-allowed opacity-75"
                )}
                onClick={() => canVote && handleVote(option.id)}
                disabled={!canVote || pollData.isClosed}
              >
                <div className="flex items-center gap-3 w-full">
                  {pollData.allowMultiple ? (
                    <div
                      className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && (
                        <div className="h-3 w-3 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{option.text}</div>
                    {hasVoted && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={percentage} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                          {percentage}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({option.voteCount} {option.voteCount === 1 ? "vote" : "votes"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            </div>
          )
        })}

        {!user && (
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertTitle>Sign in to vote</AlertTitle>
            <AlertDescription>
              You must be logged in to participate in this poll.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

