"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { EventExportButton } from "@/components/groups/EventExportButton"
import { RSVPButton } from "@/components/groups/RSVPButton"
import {
  getGroupBySlug,
  getGroupEventById,
  canUserViewGroup,
  getEventRSVPsByEventId,
  deleteGroupEvent,
  canUserModerate,
} from "@/lib/storage"
import type { Group, GroupEvent, EventRSVP } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Trash2, Edit2, Calendar, MapPin, Users, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { formatDateTime } from "@/lib/utils/date"

export default function GroupEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>
}) {
  const { slug, eventId } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [event, setEvent] = useState<GroupEvent | null>(null)
  const [rsvps, setRsvps] = useState<EventRSVP[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundGroup = getGroupBySlug(slug)
    if (!foundGroup) {
      setIsLoading(false)
      router.push("/groups")
      return
    }

    // Check visibility
    if (isAuthenticated && user) {
      if (!canUserViewGroup(foundGroup.id, user.id)) {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    } else {
      if (foundGroup.type === "secret") {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    }

    setGroup(foundGroup)
    const foundEvent = getGroupEventById(eventId)
    if (!foundEvent || foundEvent.groupId !== foundGroup.id) {
      setIsLoading(false)
      router.push(`/groups/${foundGroup.slug}`)
      return
    }

    setEvent(foundEvent)
    const eventRSVPs = getEventRSVPsByEventId(eventId)
    setRsvps(eventRSVPs)

    setIsLoading(false)
  }, [slug, eventId, user, isAuthenticated, router])

  const handleDelete = () => {
    if (!event || !group || !user) return

    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteGroupEvent(event.id)
      router.push(`/groups/${group.slug}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!group || !event) {
    return null
  }

  const canModerate = user && canUserModerate(group.id, user.id)
  const isPast = new Date(event.startDate) < new Date()
  const isUpcoming = !isPast && !event.isCancelled

  const goingRSVPs = rsvps.filter((r) => r.status === "going")
  const maybeRSVPs = rsvps.filter((r) => r.status === "maybe")
  const notGoingRSVPs = rsvps.filter((r) => r.status === "not-going")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}`} />
        </div>

        {/* Cover Image */}
        {event.coverImage && (
          <div className="relative h-64 w-full overflow-hidden rounded-lg mb-6 bg-muted">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
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
                {canModerate && (
                  <div className="flex items-center gap-2 mt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/groups/${group.slug}/events/${event.id}/edit`}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Start Date & Time</p>
                  <p className="text-muted-foreground">{formatDateTime(event.startDate)}</p>
                </div>
              </div>

              {event.endDate && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">End Date & Time</p>
                    <p className="text-muted-foreground">{formatDateTime(event.endDate)}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Location</p>
                    <p className="text-muted-foreground">{event.location}</p>
                    {event.locationUrl && (
                      <a
                        href={event.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                      >
                        <span>View on map</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Attendance</p>
                  <p className="text-muted-foreground">
                    {event.attendeeCount} {event.attendeeCount === 1 ? "person" : "people"}{" "}
                    {event.rsvpRequired ? "RSVP'd" : "attending"}
                    {event.maxAttendees && ` of ${event.maxAttendees} max`}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Export Button */}
            <div className="pt-4 border-t">
              <EventExportButton
                event={event}
                groupSlug={group.slug}
                groupName={group.name}
                variant="default"
                size="default"
              />
            </div>

            {/* RSVP Section */}
            {isAuthenticated && user && !event.isCancelled && isUpcoming && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">RSVP</h3>
                <RSVPButton eventId={event.id} userId={user.id} />
                
                {event.rsvpRequired && rsvps.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {goingRSVPs.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm mb-2">
                          Going ({goingRSVPs.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {goingRSVPs.map((rsvp) => (
                            <Badge key={rsvp.id} variant="default">
                              {rsvp.userId === user.id ? "You" : `User ${rsvp.userId.slice(0, 8)}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {maybeRSVPs.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm mb-2">
                          Maybe ({maybeRSVPs.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {maybeRSVPs.map((rsvp) => (
                            <Badge key={rsvp.id} variant="outline">
                              {rsvp.userId === user.id ? "You" : `User ${rsvp.userId.slice(0, 8)}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {notGoingRSVPs.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm mb-2">
                          Not Going ({notGoingRSVPs.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {notGoingRSVPs.map((rsvp) => (
                            <Badge key={rsvp.id} variant="secondary">
                              {rsvp.userId === user.id ? "You" : `User ${rsvp.userId.slice(0, 8)}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Alert for cancelled events */}
            {event.isCancelled && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Event Cancelled</AlertTitle>
                <AlertDescription>
                  This event has been cancelled and will not take place.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

