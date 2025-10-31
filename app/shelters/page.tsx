"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ViewModeSelector } from "@/components/ui/view-mode-selector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  CheckCircle2,
  Dog,
  Cat,
  Bird,
  Sparkles,
  Users,
  ArrowUpDown,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type SortOption = "name" | "animals" | "location" | "newest"

interface Shelter {
  id: string
  name: string
  description: string
  location: string
  website?: string
  phone?: string
  email?: string
  logo?: string
  coverImage?: string
  animalsCount: number
  species: string[]
  verified: boolean
  featured?: boolean
  sponsorsCount?: number
  createdAt: string
}

// Mock shelters data
const mockShelters: Shelter[] = [
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
    featured: true,
    sponsorsCount: 120,
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
    featured: true,
    sponsorsCount: 45,
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
    sponsorsCount: 32,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Canine Companions Rescue",
    description:
      "Focused on finding forever homes for dogs of all breeds and ages. We provide behavioral training and medical care.",
    location: "Los Angeles, CA",
    website: "https://caninecompanions.org",
    phone: "(323) 555-0234",
    email: "adopt@caninecompanions.org",
    logo: "/animal-shelter-logo.png",
    coverImage: "/golden-retriever-beach.png",
    animalsCount: 62,
    species: ["Dogs"],
    verified: true,
    featured: true,
    sponsorsCount: 180,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Feline Friends Sanctuary",
    description:
      "Cat-only shelter providing a safe space for felines in need. Specializing in senior cats and special needs felines.",
    location: "New York, NY",
    website: "https://felinefriends.org",
    phone: "(212) 555-0567",
    email: "info@felinefriends.org",
    logo: "/animal-shelter-logo.png",
    coverImage: "/maine-coon-cat-lounging.jpg",
    animalsCount: 38,
    species: ["Cats"],
    verified: true,
    sponsorsCount: 95,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Avian Angels Sanctuary",
    description:
      "Rescuing and rehabilitating exotic and domestic birds. We provide specialized care for our feathered friends.",
    location: "Miami, FL",
    website: "https://avianangels.org",
    phone: "(305) 555-0890",
    email: "rescue@avianangels.org",
    logo: "/bird-rescue-logo.jpg",
    coverImage: "/green-cheek-conure-playing.jpg",
    animalsCount: 35,
    species: ["Birds"],
    verified: true,
    sponsorsCount: 58,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Rabbit Rescue Network",
    description:
      "Nationwide network dedicated to rabbit rescue and adoption. We provide education and support for rabbit owners.",
    location: "Austin, TX",
    website: "https://rabbitrescue.org",
    phone: "(512) 555-0123",
    email: "help@rabbitrescue.org",
    logo: "/rabbit-rescue-logo.jpg",
    coverImage: "/holland-lop-rabbit-eating.jpg",
    animalsCount: 22,
    species: ["Rabbits"],
    verified: false,
    sponsorsCount: 28,
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Paws & Claws Shelter",
    description:
      "Mixed animal shelter serving dogs, cats, and small animals. Committed to finding perfect matches for every pet.",
    location: "Chicago, IL",
    website: "https://pawsandclaws.org",
    phone: "(312) 555-0456",
    email: "contact@pawsandclaws.org",
    logo: "/animal-shelter-logo.png",
    coverImage: "/animal-shelter-dogs-cats.jpg",
    animalsCount: 85,
    species: ["Dogs", "Cats"],
    verified: true,
    featured: true,
    sponsorsCount: 210,
    createdAt: new Date().toISOString(),
  },
]

const speciesTabs = [
  { value: "all", label: "All Animals", icon: null, color: null },
  { value: "Dogs", label: "Dogs", icon: Dog, color: "text-amber-500" },
  { value: "Cats", label: "Cats", icon: Cat, color: "text-blue-500" },
  { value: "Birds", label: "Birds", icon: Bird, color: "text-yellow-500" },
  { value: "Rabbits", label: "Rabbits", icon: Heart, color: "text-pink-500" },
]

