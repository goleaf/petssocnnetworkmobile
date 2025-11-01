"use client"

import { useState, useEffect, use, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EditButton } from "@/components/ui/edit-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getPetByUsernameAndSlug, getUserById, getBlogPosts, togglePetFollow, getUsers, getPets } from "@/lib/storage"
import type { PrivacyLevel } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import {
  Calendar,
  Heart,
  Cake,
  Weight,
  Palette,
  Syringe,
  Pill,
  Stethoscope,
  Award,
  Users,
  Camera,
  Edit,
  MapPin,
  Phone,
  Shield,
  Utensils,
  Brain,
  Activity,
  Star,
  AlertCircle,
  FileText,
  PawPrint,
  Dna,
  Lock,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"

import { PhotoViewer } from "@/components/photo-viewer"
import { PetAchievementsSection } from "@/components/pet-achievements"
import { FriendRequestButton, FriendRequestsSection } from "@/components/friend-requests-manager"
import { canViewPet, canInteractWithPet } from "@/lib/utils/privacy"

const formatSpecies = (species: string) => species.charAt(0).toUpperCase() + species.slice(1)

export default function PetProfilePage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<any | null>(null)
  const [owner, setOwner] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  const loadPetData = useCallback(() => {
    const fetchedPet = getPetByUsernameAndSlug(username, slug)
    setPet(fetchedPet)
    if (fetchedPet) {
      const fetchedOwner = getUserById(fetchedPet.ownerId)
      setOwner(fetchedOwner)
      const fetchedPosts = getBlogPosts()
      setPosts(fetchedPosts.filter((p) => p.petId === fetchedPet.id))

      if (fetchedPet.friends && fetchedPet.friends.length > 0) {
        const allPets = getPets()
        const friendPets = fetchedPet.friends
          .map((friendId: string) => allPets.find((p) => p.id === friendId))
          .filter(Boolean)
        setFriends(friendPets)
      } else {
        setFriends([])
      }
    } else {
      setOwner(null)
      setPosts([])
      setFriends([])
    }
  }, [username, slug])

  useEffect(() => {
    setIsLoading(true)
    loadPetData()
    setIsLoading(false)
  }, [loadPetData])

  const refreshPetData = useCallback(() => {
    loadPetData()
  }, [loadPetData])

  useEffect(() => {
    if (currentUser && pet) {
      setIsFollowing(pet.followers && pet.followers.includes(currentUser.id))
    }
  }, [currentUser, pet])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Pet not found</p>
      </div>
    )
  }

  const viewerId = currentUser?.id ?? null
  const ownerPrivacyFallback = (owner.privacy?.sections?.pets ?? owner.privacy?.pets ?? "public") as PrivacyLevel

  const resolveSetting = (field: "visibility" | "interactions"): PrivacyLevel => {
    const rawPrivacy = pet.privacy
    if (
      rawPrivacy &&
      typeof rawPrivacy === "object" &&
      field in rawPrivacy
    ) {
      return rawPrivacy[field] as PrivacyLevel
    }

    if (typeof rawPrivacy === "string") {
      return rawPrivacy
    }

    return ownerPrivacyFallback
  }

  const visibilitySetting = resolveSetting("visibility")
  const interactionSetting = resolveSetting("interactions")
  const canView = canViewPet(pet, owner, viewerId)
  const canInteract = canInteractWithPet(pet, owner, viewerId)

  const viewerIsBlockedByOwner = viewerId ? owner.blockedUsers?.includes(viewerId) : false
  const ownerIsBlockedByViewer = viewerId ? currentUser?.blockedUsers?.includes(owner.id) : false

  if (!canView) {
    let visibilityMessage: string
    if (viewerIsBlockedByOwner) {
      visibilityMessage = `${owner.fullName} has restricted access to this pet.`
    } else if (ownerIsBlockedByViewer) {
      visibilityMessage = "You have blocked this pet's owner, so their pets are hidden."
    } else if (!viewerId) {
      visibilityMessage = "Sign in to see if you can view this pet profile."
    } else if (visibilitySetting === "followers-only") {
      visibilityMessage = `Only people who follow ${owner.fullName} can view this pet.`
    } else {
      visibilityMessage = `${owner.fullName} keeps this pet profile private.`
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <BackButton href={`/user/${owner.username}`} label={`Back to ${owner.fullName}'s Profile`} icon={FileText} />
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Pet Profile Hidden</CardTitle>
                <CardDescription>{visibilityMessage}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {visibilitySetting === "followers-only" && !viewerIsBlockedByOwner && !ownerIsBlockedByViewer && (
              <p>
                Try following{" "}
                <Link href={`/user/${owner.username}`} className="text-primary underline">
                  {owner.fullName}
                </Link>{" "}
                to request access.
              </p>
            )}
            {!viewerId && (
              <p>
                You&apos;ll need to{" "}
                <Link href="/login" className="text-primary underline">
                  log in
                </Link>{" "}
                to see private pets.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = currentUser?.id === pet.ownerId
  const privacyLabelMap: Record<PrivacyLevel, string> = {
    public: "Public",
    "followers-only": "Followers Only",
    private: "Private",
  }

  const followDisabled = !currentUser || (!canInteract && !isFollowing)
  let interactionRestriction: string | null = null

  if (!currentUser) {
    interactionRestriction = "Log in to follow or send a friend request."
  } else if (viewerIsBlockedByOwner) {
    interactionRestriction = "You cannot interact with this pet because the owner has blocked you."
  } else if (ownerIsBlockedByViewer) {
    interactionRestriction = "You have blocked this pet's owner."
  } else if (!canInteract && !isFollowing) {
    if (interactionSetting === "followers-only") {
      interactionRestriction = `Only people who follow ${owner.fullName} can interact with this pet.`
    } else if (interactionSetting === "private") {
      interactionRestriction = "Only the owner can interact with this pet."
    } else {
      interactionRestriction = "You cannot interact with this pet."
    }
  }

  const handleFollow = () => {
    if (!currentUser || !pet) return
    if (!canInteract && !isFollowing) return

    togglePetFollow(currentUser.id, pet.id)
    const refreshedPet = getPetByUsernameAndSlug(username, slug)
    if (refreshedPet) {
      setPet(refreshedPet)
      setIsFollowing(refreshedPet.followers.includes(currentUser.id))
    } else {
      setIsFollowing((prev) => !prev)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/user/${owner.username}`} label={`Back to ${owner.fullName}'s Profile`} icon={FileText} />
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32 ring-4 ring-primary/10">
              <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
              <AvatarFallback className="text-2xl">{pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold">{pet.name}</h1>
                    {pet.spayedNeutered && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Fixed
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {formatSpecies(pet.species)}
                    {pet.breed && ` • ${pet.breed}`}
                    {pet.gender && ` • ${pet.gender}`}
                  </p>
                  <Link href={`/user/${owner.username}`} className="text-sm text-primary hover:underline">
                    Owned by {owner.fullName}
                  </Link>
                </div>
                <div className="flex flex-col items-start gap-2">
                  {isOwner && (
                    <Link href={`/user/${owner.username}/pet/${slug}/edit`}>
                      <EditButton>
                        Edit Profile
                      </EditButton>
                    </Link>
                  )}
                  <FriendRequestButton
                    targetPet={pet}
                    onChange={refreshPetData}
                    disabledReason={!isOwner ? interactionRestriction : null}
                  />
                  {!isOwner && currentUser && (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      disabled={followDisabled}
                      title={followDisabled && interactionRestriction ? interactionRestriction : undefined}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                  {!isOwner && !currentUser && (
                    <Link href="/login">
                      <Button variant="default">
                        <Heart className="h-4 w-4 mr-2" />
                        Log in to Follow
                      </Button>
                    </Link>
                  )}
                  {!isOwner && interactionRestriction && (
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {!currentUser ? (
                        <>
                          Log in to follow this pet.{" "}
                          <Link href="/login" className="text-primary underline">
                            Sign in
                          </Link>
                          .
                        </>
                      ) : (
                        interactionRestriction
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Biography</p>
                {pet.bio ? (
                  <p className="text-foreground text-lg leading-relaxed">{pet.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No biography added yet. Owners can add one from the edit page.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  Visibility: {privacyLabelMap[visibilitySetting]}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold">
                  Interactions: {privacyLabelMap[interactionSetting]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{formatSpecies(pet.species)}</span>
                </div>
                {pet.breed && (
                  <div className="flex items-center gap-2">
                    <Dna className="h-4 w-4 text-muted-foreground" />
                    <span>{pet.breed}</span>
                  </div>
                )}
                {pet.age !== undefined && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {pet.age} {pet.age === 1 ? "year" : "years"} old
                    </span>
                  </div>
                )}
                {pet.birthday && (
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Birthday: {formatDate(pet.birthday)}
                    </span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Weight: {pet.weight}</span>
                  </div>
                )}
                {pet.color && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Color: {pet.color}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link href={`/user/${username}/pet/${slug}/followers`} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{pet.followers.length}</span>
                  <span className="text-muted-foreground">{pet.followers.length === 1 ? "Follower" : "Followers"}</span>
                </Link>
                {pet.friends && pet.friends.length > 0 && (
                  <Link href={`/user/${username}/pet/${slug}/friends`} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{pet.friends.length}</span>
                    <span className="text-muted-foreground">{pet.friends.length === 1 ? "Friend" : "Friends"}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="about" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personality Traits */}
            {pet.personality && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Personality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pet.personality.energyLevel && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Energy Level</span>
                        <span className="text-sm text-muted-foreground">{pet.personality.energyLevel}/5</span>
                      </div>
                      <Progress value={pet.personality.energyLevel * 20} />
                    </div>
                  )}
                  {pet.personality.friendliness && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Friendliness</span>
                        <span className="text-sm text-muted-foreground">{pet.personality.friendliness}/5</span>
                      </div>
                      <Progress value={pet.personality.friendliness * 20} />
                    </div>
                  )}
                  {pet.personality.playfulness && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Playfulness</span>
                        <span className="text-sm text-muted-foreground">{pet.personality.playfulness}/5</span>
                      </div>
                      <Progress value={pet.personality.playfulness * 20} />
                    </div>
                  )}
                  {pet.personality.trainability && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Trainability</span>
                        <span className="text-sm text-muted-foreground">{pet.personality.trainability}/5</span>
                      </div>
                      <Progress value={pet.personality.trainability * 20} />
                    </div>
                  )}
                  {pet.personality.independence && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Independence</span>
                        <span className="text-sm text-muted-foreground">{pet.personality.independence}/5</span>
                      </div>
                      <Progress value={pet.personality.independence * 20} />
                    </div>
                  )}
                  {pet.personality.traits && pet.personality.traits.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-2">Traits</p>
                      <div className="flex flex-wrap gap-2">
                        {pet.personality.traits.map((trait) => (
                          <Badge key={trait} variant="secondary">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Favorite Things */}
            {pet.favoriteThings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Favorite Things
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pet.favoriteThings.toys && pet.favoriteThings.toys.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Toys</p>
                      <div className="flex flex-wrap gap-2">
                        {pet.favoriteThings.toys.map((toy) => (
                          <Badge key={toy} variant="outline">
                            {toy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {pet.favoriteThings.activities && pet.favoriteThings.activities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Activities</p>
                      <div className="flex flex-wrap gap-2">
                        {pet.favoriteThings.activities.map((activity) => (
                          <Badge key={activity} variant="outline">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {pet.favoriteThings.places && pet.favoriteThings.places.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Places</p>
                      <div className="flex flex-wrap gap-2">
                        {pet.favoriteThings.places.map((place) => (
                          <Badge key={place} variant="outline">
                            {place}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {pet.favoriteThings.foods && pet.favoriteThings.foods.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Foods</p>
                      <div className="flex flex-wrap gap-2">
                        {pet.favoriteThings.foods.map((food) => (
                          <Badge key={food} variant="outline">
                            {food}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Diet Information */}
            {pet.dietInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Diet & Nutrition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pet.dietInfo.foodBrand && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Food Brand</p>
                      <p className="text-sm">{pet.dietInfo.foodBrand}</p>
                    </div>
                  )}
                  {pet.dietInfo.foodType && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Food Type</p>
                      <p className="text-sm">{pet.dietInfo.foodType}</p>
                    </div>
                  )}
                  {pet.dietInfo.portionSize && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Portion Size</p>
                      <p className="text-sm">{pet.dietInfo.portionSize}</p>
                    </div>
                  )}
                  {pet.dietInfo.feedingSchedule && pet.dietInfo.feedingSchedule.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Feeding Schedule</p>
                      <ul className="text-sm list-disc list-inside">
                        {pet.dietInfo.feedingSchedule.map((time, idx) => (
                          <li key={idx}>{time}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pet.dietInfo.restrictions && pet.dietInfo.restrictions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dietary Restrictions</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {pet.dietInfo.restrictions.map((restriction) => (
                          <Badge key={restriction} variant="destructive">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pet.microchipId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Microchip ID</p>
                    <p className="text-sm font-mono">{pet.microchipId}</p>
                  </div>
                )}
                {pet.adoptionDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adoption Date</p>
                    <p className="text-sm">{formatDate(pet.adoptionDate)}</p>
                  </div>
                )}
                {pet.specialNeeds && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Special Needs</p>
                    <p className="text-sm">{pet.specialNeeds}</p>
                  </div>
                )}
                {pet.allergies && pet.allergies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pet.allergies.map((allergy) => (
                        <Badge key={allergy} variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Veterinarian Information */}
            {pet.vetInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Veterinarian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pet.vetInfo.clinicName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Clinic Name</p>
                      <p className="text-sm">{pet.vetInfo.clinicName}</p>
                    </div>
                  )}
                  {pet.vetInfo.veterinarianName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Veterinarian</p>
                      <p className="text-sm">{pet.vetInfo.veterinarianName}</p>
                    </div>
                  )}
                  {pet.vetInfo.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {pet.vetInfo.phone}
                      </p>
                    </div>
                  )}
                  {pet.vetInfo.address && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {pet.vetInfo.address}
                      </p>
                    </div>
                  )}
                  {pet.vetInfo.emergencyContact && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                      <p className="text-sm">{pet.vetInfo.emergencyContact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Insurance Information */}
            {pet.insurance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pet.insurance.provider && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Provider</p>
                      <p className="text-sm">{pet.insurance.provider}</p>
                    </div>
                  )}
                  {pet.insurance.policyNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                      <p className="text-sm font-mono">{pet.insurance.policyNumber}</p>
                    </div>
                  )}
                  {pet.insurance.coverage && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                      <p className="text-sm">{pet.insurance.coverage}</p>
                    </div>
                  )}
                  {pet.insurance.expiryDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                      <p className="text-sm">{formatDate(pet.insurance.expiryDate)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vaccinations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Vaccinations
                </CardTitle>
                <CardDescription>Vaccination history and upcoming shots</CardDescription>
              </CardHeader>
              <CardContent>
                {pet.vaccinations && pet.vaccinations.length > 0 ? (
                  <div className="space-y-4">
                    {pet.vaccinations.map((vaccination) => (
                      <div key={vaccination.id} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{vaccination.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Given: {formatDate(vaccination.date)}
                            </p>
                            {vaccination.nextDue && (
                              <p className="text-sm text-muted-foreground">
                                Next due: {formatDate(vaccination.nextDue)}
                              </p>
                            )}
                            {vaccination.veterinarian && (
                              <p className="text-xs text-muted-foreground">By: {vaccination.veterinarian}</p>
                            )}
                          </div>
                          {vaccination.nextDue &&
                            new Date(vaccination.nextDue) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                              <Badge variant="destructive">Due Soon</Badge>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No vaccination records yet</p>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications
                </CardTitle>
                <CardDescription>Current and past medications</CardDescription>
              </CardHeader>
              <CardContent>
                {pet.medications && pet.medications.length > 0 ? (
                  <div className="space-y-4">
                    {pet.medications.map((medication) => (
                      <div key={medication.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">{medication.name}</p>
                          {!medication.endDate && <Badge variant="default">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {medication.dosage} • {medication.frequency}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {formatDate(medication.startDate)}
                          {medication.endDate && ` • Ended: ${formatDate(medication.endDate)}`}
                        </p>
                        {medication.notes && <p className="text-sm mt-2">{medication.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No medications recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Health Records */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Records
                </CardTitle>
                <CardDescription>Medical history and checkups</CardDescription>
              </CardHeader>
              <CardContent>
                {pet.healthRecords && pet.healthRecords.length > 0 ? (
                  <div className="space-y-4">
                    {pet.healthRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{record.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(record.date)}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {record.type}
                          </Badge>
                        </div>
                        <p className="text-sm mt-2">{record.description}</p>
                        {record.veterinarian && (
                          <p className="text-xs text-muted-foreground mt-2">Veterinarian: {record.veterinarian}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No health records yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo Gallery
              </CardTitle>
              <CardDescription>
                {pet.name}
                {"'"}s photo collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pet.photos && pet.photos.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pet.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                        onClick={() => {
                          setSelectedPhotoIndex(idx)
                          setPhotoViewerOpen(true)
                        }}
                      >
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`${pet.name} photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                  <PhotoViewer
                    photos={pet.photos}
                    petId={pet.id}
                    initialIndex={selectedPhotoIndex}
                    isOpen={photoViewerOpen}
                    onClose={() => setPhotoViewerOpen(false)}
                    petName={pet.name}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No photos yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <PetAchievementsSection achievements={pet.achievements} petName={pet.name} />
        </TabsContent>

        <TabsContent value="friends">
          <div className="space-y-6">
            <FriendRequestsSection pet={pet} onChange={refreshPetData} />
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pet Friends
              </CardTitle>
              <CardDescription>
                {pet.name}
                {"'"}s furry friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => {
                    const friendOwner = getUsers().find((u) => u.id === friend.ownerId)
                    const friendSlug = friend.slug || friend.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
                    const assignmentId = pet.friendCategoryAssignments?.[friend.id]
                    const assignedCategory =
                      assignmentId && pet.friendCategories
                        ? pet.friendCategories.find((category) => category.id === assignmentId)
                        : undefined

                    return (
                      <Link
                        key={friend.id}
                        href={friendOwner ? `/user/${friendOwner.username}/pet/${friendSlug}` : `/pet/${friend.id}`}
                      >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                              <p className="font-semibold">{friend.name}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {friend.species}
                                </Badge>
                                {assignedCategory ? (
                                  <Badge variant="secondary">{assignedCategory.name}</Badge>
                                ) : pet.friendCategories && pet.friendCategories.length > 0 ? (
                                  <Badge variant="outline">No category</Badge>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No friends yet</p>
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Training Progress
              </CardTitle>
              <CardDescription>Skills and training milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {pet.trainingProgress && pet.trainingProgress.length > 0 ? (
                <div className="space-y-4">
                  {pet.trainingProgress.map((training) => (
                    <div key={training.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{training.skill}</p>
                          <p className="text-sm text-muted-foreground">
                            Started: {formatDate(training.startedAt)}
                          </p>
                          {training.completedAt && (
                            <p className="text-sm text-muted-foreground">
                              Completed: {formatDate(training.completedAt)}
                            </p>
                          )}
                        </div>
                        <Badge variant={training.level === "mastered" ? "default" : "secondary"} className="capitalize">
                          {training.level}
                        </Badge>
                      </div>
                      {training.notes && <p className="text-sm mt-2">{training.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No training records yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden p-0">
                    {post.coverImage && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={post.coverImage || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(post.createdAt)}
                      </p>
                      <p className="text-sm mt-2 line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes.length}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {posts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {pet.name} hasn{"'"}t shared any posts yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
