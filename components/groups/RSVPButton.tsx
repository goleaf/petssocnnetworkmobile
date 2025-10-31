"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, Clock, XCircle, Calendar } from "lucide-react"
import type { EventRSVPStatus } from "@/lib/types"
import {
  getUserEventRSVP,
  addEventRSVP,
  removeEventRSVP,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface RSVPButtonProps {
  eventId: string
  rsvpRequired: boolean
  maxAttendees?: number
  currentAttendeeCount: number
  onRSVPChange?: () => void
}

export function RSVPButton({
  eventId,
  rsvpRequired,
  maxAttendees,
  currentAttendeeCount,
  onRSVPChange,
}: RSVPButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const [rsvpStatus, setRsvpStatus] = useState<EventRSVPStatus | null>(null)

  useEffect(() => {
    if (!user || !isAuthenticated) return

    const rsvp = getUserEventRSVP(eventId, user.id)
    setRsvpStatus(rsvp?.status || null)
  }, [eventId, user, isAuthenticated])

  const handleRSVP = (status: EventRSVPStatus) => {
    if (!user || !isAuthenticated) return

    const existingRSVP = getUserEventRSVP(eventId, user.id)
    
    if (existingRSVP && existingRSVP.status === status) {
      // Remove RSVP if clicking the same status
      removeEventRSVP(eventId, user.id)
      setRsvpStatus(null)
    } else {
      // Add or update RSVP
      addEventRSVP({
        id: `rsvp-${eventId}-${user.id}`,
        userId: user.id,
        eventId,
        status,
        respondedAt: new Date().toISOString(),
      })
      setRsvpStatus(status)
    }

    if (onRSVPChange) {
      onRSVPChange()
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" disabled>
        <Calendar className="h-4 w-4 mr-2" />
        Sign in to RSVP
      </Button>
    )
  }

  if (!rsvpRequired) {
    return null
  }

  const isFull = maxAttendees && currentAttendeeCount >= maxAttendees

  const getStatusIcon = (status: EventRSVPStatus) => {
    switch (status) {
      case "going":
        return <CheckCircle2 className="h-4 w-4" />
      case "maybe":
        return <Clock className="h-4 w-4" />
      case "not-going":
        return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: EventRSVPStatus) => {
    switch (status) {
      case "going":
        return "bg-primary text-primary-foreground"
      case "maybe":
        return "bg-yellow-500 text-white"
      case "not-going":
        return "bg-muted text-muted-foreground"
    }
  }

  if (rsvpStatus) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            className={cn("gap-2", getStatusColor(rsvpStatus))}
          >
            {getStatusIcon(rsvpStatus)}
            <span className="capitalize">{rsvpStatus.replace("-", " ")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleRSVP("going")}
            disabled={rsvpStatus === "going"}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Going
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleRSVP("maybe")}
            disabled={rsvpStatus === "maybe"}
          >
            <Clock className="h-4 w-4 mr-2" />
            Maybe
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleRSVP("not-going")}
            disabled={rsvpStatus === "not-going"}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Not Going
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRSVP(rsvpStatus)}>
            Remove RSVP
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" disabled={isFull}>
          <Calendar className="h-4 w-4 mr-2" />
          {isFull ? "Event Full" : "RSVP"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleRSVP("going")} disabled={isFull}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Going
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRSVP("maybe")}>
          <Clock className="h-4 w-4 mr-2" />
          Maybe
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRSVP("not-going")}>
          <XCircle className="h-4 w-4 mr-2" />
          Not Going
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

