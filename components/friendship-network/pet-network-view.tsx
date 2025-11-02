"use client"

import { useMemo } from "react"
import Link from "next/link"
import { getPetSocialCircle } from "@/lib/storage"
import type {
  Pet,
  PetPlaydateInvite,
  PetRelationship,
  PetSocialCircle,
  PetVirtualPlaydate,
  User,
} from "@/lib/types"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatDate } from "@/lib/utils/date"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/ui/stat-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  PawPrint,
  Users,
  Sparkles,
  CalendarDays,
  Clock,
  HeartHandshake,
  Video,
  Send,
  MessageCircle,
  Star,
} from "lucide-react"

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function formatPlaydateSchedule(timestamp: string | undefined): string {
  if (!timestamp) return "Schedule TBA"
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "Schedule TBA"

  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  return `${formatDate(timestamp)} • ${time}`
}

function getInviteStatusLabel(status: PetPlaydateInvite["status"]): string {
  switch (status) {
    case "pending":
      return "Pending response"
    case "accepted":
      return "Accepted"
    case "declined":
      return "Declined"
    case "expired":
      return "Expired"
    default:
      return toTitleCase(status)
  }
}

interface PetNetworkViewProps {
  pet: Pet
  allPets: Pet[]
  users: User[]
  petLookup: Map<string, Pet>
  ownerLookup: Map<string, User>
  isCircleLoading?: boolean
}

