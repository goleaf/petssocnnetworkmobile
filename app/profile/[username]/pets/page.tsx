"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUsers, getPets } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { PawPrint, Users, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

export default function PetsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])

  useEffect(() => {
    const foundUser = getUsers().find((u) => u.username === username)
    if (foundUser) {
      setUser(foundUser)
      setPets(getPets().filter((p) => p.ownerId === foundUser.id))
    }
  }, [username])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p className="text-center text-muted-foreground">User not found</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user.id

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href={`/profile/${username}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.fullName}'s Pets</h1>
          <p className="text-muted-foreground">{pets.length} {pets.length === 1 ? "pet" : "pets"}</p>
        </div>
        {isOwnProfile && (
          <Link href={`/profile/${user.username}/add-pet`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Pet
            </Button>
          </Link>
        )}
      </div>

      {pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {pet.breed || pet.species}
                        {pet.age && ` • ${pet.age} ${pet.age === 1 ? "year" : "years"} old`}
                      </p>
                      {pet.bio && <p className="text-sm mt-2 line-clamp-2">{pet.bio}</p>}
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {pet.followers.length} {pet.followers.length === 1 ? "follower" : "followers"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <PawPrint className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">No pets yet</p>
            {isOwnProfile && (
              <Link href={`/profile/${user.username}/add-pet`}>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Pet
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

