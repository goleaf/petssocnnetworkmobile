"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateButton } from "@/components/ui/create-button"
import { StoriesBar } from "@/components/stories/StoriesBar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PrivacySelector } from "@/components/privacy-selector"
import { getBlogPosts, getPets, getUsers, getPetsByOwnerId, addBlogPost, deleteBlogPost, togglePostReaction, toggleFollow, getCommentsByPostId, getPlaces, getPlaceById, getHiddenPostIds, toggleHiddenPost, isPostSaved, toggleSavedPost, getUserConversations, getDirectMessagesByConversation, updateBlogPost, getPollVotesByPollId, getUserPollVote, addPollVote, getEventRSVPsByEventId, getUserEventRSVP, addEventRSVP, updateEventRSVP, generateStorageId, createConversation, ensureDefaultSavedCollection, addPostToSavedCollection, addViewEvent } from "@/lib/storage"
import { createNotification } from "@/lib/notifications"
import { PawPrint, Heart, Users, BookOpen, FileText, TrendingUp, MessageCircle, Share2, MoreHorizontal, Globe, UsersIcon, Lock, Edit2, Trash2, Smile, Plus, Send, UserPlus, Rocket, Video, Link2, ExternalLink, ShieldCheck, Pin, Home, Compass, MapPin, Bookmark, BookmarkCheck, EyeOff, Flag, Filter } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils/date"
import type { BlogPost, BlogPostMedia, Pet, User as UserType, ReactionType, PrivacyLevel, PostPoll, PollVote } from "@/lib/types"
import { detectPostLanguage, isPreferredLanguage } from "@/lib/utils/language"
import { useLocale } from 'next-intl'
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { canViewPost } from "@/lib/utils/privacy"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { MediaGallery } from "@/components/media-gallery"
import { getFriendSuggestions, type FriendSuggestion } from "@/lib/friend-suggestions"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import { PostContent } from "@/components/post/post-content"
import PostMedia from "@/components/post/PostMedia"
import { PinnedItems } from "@/components/pinned-items"
import { PinButton } from "@/components/ui/pin-button"
import { rankPosts } from "@/lib/utils/post-ranking"
import { getPostAnalytics } from "@/lib/utils/post-analytics"
import { sortPostsByScore } from "@/lib/utils/feed-ranking"
import { diversifyAndInjectFeed, diversifyPosts } from "@/lib/utils/feed-diversity"
import type { Place } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NewPostsBanner from "@/components/feed/NewPostsBanner"
import VirtualizedList from "@/components/feed/VirtualizedList"
import PullToRefresh from "@/components/feed/PullToRefresh"
import { getSeenPostIds, markPostSeen, getFeedLastVisitAt, setFeedLastVisitAt } from "@/lib/storage"
import { EventReminderScheduler } from "@/components/events/EventReminderScheduler"
import { ListingExpiryScheduler } from "@/components/market/ListingExpiryScheduler"
import { PostInteractionBar } from "@/components/post/post-interaction-bar"
import { InlineComments } from "@/components/comments/InlineComments"
import { RelativeTime } from "@/components/ui/relative-time"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePreferences } from "@/lib/preferences"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import type { DateRange } from "react-day-picker"

