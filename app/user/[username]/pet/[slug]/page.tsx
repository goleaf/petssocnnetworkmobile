"use client"

import { useState, useEffect, use } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getPetByUsernameAndSlug, getUserById, getBlogPosts, updatePet, getUsers, getPets } from "@/lib/storage"
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
  Sparkles,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"

export default function PetProfilePage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<any | null>(null)
  const [owner, setOwner] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
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
    }
    setIsLoading(false)
  }, [currentUser, username, slug])

  useEffect(() => {
    if (currentUser && pet) {
      setIsFollowing(pet.followers && pet.followers.includes(currentUser.id))
    }
  }, [currentUser, pet])

  const handleFollow = () => {
    if (!currentUser || !pet) return

    const updatedPet = { ...pet }

    if (isFollowing) {
      updatedPet.followers = updatedPet.followers.filter((id) => id !== currentUser.id)
    } else {
      updatedPet.followers.push(currentUser.id)
    }

    updatePet(updatedPet)
    setPet(updatedPet)
    setIsFollowing(!isFollowing)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pet || !owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Pet not found</p>
      </div>
    )
  }

  const isOwner = currentUser?.id === pet.ownerId

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href={`/user/${owner.username}`}>
        <Button variant="ghost" className="mb-6">
          <FileText className="h-4 w-4 mr-2" />
          Back to {owner.fullName}'s Profile
        </Button>
      </Link>
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
                  <p className="text-muted-foreground capitalize text-lg">
                    {pet.breed || pet.species}
                    {pet.gender && ` • ${pet.gender}`}
                  </p>
                  <Link href={`/user/${owner.username}`} className="text-sm text-primary hover:underline">
                    Owned by {owner.fullName}
                  </Link>
                </div>
                <div className="flex gap-2">
                  {isOwner && (
                    <Link href={`/user/${owner.username}/pet/${slug}/edit`}>
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  )}
                  {currentUser && !isOwner && (
                    <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                      <Heart className={`h-4 w-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
              {pet.bio && <p className="text-foreground text-lg leading-relaxed">{pet.bio}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                    <span>{formatDate(pet.birthday)}</span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <span>{pet.weight}</span>
                  </div>
                )}
                {pet.color && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span>{pet.color}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{pet.followers.length}</span>
                  <span className="text-muted-foreground">{pet.followers.length === 1 ? "Follower" : "Followers"}</span>
                </div>
                {pet.friends && pet.friends.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{pet.friends.length}</span>
                    <span className="text-muted-foreground">{pet.friends.length === 1 ? "Friend" : "Friends"}</span>
                  </div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pet.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`${pet.name} photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements & Badges
              </CardTitle>
              <CardDescription>
                {pet.name}
                {"'"}s accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pet.achievements && pet.achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pet.achievements.map((achievement) => (
                    <div key={achievement.id} className="border rounded-lg p-4 text-center">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <p className="font-semibold">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(achievement.earnedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No achievements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
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
                            <div>
                              <p className="font-semibold">{friend.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{friend.species}</p>
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

