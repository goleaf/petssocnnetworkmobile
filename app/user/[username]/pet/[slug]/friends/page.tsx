"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getPetByUsernameAndSlug, getUserById, getPets, getUsers } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { Pet, User } from "@/lib/types"
import { Search, Users, PawPrint, Dog, Cat, Bird, Rabbit, Fish, CircleDot } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

export default function PetFriendsPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [friends, setFriends] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setIsLoading(true)
    const fetchedPet = getPetByUsernameAndSlug(username, slug)

    if (!fetchedPet) {
      router.push(`/user/${username}`)
      return
    }

    setPet(fetchedPet)
    const fetchedOwner = getUserById(fetchedPet.ownerId)
    setOwner(fetchedOwner)

    // Get all friends (other pets)
    if (fetchedPet.friends && fetchedPet.friends.length > 0) {
      const allPets = getPets()
      const friendPets = fetchedPet.friends
        .map((friendId: string) => allPets.find((p) => p.id === friendId))
        .filter(Boolean) as Pet[]
      setFriends(friendPets)
    } else {
      setFriends([])
    }
    setIsLoading(false)
  }, [username, slug, router])

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.species.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getSpeciesIcon = (species: Pet["species"]) => {
    const icons = {
      dog: Dog,
      cat: Cat,
      bird: Bird,
      rabbit: Rabbit,
      hamster: PawPrint,
      fish: Fish,
      other: CircleDot,
    }
    return icons[species] || PawPrint
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !owner) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Pet not found</p>
            <BackButton href={`/user/${username}`} label="Back to Profile" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={getPetUrlFromPet(pet, username)} label={`Back to ${pet.name}'s Profile`} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{pet.name}'s Friends ({friends.length})</CardTitle>
              <CardDescription>{pet.name}'s furry friends</CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => {
                const friendOwner = getUsers().find((u) => u.id === friend.ownerId)
                const friendSlug = friend.slug || friend.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
                const SpeciesIcon = getSpeciesIcon(friend.species)

                return (
                  <Link
                    key={friend.id}
                    href={friendOwner ? `/user/${friendOwner.username}/pet/${friendSlug}` : `/pet/${friend.id}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                            <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                            <AvatarFallback className="text-2xl">{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2 w-full">
                            <h3 className="font-semibold text-lg">{friend.name}</h3>
                            <div className="flex items-center justify-center gap-2">
                              <SpeciesIcon className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline" className="capitalize">
                                {friend.breed || friend.species}
                              </Badge>
                            </div>
                            {friend.age !== undefined && (
                              <p className="text-sm text-muted-foreground">
                                {friend.age} {friend.age === 1 ? "year" : "years"} old
                              </p>
                            )}
                            {friend.bio && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{friend.bio}</p>
                            )}
                            {friendOwner && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Owned by {friendOwner.fullName}
                              </p>
                            )}
                            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>{friend.followers.length} followers</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? "No friends found matching your search" : `${pet.name} doesn't have any friends yet`}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