export function PetNetworkView({
  pet,
  allPets,
  users,
  petLookup,
  ownerLookup,
  isCircleLoading = false,
}: PetNetworkViewProps) {
  const socialCircle = useMemo(() => getPetSocialCircle(pet.id), [pet.id])

  const upcomingPlaydates = useMemo(() => {
    return (socialCircle?.playdates ?? [])
      .filter((playdate) => playdate.status === "upcoming")
      .sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      )
  }, [socialCircle])

  const completedPlaydates = useMemo(() => {
    return (socialCircle?.playdates ?? [])
      .filter((playdate) => playdate.status === "completed")
      .sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      )
  }, [socialCircle])

  const playdateLookup = useMemo(() => {
    const map = new Map<string, PetVirtualPlaydate>()
    ;(socialCircle?.playdates ?? []).forEach((playdate) => map.set(playdate.id, playdate))
    return map
  }, [socialCircle])

  const stats = useMemo(() => {
    const totalFriends = pet?.friends?.length ?? 0
    const deepBonds =
      socialCircle?.relationships.filter((rel) => rel.type === "best-friend").length ??
      0
    const upcomingCount = upcomingPlaydates.length
    const totalMinutes = (socialCircle?.playdates ?? []).reduce(
      (acc, playdate) => acc + (playdate.durationMinutes ?? 0),
      0,
    )
    const formattedTime =
      totalMinutes >= 60
        ? `${(totalMinutes / 60).toFixed(1)} hrs`
        : `${totalMinutes} mins`

    return [
      {
        label: "Friends",
        value: totalFriends,
        icon: Users,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Best Friends",
        value: deepBonds,
        icon: Sparkles,
        iconBgColor: "bg-purple-100 dark:bg-purple-500/10",
        iconColor: "text-purple-600 dark:text-purple-300",
      },
      {
        label: "Upcoming Playdates",
        value: upcomingCount,
        icon: CalendarDays,
        iconBgColor: "bg-emerald-100 dark:bg-emerald-500/10",
        iconColor: "text-emerald-600 dark:text-emerald-300",
      },
      {
        label: "Playdate Time",
        value: formattedTime,
        icon: Clock,
        iconBgColor: "bg-sky-100 dark:bg-sky-500/10",
        iconColor: "text-sky-600 dark:text-sky-300",
      },
    ]
  }, [pet, socialCircle, upcomingPlaydates])

  const suggestedConnections = useMemo(() => {
    if (!pet || allPets.length === 0) {
      return []
    }

    const friendIds = new Set(pet.friends ?? [])
    const relationshipIds = new Set((socialCircle?.relationships ?? []).map((rel) => rel.petId))

    const calculateCompatibilityScore = (base: Pet, candidate: Pet): number => {
      let score = 50

      if (base.species === candidate.species) {
        score += 20
      }

      if (base.breed && candidate.breed && base.breed === candidate.breed) {
        score += 5
      }

      const energyA = base.personality?.energyLevel
      const energyB = candidate.personality?.energyLevel
      if (energyA && energyB) {
        const diff = Math.abs(energyA - energyB)
        score += Math.max(0, 15 - diff * 5)
      }

      const friendlinessA = base.personality?.friendliness
      const friendlinessB = candidate.personality?.friendliness
      if (friendlinessA && friendlinessB) {
        score += Math.round(((friendlinessA + friendlinessB) / 2) * 2)
      }

      const sharedActivities = (base.favoriteThings?.activities || []).filter((activity) =>
        (candidate.favoriteThings?.activities || []).includes(activity),
      )
      score += sharedActivities.length * 5

      return Math.max(20, Math.min(100, Math.round(score)))
    }

    return allPets
      .filter(
        (candidate) =>
          candidate.id !== pet.id &&
          candidate.ownerId !== pet.ownerId &&
          !friendIds.has(candidate.id) &&
          !relationshipIds.has(candidate.id),
      )
      .map((candidate) => ({
        pet: candidate,
        score: calculateCompatibilityScore(pet, candidate),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }, [pet, allPets, socialCircle])

  if (isCircleLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
              <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{pet.name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {pet.breed || toTitleCase(pet.species)}
                </Badge>
                {pet.age !== undefined && (
                  <span>{pet.age} {pet.age === 1 ? "year" : "years"} old</span>
                )}
                {pet.personality?.traits?.slice(0, 2).map((trait) => (
                  <Badge key={trait} variant="secondary">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/pet/${pet.id}`}>
              <Button variant="outline">View public profile</Button>
            </Link>
            <Link href="/groups">
              <Button variant="ghost" className="border border-dashed border-muted">
                <MessageCircle className="h-4 w-4 mr-2" />
                Find group playdates
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-primary" />
                Relationship Map
              </CardTitle>
              <CardDescription>
                Track best friends, mentors, and adventure buddies keeping {pet.name} social.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {(socialCircle?.relationships?.length ?? 0)} connections
            </Badge>
          </CardHeader>
          <CardContent>
            {(socialCircle?.relationships && socialCircle.relationships.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialCircle.relationships.map((relationship) => {
                  const friendPet = petLookup.get(relationship.petId)
                  const owner = friendPet ? ownerLookup.get(friendPet.ownerId) : undefined
                  const nextPlaydate =
                    (relationship.nextPlaydateId &&
                      playdateLookup.get(relationship.nextPlaydateId)) ||
                    upcomingPlaydates.find(
                      (playdate) =>
                        playdate.hostPetId === relationship.petId ||
                        playdate.guestPetIds.includes(relationship.petId),
                    )

                  return (
                    <Card key={relationship.id} className="border border-muted">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friendPet?.avatar || "/placeholder.svg"} alt={friendPet?.name} />
                            <AvatarFallback>
                              {(friendPet?.name || "?").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {friendPet?.name ?? "Unknown friend"}
                              </h3>
                              {friendPet?.breed && (
                                <Badge variant="outline" className="capitalize">
                                  {friendPet.breed}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <Badge variant="secondary">{toTitleCase(relationship.type)}</Badge>
                              <Badge variant={relationship.status === "active" ? "default" : "outline"}>
                                {toTitleCase(relationship.status)}
                              </Badge>
                              {owner && (
                                <span className="text-muted-foreground">
                                  with @{owner.username}
                                </span>
                              )}
                            </div>
                            {relationship.since && (
                              <p className="text-xs text-muted-foreground">
                                Connected since {formatDate(relationship.since)}
                              </p>
                            )}
                          </div>
                        </div>

                        {relationship.compatibilityScore && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Compatibility</span>
                              <span>{relationship.compatibilityScore}%</span>
                            </div>
                            <Progress value={relationship.compatibilityScore} />
                          </div>
                        )}

                        {relationship.favoriteActivities && relationship.favoriteActivities.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Shared joys:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {relationship.favoriteActivities.map((activity) => (
                                <Badge key={activity} variant="outline">
                                  {activity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {relationship.story && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {relationship.story}
                          </p>
                        )}

                        {nextPlaydate && (
                          <div className="rounded-lg border border-dashed p-3 bg-muted/30 text-xs space-y-2">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-primary" />
                              <span className="font-medium">Next virtual playdate</span>
                            </div>
                            <div className="flex flex-col gap-1 text-muted-foreground">
                              <span>{nextPlaydate.title}</span>
                              <span>{formatPlaydateSchedule(nextPlaydate.scheduledAt)}</span>
                              {nextPlaydate.platform && (
                                <span>Platform: {nextPlaydate.platform}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {friendPet && (
                          <Link
                            href={
                              owner
                                ? getPetUrlFromPet(friendPet, owner.username)
                                : `/pet/${friendPet.id}`
                            }
                          >
                            <Button variant="link" className="px-0 text-primary">
                              View {friendPet.name}{"'"}s profile
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground space-y-2">
                <HeartHandshake className="h-10 w-10 mx-auto opacity-60" />
                <p>No relationships mapped yet.</p>
                <p className="text-sm">
                  Once {pet.name} connects with more pets, you{"'"}ll see their bonds charted here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Virtual Playdates
            </CardTitle>
            <CardDescription>
              Manage upcoming sessions and capture highlights for {pet.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Upcoming</h3>
                <Badge variant="outline">{upcomingPlaydates.length}</Badge>
              </div>
              {upcomingPlaydates.length > 0 ? (
                <div className="space-y-4">
                  {upcomingPlaydates.map((playdate) => (
                    <div key={playdate.id} className="rounded-lg border border-muted p-4 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{playdate.title}</div>
                        <Badge variant="secondary" className="capitalize">
                          {playdate.focus ? toTitleCase(playdate.focus) : "Social"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatPlaydateSchedule(playdate.scheduledAt)}
                      </p>
                      {playdate.activities && playdate.activities.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {playdate.activities.map((activity) => (
                            <Badge key={activity} variant="outline">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex -space-x-2">
                        {[playdate.hostPetId, ...playdate.guestPetIds].slice(0, 4).map((petId) => {
                          const participant = petLookup.get(petId)
                          return participant ? (
                            <Avatar key={petId} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
                              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : null
                        })}
                      </div>
                      {playdate.notes && (
                        <p className="text-xs text-muted-foreground">{playdate.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
                  No upcoming playdates on the calendar yet. Reach out to friends or explore groups to schedule one.
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Recent highlights
                </h3>
              </div>
              {(socialCircle?.highlights && socialCircle.highlights.length > 0) ? (
                <div className="space-y-3">
                  {socialCircle.highlights.map((highlight) => {
                    const relatedPet = highlight.relatedPetId
                      ? petLookup.get(highlight.relatedPetId)
                      : undefined
                    return (
                      <div key={highlight.id} className="rounded-md border border-muted/60 p-3 bg-background">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {highlight.icon && <span>{highlight.icon}</span>}
                          <span>{formatDate(highlight.date)}</span>
                        </div>
                        <div className="font-medium mt-1">{highlight.title}</div>
                        <p className="text-sm text-muted-foreground">{highlight.description}</p>
                        {relatedPet && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Celebrated with {relatedPet.name}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
                  Capture memorable moments and they{"'"}ll appear here for easy sharing.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Completed
                </h3>
                <Badge variant="outline">{completedPlaydates.length}</Badge>
              </div>
              {completedPlaydates.length > 0 ? (
                <div className="space-y-3">
                  {completedPlaydates.slice(0, 3).map((playdate) => (
                    <div key={playdate.id} className="rounded-md border border-muted p-3 text-sm space-y-1">
                      <div className="font-medium">{playdate.title}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(playdate.scheduledAt)} • {playdate.durationMinutes} mins
                      </p>
                      {playdate.highlights && playdate.highlights.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Highlight: {playdate.highlights[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
                  Completed playdates will be archived here with quick highlights for future reference.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Playdate Invitations
              </CardTitle>
              <CardDescription>
                Track the invites {pet.name} has received and their current status.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {(socialCircle?.invites?.length ?? 0)} invitations
            </Badge>
          </CardHeader>
          <CardContent>
            {(socialCircle?.invites && socialCircle.invites.length > 0) ? (
              <div className="space-y-4">
                {socialCircle.invites.map((invite) => {
                  const sender = petLookup.get(invite.senderPetId)
                  const related = invite.playdateId
                    ? playdateLookup.get(invite.playdateId)
                    : undefined

                  return (
                    <div key={invite.id} className="rounded-lg border border-muted p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.name} />
                          <AvatarFallback>{(sender?.name || "?").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            Invite from {sender?.name ?? "Unknown friend"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Sent on {formatDate(invite.sentAt)}
                          </div>
                        </div>
                        <Badge
                          variant={
                            invite.status === "accepted"
                              ? "default"
                              : invite.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                          className="ml-auto"
                        >
                          {getInviteStatusLabel(invite.status)}
                        </Badge>
                      </div>
                      {invite.message && (
                        <p className="text-sm text-muted-foreground mt-2">{invite.message}</p>
                      )}
                      {related && (
                        <div className="mt-3 text-xs rounded-md border border-dashed p-3 bg-muted/30 space-y-1">
                          <div className="font-medium">{related.title}</div>
                          <div>{formatPlaydateSchedule(related.scheduledAt)}</div>
                          {related.platform && <div>Platform: {related.platform}</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
                Incoming playdate invitations will appear here. Encourage friends to send a request or start planning one together!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Suggested Connections
              </CardTitle>
              <CardDescription>
                Pals who match {pet.name}{"'"}s energy and interests.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {suggestedConnections.length} matches
            </Badge>
          </CardHeader>
          <CardContent>
            {suggestedConnections.length > 0 ? (
              <div className="space-y-4">
                {suggestedConnections.map(({ pet: suggestedPet, score }) => {
                  const owner = ownerLookup.get(suggestedPet.ownerId)
                  return (
                    <div key={suggestedPet.id} className="border border-muted rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={suggestedPet.avatar || "/placeholder.svg"} alt={suggestedPet.name} />
                          <AvatarFallback>{suggestedPet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{suggestedPet.name}</span>
                            <Badge variant="outline" className="capitalize">
                              {suggestedPet.species}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {owner ? `with @${owner.username}` : "Owner info unavailable"}
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                            {suggestedPet.favoriteThings?.activities?.slice(0, 2).map((activity) => (
                              <Badge key={activity} variant="secondary">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-48">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Compatibility</span>
                          <span>{score}%</span>
                        </div>
                        <Progress value={score} />
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" asChild>
                            <Link
                              href={
                                owner
                                  ? getPetUrlFromPet(suggestedPet, owner.username)
                                  : `/pet/${suggestedPet.id}`
                              }
                            >
                              View profile
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Send className="h-3 w-3 mr-1" />
                            Invite
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
                We{"'"}ll recommend new friends as soon as more pets join the community or your preferences evolve.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

