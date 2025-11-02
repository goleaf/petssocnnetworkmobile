"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  getPets,
  getPetsByOwnerId,
  getUsers,
} from "@/lib/storage"
import type {
  Pet,
  User,
} from "@/lib/types"
import { useAuth } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { PawPrint } from "lucide-react"
import { PetNetworkView } from "@/components/friendship-network/pet-network-view"

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export default function FriendshipNetworkPage() {
  const { user, isAuthenticated } = useAuth()
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    setAllPets(getPets())
    setUsers(getUsers())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!isAuthenticated || !user) {
      setMyPets([])
      setSelectedPetId(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const petsOwned = getPetsByOwnerId(user.id)
    setMyPets(petsOwned)

    setSelectedPetId((currentId) => {
      if (currentId && petsOwned.some((pet) => pet.id === currentId)) {
        return currentId
      }
      return petsOwned[0]?.id ?? null
    })

    setAllPets(getPets())
    setIsLoading(false)
  }, [isAuthenticated, user])

  const petLookup = useMemo(() => {
    const map = new Map<string, Pet>()
    allPets.forEach((pet) => map.set(pet.id, pet))
    return map
  }, [allPets])

  const ownerLookup = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((item) => map.set(item.id, item))
    return map
  }, [users])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <Card>
          <CardContent className="p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="p-4 rounded-full bg-primary/10">
              <PawPrint className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <CardTitle className="text-2xl">
                Sign in to build your pet{"'"}s friendship network
              </CardTitle>
              <CardDescription className="text-base">
                Track virtual playdates, nurture best-friend bonds, and discover new pals
                once you{"'"}re logged in.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/">
                  <Button>Go to Login</Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline">
                    Explore the community
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (myPets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <CardTitle className="text-2xl">Add a pet to start connecting</CardTitle>
            <CardDescription className="text-base">
              Once you create a pet profile, we{"'"}ll help map their social circle,
              surface virtual playdates, and recommend new friends.
            </CardDescription>
            <Link href="/dashboard/add-pet">
              <Button>Add a pet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <PawPrint className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Friendship Network</h1>
              <p className="text-muted-foreground">
                Virtual playdates, relationship milestones, and discovery for all your pets
              </p>
            </div>
          </div>
        </div>
      </div>

      {myPets.length === 1 ? (
        <PetNetworkView
          pet={myPets[0]}
          allPets={allPets}
          users={users}
          petLookup={petLookup}
          ownerLookup={ownerLookup}
        />
      ) : (
        <Tabs value={selectedPetId ?? ""} onValueChange={setSelectedPetId} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
            {myPets.map((pet) => (
              <TabsTrigger key={pet.id} value={pet.id} className="flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                <span className="font-medium">{pet.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({toTitleCase(pet.species)})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {myPets.map((pet) => (
            <TabsContent key={pet.id} value={pet.id}>
              <PetNetworkView
                pet={pet}
                allPets={allPets}
                users={users}
                petLookup={petLookup}
                ownerLookup={ownerLookup}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
