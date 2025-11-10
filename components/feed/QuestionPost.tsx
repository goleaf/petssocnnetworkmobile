"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuestionData {
  category?: "Training" | "Health" | "Behavior" | "Products" | "General"
  bestAnswerCommentId?: string
}

interface QuestionPostProps {
  postId: string
  question: QuestionData
  commentsCount: number
  onViewAnswers?: (postId: string) => void
  className?: string
}

const categoryColors: Record<string, string> = {
  Training: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Behavior: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Products: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  General: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export function QuestionPost({
  postId,
  question,
  commentsCount,
  onViewAnswers,
  className,
}: QuestionPostProps) {
  const hasBestAnswer = !!question.bestAnswerCommentId

  return (
    <div className={cn("border rounded-lg p-4 space-y-3 bg-muted/30", className)}>
      {/* Question Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Question</span>
        {question.category && (
          <Badge
            variant="secondary"
            className={cn("text-xs", categoryColors[question.category])}
          >
            {question.category}
          </Badge>
        )}
        {hasBestAnswer && (
          <Badge variant="default" className="text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Best Answer
          </Badge>
        )}
      </div>

      {/* Answer Stats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {commentsCount === 0 && "No answers yet"}
          {commentsCount === 1 && "1 answer"}
          {commentsCount > 1 && `${commentsCount} answers`}
        </div>
        {onViewAnswers && commentsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewAnswers(postId)}
          >
            View Answers
          </Button>
        )}
      </div>

      {/* Call to Action */}
      {commentsCount === 0 && (
        <div className="text-xs text-muted-foreground italic">
          Be the first to answer this question
        </div>
      )}
    </div>
  )
}
