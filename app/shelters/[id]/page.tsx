"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Phone, Mail, Globe, CheckCircle2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

export default function ShelterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  // Mock shelter data
  const shelter = {
    id: params.id,
    name: "Happy Paws Animal Shelter",
    description:
      "Dedicated to rescuing and rehoming dogs and cats in need. We provide medical care, training, and love to all our animals. Our mission is to create a world where every pet has a loving home.",
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
        benefits: [
          "All Supporter benefits",
          "Sponsor badge on profile",
          "Annual event invite",
          "Recognition on shelter website",
        ],
        badge: "shelter",
      },
    ],
    sponsors: [],
    createdAt: new Date().toISOString(),
  }

  const handleSponsor = (tierId: string) => {
    if (!user) {
      toast.error("Please log in to sponsor a shelter")
      return
    }

    const tier = shelter.sponsorshipTiers.find((t) => t.id === tierId)
    if (!tier) return

    // In a real app, this would process payment
    toast.success(`Thank you for sponsoring ${shelter.name} at the ${tier.name} level!`)
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Shelters
      </Button>

      <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-6">
        <Image src={shelter.coverImage || "/placeholder.svg"} alt={shelter.name} fill className="object-cover" />
      </div>

      <div className="flex items-start gap-4 mb-6">
        <Image
          src={shelter.logo || "/placeholder.svg"}
          alt={`${shelter.name} logo`}
          width={80}
          height={80}
          className="rounded-full"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {shelter.name}
            {shelter.verified && <CheckCircle2 className="h-6 w-6 text-blue-500" />}
          </h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {shelter.location}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shelter.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {shelter.phone}
              </div>
            )}
            {shelter.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {shelter.email}
              </div>
            )}
            {shelter.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Visit website
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{shelter.animalsCount}</div>
            <div className="flex flex-wrap gap-2">
              {shelter.species.map((species) => (
                <Badge key={species} variant="secondary">
                  {species}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{shelter.sponsors.length}</div>
            <p className="text-sm text-muted-foreground">Active sponsors</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{shelter.description}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Sponsorship Tiers</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {shelter.sponsorshipTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`cursor-pointer transition-all ${selectedTier === tier.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  {tier.badge && (
                    <Badge variant="secondary">
                      <Heart className="h-3 w-3 mr-1" />
                      Badge
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">${tier.amount}</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => handleSponsor(tier.id)} disabled={!user}>
                  <Heart className="h-4 w-4 mr-2" />
                  Sponsor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
