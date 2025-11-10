"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { getUserByUsername } from "@/lib/storage"
import { getPetBySlug } from "@/lib/services/pet-service"
import { canViewPet, canEditPet, canFollowPet } from "@/lib/utils/pet-privacy"
import type { Pet, User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Share2,
  ShieldCheck,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { PetStatsBar } from "@/components/pet/pet-stats-bar"

/**
 * Pet Profile Page
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 * 
 * Displays a comprehensive pet profile with:
 * - Hero section with cover photo and profile photo
 * - Pet name with species emoji
 * - Age and breed information
 * - Owner information with link
 * - Follow button for other users
 * - Share button with shareable link
 * - Verified pet badge (if applicable)
 * - Stats bar (followers, photos, posts, age)
 */
export default function PetProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    followers: 0,
    photos: 0,
    posts: 0,
  })

  const username = params.username as string
  const petSlug = params.petSlug as string

  /**
   * Get species emoji for display
   * Requirement 8.3: Display pet name with species emoji
   */
  const getSpeciesEmoji = (species: string): string => {
    const emojiMap: Record<string, string> = {
      dog: "🐕",
      cat: "🐈",
      bird: "🐦",
      rabbit: "🐰",
      hamster: "🐹",
      fish: "🐠",
      other: "🐾",
    }
    return emojiMap[species] || "🐾"
  }

  /**
   * Calculate pet age from birthday
   * Requirement 8.4: Show age below name
   */
  const calculateAge = (birthday: string | undefined): string => {
    if (!birthday) return "Age unknown"
    
    const birthDate = new Date(birthday)
    const today = new Date()
    const years = today.getFullYear() - birthDate.getFullYear()
    const months = today.getMonth() - birthDate.getMonth()
    
    let ageYears = years
    let ageMonths = months
    
    if (months < 0) {
      ageYears--
      ageMonths = 12 + months
    }
    
    if (ageYears === 0) {
      return `${ageMonths} ${ageMonths === 1 ? "month" : "months"} old`
    } else if (ageMonths === 0) {
      return `${ageYears} ${ageYears === 1 ? "year" : "years"} old`
    } else {
      return `${ageYears} ${ageYears === 1 ? "year" : "years"}, ${ageMonths} ${ageMonths === 1 ? "month" : "months"} old`
    }
  }

  /**
   * Load pet profile data
   * Requirement 8.1: Display hero section with cover photo banner
   */
  const loadPetProfile = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Get owner first
      const fetchedOwner = getUserByUsername(username)
      if (!fetchedOwner) {
        router.push("/")
        return
      }
      
      setOwner(fetchedOwner)
      
      // Get pet by slug
      const fetchedPet = await getPetBySlug(petSlug, fetchedOwner.id)
      if (!fetchedPet) {
        router.push(`/user/${username}`)
        return
      }
      
      // Check privacy permissions
      const viewerId = currentUser?.id || null
      if (!canViewPet(fetchedPet, viewerId)) {
        router.push(`/user/${username}`)
        return
      }
      
      setPet(fetchedPet)
      
      // Calculate stats
      setStats({
        followers: fetchedPet.followers?.length || 0,
        photos: fetchedPet.photos?.length || 0,
        posts: 0, // TODO: Implement post counting
      })
      
      // Check if current user is following
      if (currentUser && fetchedPet.followers) {
        setIsFollowing(fetchedPet.followers.includes(currentUser.id))
      }
    } catch (error) {
      console.error("Error loading pet profile:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }, [username, petSlug, currentUser, router])

  useEffect(() => {
    loadPetProfile()
  }, [loadPetProfile])

  /**
   * Handle follow/unfollow action
   * Requirement 8.7: Implement follow button for other users
   */
  const handleFollow = async () => {
    if (!currentUser || !pet) return
    
    // TODO: Implement follow API call
    // For now, toggle local state
    setIsFollowing(!isFollowing)
    setStats(prev => ({
      ...prev,
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
    }))
  }

  /**
   * Handle share action
   * Requirement 8.8: Create share button with shareable link generation
   */
  const handleShare = async () => {
    if (!pet || !owner) return
    
    const shareUrl = `${window.location.origin}/pet/${owner.username}/${pet.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pet.name}'s Profile`,
          text: `Check out ${pet.name} on Pet Social!`,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or share failed, fallback to clipboard
        copyToClipboard(shareUrl)
      }
    } else {
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Show toast notification
    alert("Link copied to clipboard!")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pet profile...</p>
        </div>
      </div>
    )
  }

  if (!pet || !owner) {
    return null
  }

  const isOwner = currentUser?.id === owner.id
  const canEdit = isOwner || canEditPet(pet, currentUser?.id || null)
  const canFollow = canFollowPet(pet, currentUser?.id || null)
  const isVerified = false // TODO: Implement verified pet badge logic

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
        {/* Hero Section - Requirement 8.1, 8.2 */}
        <Card className="mb-6 overflow-hidden">
          {/* Cover Photo Banner - Requirement 8.1 */}
          <div className="relative h-48 sm:h-64 lg:h-80 bg-linear-to-br from-primary/20 via-primary/10 to-background">
            {pet.avatar && (
              <img
                src={pet.avatar}
                alt={`${pet.name}'s cover`}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Profile Photo Overlay - Requirement 8.2 */}
            <div className="absolute bottom-0 left-6 transform translate-y-1/2">
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 border-4 border-background shadow-xl">
                <AvatarImage 
                  src={pet.avatar || "/placeholder.svg"} 
                  alt={pet.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl">
                  {getSpeciesEmoji(pet.species)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <CardContent className="pt-20 sm:pt-24 lg:pt-28 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                {/* Pet Name with Species Emoji - Requirement 8.3 */}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                    {getSpeciesEmoji(pet.species)} {pet.name}
                  </h1>
                  {/* Verified Badge - Requirement 8.8 */}
                  {isVerified && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Age and Breed - Requirement 8.4 */}
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-3">
                  {pet.breed && (
                    <span className="text-lg">{pet.breed}</span>
                  )}
                  {pet.birthday && (
                    <>
                      <span>•</span>
                      <span className="text-lg">{calculateAge(pet.birthday)}</span>
                    </>
                  )}
                </div>

                {/* Owner Information - Requirement 8.5 */}
                <Link 
                  href={`/user/${owner.username}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={owner.avatar || "/placeholder.svg"} alt={owner.fullName} />
                    <AvatarFallback>{owner.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>Owned by @{owner.username}</span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Follow Button - Requirement 8.7 */}
                {!isOwner && canFollow && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}

                {/* Share Button - Requirement 8.8 */}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>

                {/* Edit Button (for owners) */}
                {canEdit && (
                  <Button
                    onClick={() => router.push(`/pet/${owner.username}/${pet.slug}/edit`)}
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Bar - Requirement 8.5, 8.6 */}
        <PetStatsBar
          followers={stats.followers}
          photos={stats.photos}
          posts={stats.posts}
          age={pet.birthday ? calculateAge(pet.birthday) : "Age unknown"}
          onFollowersClick={() => {
            // TODO: Navigate to followers section or modal
            console.log("Navigate to followers")
          }}
          onPhotosClick={() => {
            // TODO: Navigate to photos tab
            console.log("Navigate to photos tab")
          }}
          onPostsClick={() => {
            // TODO: Navigate to posts tab
            console.log("Navigate to posts tab")
          }}
        />

        {/* Bio Section */}
        {pet.bio && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-muted-foreground whitespace-pre-wrap">{pet.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Placeholder for Tabbed Content (to be implemented in future tasks) */}
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Tabbed content (About, Photos, Posts, Health, Documents) will be implemented in upcoming tasks.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
