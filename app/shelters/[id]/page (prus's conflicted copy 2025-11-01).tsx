"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Phone, Mail, Globe, CheckCircle2, ArrowLeft, Dog, Cat, Bird } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"
import type { Pet } from "@/lib/types"

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

  // Mock pets data organized by categories
  const petsByCategory: Record<string, Pet[]> = {
    dog: [
      {
        id: "shelter-dog-1",
        ownerId: "shelter",
        name: "Buddy",
        species: "dog",
        breed: "Labrador Mix",
        age: 2,
        gender: "male",
        avatar: "/golden-retriever.png",
        bio: "Friendly and energetic, loves to play fetch!",
        photos: ["/golden-retriever.png", "/golden-retriever-playing.png"],
        followers: [],
      },
      {
        id: "shelter-dog-2",
        ownerId: "shelter",
        name: "Luna",
        species: "dog",
        breed: "Husky Mix",
        age: 3,
        gender: "female",
        avatar: "/golden-retriever-puppy.png",
        bio: "Sweet and gentle, perfect family companion.",
        photos: ["/golden-retriever-puppy.png", "/golden-retriever-beach.png"],
        followers: [],
      },
      {
        id: "shelter-dog-3",
        ownerId: "shelter",
        name: "Rocky",
        species: "dog",
        breed: "German Shepherd Mix",
        age: 4,
        gender: "male",
        avatar: "/golden-retriever-running.png",
        bio: "Loyal and protective, great with kids.",
        photos: ["/golden-retriever-running.png", "/dog-agility-course.png"],
        followers: [],
      },
      {
        id: "shelter-dog-4",
        ownerId: "shelter",
        name: "Maya",
        species: "dog",
        breed: "Beagle Mix",
        age: 1,
        gender: "female",
        avatar: "/golden-retriever-swimming.jpg",
        bio: "Playful puppy looking for an active home.",
        photos: ["/golden-retriever-swimming.jpg"],
        followers: [],
      },
      {
        id: "shelter-dog-5",
        ownerId: "shelter",
        name: "Charlie",
        species: "dog",
        breed: "Terrier Mix",
        age: 5,
        gender: "male",
        avatar: "/golden-retriever-sleeping.png",
        bio: "Calm and well-behaved, great for apartments.",
        photos: ["/golden-retriever-sleeping.png"],
        followers: [],
      },
      {
        id: "shelter-dog-6",
        ownerId: "shelter",
        name: "Daisy",
        species: "dog",
        breed: "Golden Retriever Mix",
        age: 2,
        gender: "female",
        avatar: "/golden-retriever-toy.png",
        bio: "Affectionate and intelligent, loves people.",
        photos: ["/golden-retriever-toy.png"],
        followers: [],
      },
    ],
    cat: [
      {
        id: "shelter-cat-1",
        ownerId: "shelter",
        name: "Whiskers",
        species: "cat",
        breed: "Tabby Mix",
        age: 3,
        gender: "male",
        avatar: "/maine-coon-cat.png",
        bio: "Independent and playful, loves catnip toys.",
        photos: ["/maine-coon-cat.png", "/cat-in-box.jpg"],
        followers: [],
      },
      {
        id: "shelter-cat-2",
        ownerId: "shelter",
        name: "Luna",
        species: "cat",
        breed: "Black Domestic Shorthair",
        age: 2,
        gender: "female",
        avatar: "/black-cat-portrait.png",
        bio: "Sweet and shy, needs a quiet home.",
        photos: ["/black-cat-portrait.png", "/black-cat-eyes.jpg"],
        followers: [],
      },
      {
        id: "shelter-cat-3",
        ownerId: "shelter",
        name: "Milo",
        species: "cat",
        breed: "Maine Coon Mix",
        age: 4,
        gender: "male",
        avatar: "/maine-coon-portrait.png",
        bio: "Gentle giant, loves cuddles and attention.",
        photos: ["/maine-coon-portrait.png", "/maine-coon-cat-lounging.jpg"],
        followers: [],
      },
      {
        id: "shelter-cat-4",
        ownerId: "shelter",
        name: "Bella",
        species: "cat",
        breed: "Calico",
        age: 1,
        gender: "female",
        avatar: "/fluffy-cat-sleeping.jpg",
        bio: "Energetic kitten, full of personality!",
        photos: ["/fluffy-cat-sleeping.jpg"],
        followers: [],
      },
      {
        id: "shelter-cat-5",
        ownerId: "shelter",
        name: "Oliver",
        species: "cat",
        breed: "Orange Tabby",
        age: 5,
        gender: "male",
        avatar: "/cat-behavior.png",
        bio: "Friendly and outgoing, great with other pets.",
        photos: ["/cat-behavior.png"],
        followers: [],
      },
    ],
    bird: [
      {
        id: "shelter-bird-1",
        ownerId: "shelter",
        name: "Kiwi",
        species: "bird",
        breed: "Green Cheek Conure",
        age: 2,
        gender: "unknown",
        avatar: "/green-cheek-conure-playing.jpg",
        bio: "Intelligent and social, loves to interact.",
        photos: ["/green-cheek-conure-playing.jpg", "/parrot-waving.jpg"],
        followers: [],
      },
      {
        id: "shelter-bird-2",
        ownerId: "shelter",
        name: "Sunny",
        species: "bird",
        breed: "Cockatiel",
        age: 3,
        gender: "male",
        avatar: "/colorful-parrots.jpg",
        bio: "Musical and friendly, enjoys whistling tunes.",
        photos: ["/colorful-parrots.jpg", "/green-parrot.jpg"],
        followers: [],
      },
      {
        id: "shelter-bird-3",
        ownerId: "shelter",
        name: "Pepper",
        species: "bird",
        breed: "African Grey Mix",
        age: 4,
        gender: "unknown",
        avatar: "/pet-bird-care.jpg",
        bio: "Calm and observant, perfect for experienced owners.",
        photos: ["/pet-bird-care.jpg"],
        followers: [],
      },
    ],
    rabbit: [
      {
        id: "shelter-rabbit-1",
        ownerId: "shelter",
        name: "Cocoa",
        species: "rabbit",
        breed: "Holland Lop",
        age: 1,
        gender: "female",
        avatar: "/cute-rabbits.jpg",
        bio: "Gentle and curious, loves to explore.",
        photos: ["/cute-rabbits.jpg", "/holland-lop-rabbit-eating.jpg"],
        followers: [],
      },
      {
        id: "shelter-rabbit-2",
        ownerId: "shelter",
        name: "Thumper",
        species: "rabbit",
        breed: "Lop Eared Mix",
        age: 2,
        gender: "male",
        avatar: "/lop-rabbit.jpg",
        bio: "Playful and social, great with gentle handling.",
        photos: ["/lop-rabbit.jpg", "/cute-bunny-hopping.jpg"],
        followers: [],
      },
      {
        id: "shelter-rabbit-3",
        ownerId: "shelter",
        name: "Snowflake",
        species: "rabbit",
        breed: "White Angora Mix",
        age: 1,
        gender: "female",
        avatar: "/rabbit-health-care.jpg",
        bio: "Soft and docile, perfect indoor pet.",
        photos: ["/rabbit-health-care.jpg", "/rabbit-room-setup.jpg"],
        followers: [],
      },
    ],
  }

  const categoryInfo: Record<
    string,
    {
      label: string
      icon: React.ReactNode
      color: string
      bgColor: string
    }
  > = {
    dog: {
      label: "Dogs",
      icon: <Dog className="h-5 w-5" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    cat: {
      label: "Cats",
      icon: <Cat className="h-5 w-5" />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    bird: {
      label: "Birds",
      icon: <Bird className="h-5 w-5" />,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    rabbit: {
      label: "Rabbits",
      icon: <Heart className="h-5 w-5" />,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
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

  const handlePetClick = (pet: Pet) => {
    router.push(`/pet/${pet.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton onClick={() => router.back()} label="Back to Shelters" className="mb-4" />

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

      {/* Pets by Category Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Our Available Pets</h2>
          <p className="text-muted-foreground text-lg">Browse our pets organized by category</p>
        </div>

        {Object.entries(petsByCategory).map(([category, pets]) => {
          const info = categoryInfo[category]
          if (!info || pets.length === 0) return null

          return (
            <Card key={category} className="mb-6 overflow-hidden">
              <CardHeader className={`${info.bgColor} border-b`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${info.bgColor} ${info.color}`}>{info.icon}</div>
                  <div>
                    <CardTitle className="text-2xl">{info.label}</CardTitle>
                    <CardDescription className="text-base">{pets.length} available for adoption</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      onClick={() => handlePetClick(pet)}
                      className="group cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                        <Image
                          src={pet.avatar || pet.photos?.[0] || "/placeholder.svg"}
                          alt={pet.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {pet.breed && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <Badge
                              variant="secondary"
                              className="w-full text-xs bg-white/90 dark:bg-gray-800/90 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              {pet.breed}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200">
                          {pet.name}
                        </h3>
                        {pet.age && (
                          <p className="text-xs text-muted-foreground">
                            {pet.age} {pet.age === 1 ? "year" : "years"} old
                            {pet.gender && ` • ${pet.gender}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Support Our Mission</h2>
          <p className="text-muted-foreground text-lg">Choose a sponsorship tier and help us care for animals in need</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {shelter.sponsorshipTiers.map((tier, index) => {
            const isPopular = index === 1 // Middle tier is popular
            const isSelected = selectedTier === tier.id

            return (
              <Card
                key={tier.id}
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  isSelected ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
                } ${isPopular ? "border-2 border-primary shadow-md" : ""}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                    {tier.badge && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 dark:from-pink-900 dark:to-purple-900 dark:text-pink-300">
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        Badge
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        ${tier.amount}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">/month</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-100 dark:fill-green-900" />
                        </div>
                        <span className="text-sm leading-relaxed text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-semibold transition-all ${
                      isPopular
                        ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                        : ""
                    } ${isSelected ? "ring-2 ring-offset-2" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSponsor(tier.id)
                    }}
                    disabled={!user}
                    size="lg"
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isPopular ? "fill-current" : ""}`} />
                    {user ? "Become a Sponsor" : "Login to Sponsor"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
