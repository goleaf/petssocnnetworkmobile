"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Loader2, UserCheck, UserMinus, UserPlus, Users, X } from "lucide-react"

import { useAuth } from "@/lib/auth"
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendRequestBetweenPets,
  getFriendRequestsForPet,
  getPetById,
  getPetsByOwnerId,
  getUserById,
  removePetFriendship,
  sendFriendRequest,
} from "@/lib/storage"
import type { FriendRequest, Pet } from "@/lib/types"
import {
  createFriendRequestAcceptedNotification,
  createFriendRequestCancelledNotification,
  createFriendRequestDeclinedNotification,
  createFriendRequestNotification,
} from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RelationshipState =
  | { kind: "noPets" }
  | { kind: "friends" }
  | { kind: "pendingSent"; request: FriendRequest }
  | { kind: "pendingReceived"; request: FriendRequest }
  | { kind: "none" }

interface FriendRequestButtonProps {
  targetPet: Pet
  onChange?: () => void
  disabledReason?: string | null
}

interface FriendRequestsSectionProps {
  pet: Pet
  onChange?: () => void
  className?: string
}

interface FriendRequestDetail {
  request: FriendRequest
  pet: Pet
  ownerName: string
  ownerUsername?: string
}

function getPetLink(pet: Pet, ownerUsername?: string) {
  if (ownerUsername && pet.slug) {
    return `/user/${ownerUsername}/pet/${pet.slug}`
  }
  return `/pet/${pet.id}`
}