const STORAGE_KEYS_TO_WATCH = ["pet_social_users", "pet_social_pets"]

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Array<{ label: string; value: number; icon: any }>>([
    { label: "Active Users", value: 0, icon: Users },
    { label: "Pets", value: 0, icon: PawPrint },
    { label: "Blog Posts", value: 0, icon: BookOpen },
  ])

  // Feed state
  const [activeFeed, setActiveFeed] = useState<"home" | "explore" | "following" | "local" | "mypets">("home")
  const [homeFeedPosts, setHomeFeedPosts] = useState<BlogPost[]>([])
  const [exploreFeedPosts, setExploreFeedPosts] = useState<BlogPost[]>([])
  const [followingFeedPosts, setFollowingFeedPosts] = useState<BlogPost[]>([])
  const [localFeedPosts, setLocalFeedPosts] = useState<BlogPost[]>([])
  const [myPetsFeedPosts, setMyPetsFeedPosts] = useState<BlogPost[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<FriendSuggestion[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostPrivacy, setNewPostPrivacy] = useState<PrivacyLevel>("public")
  const [selectedPet, setSelectedPet] = useState("")
  const [isFeedLoading, setIsFeedLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const locale = useLocale()

  // Feed filters
  type DatePreset = "today" | "week" | "month" | "all" | "custom"
  interface FeedFilters {
    contentTypes: string[]
    myPets: boolean
    specificPetId: string
    hasLocationTag: boolean
    hasPriceTag: boolean
    datePreset: DatePreset
    customDate: DateRange | undefined
  }
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [feedFilters, setFeedFilters] = useState<FeedFilters>({
    contentTypes: [],
    myPets: false,
    specificPetId: "",
    hasLocationTag: false,
    hasPriceTag: false,
    datePreset: "all",
    customDate: undefined,
  })

  const followedPetsList = useMemo(() => {
    if (!user) return [] as Pet[]
    const all = getPets()
    const ids = new Set<string>(user.followingPets || [])
    return all.filter((p) => ids.has(p.id))
  }, [user?.id])

  const countActiveFilters = useCallback((): number => {
    let count = 0
    if (feedFilters.contentTypes.length > 0) count++
    if (feedFilters.myPets) count++
    if (feedFilters.specificPetId) count++
    if (feedFilters.hasLocationTag) count++
    if (feedFilters.hasPriceTag) count++
    if (feedFilters.datePreset === "custom") {
      if (feedFilters.customDate?.from || feedFilters.customDate?.to) count++
    } else if (feedFilters.datePreset !== "all") {
      count++
    }
    return count
  }, [feedFilters])

  const clearAllFilters = useCallback(() => {
    setFeedFilters({
      contentTypes: [],
      myPets: false,
      specificPetId: "",
      hasLocationTag: false,
      hasPriceTag: false,
      datePreset: "all",
      customDate: undefined,
    })
  }, [])

  // Real-time/new-posts + seen/highlight state
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [recentlyInsertedIds, setRecentlyInsertedIds] = useState<Set<string>>(new Set())
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [lastVisitAt, setLastVisitAt] = useState<string | undefined>(undefined)

  const places = useMemo(() => getPlaces(), [])
  const placesMap = useMemo(() => {
    const m = new Map<string, Place>()
    for (const p of places) m.set(p.id, p)
    return m
  }, [places])

  // Apply filters to a post list
  const getFilteredPosts = useCallback((posts: BlogPost[]): BlogPost[] => {
    let result = posts

    // Content types (OR between selected types)
    if (feedFilters.contentTypes.length > 0) {
      result = result.filter((post) => {
        const media = post.media || { images: [], videos: [], links: [] }
        const hasPhotos = (media.images?.length || 0) > 0
        const hasVideos = (media.videos?.length || 0) > 0
        const isTextOnly = !hasPhotos && !hasVideos && !post.poll
        const isPoll = Boolean(post.poll)
        const isShared = (media.links?.length || 0) > 0

        return feedFilters.contentTypes.some((t) => {
          switch (t) {
            case "photos":
              return hasPhotos
            case "videos":
              return hasVideos
            case "text":
              return isTextOnly
            case "polls":
              return isPoll
            case "shared":
              return isShared
            default:
              return false
          }
        })
      })
    }

    // Posts with: My Pets and/or Specific Pet (union)
    if (feedFilters.myPets || feedFilters.specificPetId) {
      const allowed = new Set<string>()
      if (feedFilters.myPets) {
        for (const p of myPets) allowed.add(p.id)
      }
      if (feedFilters.specificPetId) allowed.add(feedFilters.specificPetId)
      result = result.filter((p) => allowed.has(p.petId))
    }

    // Location tag (requires placeId)
    if (feedFilters.hasLocationTag) {
      result = result.filter((p) => Boolean(p.placeId))
    }

    // Price tag (approximate to marketplace-like tags/categories)
    if (feedFilters.hasPriceTag) {
      const hasPrice = (p: BlogPost) => {
        const tags = (p.tags || []).map((t) => t.toLowerCase())
        const cats = (p.categories || []).map((t) => t.toLowerCase())
        const keys = ["sale", "for-sale", "market", "marketplace", "price", "$"]
        return tags.some((t) => keys.includes(t)) || cats.some((t) => keys.includes(t))
      }
      result = result.filter(hasPrice)
    }

    // Date range
    if (feedFilters.datePreset !== "all") {
      const now = new Date()
      let from: Date | undefined
      let to: Date | undefined

      switch (feedFilters.datePreset) {
        case "today": {
          const start = new Date(now)
          start.setHours(0, 0, 0, 0)
          from = start
          to = now
          break
        }
        case "week": {
          const start = new Date(now)
          start.setDate(now.getDate() - 7)
          from = start
          to = now
          break
        }
        case "month": {
          const start = new Date(now)
          start.setMonth(now.getMonth() - 1)
          from = start
          to = now
          break
        }
        case "custom": {
          from = feedFilters.customDate?.from
          to = feedFilters.customDate?.to ?? feedFilters.customDate?.from
          break
        }
      }

      if (from) {
        result = result.filter((p) => new Date(p.createdAt) >= from!)
      }
      if (to) {
        result = result.filter((p) => new Date(p.createdAt) <= to!)
      }
    }

    return result
  }, [feedFilters, myPets])

  const filteredHomePosts = useMemo(() => getFilteredPosts(homeFeedPosts), [homeFeedPosts, getFilteredPosts])
  const filteredExplorePosts = useMemo(() => getFilteredPosts(exploreFeedPosts), [exploreFeedPosts, getFilteredPosts])
  const filteredFollowingPosts = useMemo(() => getFilteredPosts(followingFeedPosts), [followingFeedPosts, getFilteredPosts])
  const filteredLocalPosts = useMemo(() => getFilteredPosts(localFeedPosts), [localFeedPosts, getFilteredPosts])
  const filteredMyPetsPosts = useMemo(() => getFilteredPosts(myPetsFeedPosts), [myPetsFeedPosts, getFilteredPosts])

  const refreshFeatured = useCallback(() => {
    const posts = getBlogPosts()
    const users = getUsers()
    const viewerId = user?.id || null

    const visiblePosts = posts.filter((post) => {
      const author = users.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      
      // Only show published or scheduled posts
      const status = post.queueStatus || (post.isDraft ? "draft" : "published")
      if (status !== "published" && status !== "scheduled") return false
      
      // Check if scheduled post should be visible (if scheduledAt is in the past or now)
      // Use a consistent reference time to avoid hydration mismatches
      if (status === "scheduled" && post.scheduledAt) {
        const scheduledDate = new Date(post.scheduledAt)
        // Only check on client side, otherwise allow scheduled posts through
        // They will be filtered client-side if needed
        if (typeof window !== 'undefined' && scheduledDate > new Date()) {
          return false // Don't show future scheduled posts
        }
      }
      
      return canViewPost(post, author, viewerId)
    })

    // Prioritize featured posts from queue, then sort by likes
    const featured = [...visiblePosts].sort((a, b) => {
      // First, prioritize featuredOnHomepage posts
      if (a.featuredOnHomepage && !b.featuredOnHomepage) return -1
      if (!a.featuredOnHomepage && b.featuredOnHomepage) return 1
      
      // Then sort by likes/reactions
      const aLikes = a.reactions
        ? Object.values(a.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : a.likes.length
      const bLikes = b.reactions
        ? Object.values(b.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : b.likes.length
      return bLikes - aLikes
    })

    setFeaturedPosts(featured.slice(0, 6))

    setStats([
      { label: "Active Users", value: users.length, icon: Users },
      { label: "Pets", value: getPets().length, icon: PawPrint },
      { label: "Blog Posts", value: posts.length, icon: BookOpen },
    ])

    setIsLoading(false)
  }, [user?.id])

  const computeFeeds = useCallback(() => {
    if (!user) {
      setHomeFeedPosts([])
      setExploreFeedPosts([])
      setFollowingFeedPosts([])
      setLocalFeedPosts([])
      setMyPetsFeedPosts([])
      return
    }

    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    const allPets = getPets()
    const hidden = getHiddenPostIds(user.id)
    const seenSet = new Set<string>(getSeenPostIds(user.id))

    const preferred = user.displayPreferences?.preferredContentLanguages || []
    const strict = Boolean(user.displayPreferences?.strictLanguageFilter)
    const showSponsored = user.displayPreferences?.showSponsoredPosts !== false
    const allowExplore = user.displayPreferences?.showExploreContent !== false
    const allowSuggested = user.displayPreferences?.showSuggestedPosts !== false
    const mutedUserIds = new Set<string>(user.mutedUsers || [])

    // Helper: language filter when strict is enabled
    const applyLanguageFilter = (posts: BlogPost[]): BlogPost[] => {
      if (!strict || preferred.length === 0) return posts
      return posts.filter((p) => isPreferredLanguage(detectPostLanguage(p), preferred))
    }

    // Visible posts per privacy
    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      if (!canViewPost(post, author, user.id)) return false
      if (hidden.includes(post.id)) return false
      // Exclude posts by muted users
      if (mutedUserIds.has(post.authorId)) return false
      // Exclude sponsored/promoted posts if user disabled them
      if (!showSponsored && (post.isPromoted || post.promotionStatus === "approved")) return false
      // Exclude posts containing user-muted keywords entirely
      const muted = user.displayPreferences?.mutedKeywords || []
      if (muted.length > 0) {
        const hay = `${post.title || ""} ${post.content || ""} ${
          (post.hashtags || []).join(" ")
        } ${(post.tags || []).join(" ")}`.toLowerCase()
        for (const kw of muted) {
          if (kw && hay.includes(kw.toLowerCase())) return false
        }
      }
      return true
    })

    // Build comment counts map once for ranking
    const commentCounts = new Map<string, number>()
    for (const post of visiblePosts) {
      commentCounts.set(post.id, getCommentsByPostId(post.id).length)
    }

    // Build personalized context for ranking: affinity, content-type, topics
    const followingIds = new Set<string>(user.following || [])
    const mutualFollowingIds = new Set<string>((user.following || []).filter((fid) => {
      const other = allUsers.find((u) => u.id === fid)
      return other?.following?.includes(user.id)
    }))

    const interactionsByAuthor = new Map<string, { reactions: number; comments: number; views?: number; messages?: number }>()
    const contentTypePreference = { photo: 0, video: 0, text: 0 }
    const topicPreferences = new Map<string, number>()

    const bumpInteraction = (authorId: string, type: 'reaction'|'comment') => {
      const cur = interactionsByAuthor.get(authorId) || { reactions: 0, comments: 0, views: 0, messages: 0 }
      if (type === 'reaction') cur.reactions += 1
      else cur.comments += 1
      interactionsByAuthor.set(authorId, cur)
    }

    // Aggregate engagement history for preferences and affinity
    for (const p of allPosts) {
      const reacted = p.reactions
        ? Object.values(p.reactions).some((arr) => Array.isArray(arr) && arr.includes(user.id))
        : (p.likes || []).includes(user.id)
      if (reacted) {
        bumpInteraction(p.authorId, 'reaction')
        const hasVideo = Boolean(p.media?.videos?.length)
        const hasPhoto = Boolean(p.media?.images?.length)
        if (hasVideo) contentTypePreference.video += 1
        else if (hasPhoto) contentTypePreference.photo += 1
        else contentTypePreference.text += 1
        ;(p.hashtags || p.tags || []).forEach((t) => {
          if (typeof t === 'string' && t.trim()) {
            const key = t.trim().toLowerCase()
            topicPreferences.set(key, (topicPreferences.get(key) || 0) + 1)
          }
        })
      }
      const comments = getCommentsByPostId(p.id)
      const myComments = comments.filter((c) => c.userId === user.id)
      if (myComments.length > 0) {
        for (let i = 0; i < myComments.length; i++) bumpInteraction(p.authorId, 'comment')
        const hasVideo = Boolean(p.media?.videos?.length)
        const hasPhoto = Boolean(p.media?.images?.length)
        if (hasVideo) contentTypePreference.video += 1
        else if (hasPhoto) contentTypePreference.photo += 1
        else contentTypePreference.text += 1
        ;(p.hashtags || p.tags || []).forEach((t) => {
          if (typeof t === 'string' && t.trim()) {
            const key = t.trim().toLowerCase()
            topicPreferences.set(key, (topicPreferences.get(key) || 0) + 1)
          }
        })
      }
    }

    // Messages with authors (use total messages in conversations with that author as a rough proxy)
    try {
      const conversations = getUserConversations(user.id)
      for (const conv of conversations) {
        const dmCount = getDirectMessagesByConversation(conv.id).length
        if (dmCount === 0) continue
        for (const pid of conv.participantIds) {
          if (pid === user.id) continue
          const cur = interactionsByAuthor.get(pid) || { reactions: 0, comments: 0, views: 0, messages: 0 }
          cur.messages = (cur.messages || 0) + dmCount
          interactionsByAuthor.set(pid, cur)
        }
      }
    } catch {}

    // Determine following relationships
    const followedUserIds = new Set<string>(user.following || [])
    const followedPetIds = new Set<string>(user.followingPets || [])

    // Home Feed: followed users/pets ranked algorithmically
    const homeCandidates = visiblePosts.filter((post) => {
      const pet = allPets.find((p) => p.id === post.petId)
      const isFollowingUser = followedUserIds.has(post.authorId)
      const isFollowingPet = pet ? pet.followers?.includes(user.id) || followedPetIds.has(pet.id) : false
      if (!(isFollowingUser || isFollowingPet)) return false
      if (seenSet.has(post.id)) return false
      return true
    })
    // Personalized Home Feed ranking (affinity, content type, topic relevance + core signals)
    const homeRanked = rankPosts(
      applyLanguageFilter(homeCandidates),
      commentCounts,
      placesMap,
      userLocation,
      {},
      {
        currentUserId: user.id,
        followingIds,
        mutualFollowingIds,
        interactionsByAuthor,
        contentTypePreference,
        topicPreferences,
        userInterests: new Set<string>(user.interests || []),
      },
    )
    const homeDiversified = diversifyPosts(homeRanked, { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 })
    const homeFinal = allowSuggested && allowExplore
      ? diversifyAndInjectFeed(
          homeDiversified,
          visiblePosts,
          user as UserType,
          allUsers,
          allPets,
          [5, 15, 30, 50],
          { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 }
        )
      : homeDiversified
    setHomeFeedPosts(homeFinal)

    // Explore Feed: public posts from anyone, ranked
    const exploreCandidates = allowExplore ? visiblePosts.filter((post) => (post.privacy || "public") === "public") : []
    const exploreRanked = rankPosts(
      applyLanguageFilter(exploreCandidates),
      commentCounts,
      placesMap,
      userLocation,
      {},
      {
        currentUserId: user.id,
        followingIds: followingIds,
        mutualFollowingIds,
        interactionsByAuthor,
        contentTypePreference,
        topicPreferences,
        userInterests: new Set<string>(user.interests || []),
        mutedKeywords: user.displayPreferences?.mutedKeywords,
      }
    )
    const exploreDiversified = diversifyPosts(exploreRanked, { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 })
    const exploreFinal = allowSuggested && allowExplore
      ? diversifyAndInjectFeed(
          exploreDiversified,
          visiblePosts,
          user as UserType,
          allUsers,
          allPets,
          [5, 15, 30, 50],
          { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 }
        )
      : exploreDiversified
    setExploreFeedPosts(exploreFinal)

    // Following Feed: strictly chronological from followed users/pets
    const followingCandidates = visiblePosts.filter((post) => {
      const pet = allPets.find((p) => p.id === post.petId)
      const isFollowingUser = followedUserIds.has(post.authorId)
      const isFollowingPet = pet ? pet.followers?.includes(user.id) || followedPetIds.has(pet.id) : false
      return isFollowingUser || isFollowingPet
    })
    const followingChrono = applyLanguageFilter(followingCandidates).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const followingDiversified = diversifyPosts(followingChrono, { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 })
    setFollowingFeedPosts(followingDiversified)

    // Local Feed: posts with places near the user
    const MAX_KM = 50
    const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLng = ((lng2 - lng1) * Math.PI) / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }
    const localCandidates = visiblePosts.filter((post) => {
      if (!post.placeId || !userLocation) return false
      const place = placesMap.get(post.placeId)
      if (!place) return false
      const d = distanceKm(userLocation.lat, userLocation.lng, place.lat, place.lng)
      return d <= MAX_KM
    })
    const localRanked = rankPosts(
      applyLanguageFilter(localCandidates),
      commentCounts,
      placesMap,
      userLocation,
      {},
      {
        currentUserId: user.id,
        followingIds: followingIds,
        mutualFollowingIds,
        interactionsByAuthor,
        contentTypePreference,
        topicPreferences,
        userInterests: new Set<string>(user.interests || []),
        mutedKeywords: user.displayPreferences?.mutedKeywords,
      }
    )
    setLocalFeedPosts(localRanked)

    // My Pets Feed: posts featuring my pets (from me or others who tag them)
    const myPetIds = new Set<string>(myPets.map((p) => p.id))
    const myPetsCandidates = visiblePosts.filter((post) => myPetIds.has(post.petId))
    const myPetsChrono = applyLanguageFilter(myPetsCandidates).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setMyPetsFeedPosts(myPetsChrono)
  }, [user, userLocation, myPets, placesMap])

  // Visible count for infinite paging
  // Infinite scroll pagination
  type FeedTab = "home" | "explore" | "following" | "local" | "mypets"
  const MAX_LOADED = 200
  const BATCH = 20
  const [loadedCounts, setLoadedCounts] = useState<Record<FeedTab, number>>({ home: BATCH, explore: BATCH, following: BATCH, local: BATCH, mypets: BATCH })
  const [loadingMore, setLoadingMore] = useState(false)

  // Helper: list accessor for current tab
  const getActiveFeedList = useCallback((): BlogPost[] => {
    switch (activeFeed) {
      case "explore":
        return exploreFeedPosts
      case "following":
        return followingFeedPosts
      case "local":
        return localFeedPosts
      case "mypets":
        return myPetsFeedPosts
      default:
        return homeFeedPosts
    }
  }, [activeFeed, homeFeedPosts, exploreFeedPosts, followingFeedPosts, localFeedPosts, myPetsFeedPosts])

  // Build only the active feed list (mirrors logic inside computeFeeds)
  const buildActiveFeed = useCallback((which: typeof activeFeed): BlogPost[] => {
    if (!user) return []
    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    const allPets = getPets()
    const preferred = user.displayPreferences?.preferredContentLanguages || []
    const strict = Boolean(user.displayPreferences?.strictLanguageFilter)
    const showSponsored = user.displayPreferences?.showSponsoredPosts !== false
    const allowExplore = user.displayPreferences?.showExploreContent !== false
    const mutedUserIds = new Set<string>(user.mutedUsers || [])
    const applyLanguageFilter = (posts: BlogPost[]): BlogPost[] => {
      if (!strict || preferred.length === 0) return posts
      return posts.filter((p) => isPreferredLanguage(detectPostLanguage(p), preferred))
    }
    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      if (!canViewPost(post, author, user.id)) return false
      if (mutedUserIds.has(post.authorId)) return false
      if (!showSponsored && (post.isPromoted || post.promotionStatus === "approved")) return false
      const muted = user.displayPreferences?.mutedKeywords || []
      if (muted.length > 0) {
        const hay = `${post.title || ""} ${post.content || ""} ${(post.hashtags || []).join(" ")} ${(post.tags || []).join(" ")}`.toLowerCase()
        for (const kw of muted) {
          if (kw && hay.includes(kw.toLowerCase())) return false
        }
      }
      return true
    })
    const followedUserIds = new Set<string>(user.following || [])
    const followedPetIds = new Set<string>(user.followingPets || [])
    const isFollowCandidate = (post: BlogPost) => {
      const pet = allPets.find((p) => p.id === post.petId)
      const isFollowingUser = followedUserIds.has(post.authorId)
      const isFollowingPet = pet ? pet.followers?.includes(user.id) || followedPetIds.has(pet.id) : false
      return isFollowingUser || isFollowingPet
    }
    if (which === "home") {
      const candidates = visiblePosts.filter(isFollowCandidate).filter((p) => !seenIds.has(p.id))
      const commentCounts = new Map<string, number>()
      for (const post of candidates) commentCounts.set(post.id, getCommentsByPostId(post.id).length)
      return rankPosts(applyLanguageFilter(candidates), commentCounts, placesMap, userLocation)
    }
    if (which === "explore") {
      const candidates = allowExplore ? visiblePosts.filter((post) => (post.privacy || "public") === "public") : []
      const commentCounts = new Map<string, number>()
      for (const post of candidates) commentCounts.set(post.id, getCommentsByPostId(post.id).length)
      return rankPosts(applyLanguageFilter(candidates), commentCounts, placesMap, userLocation)
    }
    if (which === "following") {
      const candidates = visiblePosts.filter(isFollowCandidate)
      return applyLanguageFilter(candidates).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    if (which === "local") {
      if (!userLocation) return []
      const MAX_KM = 50
      const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLng = ((lng2 - lng1) * Math.PI) / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
      }
      const candidates = visiblePosts.filter((post) => {
        if (!post.placeId) return false
        const place = placesMap.get(post.placeId)
        if (!place) return false
        const d = distanceKm(userLocation.lat, userLocation.lng, place.lat, place.lng)
        return d <= MAX_KM
      })
      const commentCounts = new Map<string, number>()
      for (const post of candidates) commentCounts.set(post.id, getCommentsByPostId(post.id).length)
      return rankPosts(applyLanguageFilter(candidates), commentCounts, placesMap, userLocation)
    }
    // mypets
    const myPetIds = new Set<string>(myPets.map((p) => p.id))
    const candidates = visiblePosts.filter((post) => myPetIds.has(post.petId))
    return applyLanguageFilter(candidates).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activeFeed, user, myPets, placesMap, userLocation, seenIds])

  // Active filtered list helper
  const getFilteredActive = useCallback((): BlogPost[] => {
    switch (activeFeed) {
      case "explore": return filteredExplorePosts
      case "following": return filteredFollowingPosts
      case "local": return filteredLocalPosts
      case "mypets": return filteredMyPetsPosts
      default: return filteredHomePosts
    }
  }, [activeFeed, filteredHomePosts, filteredExplorePosts, filteredFollowingPosts, filteredLocalPosts, filteredMyPetsPosts])

  // Preload next batch when reaching 80% of scroll height
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const ratio = (window.scrollY + window.innerHeight) / (doc.scrollHeight || 1)
      if (ratio < 0.8) return
      const total = getFilteredActive().length
      const loaded = loadedCounts[activeFeed]
      if (loadingMore) return
      if (loaded >= Math.min(total, MAX_LOADED)) return
      setLoadingMore(true)
      // Simulate async fetch; in real app call API
      setTimeout(() => {
        setLoadedCounts((prev) => ({ ...prev, [activeFeed]: Math.min(prev[activeFeed] + BATCH, Math.min(total, MAX_LOADED)) }))
        setLoadingMore(false)
      }, 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeFeed, loadedCounts, loadingMore, getFilteredActive])

  // Restore pagination + scroll from URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash?.slice(1) || ''
    const params = new URLSearchParams(hash)
    const feed = params.get('feed') as FeedTab | null
    const loaded = parseInt(params.get('loaded') || '', 10)
    const y = parseInt(params.get('y') || '', 10)
    if (feed && ['home','explore','following','local','mypets'].includes(feed)) {
      setActiveFeed(feed)
      if (Number.isFinite(loaded) && loaded > BATCH) {
        setLoadedCounts((prev) => ({ ...prev, [feed]: Math.min(Math.max(BATCH, loaded), MAX_LOADED) }))
      }
      if (Number.isFinite(y)) {
        setTimeout(() => { try { window.scrollTo(0, y) } catch {} }, 0)
      }
    }
  }, [])

  // Persist pagination + scroll in hash for back/forward support
  useEffect(() => {
    const onScroll = () => {
      const y = Math.round(window.scrollY || 0)
      const params = new URLSearchParams()
      params.set('feed', activeFeed)
      params.set('loaded', String(loadedCounts[activeFeed]))
      params.set('y', String(y))
      const next = `${window.location.pathname}#${params.toString()}`
      window.history.replaceState(null, '', next)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeFeed, loadedCounts])

  const loadTrending = useCallback(() => {
    if (!user) {
      setTrendingPosts([])
      return
    }

    const allPosts = getBlogPosts()
    const allUsers = getUsers()

    const showSponsored = user.displayPreferences?.showSponsoredPosts !== false
    const mutedUserIds = new Set<string>(user.mutedUsers || [])
    let visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      if (!canViewPost(post, author, user.id)) return false
      if (mutedUserIds.has(post.authorId)) return false
      if (!showSponsored && (post.isPromoted || post.promotionStatus === "approved")) return false
      const muted = user.displayPreferences?.mutedKeywords || []
      if (muted.length > 0) {
        const hay = `${post.title || ""} ${post.content || ""} ${(post.hashtags || []).join(" ")} ${(post.tags || []).join(" ")}`.toLowerCase()
        for (const kw of muted) {
          if (kw && hay.includes(kw.toLowerCase())) return false
        }
      }
      return true
    })
    const preferred = user.displayPreferences?.preferredContentLanguages || []
    const strict = Boolean(user.displayPreferences?.strictLanguageFilter)
    if (strict && preferred.length > 0) {
      visiblePosts = visiblePosts.filter((p) => {
        const code = detectPostLanguage(p)
        return isPreferredLanguage(code, preferred)
      })
    }
    // Build comment counts for ranking
    const commentCounts = new Map<string, number>()
    for (const post of visiblePosts) {
      commentCounts.set(post.id, getCommentsByPostId(post.id).length)
    }
    // Apply ranking with negative signals
    const followingIds = new Set<string>(user.following || [])
    const ranked = rankPosts(
      visiblePosts,
      commentCounts,
      placesMap,
      userLocation,
      {},
      {
        currentUserId: user.id,
        followingIds,
        mutedKeywords: user.displayPreferences?.mutedKeywords,
      }
    )
    setTrendingPosts(ranked.slice(0, 3))
  }, [user, placesMap, userLocation])

  const loadSuggestedUsers = useCallback(() => {
    if (!user) {
      setSuggestedUsers([])
      return
    }

    const suggestions = getFriendSuggestions(user, { limit: 4 })
    setSuggestedUsers(suggestions)
  }, [user])

  const refreshFeedData = useCallback(() => {
    computeFeeds()
    loadTrending()
    loadSuggestedUsers()
  }, [computeFeeds, loadTrending, loadSuggestedUsers])

  // Insert freshly arrived posts for the active tab and scroll to top
  const handleNewBannerClick = useCallback(() => {
    const fresh = buildActiveFeed(activeFeed)
    const current = getActiveFeedList()
    const currentIds = new Set(current.map((p) => p.id))
    const insertedIds = new Set(fresh.filter((p) => !currentIds.has(p.id)).map((p) => p.id))
    setRecentlyInsertedIds(insertedIds)
    setNewPostsCount(0)

    switch (activeFeed) {
      case "explore":
        setExploreFeedPosts(fresh)
        break
      case "following":
        setFollowingFeedPosts(fresh)
        break
      case "local":
        setLocalFeedPosts(fresh)
        break
      case "mypets":
        setMyPetsFeedPosts(fresh)
        break
      default:
        setHomeFeedPosts(fresh)
        break
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    setTimeout(() => setRecentlyInsertedIds(new Set()), 1500)
  }, [activeFeed, buildActiveFeed, getActiveFeedList])

  // Pull-to-refresh merges latest posts at top like the New Posts banner does
  const handlePullToRefresh = useCallback(async () => {
    // Recompute feeds first to ensure we have fresh data
    refreshFeedData()
    // Insert fresh posts for active tab
    const fresh = buildActiveFeed(activeFeed)
    const current = getActiveFeedList()
    const currentIds = new Set(current.map((p) => p.id))
    const insertedIds = new Set(fresh.filter((p) => !currentIds.has(p.id)).map((p) => p.id))
    setRecentlyInsertedIds(insertedIds)
    setNewPostsCount(0)
    switch (activeFeed) {
      case "explore":
        setExploreFeedPosts(fresh)
        break
      case "following":
        setFollowingFeedPosts(fresh)
        break
      case "local":
        setLocalFeedPosts(fresh)
        break
      case "mypets":
        setMyPetsFeedPosts(fresh)
        break
      default:
        setHomeFeedPosts(fresh)
        break
    }
    // Smoothly scroll to top and clear highlight after animation
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
    setTimeout(() => setRecentlyInsertedIds(new Set()), 1500)
  }, [activeFeed, refreshFeedData, buildActiveFeed, getActiveFeedList])

  // Silent check: compute fresh vs current and update banner count (no merge)
  const checkForNewPosts = useCallback(() => {
    try {
      const fresh = buildActiveFeed(activeFeed)
      const current = getActiveFeedList()
      const currentIds = new Set(current.map((p) => p.id))
      const freshNew = fresh.filter((p) => !currentIds.has(p.id))
      setNewPostsCount(freshNew.length)
    } catch {}
  }, [activeFeed, buildActiveFeed, getActiveFeedList])

  const refreshPersonalData = useCallback(() => {
    if (!isAuthenticated || !user) {
      setHomeFeedPosts([])
      setExploreFeedPosts([])
      setFollowingFeedPosts([])
      setLocalFeedPosts([])
      setMyPetsFeedPosts([])
      setTrendingPosts([])
      setSuggestedUsers([])
      setMyPets([])
      setIsFeedLoading(false)
      return
    }

    setIsFeedLoading(true)
    const pets = getPetsByOwnerId(user.id)
    setMyPets(pets)
    setSelectedPet((prev) => {
      if (prev && pets.some((pet) => pet.id === prev)) {
        return prev
      }
      return pets[0]?.id ?? ""
    })
    refreshFeedData()
    setIsFeedLoading(false)
  }, [isAuthenticated, user, refreshFeedData])

  useEffect(() => {
    refreshFeatured()
  }, [refreshFeatured])

  // Avoid dependency cycles: trigger personal data refresh on auth/user changes only
  useEffect(() => {
    refreshPersonalData()
  }, [isAuthenticated, user?.id])

  // Auto-refresh on focus/visibility: silent fetch → show banner if new
  useEffect(() => {
    const onFocus = () => checkForNewPosts()
    const onVisibility = () => { if (document.visibilityState === 'visible') checkForNewPosts() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [checkForNewPosts])

  // Desktop periodic auto-refresh (every 2 minutes) only when tab is active
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const setup = () => {
      if (typeof window === 'undefined') return
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      if (isDesktop && document.visibilityState === 'visible') {
        timer = setInterval(() => checkForNewPosts(), 120000)
      }
    }
    const reset = () => { if (timer) { clearInterval(timer); timer = null } ; setup() }
    setup()
    window.addEventListener('focus', reset)
    document.addEventListener('visibilitychange', reset)
    return () => {
      if (timer) clearInterval(timer)
      window.removeEventListener('focus', reset)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [checkForNewPosts])

  // Initialize seen + last-visit info for highlighting and filtering
  useEffect(() => {
    if (!user) return
    const ids = getSeenPostIds(user.id)
    setSeenIds(new Set(ids))
    const prev = getFeedLastVisitAt(user.id)
    const effective = prev ?? new Date().toISOString()
    setLastVisitAt(effective)
    return () => {
      setFeedLastVisitAt(user.id, new Date().toISOString())
    }
  }, [user?.id])

  // Get user location for proximity ranking
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator && isAuthenticated) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // User denied or error - continue without location (proximity will be 0)
          console.log("Location access denied or unavailable:", error.message)
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      )
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!user) {
      setNewPostPrivacy("public")
      return
    }

    setNewPostPrivacy(user.privacy?.posts || "public")
  }, [user?.id])

  const refreshAll = useCallback(() => {
    // Keep deps stable to avoid cascaded callback changes
    refreshFeatured()
    refreshPersonalData()
  }, [refreshFeatured, isAuthenticated, user?.id])

  useStorageListener(STORAGE_KEYS_TO_WATCH, refreshAll)

  // Watch only blog posts storage changes to show the New Posts banner instead of immediately merging
  useEffect(() => {
    if (typeof window === "undefined" || !user) return
    const handler = (event: StorageEvent) => {
      if (event.key && event.key !== "pet_social_blog_posts") return
      const fresh = buildActiveFeed(activeFeed)
      const current = getActiveFeedList()
      const currentIds = new Set(current.map((p) => p.id))
      const freshNew = fresh.filter((p) => !currentIds.has(p.id))
      setNewPostsCount(freshNew.length)
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [activeFeed, user?.id, homeFeedPosts, exploreFeedPosts, followingFeedPosts, localFeedPosts, myPetsFeedPosts])

  const handleCreatePost = () => {
    if (!user || !newPostContent.trim() || !selectedPet) return

    const newPost: BlogPost = {
      id: String(Date.now()),
      petId: selectedPet,
      authorId: user.id,
      title: newPostContent.substring(0, 50) + (newPostContent.length > 50 ? "..." : ""),
      content: newPostContent,
      language: user.displayPreferences?.primaryLanguage || user.displayPreferences?.preferredContentLanguages?.[0] || (locale?.split('-')[0] || 'en'),
      tags: [],
      categories: [],
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: newPostPrivacy,
      hashtags: [],
    }

    addBlogPost(newPost)
    setNewPostContent("")
    refreshFeedData()
  }

  const handleDelete = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    deleteBlogPost(postId)
    refreshFeedData()
  }

  const handleEdit = (post: BlogPost) => {
    router.push(`/blog/${post.id}/edit`)
  }

  const handleReaction = (postId: string, reactionType: ReactionType) => {
    if (!user) return
    togglePostReaction(postId, user.id, reactionType)
    refreshFeedData()
  }

  const handleShare = (post: BlogPost) => {
    // Sharing is handled via PostShareDialog inside the interaction bar now.
    // Keep a minimal fallback that copies the URL silently.
    const url = `${window.location.origin}/blog/${post.id}`
    navigator.clipboard?.writeText?.(url).catch(() => {})
  }

  const handleFollowSuggested = (userId: string) => {
    if (!user) return
    toggleFollow(user.id, userId)
    setSuggestedUsers((prev) => prev.filter((suggestion) => suggestion.user.id !== userId))
    loadSuggestedUsers()
  }

  // Show loading spinner while checking auth and loading data
  if (isLoading || (isAuthenticated && isFeedLoading)) {
    return <LoadingSpinner fullScreen />
  }

  // If user is authenticated, show feed
  if (isAuthenticated && user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Schedulers */}
        <EventReminderScheduler />
        <ListingExpiryScheduler />
        {/* Pull to refresh (mobile) */}
        <PullToRefresh onRefresh={handlePullToRefresh} />
        {/* Stories bar */}
        <StoriesBar />
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.fullName}!</h1>
          <p className="text-muted-foreground">Here{"'"}s what{"'"}s happening in your pet community</p>
        </div>

        {/* Prominent Add Pet CTA */}
        <div className="mb-6">
          <Link href="/dashboard/add-pet">
            <CreateButton iconType="paw" size="lg" className="w-full sm:w-auto px-6 py-6 text-base">
              Add Pet
            </CreateButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter and Create Post */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Feed</h2>
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter by
                    {countActiveFilters() > 0 && (
                      <Badge variant="secondary" className="ml-2">{countActiveFilters()}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Filter posts</SheetTitle>
                  </SheetHeader>

                  <div className="px-4 pb-4 space-y-6 overflow-auto">
                    {/* Content Type */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Content Type</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ id: "photos", label: "Photos" }, { id: "videos", label: "Videos" }, { id: "text", label: "Text Only" }, { id: "polls", label: "Polls" }, { id: "shared", label: "Shared Posts" }].map((opt) => (
                          <label key={opt.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={feedFilters.contentTypes.includes(opt.id)}
                              onCheckedChange={(checked) => {
                                setFeedFilters((prev) => {
                                  const next = new Set(prev.contentTypes)
                                  if (checked) next.add(opt.id)
                                  else next.delete(opt.id)
                                  return { ...prev, contentTypes: Array.from(next) }
                                })
                              }}
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Posts With */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Posts With</p>
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={feedFilters.myPets}
                          onCheckedChange={(checked) => setFeedFilters((p) => ({ ...p, myPets: Boolean(checked) }))}
                        />
                        <span className="text-sm">My Pets</span>
                      </label>
                      <div className="space-y-2">
                        <Label className="text-sm">Specific Pet</Label>
                        <Select
                          value={feedFilters.specificPetId || ""}
                          onValueChange={(val) => setFeedFilters((p) => ({ ...p, specificPetId: val }))}
                          disabled={followedPetsList.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={followedPetsList.length ? "Choose a pet you follow" : "No followed pets"} />
                          </SelectTrigger>
                          <SelectContent>
                            {followedPetsList.map((pet) => (
                              <SelectItem key={pet.id} value={pet.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                    <AvatarFallback className="text-xs">{pet.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span>{pet.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                            {followedPetsList.length > 0 && (
                              <SelectItem value="">All followed pets</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={feedFilters.hasLocationTag}
                          onCheckedChange={(checked) => setFeedFilters((p) => ({ ...p, hasLocationTag: Boolean(checked) }))}
                        />
                        <span className="text-sm">Location Tag</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={feedFilters.hasPriceTag}
                          onCheckedChange={(checked) => setFeedFilters((p) => ({ ...p, hasPriceTag: Boolean(checked) }))}
                        />
                        <span className="text-sm">Price Tag</span>
                      </label>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Show posts from</p>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { id: "today", label: "Today" },
                          { id: "week", label: "This Week" },
                          { id: "month", label: "This Month" },
                          { id: "all", label: "All Time" },
                          { id: "custom", label: "Custom" },
                        ] as Array<{ id: DatePreset; label: string }>).map((opt) => (
                          <Button
                            key={opt.id}
                            variant={feedFilters.datePreset === opt.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFeedFilters((p) => ({ ...p, datePreset: opt.id }))}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      {feedFilters.datePreset === "custom" && (
                        <DatePickerWithRange
                          date={feedFilters.customDate}
                          onDateChange={(date) => setFeedFilters((p) => ({ ...p, customDate: date }))}
                        />
                      )}
                    </div>
                  </div>

                  <SheetFooter>
                    <div className="flex items-center justify-between w-full">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          clearAllFilters()
                        }}
                      >
                        Clear All
                      </Button>
                      <Button onClick={() => setFiltersOpen(false)}>Apply Filters</Button>
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>

            {/* New posts banner */}
            <NewPostsBanner count={newPostsCount} onClick={handleNewBannerClick} />

            {/* Feed Tabs */}
            <Tabs value={activeFeed} onValueChange={(v) => setActiveFeed(v as typeof activeFeed)}>
              <TabsList>
                <TabsTrigger value="home">
                  <Home className="h-4 w-4 mr-1" /> Home
                </TabsTrigger>
                <TabsTrigger value="explore">
                  <Compass className="h-4 w-4 mr-1" /> Explore
                </TabsTrigger>
                <TabsTrigger value="following">
                  <Users className="h-4 w-4 mr-1" /> Following
                </TabsTrigger>
                <TabsTrigger value="local">
                  <MapPin className="h-4 w-4 mr-1" /> Local
                </TabsTrigger>
                <TabsTrigger value="mypets">
                  <PawPrint className="h-4 w-4 mr-1" /> My Pets
                </TabsTrigger>
              </TabsList>

              {/* Create Post Card remains visible above content */}
              {myPets.length > 0 && (
                <Card className="mb-6 mt-4">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea
                          placeholder="What's on your mind?"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                            <Select value={selectedPet} onValueChange={setSelectedPet}>
                              <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select pet">
                                  {selectedPet &&
                                    (() => {
                                      const selectedPetObj = myPets.find((p) => p.id === selectedPet)
                                      return selectedPetObj ? (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-5 w-5 flex-shrink-0">
                                            <AvatarImage src={selectedPetObj.avatar || "/placeholder.svg"} alt={selectedPetObj.name} />
                                            <AvatarFallback className="text-xs">
                                              {selectedPetObj.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">{selectedPetObj.name}</span>
                                        </div>
                                      ) : null
                                    })()}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {myPets.map((pet) => (
                                  <SelectItem key={pet.id} value={pet.id}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6 flex-shrink-0">
                                        <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                        <AvatarFallback className="text-xs">{pet.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span>{pet.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <PrivacySelector
                              value={newPostPrivacy}
                              onChange={setNewPostPrivacy}
                              className="w-full sm:w-[180px] justify-between"
                            />
                          </div>
                          <Button onClick={handleCreatePost} disabled={!newPostContent.trim() || !selectedPet}>
                            <Send className="h-4 w-4 mr-2" />
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feed Posts per tab */}
              <TabsContent value="home">
                <div className="space-y-4">
                  {loadingMore && activeFeed === 'home' && loadedCounts.home < filteredHomePosts.length && (
                    <div className="flex justify-center py-2 text-xs text-muted-foreground">Loading more…</div>
                  )}
                  {filteredHomePosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No posts from your network yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <VirtualizedList
                      items={filteredHomePosts.slice(0, loadedCounts.home)}
                      estimatedItemHeight={640}
                      overscan={5}
                      keyExtractor={(p) => p.id}
                      renderItem={(post) => (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          isNewlyInserted={recentlyInsertedIds.has(post.id)}
                          isNewSinceLastVisit={Boolean(lastVisitAt && new Date(post.createdAt) > new Date(lastVisitAt))}
                          onSeen={(id) => {
                            if (!user) return
                            if (!seenIds.has(id)) {
                              markPostSeen(user.id, id)
                              const next = new Set(seenIds)
                              next.add(id)
                              setSeenIds(next)
                            }
                          }}
                          onReaction={handleReaction}
                          onHide={(postId) => {
                            if (!user) return
                            const { isHidden } = toggleHiddenPost(user.id, postId)
                            toast.message(isHidden ? 'Post hidden' : 'Post unhidden')
                            computeFeeds()
                          }}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onShare={handleShare}
                          currentUser={user}
                          onRefresh={refreshFeedData}
                        />
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="explore">
                <div className="space-y-4">
                  {loadingMore && activeFeed === 'explore' && loadedCounts.explore < filteredExplorePosts.length && (
                    <div className="flex justify-center py-2 text-xs text-muted-foreground">Loading more…</div>
                  )}
                  {filteredExplorePosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No public posts yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <VirtualizedList
                      items={filteredExplorePosts.slice(0, loadedCounts.explore)}
                      estimatedItemHeight={640}
                      overscan={5}
                      keyExtractor={(p) => p.id}
                      renderItem={(post) => (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          isNewlyInserted={recentlyInsertedIds.has(post.id)}
                          isNewSinceLastVisit={Boolean(lastVisitAt && new Date(post.createdAt) > new Date(lastVisitAt))}
                          onSeen={(id) => {
                            if (!user) return
                            if (!seenIds.has(id)) {
                              markPostSeen(user.id, id)
                              const next = new Set(seenIds)
                              next.add(id)
                              setSeenIds(next)
                            }
                          }}
                          onReaction={handleReaction}
                          onHide={(postId) => {
                            if (!user) return
                            const { isHidden } = toggleHiddenPost(user.id, postId)
                            toast.message(isHidden ? 'Post hidden' : 'Post unhidden')
                            computeFeeds()
                          }}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onShare={handleShare}
                          currentUser={user}
                          onRefresh={refreshFeedData}
                        />
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="following">
                <div className="space-y-4">
                  {loadingMore && activeFeed === 'following' && loadedCounts.following < filteredFollowingPosts.length && (
                    <div className="flex justify-center py-2 text-xs text-muted-foreground">Loading more…</div>
                  )}
                  {filteredFollowingPosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No posts from people you follow yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <VirtualizedList
                      items={filteredFollowingPosts.slice(0, loadedCounts.following)}
                      estimatedItemHeight={640}
                      overscan={5}
                      keyExtractor={(p) => p.id}
                      renderItem={(post) => (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          isNewlyInserted={recentlyInsertedIds.has(post.id)}
                          isNewSinceLastVisit={Boolean(lastVisitAt && new Date(post.createdAt) > new Date(lastVisitAt))}
                          onSeen={(id) => {
                            if (!user) return
                            if (!seenIds.has(id)) {
                              markPostSeen(user.id, id)
                              const next = new Set(seenIds)
                              next.add(id)
                              setSeenIds(next)
                            }
                          }}
                          onReaction={handleReaction}
                          onHide={(postId) => {
                            if (!user) return
                            const { isHidden } = toggleHiddenPost(user.id, postId)
                            toast.message(isHidden ? 'Post hidden' : 'Post unhidden')
                            computeFeeds()
                          }}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onShare={handleShare}
                          currentUser={user}
                          onRefresh={refreshFeedData}
                        />
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="local">
                <div className="space-y-4">
                  {loadingMore && activeFeed === 'local' && loadedCounts.local < filteredLocalPosts.length && (
                    <div className="flex justify-center py-2 text-xs text-muted-foreground">Loading more…</div>
                  )}
                  {userLocation == null ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Enable location to see nearby posts</p>
                      </CardContent>
                    </Card>
                  ) : filteredLocalPosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No nearby posts yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <VirtualizedList
                      items={filteredLocalPosts.slice(0, loadedCounts.local)}
                      estimatedItemHeight={640}
                      overscan={5}
                      keyExtractor={(p) => p.id}
                      renderItem={(post) => (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          isNewlyInserted={recentlyInsertedIds.has(post.id)}
                          isNewSinceLastVisit={Boolean(lastVisitAt && new Date(post.createdAt) > new Date(lastVisitAt))}
                          onSeen={(id) => {
                            if (!user) return
                            if (!seenIds.has(id)) {
                              markPostSeen(user.id, id)
                              const next = new Set(seenIds)
                              next.add(id)
                              setSeenIds(next)
                            }
                          }}
                          onReaction={handleReaction}
                          onHide={(postId) => {
                            if (!user) return
                            const { isHidden } = toggleHiddenPost(user.id, postId)
                            toast.message(isHidden ? 'Post hidden' : 'Post unhidden')
                            computeFeeds()
                          }}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onShare={handleShare}
                          currentUser={user}
                          onRefresh={refreshFeedData}
                        />
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="mypets">
                <div className="space-y-4">
                  {loadingMore && activeFeed === 'mypets' && loadedCounts.mypets < filteredMyPetsPosts.length && (
                    <div className="flex justify-center py-2 text-xs text-muted-foreground">Loading more…</div>
                  )}
                  {filteredMyPetsPosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No posts featuring your pets yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <VirtualizedList
                      items={filteredMyPetsPosts.slice(0, loadedCounts.mypets)}
                      estimatedItemHeight={640}
                      overscan={5}
                      keyExtractor={(p) => p.id}
                      renderItem={(post) => (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          isNewlyInserted={recentlyInsertedIds.has(post.id)}
                          isNewSinceLastVisit={Boolean(lastVisitAt && new Date(post.createdAt) > new Date(lastVisitAt))}
                          onSeen={(id) => {
                            if (!user) return
                            if (!seenIds.has(id)) {
                              markPostSeen(user.id, id)
                              const next = new Set(seenIds)
                              next.add(id)
                              setSeenIds(next)
                            }
                          }}
                          onReaction={handleReaction}
                          onHide={(postId) => {
                            if (!user) return
                            const { isHidden } = toggleHiddenPost(user.id, postId)
                            toast.message(isHidden ? 'Post hidden' : 'Post unhidden')
                            computeFeeds()
                          }}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onShare={handleShare}
                          currentUser={user}
                          onRefresh={refreshFeedData}
                        />
                      )}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Posts
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Most popular posts from the community</p>
              </CardHeader>
              <CardContent>
                {trendingPosts.length > 0 ? (
                  <div className="space-y-4">
                    {trendingPosts.map((post) => {
                      const pet = getPets().find((p) => p.id === post.petId)
                      const previewImage = post.coverImage || post.media?.images?.[0]
                      const hasVideoPreview = !previewImage && (post.media?.videos?.length || 0) > 0
                      return (
                        <Link key={post.id} href={`/blog/${post.id}`}>
                          <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            {previewImage ? (
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                <img src={previewImage} alt={post.title} className="h-full w-full object-cover" />
                              </div>
                            ) : hasVideoPreview ? (
                              <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                <Video className="h-6 w-6 text-primary" />
                              </div>
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold line-clamp-2 text-sm">{post.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">By {pet?.name}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 fill-current text-red-500" />
                                  {post.reactions
                                    ? Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0)
                                    : post.likes.length}
                                </div>
                                <div className="flex gap-1">
                                  {post.tags.slice(0, 2).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No trending posts yet</p>
                )}
              </CardContent>
            </Card>

            {/* Pinned Items */}
            <PinnedItems />

            {/* Suggested Users */}
            <Card>
              <CardHeader>
                <CardTitle>Suggested Users</CardTitle>
              </CardHeader>
              <CardContent>
                {suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map((suggestion) => (
                      <div key={suggestion.user.id} className="flex items-center justify-between">
                        <Link href={`/profile/${suggestion.user.username}`} className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={suggestion.user.avatar || "/placeholder.svg"} alt={suggestion.user.fullName} />
                            <AvatarFallback>{suggestion.user.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{suggestion.user.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">@{suggestion.user.username}</p>
                            {suggestion.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {suggestion.reasons.slice(0, 2).map((reason) => (
                                  <Badge key={`${suggestion.user.id}-${reason}`} variant="secondary" className="text-xs font-normal">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollowSuggested(suggestion.user.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No suggestions available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/blog">
                  <Button variant="ghost" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse All Blogs
                  </Button>
                </Link>
                <Link href="/wiki">
                  <Button variant="ghost" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Pet Care Wiki
                  </Button>
                </Link>
                <Link href={`/profile/${user.username}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If user is not logged in, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6">
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs sm:text-sm font-semibold shadow-sm border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-700">
            <PawPrint className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="whitespace-nowrap">The Social Network for Pet Lovers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent animate-in fade-in slide-in-from-left-4 duration-1000">
            Connect, Share, and Learn About Your Pets
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground text-pretty leading-relaxed animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
            Join a vibrant community of pet owners. Share your pet{"'"}s adventures, discover care tips, and connect
            with fellow animal lovers.
          </p>
          
          {/* Demo Credentials Section */}
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50 hover:shadow-md transition-all duration-300 max-w-md mx-auto mt-4">
            <CardContent className="p-3">
              <div className="flex items-start gap-1.5 mb-2">
                <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-foreground">Demo Credentials</p>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground pl-4.5">
                <p className="break-words">
                  <strong className="text-foreground font-semibold">Username:</strong>{" "}
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">admin</span>,{" "}
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">sarahpaws</span>,{" "}
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">mikecatlover</span>,{" "}
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">emmabirds</span>,{" "}
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">alexrabbits</span>
                </p>
                <p>
                  <strong className="text-foreground font-semibold">Password:</strong>{" "}
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">password123</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-b from-transparent via-muted/20 to-transparent">
        <div className="text-center mb-3 sm:mb-4 md:mb-5 px-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-2 sm:mb-3">
            <Rocket className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Platform Features</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything You Need for Your Pet Community
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
            Discover features designed for pet lovers
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-7xl mx-auto">
          <Card className="h-full group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Pet Profiles</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Create detailed profiles for each of your pets. Share their photos, stories, and milestones with the
                community.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-500" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Pet Care Wiki</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Access comprehensive guides on pet care, health, training, and nutrition. Learn from experts and
                experienced pet owners.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full sm:col-span-2 lg:col-span-1 group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-pink-500" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Social Features</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Follow other pet owners, like and comment on posts, and build connections with people who share your
                love for animals.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full sm:col-span-2 lg:col-span-1 group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Message Privacy</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Keep sensitive conversations secure with automatic end-to-end encryption for direct messages and shared
                attachments.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-500" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Blog & Stories</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Share your pet's adventures, stories, and experiences through rich blog posts. Document milestones and create lasting memories.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-orange-500" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Pet Communities</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Join or create communities based on pet breeds, interests, or locations. Connect with like-minded pet owners and share experiences.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* CTA Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6">
        <Card className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent opacity-50"></div>
          <CardContent className="p-4 sm:p-5 md:p-6 text-center space-y-2 sm:space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs sm:text-sm font-medium mb-2 sm:mb-3">
              <Rocket className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Start Your Journey</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              Ready to Join the Community?
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-95 max-w-2xl mx-auto">
              Create your account today and start sharing your pet{"'"}s amazing journey
            </p>
            <Link href="/register">
              <Button 
                size="default" 
                variant="secondary" 
                className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-6 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FeedPostCard({
  post,
  onReaction,
  onHide,
  onDelete,
  onEdit,
  onShare,
  currentUser,
  isNewlyInserted,
  isNewSinceLastVisit,
  onSeen,
  onRefresh,
}: {
  post: BlogPost
  onReaction: (postId: string, reactionType: ReactionType) => void
  onHide: (postId: string) => void
  onDelete: (postId: string) => void
  onEdit: (post: BlogPost) => void
  onShare: (post: BlogPost) => void
  currentUser: UserType
  isNewlyInserted?: boolean
  isNewSinceLastVisit?: boolean
  onSeen?: (postId: string) => void
  onRefresh?: () => void
}) {
  const media = (post.media ?? { images: [], videos: [], links: [] }) as BlogPostMedia
  const pet = getPets().find((p) => p.id === post.petId)
  const author = getUsers().find((u) => u.id === post.authorId)
  const [showReactionsMenu, setShowReactionsMenu] = useState(false)
  const [isSaved, setIsSaved] = useState<boolean>(isPostSaved(currentUser.id, post.id))
  const isOwner = post.authorId === currentUser.id

  const rootRef = useRef<HTMLDivElement | null>(null)
  const seenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewStartRef = useRef<number | null>(null)
  const [highlight, setHighlight] = useState(false)

  // Visibility observer: 50% for >=1s marks seen
  useEffect(() => {
    if (!rootRef.current) return
    const target = rootRef.current
    let visible = false
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== target) continue
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!visible) {
              visible = true
              if (seenTimerRef.current) clearTimeout(seenTimerRef.current)
              seenTimerRef.current = setTimeout(() => {
                onSeen?.(post.id)
                if (isNewSinceLastVisit) {
                  setHighlight(true)
                  setTimeout(() => setHighlight(false), 10000)
                }
              }, 1000)
              // begin view timing
              viewStartRef.current = Date.now()
            }
          } else {
            visible = false
            if (seenTimerRef.current) {
              clearTimeout(seenTimerRef.current)
              seenTimerRef.current = null
            }
            if (viewStartRef.current && currentUser) {
              const dur = Date.now() - viewStartRef.current
              try { addViewEvent({ userId: currentUser.id, postId: post.id, viewedAt: new Date().toISOString(), durationMs: Math.max(0, dur) }) } catch {}
              viewStartRef.current = null
            }
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    )
    observer.observe(target)
    return () => {
      try { observer.disconnect() } catch {}
      if (seenTimerRef.current) clearTimeout(seenTimerRef.current)
      if (viewStartRef.current && currentUser) {
        const dur = Date.now() - viewStartRef.current
        try { addViewEvent({ userId: currentUser.id, postId: post.id, viewedAt: new Date().toISOString(), durationMs: Math.max(0, dur) }) } catch {}
        viewStartRef.current = null
      }
    }
  }, [post.id, onSeen, isNewSinceLastVisit])

  const previewLinks = media.links.slice(0, 2)

  const formatHost = (url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, "")
    } catch (error) {
      return url
    }
  }

  const reactionEmojis: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    laugh: "😄",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }

  const getUserReaction = (): ReactionType | null => {
    if (!post.reactions) return null
    for (const [type, userIds] of Object.entries(post.reactions)) {
      if (userIds.includes(currentUser.id)) {
        return type as ReactionType
      }
    }
    return null
  }

  const getTotalReactions = (): number => {
    if (!post.reactions) return 0
    return Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0)
  }

  const userReaction = getUserReaction()
  const totalReactions = getTotalReactions()

  // Listing post helpers
  const isListing = (post as any).postType === 'listing'
  const listingSold = Boolean((post as any).listingSoldAt)
  const listingArchived = Boolean((post as any).listingArchivedAt)
  const messageSeller = () => {
    try {
      const conv = createConversation([currentUser.id, post.authorId])
      toast.success('Conversation created. Check your Messages to continue.')
    } catch {
      toast.message('Could not open messages. Try again later.')
    }
  }
  const markAsSold = () => {
    if (post.authorId !== currentUser.id) return
    updateBlogPost({ ...post, listingSoldAt: new Date().toISOString() })
    try { onRefresh?.() } catch {}
  }

  // Event post RSVP state and helpers
  const isEvent = (post as any).postType === 'event'
  const [rsvpStatus, setRsvpStatus] = useState<('going'|'maybe'|'not-going'|null)>(() => {
    if (!isEvent) return null
    const mine = getUserEventRSVP(post.id, currentUser.id)
    return (mine?.status as any) || null
  })
  const [rsvpCounts, setRsvpCounts] = useState<{going:number; maybe:number; notGoing:number}>(() => {
    if (!isEvent) return { going: 0, maybe: 0, notGoing: 0 }
    const list = getEventRSVPsByEventId(post.id)
    return {
      going: list.filter(r => r.status === 'going').length,
      maybe: list.filter(r => r.status === 'maybe').length,
      notGoing: list.filter(r => r.status === 'not-going').length,
    }
  })

  const refreshRsvps = useCallback(() => {
    if (!isEvent) return
    const list = getEventRSVPsByEventId(post.id)
    setRsvpCounts({
      going: list.filter(r => r.status === 'going').length,
      maybe: list.filter(r => r.status === 'maybe').length,
      notGoing: list.filter(r => r.status === 'not-going').length,
    })
    const mine = getUserEventRSVP(post.id, currentUser.id)
    setRsvpStatus((mine?.status as any) || null)
  }, [isEvent, post.id, currentUser.id])

  useEffect(() => {
    if (!isEvent) return
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== 'pet_social_event_rsvps') return
      try { refreshRsvps() } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [isEvent, refreshRsvps])

  const setRSVP = (status: 'going'|'maybe'|'not-going') => {
    if (!isEvent) return
    const existing = getUserEventRSVP(post.id, currentUser.id)
    const now = new Date().toISOString()
    if (existing) {
      updateEventRSVP(existing.eventId, existing.userId, { status, respondedAt: now })
    } else {
      addEventRSVP({ id: generateStorageId('event_rsvp'), eventId: post.id, userId: currentUser.id, status, respondedAt: now })
    }
    refreshRsvps()
  }

  const inviteMutuals = () => {
    if (!isEvent) return
    const following = new Set(currentUser.following || [])
    const mutuals = (currentUser.followers || []).filter(uid => following.has(uid))
    for (const uid of mutuals) {
      createNotification({
        userId: uid,
        type: 'message',
        actorId: currentUser.id,
        targetId: post.id,
        targetType: 'post',
        message: `${currentUser.fullName} invited you to: ${post.title}`,
        category: 'reminders',
      })
    }
  }

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case "private":
        return <Lock className="h-3 w-3" />
      case "followers-only":
        return <UsersIcon className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  function PollBlock({ post, currentUser }: { post: BlogPost; currentUser: UserType }) {
    const poll = post.poll as PostPoll | undefined
    const [now, setNow] = useState(Date.now())
    const [votes, setVotes] = useState<PollVote[]>([])
    const [selected, setSelected] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const isOwner = post.authorId === currentUser.id

    if (!poll) return null
    const pollId = `post-poll-${post.id}`
    const expiresAt = poll.expiresAt ? new Date(poll.expiresAt).getTime() : null
    const isExpired = expiresAt != null && now >= expiresAt
    const isClosed = Boolean(poll.isClosed) || isExpired
    const allowMultiple = Boolean(poll.allowMultiple)

    useEffect(() => {
      setVotes(getPollVotesByPollId(pollId))
      const onStorage = (e: StorageEvent) => {
        if (e.key === 'pet_social_poll_votes') setVotes(getPollVotesByPollId(pollId))
      }
      window.addEventListener('storage', onStorage)
      const t = setInterval(() => setNow(Date.now()), 1000)
      return () => { window.removeEventListener('storage', onStorage); clearInterval(t) }
    }, [pollId])

    const myVote = getUserPollVote(pollId, currentUser.id)
    const optionCounts: Record<string, number> = {}
    poll.options.forEach((o) => { optionCounts[o.id] = 0 })
    votes.forEach((v) => v.optionIds.forEach((id) => { optionCounts[id] = (optionCounts[id]||0)+1 }))
    const total = Object.values(optionCounts).reduce((a,b)=>a+b,0)

    const fmtRemaining = () => {
      if (expiresAt == null) return 'No expiration'
      const diff = Math.max(0, expiresAt - now)
      const s = Math.floor(diff / 1000)
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const ss = s % 60
      return `${h}h ${m}m ${ss}s`
    }

    const toggleSelect = (id: string) => {
      if (!allowMultiple) { setSelected([id]); return }
      setSelected((prev) => prev.includes(id) ? prev.filter((x)=>x!==id) : [...prev, id])
    }

    const submit = () => {
      if (isClosed || submitting) return
      const choices = allowMultiple ? selected : (selected[0] ? [selected[0]] : [])
      if (choices.length === 0) return
      setSubmitting(true)
      const vote: PollVote = { id: `vote_${Date.now()}_${Math.random().toString(16).slice(2)}`, pollId, userId: currentUser.id, optionIds: choices, votedAt: new Date().toISOString() }
      addPollVote(vote)
      setVotes(getPollVotesByPollId(pollId))
      setSelected([])
      setSubmitting(false)
    }

    const endPoll = () => {
      const updated: BlogPost = { ...post, poll: { ...poll, isClosed: true } as PostPoll }
      updateBlogPost(updated)
    }
    const extendPoll = (mins: number) => {
      const current = poll.expiresAt ? new Date(poll.expiresAt).getTime() : Date.now()
      const next = new Date(current + mins*60*1000).toISOString()
      const updated: BlogPost = { ...post, poll: { ...poll, expiresAt: next } as PostPoll }
      updateBlogPost(updated)
    }

    const shareResults = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800; canvas.height = 400
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.fillStyle = '#111827'; ctx.font = 'bold 20px sans-serif'
      ctx.fillText(poll.question.slice(0,60), 20, 40)
      let y = 80
      poll.options.forEach((o) => {
        const count = optionCounts[o.id] || 0
        const pct = total > 0 ? Math.round(count*100/total) : 0
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(20, y, 760, 24)
        ctx.fillStyle = '#60a5fa'; ctx.fillRect(20, y, Math.round(760*pct/100), 24)
        ctx.fillStyle = '#111827'; ctx.font = '14px sans-serif'
        ctx.fillText(`${o.text} – ${pct}% (${count})`, 30, y+16)
        y += 40
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url; a.download = `poll-results-${post.id}.png`; a.click()
    }

    const votersByOption: Record<string, string[]> = {}
    votes.forEach((v) => v.optionIds.forEach((id) => {
      votersByOption[id] = votersByOption[id] || []
      votersByOption[id].push(v.userId)
    }))
    const [showVoters, setShowVoters] = useState(false)

    return (
      <div className="mb-3 border rounded-md p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">{poll.question.slice(0,280)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{isClosed ? 'Poll closed' : fmtRemaining()}</span>
            {!poll.anonymous && (isClosed || myVote) && (
              <button type="button" className="underline" onClick={() => setShowVoters((v)=>!v)}>{showVoters ? 'Hide voters' : 'Show voters'}</button>
            )}
          </div>
        </div>
        {!isClosed && !myVote && (
          <div className="space-y-2">
            {poll.options.map((opt) => (
              <button key={opt.id} type="button" onClick={() => toggleSelect(opt.id)} className={cn('w-full text-left px-3 py-2 rounded border', selected.includes(opt.id) && 'bg-accent')}>{opt.text.slice(0,50)}</button>
            ))}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{allowMultiple ? 'Multiple selection' : 'Single choice'}</div>
              <Button size="sm" disabled={submitting || (allowMultiple ? selected.length===0 : selected.length!==1)} onClick={submit}>Vote</Button>
            </div>
          </div>
        )}
        {(isClosed || myVote) && (
          <div className="space-y-2">
            {poll.options.map((opt) => {
              const count = optionCounts[opt.id] || 0
              const pct = total > 0 ? Math.round(count*100/total) : 0
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{opt.text}</span>
                    <span className="text-xs text-muted-foreground">{pct}% ({count})</span>
                  </div>
                  <div className="h-2 w-full rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: pct + '%' }} /></div>
                  {!poll.anonymous && showVoters && votersByOption[opt.id]?.length > 0 && (
                    <div className="text-[11px] text-muted-foreground">Voters: {getUsers().filter(u => votersByOption[opt.id].includes(u.id)).map(u => '@'+u.username).join(', ')}</div>
                  )}
                </div>
              )
            })}
            <div className="text-xs text-muted-foreground">Total votes: {total}</div>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          {isOwner && !isClosed && (
            <>
              <Button size="sm" variant="outline" onClick={endPoll}>End Poll</Button>
              <Button size="sm" variant="outline" onClick={() => extendPoll(60)}>+1h</Button>
              <Button size="sm" variant="outline" onClick={() => extendPoll(24*60)}>+1d</Button>
            </>
          )}
          {isClosed && (
            <Button size="sm" variant="outline" onClick={shareResults}>Share Results</Button>
          )}
        </div>
      </div>
    )
  }

  const [showComments, setShowComments] = useState(false)

  return (
    <div ref={rootRef} className={highlight ? "new-post-highlight" : ""}>
      <Card className={isNewlyInserted ? "animate-in fade-in-0 slide-in-from-top-2" : undefined}>
        <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3">
            <Link href={author ? getPetUrlFromPet(pet, author.username) : "#"}>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={pet?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/user/${author?.username}`} className="font-semibold hover:underline">
                  {author?.fullName}
                </Link>
                <Link href={`/user/${author?.username}`} className="text-sm text-muted-foreground hover:underline">
                  @{author?.username}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">
                        <RelativeTime date={post.createdAt} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>{formatDate(post.createdAt)}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>•</span>
                {getPrivacyIcon()}
                {(isNewlyInserted || isNewSinceLastVisit) && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>New</span>
                    </span>
                  </>
                )}
                {post.placeId && (
                  <>
                    <span>•</span>
                    <span>at {getPlaceById(post.placeId)?.name}</span>
                  </>
                )}
                {post.feeling && (
                  <>
                    <span>•</span>
                    <span>feeling {post.feeling}</span>
                  </>
                )}
                {post.activity && (
                  <>
                    <span>•</span>
                    <span>{post.activity}</span>
                  </>
                )}
              </div>
              {post.postType === 'question' && (
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">Question</Badge>
                  {post.questionCategory && (
                    <Badge variant="secondary" className="text-[10px]">{post.questionCategory}</Badge>
                  )}
                </div>
              )}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={`hdr-${post.id}-${tag}`} variant="secondary" className="text-[10px] py-0.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PinButton
              type="post"
              itemId={post.id}
              metadata={{
                title: post.title,
                description: post.content.substring(0, 200),
                image: post.coverImage || post.media?.images?.[0],
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/blog/${post.id}`}>
                  <DropdownMenuItem>View full post</DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={() => {
                    const { isSaved: saved } = toggleSavedPost(currentUser.id, post.id)
                    setIsSaved(saved)
                    if (saved) {
                      try {
                        const col = ensureDefaultSavedCollection(currentUser.id)
                        addPostToSavedCollection(currentUser.id, col.id, post.id)
                      } catch {}
                    }
                    toast.message(saved ? 'Saved to your posts' : 'Removed from saved')
                  }}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                      Unsave post
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save post
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onHide(post.id)}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      const key = `pet_social_hidden_topics_${currentUser.id}`
                      const prev: string[] = JSON.parse(localStorage.getItem(key) || '[]')
                      const baseTopics = new Set<string>([
                        ...((post.hashtags || []) as string[]),
                        ...((post.tags || []) as string[]),
                      ].filter(Boolean).map((s) => String(s).toLowerCase()))
                      // Fallback: derive a few keywords from title if no tags/hashtags
                      if (baseTopics.size === 0) {
                        const title = `${post.title || ''}`.toLowerCase()
                        title.split(/[^a-z0-9]+/g).filter((w) => w && w.length >= 4).slice(0, 3).forEach((w) => baseTopics.add(w))
                      }
                      const next = Array.from(new Set<string>([...prev, ...Array.from(baseTopics)]))
                      localStorage.setItem(key, JSON.stringify(next))
                      toast.message('You will see fewer similar posts')
                      onRefresh?.()
                    } catch {}
                  }}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide similar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      const reports = JSON.parse(localStorage.getItem('pet_social_reports') || '[]')
                      reports.push({ id: `report_${Date.now()}`, postId: post.id, reason: 'other', reportedAt: new Date().toISOString() })
                      localStorage.setItem('pet_social_reports', JSON.stringify(reports))
                    } catch {}
                    toast.success('Report submitted. Thank you for helping keep our community safe.')
                  }}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report post
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(post)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <Link href={`/blog/${post.id}`}>
            <h3 className="font-semibold text-lg mb-2 hover:underline cursor-pointer">{post.title}</h3>
          </Link>
          <div className="text-muted-foreground">
            <PostContent content={post.content} post={post} />
          </div>
        </div>
        {isListing && (
          <div className={cn("mb-3 rounded-md border p-3", listingArchived ? 'opacity-60' : '', listingSold ? 'opacity-70' : '')}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">Listing</Badge>
              {post.listingCategory && <Badge variant="secondary">{post.listingCategory}</Badge>}
              {typeof post.listingPrice === 'number' && (
                <span className="font-medium">{post.listingCurrency || 'USD'} {post.listingPrice.toFixed(2)}</span>
              )}
              {post.listingCondition && (
                <span className="text-xs text-muted-foreground">• {post.listingCondition}</span>
              )}
              {post.placeId && (
                <span className="text-xs text-muted-foreground">• {getPlaceById(post.placeId)?.name}</span>
              )}
              {listingSold && <Badge variant="destructive">SOLD</Badge>}
              {listingArchived && <Badge variant="outline">Archived</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {post.listingShipping?.localPickup ? 'Local pickup' : ''}{post.listingShipping?.localPickup && post.listingShipping?.shippingAvailable ? ' • ' : ''}{post.listingShipping?.shippingAvailable ? 'Shipping available' : ''}
              </div>
              {post.listingPaymentMethods && post.listingPaymentMethods.length > 0 && (
                <div className="text-xs text-muted-foreground">• Accepts: {post.listingPaymentMethods.join(', ')}</div>
              )}
              <div className="ml-auto flex gap-2">
                <Button size="sm" onClick={messageSeller} variant="outline">Message Seller</Button>
                {post.authorId === currentUser.id && !listingSold && (
                  <Button size="sm" onClick={markAsSold}>Mark as Sold</Button>
                )}
              </div>
            </div>
          </div>
        )}
        {((post as any).postType === 'event') && (
          <div className="mb-3 rounded-md border p-3 bg-accent/20">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {(() => {
                const start = post.eventStartAt ? new Date(post.eventStartAt) : null
                const end = (start && post.eventDurationMinutes) ? new Date(start.getTime() + post.eventDurationMinutes*60000) : null
                return (
                  <>
                    {start && (<span>{start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}{post.eventTimezone ? ` (${post.eventTimezone})` : ''}</span>)}
                    {end && (<span>• Ends {end.toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>)}
                    {post.placeId && (<span>• at {getPlaceById(post.placeId)?.name}</span>)}
                  </>
                )
              })()}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant={rsvpStatus === 'going' ? 'default' : 'outline'} onClick={() => setRSVP('going')}>Going ({rsvpCounts.going})</Button>
              <Button size="sm" variant={rsvpStatus === 'maybe' ? 'default' : 'outline'} onClick={() => setRSVP('maybe')}>Interested ({rsvpCounts.maybe})</Button>
              <Button size="sm" variant={rsvpStatus === 'not-going' ? 'default' : 'outline'} onClick={() => setRSVP('not-going')}>Can't Go ({rsvpCounts.notGoing})</Button>
              <Button size="sm" variant="ghost" onClick={inviteMutuals}>Invite Friends</Button>
            </div>
            <div className="mt-3 flex -space-x-2">
              {(() => {
                const list = getEventRSVPsByEventId(post.id).filter(r => r.status === 'going').slice(0, 10)
                return list.map((r) => {
                  const u = getUsers().find(x => x.id === r.userId)
                  return (
                    <Avatar key={r.userId} className="h-7 w-7 ring-2 ring-background">
                      <AvatarImage src={u?.avatar || '/placeholder.svg'} />
                      <AvatarFallback>{u?.fullName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Repost embed */}
        {post.sharedFromPostId && (() => {
          const original = getBlogPosts().find((p) => p.id === post.sharedFromPostId)
          if (!original) return null
          const origPet = getPets().find((p) => p.id === original.petId)
          const origAuthor = getUsers().find((u) => u.id === original.authorId)
          const mediaOrig = (original.media ?? { images: [], videos: [], links: [] }) as BlogPostMedia
          return (
            <div className="mb-3 border rounded-md p-3 bg-accent/20">
              <div className="text-xs text-muted-foreground mb-2">Original post by <Link href={`/user/${origAuthor?.username || ''}`} className="underline">{origAuthor?.fullName || 'Unknown'}</Link></div>
              <Link href={`/blog/${original.id}`}>
                <div className="font-medium mb-1 hover:underline">{original.title}</div>
              </Link>
              <div className="text-muted-foreground mb-2">
                <PostContent content={original.content} post={original} />
              </div>
              {(mediaOrig.images.length > 0 || mediaOrig.videos.length > 0) && (
                <PostMedia media={mediaOrig} />
              )}
            </div>
          )
        })()}

        {/* Tagged pets */}
        {post.taggedPetIds && post.taggedPetIds.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {post.taggedPetIds.map((pid) => {
              const p = getPets().find((x) => x.id === pid)
              if (!p) return null
              return (
                <Link key={pid} href={getPetUrlFromPet(p)}>
                  <Badge variant="secondary" className="text-xs">@{p.name}</Badge>
                </Link>
              )
            })}
          </div>
        )}

        {(media.images.length > 0 || media.videos.length > 0 || media.links.length > 0) && (
          <div className="mb-3 space-y-3">
            {(media.images.length > 0 || media.videos.length > 0) && <PostMedia media={media} />}

            {media.links.length > 0 && (
              <div className="space-y-2">
                {previewLinks.map((link, index) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border px-3 py-2 text-xs sm:text-sm hover:bg-accent transition-colors"
                  >
                    <Link2 className="h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{link.title || formatHost(link.url)}</p>
                      <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{link.url}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                ))}
                {media.links.length > previewLinks.length && (
                  <span className="text-xs text-muted-foreground">+{media.links.length - previewLinks.length} more links</span>
                )}
              </div>
            )}
          </div>
        )}

        {post.poll && <PollBlock post={post} currentUser={currentUser} />}

        {/* Post Tags/Hashtags */}
        {(post.tags.length > 0 || (post.hashtags && post.hashtags.length > 0)) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}>
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
            {post.hashtags?.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(`#${tag}`)}&tab=blogs`}>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Post Actions */}
        <PostInteractionBar post={post} currentUser={currentUser} onRefresh={onRefresh} onOpenComments={() => setShowComments(true)} />
        {showComments && (
          <InlineComments postId={post.id} />
        )}
      </CardContent>
    </Card>
    </div>
  )
}