export default function SheltersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Get unique locations
  const locations = useMemo(() => {
    return Array.from(new Set(mockShelters.map((s) => s.location))).sort()
  }, [])

  // Filter and sort shelters
  const filteredShelters = useMemo(() => {
    let filtered = mockShelters.filter((shelter) => {
      const matchesSearch =
        shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shelter.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shelter.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSpecies = activeTab === "all" || shelter.species.includes(activeTab)

      const matchesLocation = locationFilter === "all" || shelter.location === locationFilter

      return matchesSearch && matchesSpecies && matchesLocation
    })

    // Sort shelters
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "animals":
          return b.animalsCount - a.animalsCount
        case "location":
          return a.location.localeCompare(b.location)
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, activeTab, locationFilter, sortBy])

  const featuredShelters = useMemo(() => {
    return mockShelters.filter((s) => s.featured).slice(0, 3)
  }, [])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAnimals = mockShelters.reduce((sum, s) => sum + s.animalsCount, 0)
    const totalShelters = mockShelters.length
    const totalSponsors = mockShelters.reduce((sum, s) => sum + (s.sponsorsCount || 0), 0)
    return { totalAnimals, totalShelters, totalSponsors }
  }, [])

  const ShelterCard = ({ shelter, isList }: { shelter: Shelter; isList?: boolean }) => (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${isList ? "flex flex-row" : ""}`}>
      <div className={`relative ${isList ? "w-64 h-48 flex-shrink-0" : "h-48 w-full"}`}>
        <Image
          src={shelter.coverImage || "/placeholder.svg"}
          alt={shelter.name}
          fill
          className="object-cover"
        />
        {shelter.featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>
      <div className={`flex-1 ${isList ? "flex flex-col justify-between" : ""}`}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Image
              src={shelter.logo || "/placeholder.svg"}
              alt={`${shelter.name} logo`}
              width={48}
              height={48}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="truncate">{shelter.name}</span>
                {shelter.verified && <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{shelter.location}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 ${isList ? "flex-1" : ""}`}>
          <p className={`text-sm text-muted-foreground ${isList ? "line-clamp-3" : "line-clamp-2"}`}>
            {shelter.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {shelter.species.map((species) => (
              <Badge key={species} variant="secondary" className="text-xs">
                {species}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs">
              {shelter.animalsCount} animals
            </Badge>
            {shelter.sponsorsCount && (
              <Badge variant="outline" className="text-xs">
                {shelter.sponsorsCount} sponsors
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {shelter.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{shelter.phone}</span>
              </div>
            )}
            {shelter.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{shelter.email}</span>
              </div>
            )}
            {shelter.website && (
              <a
                href={shelter.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <Globe className="h-3 w-3" />
                Website
              </a>
            )}
          </div>

          <Link href={`/shelters/${shelter.id}`}>
            <Button className="w-full" variant="default">
              <Heart className="h-4 w-4 mr-2" />
              View Shelter
            </Button>
          </Link>
        </CardContent>
      </div>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Animal Shelters
        </h1>
        <p className="text-muted-foreground text-lg">Support local shelters and help animals in need</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Animals</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalAnimals}</p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Active Shelters</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalShelters}</p>
              </div>
              <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-1">Total Sponsors</p>
                <p className="text-3xl font-bold text-pink-900 dark:text-pink-100">{stats.totalSponsors}</p>
              </div>
              <div className="p-3 bg-pink-200 dark:bg-pink-800 rounded-lg">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Shelters */}
      {featuredShelters.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-2xl font-bold">Featured Shelters</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredShelters.map((shelter) => (
              <ShelterCard key={shelter.id} shelter={shelter} />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shelters by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="animals">Most Animals</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            <ViewModeSelector
              value={viewMode}
              onValueChange={(value) => setViewMode(value)}
              iconVariant="grid3x3"
            />
          </div>
        </div>
      </div>

      {/* Tabs for Animal Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          {speciesTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`gap-2 ${tab.value === "all" ? "pr-6" : ""}`}
              >
                {Icon && tab.color && <Icon className={`h-4 w-4 ${tab.color}`} />}
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {speciesTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            {filteredShelters.length > 0 ? (
              <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {filteredShelters.map((shelter) => (
                  <ShelterCard key={shelter.id} shelter={shelter} isList={viewMode === "list"} />
                ))}
              </div>
            ) : (
              <Card className="py-12">
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-lg mb-2">No shelters found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}