export function FriendRequestButton({ targetPet, onChange, disabledReason }: FriendRequestButtonProps) {
  const { user } = useAuth()
  const isOwner = user?.id === targetPet.ownerId
  const [userPets, setUserPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const isInteractionDisabled = Boolean(disabledReason)

  const loadPets = useCallback(() => {
    if (!user || isOwner) {
      setUserPets([])
      setSelectedPetId("")
      return
    }

    const pets = getPetsByOwnerId(user.id).filter((pet) => pet.id !== targetPet.id)
    setUserPets(pets)
    setSelectedPetId((previous) => {
      if (previous && pets.some((pet) => pet.id === previous)) {
        return previous
      }
      return pets[0]?.id ?? ""
    })
  }, [user, isOwner, targetPet.id])

  useEffect(() => {
    loadPets()
  }, [loadPets])

  const selectedPet = useMemo(
    () => userPets.find((pet) => pet.id === selectedPetId),
    [userPets, selectedPetId],
  )

  const relationship = useMemo<RelationshipState>(() => {
    if (!selectedPet) {
      return userPets.length === 0 ? { kind: "noPets" } : { kind: "none" }
    }

    const selectedFriends = selectedPet.friends ?? []
    const targetFriends = targetPet.friends ?? []

    if (selectedFriends.includes(targetPet.id) || targetFriends.includes(selectedPet.id)) {
      return { kind: "friends" }
    }

    const request = getFriendRequestBetweenPets(selectedPet.id, targetPet.id)
    if (request && request.status === "pending") {
      if (request.senderPetId === selectedPet.id) {
        return { kind: "pendingSent", request }
      }
      if (request.receiverPetId === selectedPet.id) {
        return { kind: "pendingReceived", request }
      }
    }

    return { kind: "none" }
  }, [selectedPet, targetPet, userPets.length, refreshCounter])

  const updateState = useCallback(() => {
    loadPets()
    setRefreshCounter((previous) => previous + 1)
    onChange?.()
  }, [loadPets, onChange])

  if (!user || isOwner) {
    return null
  }

  const handleSend = () => {
    if (!selectedPet || isInteractionDisabled) return
    setIsProcessing(true)
    setError(null)

    const result = sendFriendRequest(selectedPet.id, targetPet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to send friend request right now.")
      setIsProcessing(false)
      return
    }

    if (result.autoAccepted && result.request) {
      const senderPet = getPetById(result.request.senderPetId)
      const receiverPet = getPetById(result.request.receiverPetId)
      if (senderPet && receiverPet) {
        createFriendRequestAcceptedNotification({
          senderPetId: senderPet.id,
          senderPetName: senderPet.name,
          receiverPetId: receiverPet.id,
          receiverPetName: receiverPet.name,
          senderOwnerId: senderPet.ownerId,
        })
      }
    } else {
      createFriendRequestNotification({
        senderPetId: selectedPet.id,
        senderPetName: selectedPet.name,
        receiverPetId: targetPet.id,
        receiverPetName: targetPet.name,
        receiverOwnerId: targetPet.ownerId,
      })
    }

    setIsProcessing(false)
    updateState()
  }

  const handleCancel = () => {
    if (relationship.kind !== "pendingSent" || !selectedPet) return
    setIsProcessing(true)
    setError(null)

    const result = cancelFriendRequest(relationship.request.id, selectedPet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to cancel this friend request.")
      setIsProcessing(false)
      return
    }

    createFriendRequestCancelledNotification({
      senderPetId: selectedPet.id,
      senderPetName: selectedPet.name,
      receiverPetId: targetPet.id,
      receiverPetName: targetPet.name,
      receiverOwnerId: targetPet.ownerId,
    })

    setIsProcessing(false)
    updateState()
  }

  const handleAccept = () => {
    if (relationship.kind !== "pendingReceived" || !selectedPet) return
    setIsProcessing(true)
    setError(null)

    const result = acceptFriendRequest(relationship.request.id, selectedPet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to accept this friend request.")
      setIsProcessing(false)
      return
    }

    const senderPet = getPetById(relationship.request.senderPetId)
    const receiverPet = getPetById(relationship.request.receiverPetId)
    if (senderPet && receiverPet) {
      createFriendRequestAcceptedNotification({
        senderPetId: senderPet.id,
        senderPetName: senderPet.name,
        receiverPetId: receiverPet.id,
        receiverPetName: receiverPet.name,
        senderOwnerId: senderPet.ownerId,
      })
    }

    setIsProcessing(false)
    updateState()
  }

  const handleDecline = () => {
    if (relationship.kind !== "pendingReceived" || !selectedPet) return
    setIsProcessing(true)
    setError(null)

    const result = declineFriendRequest(relationship.request.id, selectedPet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to decline this friend request.")
      setIsProcessing(false)
      return
    }

    const senderPet = getPetById(relationship.request.senderPetId)
    const receiverPet = getPetById(relationship.request.receiverPetId)
    if (senderPet && receiverPet) {
      createFriendRequestDeclinedNotification({
        senderPetId: senderPet.id,
        senderPetName: senderPet.name,
        receiverPetId: receiverPet.id,
        receiverPetName: receiverPet.name,
        senderOwnerId: senderPet.ownerId,
      })
    }

    setIsProcessing(false)
    updateState()
  }

  const handleRemove = () => {
    if (!selectedPet) return
    setIsProcessing(true)
    setError(null)

    const result = removePetFriendship(selectedPet.id, targetPet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to remove this friendship.")
      setIsProcessing(false)
      return
    }

    setIsProcessing(false)
    updateState()
  }

  const renderAction = () => {
    switch (relationship.kind) {
      case "noPets":
        return (
          <div className="flex flex-col gap-1">
            <Button variant="outline" disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </Button>
            <p className="text-xs text-muted-foreground">Add a pet to start sending friend requests.</p>
          </div>
        )
      case "friends":
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" disabled>
              <Users className="mr-2 h-4 w-4" />
              Friends
            </Button>
            <Button variant="outline" onClick={handleRemove} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
              Remove
            </Button>
          </div>
        )
      case "pendingSent":
        return (
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Cancel Request
          </Button>
        )
      case "pendingReceived":
        return (
          <div className="flex items-center gap-2">
            <Button onClick={handleAccept} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Accept
            </Button>
            <Button variant="outline" onClick={handleDecline} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Decline
            </Button>
          </div>
        )
      default:
        if (isInteractionDisabled) {
          return (
            <div className="flex flex-col gap-1">
              <Button variant="outline" disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
              {disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
            </div>
          )
        }
        return (
          <Button onClick={handleSend} disabled={isProcessing || !selectedPet}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Add Friend
          </Button>
        )
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {userPets.length > 1 && (
          <Select value={selectedPetId} onValueChange={(value) => setSelectedPetId(value)}>
            <SelectTrigger className="min-w-[190px]">
              <SelectValue placeholder="Choose a pet" />
            </SelectTrigger>
            <SelectContent>
              {userPets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {renderAction()}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function FriendRequestsSection({ pet, onChange, className }: FriendRequestsSectionProps) {
  const { user } = useAuth()
  const isOwner = user?.id === pet.ownerId
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const loadRequests = useCallback(() => {
    if (!isOwner) {
      setRequests([])
      setIsLoading(false)
      return
    }

    const petRequests = getFriendRequestsForPet(pet.id)
    setRequests(petRequests)
    setIsLoading(false)
  }, [isOwner, pet.id])

  useEffect(() => {
    setIsLoading(true)
    loadRequests()
  }, [loadRequests, refreshCounter])

  const updateAfterAction = useCallback(() => {
    loadRequests()
    setRefreshCounter((previous) => previous + 1)
    onChange?.()
  }, [loadRequests, onChange])

  const incomingRequests = useMemo(
    () =>
      requests.filter((request) => request.receiverPetId === pet.id && request.status === "pending"),
    [requests, pet.id],
  )

  const outgoingRequests = useMemo(
    () =>
      requests.filter((request) => request.senderPetId === pet.id && request.status === "pending"),
    [requests, pet.id],
  )

  const incomingDetails = useMemo<FriendRequestDetail[]>(() => {
    return incomingRequests
      .map((request) => {
        const otherPet = getPetById(request.senderPetId)
        if (!otherPet) return null
        const owner = getUserById(otherPet.ownerId)
        return {
          request,
          pet: otherPet,
          ownerName: owner?.fullName ?? (owner?.username ? `@${owner.username}` : "Unknown owner"),
          ownerUsername: owner?.username,
        }
      })
      .filter((detail): detail is FriendRequestDetail => detail !== null)
  }, [incomingRequests, refreshCounter])

  const outgoingDetails = useMemo<FriendRequestDetail[]>(() => {
    return outgoingRequests
      .map((request) => {
        const otherPet = getPetById(request.receiverPetId)
        if (!otherPet) return null
        const owner = getUserById(otherPet.ownerId)
        return {
          request,
          pet: otherPet,
          ownerName: owner?.fullName ?? (owner?.username ? `@${owner.username}` : "Unknown owner"),
          ownerUsername: owner?.username,
        }
      })
      .filter((detail): detail is FriendRequestDetail => detail !== null)
  }, [outgoingRequests, refreshCounter])

  const handleAccept = (request: FriendRequest) => {
    setProcessingId(request.id)
    setError(null)

    const result = acceptFriendRequest(request.id, pet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to accept this friend request.")
      setProcessingId(null)
      return
    }

    const senderPet = getPetById(request.senderPetId)
    const receiverPet = getPetById(request.receiverPetId)
    if (senderPet && receiverPet) {
      createFriendRequestAcceptedNotification({
        senderPetId: senderPet.id,
        senderPetName: senderPet.name,
        receiverPetId: receiverPet.id,
        receiverPetName: receiverPet.name,
        senderOwnerId: senderPet.ownerId,
      })
    }

    setProcessingId(null)
    updateAfterAction()
  }

  const handleDecline = (request: FriendRequest) => {
    setProcessingId(request.id)
    setError(null)

    const result = declineFriendRequest(request.id, pet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to decline this friend request.")
      setProcessingId(null)
      return
    }

    const senderPet = getPetById(request.senderPetId)
    const receiverPet = getPetById(request.receiverPetId)
    if (senderPet && receiverPet) {
      createFriendRequestDeclinedNotification({
        senderPetId: senderPet.id,
        senderPetName: senderPet.name,
        receiverPetId: receiverPet.id,
        receiverPetName: receiverPet.name,
        senderOwnerId: senderPet.ownerId,
      })
    }

    setProcessingId(null)
    updateAfterAction()
  }

  const handleCancel = (request: FriendRequest) => {
    setProcessingId(request.id)
    setError(null)

    const result = cancelFriendRequest(request.id, pet.id)
    if (!result.success) {
      setError(result.error ?? "Unable to cancel this friend request.")
      setProcessingId(null)
      return
    }

    const receiverPet = getPetById(request.receiverPetId)
    if (receiverPet) {
      createFriendRequestCancelledNotification({
        senderPetId: pet.id,
        senderPetName: pet.name,
        receiverPetId: receiverPet.id,
        receiverPetName: receiverPet.name,
        receiverOwnerId: receiverPet.ownerId,
      })
    }

    setProcessingId(null)
    updateAfterAction()
  }

  if (!isOwner) {
    return null
  }

  return (
    <Card className={cn("border-primary/10 shadow-sm", className)}>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
        <CardDescription>Manage incoming and outgoing friend requests for {pet.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading requests...
          </div>
        ) : incomingDetails.length === 0 && outgoingDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending friend requests right now.</p>
        ) : (
          <div className="space-y-6">
            {incomingDetails.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Incoming</h3>
                <div className="space-y-3">
                  {incomingDetails.map(({ request, pet: otherPet, ownerName, ownerUsername }) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherPet.avatar || "/placeholder.svg"} alt={otherPet.name} />
                          <AvatarFallback>{otherPet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={getPetLink(otherPet, ownerUsername)} className="font-medium hover:text-primary">
                            {otherPet.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{ownerName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="mr-2 h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <X className="mr-2 h-4 w-4" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outgoingDetails.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Sent</h3>
                <div className="space-y-3">
                  {outgoingDetails.map(({ request, pet: otherPet, ownerName, ownerUsername }) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherPet.avatar || "/placeholder.svg"} alt={otherPet.name} />
                          <AvatarFallback>{otherPet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={getPetLink(otherPet, ownerUsername)} className="font-medium hover:text-primary">
                            {otherPet.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{ownerName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <X className="mr-2 h-4 w-4" />
                          )}
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
