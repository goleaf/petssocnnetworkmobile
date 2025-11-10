"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  Star,
  X,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

export interface EventData {
  title: string
  startAt: string // ISO datetime
  durationMinutes?: number
  timezone?: string
  location?: {
    name?: string
    address?: string
    lat?: number
    lng?: number
  }
  rsvps?: {
    going: string[] // User IDs
    interested: string[] // User IDs
    cantGo: string[] // User IDs
  }
  userRsvp?: "going" | "interested" | "cant_go" | null
}

interface EventPostProps {
  postId: string
  event: EventData
  onRsvp?: (postId: string, status: "going" | "interested" | "cant_go") => Promise<void>
  disabled?: boolean
  className?: string
}

export function EventPost({
  postId,
  event,
  onRsvp,
  disabled = false,
  className,
}: EventPostProps) {
  const [userRsvp, setUserRsvp] = useState<"going" | "interested" | "cant_go" | null>(
    event.userRsvp || null
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRsvp = async (status: "going" | "interested" | "cant_go") => {
    if (!onRsvp || disabled) return

    // Toggle off if clicking the same status
    const newStatus = userRsvp === status ? null : status

    setIsUpdating(true)
    try {
      if (newStatus) {
        await onRsvp(postId, newStatus)
        setUserRsvp(newStatus)
      } else {
        // Remove RSVP
        setUserRsvp(null)
      }
    } catch (error) {
      console.error("Failed to update RSVP:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const eventDate = parseISO(event.startAt)
  const formattedDate = format(eventDate, "EEEE, MMMM d, yyyy")
  const formattedTime = format(eventDate, "h:mm a")

  const goingCount = event.rsvps?.going.length || 0
  const interestedCount = event.rsvps?.interested.length || 0
  const totalAttending = goingCount + interestedCount

  const isPastEvent = eventDate < new Date()

  return (
    <div className={cn("border rounded-lg p-4 space-y-4 bg-muted/30", className)}>
      {/* Event Title */}
      <div className="flex items-start gap-2">
        <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          {isPastEvent && (
            <Badge variant="secondary" className="mt-1">
              Past Event
            </Badge>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-2 text-sm">
        {/* Date and Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {formattedTime}
            {event.durationMinutes && ` (${event.durationMinutes} min)`}
            {event.timezone && ` ${event.timezone}`}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              {event.location.name && (
                <div className="font-medium text-foreground">
                  {event.location.name}
                </div>
              )}
              {event.location.address && <div>{event.location.address}</div>}
            </div>
          </div>
        )}

        {/* Attendance Count */}
        {totalAttending > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {goingCount} going
              {interestedCount > 0 && ` • ${interestedCount} interested`}
            </span>
          </div>
        )}
      </div>

      {/* RSVP Buttons */}
      {!isPastEvent && (
        <div className="flex gap-2 pt-2">
          <Button
            variant={userRsvp === "going" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("going")}
            disabled={isUpdating || disabled}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            Going
          </Button>
          <Button
            variant={userRsvp === "interested" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("interested")}
            disabled={isUpdating || disabled}
            className="flex-1"
          >
            <Star className="h-4 w-4 mr-1" />
            Interested
          </Button>
          <Button
            variant={userRsvp === "cant_go" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("cant_go")}
            disabled={isUpdating || disabled}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Can't Go
          </Button>
        </div>
      )}
    </div>
  )
}
