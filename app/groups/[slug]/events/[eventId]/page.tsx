"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EventExportButton } from "@/components/groups/EventExportButton"
import { RSVPButton } from "@/components/groups/RSVPButton"
import {
  getGroupBySlug,
  getGroupEventById,
  canUserViewGroup,
  canUserViewGroupContent,
  getEventRSVPsByEventId,
  deleteGroupEvent,
  canUserModerate,
  updateEventRSVPLocationShare,
  getUserById,
} from "@/lib/storage"
import type { Group, GroupEvent, EventRSVP } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Trash2,
  Edit2,
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  LocateFixed,
  PencilLine,
  XCircle,
  Loader2,
} from "lucide-react"
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
  const [locationNote, setLocationNote] = useState("")
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

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

    const canViewContent = isAuthenticated && user
      ? canUserViewGroupContent(foundGroup.id, user.id)
      : canUserViewGroupContent(foundGroup.id)

    if (!canViewContent) {
      setIsLoading(false)
      router.push(`/groups/${foundGroup.slug}`)
      return
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

  useEffect(() => {
    if (!user) {
      setLocationNote("")
      setLocationError(null)
      return
    }

    const rsvpEntry = rsvps.find((entry) => entry.userId === user.id)
    const label = rsvpEntry?.locationShare?.label ?? ""

    if (!isUpdatingLocation && label && label !== locationNote) {
      setLocationNote(label)
    }
  }, [rsvps, user, isUpdatingLocation, locationNote])

  const refreshEventData = () => {
    const updatedEvent = getGroupEventById(eventId)
    if (updatedEvent) {
      setEvent(updatedEvent)
    }
  }

  const refreshRsvps = () => {
    const latestRsvps = getEventRSVPsByEventId(eventId)
    setRsvps(latestRsvps)
    refreshEventData()
  }

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
  const sharedLocationRSVPs = rsvps.filter(
    (rsvp) => rsvp.shareLocation && rsvp.locationShare,
  )
  const userRsvp = user ? rsvps.find((rsvp) => rsvp.userId === user.id) : null
  const canShareLocation = Boolean(userRsvp && userRsvp.status === "going")
  const isSharingLocation = Boolean(userRsvp?.shareLocation && userRsvp.locationShare)

  const handleShareLiveLocation = () => {
    if (!event || !user) return
    if (!canShareLocation) {
      setLocationError('Change your RSVP to "Going" before sharing your location.')
      return
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const note = locationNote.trim()
      if (note) {
        updateEventRSVPLocationShare(event.id, user.id, true, {
          method: "manual",
          label: note,
          sharedAt: new Date().toISOString(),
        })
        refreshRsvps()
        setLocationError("Live location is not supported in this browser. Shared your note instead.")
      } else {
        setLocationError("Live location is not supported in this browser.")
      }
      return
    }

    setIsUpdatingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateEventRSVPLocationShare(event.id, user.id, true, {
          method: "device",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          label: locationNote.trim() || undefined,
          sharedAt: new Date().toISOString(),
        })
        refreshRsvps()
        setIsUpdatingLocation(false)
      },
      (error) => {
        const fallbackNote = locationNote.trim()
        const errorMessage =
          error.code === error.PERMISSION_DENIED
            ? "Permission to access your device location was denied."
            : "We couldn't access your device location."

        if (fallbackNote) {
          updateEventRSVPLocationShare(event.id, user.id, true, {
            method: "manual",
            label: fallbackNote,
            sharedAt: new Date().toISOString(),
          })
          refreshRsvps()
          setLocationError(`${errorMessage} Shared your meetup note instead.`)
        } else {
          setLocationError(errorMessage)
        }
        setIsUpdatingLocation(false)
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    )
  }

  const handleShareManualLocation = () => {
    if (!event || !user) return
    if (!canShareLocation) {
      setLocationError('Change your RSVP to "Going" before sharing your location.')
      return
    }

    const note = locationNote.trim()
    if (!note) {
      setLocationError("Add a short note before sharing manually.")
      return
    }

    setIsUpdatingLocation(true)
    setLocationError(null)
    updateEventRSVPLocationShare(event.id, user.id, true, {
      method: "manual",
      label: note,
      sharedAt: new Date().toISOString(),
    })
    refreshRsvps()
    setIsUpdatingLocation(false)
  }

  const handleStopSharing = () => {
    if (!event || !user) return
    if (!isSharingLocation) return

    setIsUpdatingLocation(true)
    setLocationError(null)
    updateEventRSVPLocationShare(event.id, user.id, false)
    refreshRsvps()
    setIsUpdatingLocation(false)
  }

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
                <RSVPButton
                  eventId={event.id}
                  rsvpRequired={Boolean(event.rsvpRequired)}
                  maxAttendees={event.maxAttendees}
                  currentAttendeeCount={event.attendeeCount}
                  onRSVPChange={refreshRsvps}
                />
                
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

            {event.locationSharingEnabled && (
              <div className="pt-4 border-t space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Location Sharing</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.locationSharingDescription ||
                      "Share where you are during the meetup so other pet parents can find you quickly."}
                  </p>
                </div>

                {locationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unable to update location</AlertTitle>
                    <AlertDescription>{locationError}</AlertDescription>
                  </Alert>
                )}

                {isAuthenticated && user ? (
                  userRsvp ? (
                    canShareLocation ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                          <Button
                            onClick={handleShareLiveLocation}
                            disabled={isUpdatingLocation}
                            className="justify-start gap-2"
                          >
                            {isUpdatingLocation ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LocateFixed className="h-4 w-4" />
                            )}
                            Share live location
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleShareManualLocation}
                            disabled={isUpdatingLocation || !locationNote.trim()}
                            className="justify-start gap-2"
                          >
                            <PencilLine className="h-4 w-4" />
                            Share meetup note
                          </Button>
                          {isSharingLocation && (
                            <Button
                              variant="ghost"
                              onClick={handleStopSharing}
                              disabled={isUpdatingLocation}
                              className="justify-start gap-2 text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              Stop sharing
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location-note">Optional note</Label>
                          <Input
                            id="location-note"
                            placeholder="e.g. Near the north shelter picnic tables"
                            value={locationNote}
                            onChange={(e) => {
                              setLocationNote(e.target.value)
                              if (locationError) setLocationError(null)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Add a short description to help others if GPS is unavailable.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Change your RSVP to &quot;Going&quot; to enable location sharing.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      RSVP to the event to unlock location sharing options.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sign in to share your location with other attendees.
                  </p>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Attendees currently sharing</h4>
                  {sharedLocationRSVPs.length > 0 ? (
                    <div className="space-y-3">
                      {sharedLocationRSVPs.map((shareRsvp) => {
                        const share = shareRsvp.locationShare!
                        const attendee = getUserById(shareRsvp.userId)
                        const displayName =
                          shareRsvp.userId === user?.id
                            ? "You"
                            : attendee?.fullName || `User ${shareRsvp.userId.slice(0, 8)}`
                        const hasCoordinates =
                          typeof share.latitude === "number" && typeof share.longitude === "number"
                        const mapHref = hasCoordinates
                          ? `https://www.google.com/maps/search/?api=1&query=${share.latitude},${share.longitude}`
                          : null

                        return (
                          <div
                            key={shareRsvp.id}
                            className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3"
                          >
                            <MapPin className="h-5 w-5 text-primary mt-1" />
                            <div className="space-y-1">
                              <p className="font-medium">{displayName}</p>
                              {share.label && (
                                <p className="text-sm text-muted-foreground">{share.label}</p>
                              )}
                              {mapHref && (
                                <a
                                  href={mapHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open in Maps
                                </a>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {share.method === "manual"
                                  ? "Shared as meetup note"
                                  : "Shared from device"}
                                {" • Updated "}
                                {formatDateTime(share.sharedAt)}
                                {typeof share.accuracy === "number" &&
                                  ` • ±${Math.round(share.accuracy)} m`}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No attendees are sharing their location yet.
                    </p>
                  )}
                </div>
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
