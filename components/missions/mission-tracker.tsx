"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Sparkles } from "lucide-react"
import type { Mission } from "@/lib/types"
import { MissionCard } from "./mission-card"
import { getAvailableMissions } from "@/lib/utils/mission-system"

interface MissionTrackerProps {
  userId?: string
  className?: string
}

export function MissionTracker({ userId, className }: MissionTrackerProps) {
  const [missions, setMissions] = React.useState<Mission[]>([])
  const [completedCount, setCompletedCount] = React.useState(0)
  
  React.useEffect(() => {
    const availableMissions = getAvailableMissions(userId)
    setMissions(availableMissions)
    
    // Count completed missions
    const completed = availableMissions.filter(
      (m) => (m.currentProgress || 0) >= m.target
    ).length
    setCompletedCount(completed)
  }, [userId])
  
  const handleMissionComplete = (missionId: string) => {
    setCompletedCount((prev) => prev + 1)
    // You could trigger a celebration animation or notification here
  }
  
  const activeMissions = missions.filter((m) => (m.currentProgress || 0) < m.target)
  const completedMissions = missions.filter((m) => (m.currentProgress || 0) >= m.target)
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Missions
          </CardTitle>
          <Badge variant="secondary">
            {completedCount} / {missions.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Complete missions to earn rewards and help grow the community
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeMissions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Active Missions</h4>
            </div>
            {activeMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onComplete={handleMissionComplete}
              />
            ))}
          </div>
        )}
        
        {completedMissions.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm text-muted-foreground">Completed</h4>
            </div>
            {completedMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
        
        {missions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No missions available at this time.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

