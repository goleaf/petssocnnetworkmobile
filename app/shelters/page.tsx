"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Phone, Mail, Globe, Search, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock shelters data
const mockShelters = [
  {
    id: "1",
    name: "Happy Paws Animal Shelter",
    description:
      "Dedicated to rescuing and rehoming dogs and cats in need. We provide medical care, training, and love to all our animals.",
    location: "San Francisco, CA",
    website: "https://happypaws.org",
    phone: "(415) 555-0123",
    email: "info@happypaws.org",
    logo: "/animal-shelter-logo.png",
    coverImage: "/animal-shelter-dogs-cats.jpg",
    animalsCount: 45,
    species: ["Dogs", "Cats"],
    verified: true,
    sponsorshipTiers: [
      { id: "1", name: "Friend", amount: 10, benefits: ["Monthly newsletter", "Shelter updates"], badge: undefined },
      {
        id: "2",
        name: "Supporter",
        amount: 25,
        benefits: ["All Friend benefits", "Shelter tour", "10% merch discount"],
        badge: undefined,
      },
      {
        id: "3",
        name: "Champion",
        amount: 50,
        benefits: ["All Supporter benefits", "Sponsor badge", "Annual event invite"],
        badge: "shelter",
      },
    ],
    sponsors: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Feathered Friends Aviary",
    description:
      "Specializing in bird rescue and rehabilitation. We care for parrots, finches, and other avian species.",
    location: "Portland, OR",
    website: "https://featheredfriends.org",
    phone: "(503) 555-0456",
    email: "contact@featheredfriends.org",
    logo: "/bird-rescue-logo.jpg",
    coverImage: "/colorful-parrots.jpg",
    animalsCount: 28,
    species: ["Birds"],
    verified: true,
    sponsorshipTiers: [
      { id: "1", name: "Nest Builder", amount: 15, benefits: ["Monthly updates"], badge: undefined },
      {
        id: "2",
        name: "Wing Supporter",
        amount: 35,
        benefits: ["All Nest Builder benefits", "Sponsor badge"],
        badge: "shelter",
      },
    ],
    sponsors: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Bunny Haven Rescue",
    description:
      "A safe haven for abandoned and neglected rabbits. We provide medical care and find loving forever homes.",
    location: "Seattle, WA",
    website: "https://bunnyhaven.org",
    phone: "(206) 555-0789",
    email: "help@bunnyhaven.org",
    logo: "/rabbit-rescue-logo.jpg",
    coverImage: "/cute-rabbits.jpg",
    animalsCount: 18,
    species: ["Rabbits"],
    verified: true,
    sponsorshipTiers: [
      {
        id: "1",
        name: "Carrot Club",
        amount: 20,
        benefits: ["Monthly newsletter", "Adoption priority"],
        badge: undefined,
      },
      {
        id: "2",
        name: "Bunny Guardian",
        amount: 50,
        benefits: ["All Carrot Club benefits", "Sponsor badge", "Annual calendar"],
        badge: "shelter",
      },
    ],
    sponsors: [],
    createdAt: new Date().toISOString(),
  },
]

export default function SheltersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)

  const filteredShelters = mockShelters.filter((shelter) => {
    const matchesSearch =
      shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSpecies = !selectedSpecies || shelter.species.includes(selectedSpecies)
    return matchesSearch && matchesSpecies
  })

  const allSpecies = Array.from(new Set(mockShelters.flatMap((s) => s.species)))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Animal Shelters</h1>
        <p className="text-muted-foreground">Support local shelters and help animals in need</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shelters by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedSpecies === null ? "default" : "outline"}
            onClick={() => setSelectedSpecies(null)}
            size="sm"
          >
            All
          </Button>
          {allSpecies.map((species) => (
            <Button
              key={species}
              variant={selectedSpecies === species ? "default" : "outline"}
              onClick={() => setSelectedSpecies(species)}
              size="sm"
            >
              {species}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredShelters.map((shelter) => (
          <Card key={shelter.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full">
              <Image src={shelter.coverImage || "/placeholder.svg"} alt={shelter.name} fill className="object-cover" />
            </div>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Image
                  src={shelter.logo || "/placeholder.svg"}
                  alt={`${shelter.name} logo`}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {shelter.name}
                    {shelter.verified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {shelter.location}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{shelter.description}</p>

              <div className="flex flex-wrap gap-2">
                {shelter.species.map((species) => (
                  <Badge key={species} variant="secondary">
                    {species}
                  </Badge>
                ))}
                <Badge variant="outline">{shelter.animalsCount} animals</Badge>
              </div>

              <div className="space-y-2 text-sm">
                {shelter.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {shelter.phone}
                  </div>
                )}
                {shelter.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {shelter.email}
                  </div>
                )}
                {shelter.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Visit website
                    </a>
                  </div>
                )}
              </div>

              <Link href={`/shelters/${shelter.id}`}>
                <Button className="w-full" variant="default">
                  <Heart className="h-4 w-4 mr-2" />
                  Sponsor This Shelter
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShelters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No shelters found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
