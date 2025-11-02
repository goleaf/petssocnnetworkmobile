"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock, ExternalLink } from "lucide-react"
import type { GroupEvent } from "@/lib/types"
import { formatDate, formatDateTime } from "@/lib/utils/date"
import { EventExportButton } from "./EventExportButton"

interface EventCardProps {
  event: GroupEvent
  groupSlug: string
  showGroupLink?: boolean
}

export function EventCard({ event, groupSlug, showGroupLink = false }: EventCardProps) {
  const isPast = new Date(event.startDate) < new Date()
  const isUpcoming = !isPast && !event.isCancelled

  const getEventTypeIcon = () => {
    switch (event.eventType) {
      case "adoption-drive":
        return <Heart className="h-4 w-4" />
      case "meetup":
        return <UsersRound className="h-4 w-4" />
      case "vaccination-clinic":
        return <Syringe className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getEventTypeLabel = () => {
    switch (event.eventType) {
      case "adoption-drive":
        return "Adoption Drive"
      case "meetup":
        return "Meetup"
      case "vaccination-clinic":
        return "Vaccination Clinic"
      default:
        return "Event"
    }
  }

  return (
    <Link href={`/groups/${groupSlug}/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Cover Image */}
        {event.coverImage && (
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {event.eventType && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getEventTypeIcon()}
                    {getEventTypeLabel()}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl line-clamp-2">{event.title}</CardTitle>
            </div>
            <div className="flex flex-col gap-1">
              {event.isCancelled && (
                <Badge variant="destructive">Cancelled</Badge>
              )}
              {isPast && !event.isCancelled && (
                <Badge variant="outline">Past</Badge>
              )}
              {isUpcoming && (
                <Badge variant="default">Upcoming</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDateTime(event.startDate)}</span>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Ends: {formatDateTime(event.endDate)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
                {event.locationUrl && (
                  <a
                    href={event.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-1 hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>
                {event.attendeeCount} {event.attendeeCount === 1 ? "person" : "people"}{" "}
                {event.rsvpRequired ? "RSVP'd" : "attending"}
              </span>
              {event.maxAttendees && (
                <span>of {event.maxAttendees} max</span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <EventExportButton
              event={event}
              groupSlug={groupSlug}
              variant="outline"
              size="sm"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

