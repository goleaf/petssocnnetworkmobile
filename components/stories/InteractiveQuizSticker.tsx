"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

interface QuizStickerData {
  question: string
  options: QuizOption[]
}

interface InteractiveQuizStickerProps {
  storyId: string
  userId: string
  quizData: QuizStickerData
  onAnswer: (optionId: string, isCorrect: boolean) => void
  position: { x: number; y: number }
  scale?: number
}

export function InteractiveQuizSticker({
  storyId,
  userId,
  quizData,
  onAnswer,
  position,
  scale = 1,
}: InteractiveQuizStickerProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleAnswer = (optionId: string) => {
    if (hasAnswered) return

    const option = quizData.options.find(o => o.id === optionId)
    if (!option) return

    setSelectedOption(optionId)
    setHasAnswered(true)
    setShowFeedback(true)
    onAnswer(optionId, option.isCorrect)
  }

  const selectedOptionData = quizData.options.find(o => o.id === selectedOption)
  const isCorrect = selectedOptionData?.isCorrect || false

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
        {quizData.question}
      </div>

      <div className="space-y-2">
        {quizData.options.map((option) => {
          const isSelected = selectedOption === option.id
          const showCorrect = hasAnswered && option.isCorrect
          const showIncorrect = hasAnswered && isSelected && !option.isCorrect

          return (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "w-full justify-start relative h-auto py-3 px-4 text-left",
                isSelected && !hasAnswered && "border-primary border-2",
                showCorrect && "border-green-500 bg-green-50 border-2",
                showIncorrect && "border-red-500 bg-red-50 border-2",
                hasAnswered && "cursor-default"
              )}
              onClick={() => handleAnswer(option.id)}
              disabled={hasAnswered}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">{option.text}</span>
                {showCorrect && (
                  <Check className="h-5 w-5 text-green-600 ml-2" />
                )}
                {showIncorrect && (
                  <X className="h-5 w-5 text-red-600 ml-2" />
                )}
              </div>
            </Button>
          )
        })}
      </div>

      {showFeedback && (
        <div className={cn(
          "mt-3 p-3 rounded-lg text-center text-sm font-semibold",
          isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {isCorrect ? "Correct! 🎉" : "Not quite! Try again next time"}
        </div>
      )}
    </div>
  )
}
