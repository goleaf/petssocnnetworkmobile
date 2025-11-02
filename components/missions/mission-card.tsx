"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Target, Sparkles, Award } from "lucide-react"
import type { Mission } from "@/lib/types"
import { getStorage, setStorage } from "@/lib/storage"

interface MissionCardProps {
  mission: Mission
  onComplete?: (missionId: string) => void
  className?: string
}

export function MissionCard({ mission, onComplete, className }: MissionCardProps) {
  const storageKey = `mission_${mission.id}`
  const [progress, setProgress] = useState(() => {
    const saved = getStorage<number>(storageKey)
    return saved || mission.currentProgress || 0
  })
  
  const isCompleted = progress >= mission.target
  
  const handleProgress = () => {
    if (isCompleted) return
    
    const newProgress = Math.min(progress + 1, mission.target)
    setProgress(newProgress)
    setStorage(storageKey, newProgress)
    
    if (newProgress >= mission.target && onComplete) {
      onComplete(mission.id)
    }
  }
  
  const progressPercent = (progress / mission.target) * 100
  
  return (
    <Card className={`${isCompleted ? "border-primary bg-primary/5" : ""} ${className || ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Target className="h-5 w-5 text-muted-foreground" />
            )}
            {mission.title}
          </CardTitle>
          {isCompleted && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              Complete
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {progress} / {mission.target}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        
        {mission.reward && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Reward: <span className="font-semibold">{mission.reward}</span>
            </span>
          </div>
        )}
        
        {mission.actionUrl && !isCompleted && (
          <Button asChild variant="default" size="sm" className="w-full" onClick={handleProgress}>
            <Link href={mission.actionUrl}>
              <Sparkles className="h-4 w-4 mr-2" />
              {mission.actionLabel || "Start Mission"}
            </Link>
          </Button>
        )}
        
        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Mission completed!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

