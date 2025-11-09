"use client"

import { useState, useEffect, use, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EditButton } from "@/components/ui/edit-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { uploadImageWithProgress } from "@/lib/utils/upload-signed"
import { getPetByUsernameAndSlug, getUserById, getBlogPosts, togglePetFollow, getUsers, getPets, getWikiArticles, updatePet } from "@/lib/storage"
import { getPetByUsernameAndSlugForViewer } from "@/lib/pet-health-storage"
import { createShareInvite, grantTemporaryAccess, getInvite, redeemShareInvite, acceptCoOwnerInvite } from "@/lib/pet-sharing"
import type { PrivacyLevel } from "@/lib/types"
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
  PawPrint,
  Dna,
  Lock,
  Share2,
  CheckCircle2,
  Trash2,
  Download,
} from "lucide-react"
import { zipSync } from "fflate"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { formatDate, calculateAge } from "@/lib/utils/date"

import { PhotoViewer } from "@/components/photo-viewer"
import { PetAchievementsSection } from "@/components/pet-achievements"
import { FriendRequestButton, FriendRequestsSection } from "@/components/friend-requests-manager"
import { addComment, getCommentsByPetPhotoId, toggleCommentReaction } from "@/lib/storage"
import type { Comment, ReactionType } from "@/lib/types"
import { toggleTimelineReaction, getTimelineReactions } from "@/lib/storage"
import { canViewPet, canInteractWithPet, canViewPost } from "@/lib/utils/privacy"
import { markMedicationDoseGivenToday, getMedicationAdherenceCountThisMonth } from "@/lib/pet-medication"
import { PetBreedSummary } from "@/components/pet-breed-summary"
import { PetCareChecklist } from "@/components/pet-care-checklist"
import { PetFavorites } from "@/components/pet/pet-favorites"

const formatSpecies = (species: string) => species.charAt(0).toUpperCase() + species.slice(1)

export default function PetProfilePage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params)
  const { user: currentUser } = useAuth()
  const [pet, setPet] = useState<any | null>(null)
  const [owner, setOwner] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null)
  const [newCommentText, setNewCommentText] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [weightModalOpen, setWeightModalOpen] = useState(false)
  const [weightDate, setWeightDate] = useState<string>("")
  const [weightValue, setWeightValue] = useState<string>("")
  const [weightUnit, setWeightUnit] = useState<'kg'|'lb'>('kg')
  const [birthdayEditing, setBirthdayEditing] = useState(false)
  const [birthdayDraft, setBirthdayDraft] = useState<string>("")
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false)
  const [photoUploading, setPhotoUploading] = useState<number>(0)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [captionMode, setCaptionMode] = useState(false)
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({})
  const [traitsOpen, setTraitsOpen] = useState(false)
  const [traitDrafts, setTraitDrafts] = useState<string[]>([])

  const loadPetData = useCallback(() => {
    const fetchedPet = getPetByUsernameAndSlug(username, slug)
    setPet(fetchedPet)
    if (fetchedPet) {
      const fetchedOwner = getUserById(fetchedPet.ownerId)
      setOwner(fetchedOwner)
      const fetchedPosts = getBlogPosts()
      const users = getUsers()
      const viewer = currentUser?.id || null
      const visiblePosts = fetchedPosts.filter((p) => {
        if (p.petId !== fetchedPet.id) return false
        const author = users.find((u) => u.id === p.authorId)
        if (!author) return false
        return canViewPost(p, author, viewer)
      })
      setPosts(visiblePosts)

      if (fetchedPet.friends && fetchedPet.friends.length > 0) {
        const allPets = getPets()
        const friendPets = fetchedPet.friends
          .map((friendId: string) => allPets.find((p) => p.id === friendId))
          .filter(Boolean)
        setFriends(friendPets)
      } else {
        setFriends([])
      }

      // Handle access token in URL for share links
      try {
        const params = new URLSearchParams(window.location.search)
        const accessToken = params.get('access') || params.get('invite')
        if (accessToken) {
          const invite = getInvite(accessToken)
          if (invite && invite.petId === fetchedPet.id) {
            // Grant temporary access for viewing health data
            if (invite.permissions?.viewHealth) {
              grantTemporaryAccess(fetchedPet.id)
            }
          }
        }
      } catch {}

      // Refresh with decrypted view for authorized viewer or temporary access
      const accessGranted = (() => {
        try {
          const params = new URLSearchParams(window.location.search)
          return params.has('access') || params.has('invite')
        } catch { return false }
      })()
      const grantSet = accessGranted ? new Set<string>([fetchedPet.id]) : new Set<string>()
      getPetByUsernameAndSlugForViewer(username, slug, currentUser?.id ?? null, grantSet).then((decrypted) => {
        if (decrypted) setPet(decrypted)
      })
    } else {
      setOwner(null)
      setPosts([])
      setFriends([])
    }
  }, [username, slug, currentUser?.id])

  useEffect(() => {
    setIsLoading(true)
    loadPetData()
    setIsLoading(false)
  }, [loadPetData])

  const refreshPetData = useCallback(() => {
    loadPetData()
  }, [loadPetData])

  useEffect(() => {
    if (currentUser && pet) {
      setIsFollowing(pet.followers && pet.followers.includes(currentUser.id))
    }
  }, [currentUser, pet])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!pet || !owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Pet not found</p>
      </div>
    )
  }

  const viewerId = currentUser?.id ?? null
  const ownerPrivacyFallback = (owner.privacy?.sections?.pets ?? owner.privacy?.pets ?? "public") as PrivacyLevel

  const resolveSetting = (field: "visibility" | "interactions"): PrivacyLevel => {
    const rawPrivacy = pet.privacy
    if (
      rawPrivacy &&
      typeof rawPrivacy === "object" &&
      field in rawPrivacy
    ) {
      return rawPrivacy[field] as PrivacyLevel
    }

    if (typeof rawPrivacy === "string") {
      return rawPrivacy
    }

    return ownerPrivacyFallback
  }

  const visibilitySetting = resolveSetting("visibility")
  const interactionSetting = resolveSetting("interactions")
  const canView = canViewPet(pet, owner, viewerId)
  const canInteract = canInteractWithPet(pet, owner, viewerId)

  const viewerIsBlockedByOwner = viewerId ? owner.blockedUsers?.includes(viewerId) : false
  const ownerIsBlockedByViewer = viewerId ? currentUser?.blockedUsers?.includes(owner.id) : false

  if (!canView) {
    let visibilityMessage: string
    if (viewerIsBlockedByOwner) {
      visibilityMessage = `${owner.fullName} has restricted access to this pet.`
    } else if (ownerIsBlockedByViewer) {
      visibilityMessage = "You have blocked this pet's owner, so their pets are hidden."
    } else if (!viewerId) {
      visibilityMessage = "Sign in to see if you can view this pet profile."
    } else if (visibilitySetting === "followers-only") {
      visibilityMessage = `Only people who follow ${owner.fullName} can view this pet.`
    } else {
      visibilityMessage = `${owner.fullName} keeps this pet profile private.`
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <BackButton href={`/user/${owner.username}`} label={`Back to ${owner.fullName}'s Profile`} icon={FileText} />
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Pet Profile Hidden</CardTitle>
                <CardDescription>{visibilityMessage}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {visibilitySetting === "followers-only" && !viewerIsBlockedByOwner && !ownerIsBlockedByViewer && (
              <p>
                Try following{" "}
                <Link href={`/user/${owner.username}`} className="text-primary underline">
                  {owner.fullName}
                </Link>{" "}
                to request access.
              </p>
            )}
            {!viewerId && (
              <p>
                You&apos;ll need to{" "}
                <Link href="/login" className="text-primary underline">
                  log in
                </Link>{" "}
                to see private pets.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Owner-only share controls
  const isOwner = viewerId === owner.id
  const [shareOpen, setShareOpen] = useState(false)
  const [shareViewHealth, setShareViewHealth] = useState(true)
  const [shareCoOwner, setShareCoOwner] = useState(false)
  const [shareLink, setShareLink] = useState<string>("")

  const generateShare = () => {
    const invite = createShareInvite(pet.id, owner.id, { viewHealth: shareViewHealth, coOwner: shareCoOwner })
    const url = `${window.location.origin}${window.location.pathname}?access=${encodeURIComponent(invite.token)}`
    setShareLink(url)
  }

  // Accept co-owner if visiting with invite and logged in
  const [coOwnerOffer, setCoOwnerOffer] = useState<{ token: string; label: string } | null>(null)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('invite') || params.get('access')
      if (!token || !pet) return
      const inv = getInvite(token)
      if (inv && inv.petId === pet.id && inv.permissions?.coOwner && currentUser && currentUser.id !== owner.id) {
        setCoOwnerOffer({ token, label: 'Accept Co-owner Invitation' })
      }
    } catch {}
  }, [pet?.id, currentUser?.id])

  const isOwner = currentUser?.id === pet.ownerId
  const privacyLabelMap: Record<PrivacyLevel, string> = {
    public: "Public",
    "followers-only": "Followers Only",
    private: "Private",
  }

  const followDisabled = !currentUser || (!canInteract && !isFollowing)
  let interactionRestriction: string | null = null

  if (!currentUser) {
    interactionRestriction = "Log in to follow or send a friend request."
  } else if (viewerIsBlockedByOwner) {
    interactionRestriction = "You cannot interact with this pet because the owner has blocked you."
  } else if (ownerIsBlockedByViewer) {
    interactionRestriction = "You have blocked this pet's owner."
  } else if (!canInteract && !isFollowing) {
    if (interactionSetting === "followers-only") {
      interactionRestriction = `Only people who follow ${owner.fullName} can interact with this pet.`
    } else if (interactionSetting === "private") {
      interactionRestriction = "Only the owner can interact with this pet."
    } else {
      interactionRestriction = "You cannot interact with this pet."
    }
  }

  const handleFollow = () => {
    if (!currentUser || !pet) return
    if (!canInteract && !isFollowing) return

    togglePetFollow(currentUser.id, pet.id)
    const refreshedPet = getPetByUsernameAndSlug(username, slug)
    if (refreshedPet) {
      setPet(refreshedPet)
      setIsFollowing(refreshedPet.followers.includes(currentUser.id))
    } else {
      setIsFollowing((prev) => !prev)
    }
  }

  // Helpers for quick edits
  const saveName = () => {
    if (!isOwner || !pet) return
    const trimmed = nameDraft.trim()
    if (!trimmed || trimmed === pet.name) { setEditingName(false); return }
    updatePet({ ...pet, name: trimmed })
    refreshPetData()
    setEditingName(false)
  }

  const openWeightLogger = () => {
    if (!isOwner) return
    setWeightDate(new Date().toISOString().slice(0,10))
    // prefill numeric; parse from pet.weight
    if (pet?.weight) {
      const m = pet.weight.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|kilograms|lb|lbs|pounds)?/i)
      if (m) {
        setWeightValue(m[1])
        const unit = (m[2] || 'kg').toLowerCase()
        setWeightUnit(unit.startsWith('lb') ? 'lb' : 'kg')
      }
    }
    setWeightModalOpen(true)
  }

  const saveWeightLog = () => {
    if (!isOwner || !pet) return
    const val = Number(weightValue)
    if (!Number.isFinite(val) || val <= 0) return
    const kg = weightUnit === 'kg' ? val : val * 0.453592
    const history = ((pet as any).weightHistory || []) as Array<{ date: string; valueKg: number }>
    const nextHistory = [...history, { date: weightDate || new Date().toISOString().slice(0,10), valueKg: Number(kg.toFixed(2)) }]
    const display = weightUnit === 'kg' ? `${val} kg` : `${val} lb`
    updatePet({ ...pet, weight: display, weightHistory: nextHistory } as any)
    setWeightModalOpen(false)
    refreshPetData()
  }

  const saveBirthday = () => {
    if (!isOwner || !pet) return
    if (!birthdayDraft) { setBirthdayEditing(false); return }
    const age = calculateAge(birthdayDraft)
    updatePet({ ...pet, birthday: birthdayDraft, age } as any)
    setBirthdayEditing(false)
    refreshPetData()
  }

  const movePhoto = (from: number, to: number) => {
    if (!pet || !isOwner) return
    const arr = [...(pet.photos || [])]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    const updated = { ...pet, photos: arr, avatar: arr[0] || pet.avatar }
    updatePet(updated)
    refreshPetData()
  }

  const removePhoto = (idx: number) => {
    if (!pet || !isOwner) return
    const arr = (pet.photos || []).filter((_, i) => i !== idx)
    const updated = { ...pet, photos: arr, avatar: idx === 0 ? (arr[0] || undefined) : pet.avatar }
    updatePet(updated)
    refreshPetData()
  }

  const uploadNewPhoto = async (file: File) => {
    if (!pet || !isOwner) return
    try {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
      const res = await uploadImageWithProgress({ file, folder: 'pets', onProgress: (v) => setUploadProgress((prev) => ({ ...prev, [file.name]: v })) })
      const arr = [...(pet.photos || []), res.url]
      const updated = { ...pet, photos: arr }
      updatePet(updated)
      refreshPetData()
    } catch (e) {
      console.error('upload failed', e)
    } finally {
      setTimeout(() => setUploadProgress((prev) => { const next = { ...prev }; delete next[file.name]; return next }), 500)
    }
  }

  const PREDEFINED_TRAITS = [
    'Friendly','Shy','Energetic','Calm','Playful','Curious','Protective','Independent','Affectionate','Vocal','Quiet','Intelligent','Stubborn','Loyal','Anxious','Confident','Gentle','Aggressive','Good with Kids','Good with Other Pets'
  ]
  const saveTraits = () => {
    if (!isOwner || !pet) return
    const personality = pet.personality || {}
    const next = { ...pet, personality: { ...personality, traits: traitDrafts } }
    updatePet(next as any)
    setTraitsOpen(false)
    refreshPetData()
  }

  // Build activity timeline entries from pet data
  const timelineEntries = useMemo(() => {
    if (!pet) return [] as Array<{ id: string; date: string; kind: string; title: string; description?: string; photos?: string[] }>
    const entries: Array<{ id: string; date: string; kind: string; title: string; description?: string; photos?: string[] }> = []
    // Adoption
    if (pet.adoptionDate) {
      entries.push({ id: `adopt-${pet.id}`, date: pet.adoptionDate, kind: 'adoption', title: 'Added to family', description: `${pet.name} joined the family.` })
    }
    // First vet visit
    const checkups = (pet.healthRecords || []).filter((r: any) => r.type === 'checkup').sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (checkups.length > 0) {
      const first = checkups[0]
      entries.push({ id: `vet-${first.id}`, date: first.date, kind: 'vet', title: 'First vet visit', description: first.title || 'First checkup' })
    }
    // Vaccinations
    ;(pet.vaccinations || []).forEach((v: any) => {
      entries.push({ id: `vac-${v.id}`, date: v.date, kind: 'vaccination', title: `Completed vaccination`, description: v.name })
    })
    // Health updates
    ;(pet.healthRecords || []).forEach((r: any) => {
      if (r.type === 'illness' || r.type === 'injury' || r.type === 'surgery') {
        entries.push({ id: `health-${r.id}`, date: r.date, kind: 'health', title: 'Health update', description: r.title || r.description, photos: r.attachments })
      }
    })
    // Achievements
    ;(pet.achievements || []).forEach((a: any) => {
      const when = a.earnedAt || new Date().toISOString()
      entries.push({ id: `ach-${a.id}`, date: when, kind: 'accomplishment', title: 'New accomplishment', description: a.title })
    })
    // Birthday (last occurrence)
    if (pet.birthday) {
      const now = new Date()
      const b = new Date(pet.birthday)
      const currentYearBirthday = new Date(now.getFullYear(), b.getMonth(), b.getDate())
      const last = currentYearBirthday <= now ? currentYearBirthday : new Date(now.getFullYear() - 1, b.getMonth(), b.getDate())
      entries.push({ id: `bday-${last.getFullYear()}`, date: last.toISOString(), kind: 'birthday', title: 'Birthday celebrations', description: `Happy birthday, ${pet.name}!`, photos: pet.photos && pet.photos.length > 0 ? [pet.photos[0]] : undefined })
    }
    // Sort reverse chronologically
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return entries
  }, [pet])

  const entryKeyForComments = (entryId: string) => `${pet?.id}:${'timeline-' + entryId}`

  const entryReactions = (entryId: string) => getTimelineReactions(pet!.id, entryId)

  const toggleEntryHeart = (entryId: string) => {
    if (!currentUser || !pet) return
    toggleTimelineReaction(pet.id, entryId, currentUser.id, 'love' as ReactionType)
    // force re-render by updating state toggles (we rely on getter each render)
    setOpenCommentsFor((prev) => prev === entryId ? entryId + '' : prev)
  }

  const commentsForEntry = (entryId: string) => getCommentsByPetPhotoId(entryKeyForComments(entryId))

  const addEntryComment = () => {
    if (!currentUser || !newCommentText.trim() || !openCommentsFor || !pet) return
    const c: Comment = {
      id: String(Date.now()),
      petPhotoId: entryKeyForComments(openCommentsFor),
      userId: currentUser.id,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    }
    addComment(c)
    setNewCommentText("")
  }

  const getSpeciesEmoji = (s: string) => {
    switch (s) {
      case 'dog': return '🐕'
      case 'cat': return '🐈'
      case 'bird': return '🐦'
      case 'rabbit': return '🐇'
      case 'hamster': return '🐹'
      case 'fish': return '🐟'
      default: return '✨'
    }
  }
  const isVerifiedPet = Boolean(pet.achievements?.some((a: any) => a?.highlight || a?.type === 'service'))
  const cover = pet.photos && pet.photos.length > 0 ? pet.photos[0] : (pet.avatar || null)
  const speciesBg: Record<string, string> = {
    dog: 'from-amber-200/60 via-amber-100 to-white',
    cat: 'from-blue-200/60 via-blue-100 to-white',
    bird: 'from-yellow-200/60 via-yellow-100 to-white',
    rabbit: 'from-pink-200/60 via-pink-100 to-white',
    hamster: 'from-orange-200/60 via-orange-100 to-white',
    fish: 'from-cyan-200/60 via-cyan-100 to-white',
    other: 'from-purple-200/60 via-purple-100 to-white',
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/user/${owner.username}`} label={`Back to ${owner.fullName}'s Profile`} icon={FileText} />
      <section className="relative rounded-2xl overflow-hidden border bg-card shadow-sm mb-6">
        <div className={`relative h-[220px] sm:h-[260px] lg:h-[360px] w-full ${cover ? '' : `bg-gradient-to-b ${speciesBg[pet.species] || speciesBg.other}`}` }>
          {cover && (
            <img src={cover} alt={`${pet.name} cover`} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/40" />
        </div>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-16 sm:-mt-24 flex items-end gap-4">
            <Avatar
              className="h-[200px] w-[200px] border-4 border-background shadow-2xl cursor-pointer"
              onClick={() => { if (isOwner) setPhotoManagerOpen(true) }}
              title={isOwner ? 'Click to manage photos' : undefined}
            >
              <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
              <AvatarFallback className="text-4xl">{pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingName && isOwner ? (
                    <input
                      autoFocus
                      className="text-3xl sm:text-4xl font-bold tracking-tight bg-white/90 text-black rounded px-2 py-1"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      onBlur={() => setEditingName(false)}
                    />
                  ) : (
                    <h1
                      className="text-3xl sm:text-4xl font-bold tracking-tight cursor-pointer"
                      title={isOwner ? 'Click to edit name' : undefined}
                      onClick={() => { if (isOwner) { setNameDraft(pet.name); setEditingName(true) } }}
                    >
                      {getSpeciesEmoji(pet.species)} {pet.name}
                    </h1>
                  )}
                  {isVerifiedPet && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-xs">
                      <CheckCircle2 className="h-4 w-4" /> Verified
                    </span>
                  )}
                  {pet.spayedNeutered && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs">
                      <Shield className="h-3 w-3" /> Fixed
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base opacity-90">
                  {formatSpecies(pet.species)}{pet.breed ? ` • ${pet.breed}` : ''}{pet.age ? ` • ${pet.age} ${pet.age === 1 ? 'year' : 'years'} old` : ''}
                </p>
                <Link href={`/user/${owner.username}`} className="text-xs sm:text-sm underline">
                  Owned by @{owner.username}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <Button type="button" variant="secondary" onClick={() => setPhotoManagerOpen(true)} title="Manage photos">
                    <Camera className="h-4 w-4 mr-2" /> Manage Photos
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : ''
                  if (!url) return
                  if ((navigator as any).share) {
                    ;(navigator as any).share({ title: `${pet.name} on PetSocial`, text: `Meet ${pet.name}!`, url }).catch(() => {})
                  } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!')).catch(() => {})
                  }
                }}>
                  <Share2 className="h-4 w-4 mr-2" /> Share Profile
                </Button>
                {isOwner && (
                  <>
                    <Button type="button" variant="secondary" data-testid="secure-share-button" onClick={() => setShareOpen(true)}>
                      <Share2 className="h-4 w-4 mr-2" /> Secure Share
                    </Button>
                    <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate Secure Share Link</DialogTitle>
                          <DialogDescription>Choose what the recipient can access</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shareViewHealth} onChange={(e) => setShareViewHealth(e.target.checked)} /> Allow viewing health data</label>
                          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shareCoOwner} onChange={(e) => setShareCoOwner(e.target.checked)} /> Invite as co-owner (can edit)</label>
                          <div className="flex items-center gap-2">
                            <Button onClick={generateShare} data-testid="generate-share-link">Generate Link</Button>
                            {shareLink && (
                              <>
                                <input className="flex-1 border rounded px-2 py-1 text-xs" value={shareLink} readOnly data-testid="share-link" />
                                <Button variant="outline" onClick={() => navigator.clipboard?.writeText(shareLink)} data-testid="copy-share-link">Copy</Button>
                              </>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {isOwner ? (
                  <Link href={`/user/${owner.username}/pet/${slug}/edit`}>
                    <EditButton>Edit Profile</EditButton>
                  </Link>
                ) : currentUser ? (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    disabled={followDisabled}
                    title={followDisabled && interactionRestriction ? interactionRestriction : undefined}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                ) : (
                  <Link href="/login"><Button><Heart className="h-4 w-4 mr-2" /> Log in to Follow</Button></Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {coOwnerOffer && currentUser && (
        <div className="container mx-auto px-4 mt-4">
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle className="text-base">Co-owner invitation</CardTitle>
              <CardDescription>You have been invited to co-own this pet. Accept to edit and manage health data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button data-testid="accept-coowner" onClick={() => {
                  if (!coOwnerOffer || !currentUser) return
                  const inv = redeemShareInvite(coOwnerOffer.token, currentUser.id)
                  if (inv) {
                    acceptCoOwnerInvite(pet.id, currentUser.id, inv.permissions)
                    setCoOwnerOffer(null)
                    loadPetData()
                  }
                }}>Accept</Button>
                <Button variant="outline" onClick={() => setCoOwnerOffer(null)}>Dismiss</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Stats Bar */}
      <section className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              <span>Followers</span>
            </div>
            <div className="text-base font-semibold">{pet.followers?.length || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText className="h-4 w-4" />
              <span>Posts</span>
            </div>
            <div className="text-base font-semibold">{posts.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Camera className="h-4 w-4" />
              <span>Photos</span>
            </div>
            <div className="text-base font-semibold">{(pet.photos && pet.photos.length) || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Cake className="h-4 w-4" />
              <span>Age</span>
            </div>
            <div className="text-base font-semibold">
              {(() => {
                const years = calculateAge(pet.birthday)
                if (years !== undefined) return `${years} yr${years === 1 ? '' : 's'}`
                if (typeof pet.age === 'number') return `${pet.age} yr${pet.age === 1 ? '' : 's'}`
                return '—'
              })()}
            </div>
          </div>
        </div>
      </section>
                <Link href={`/user/${username}/pet/${slug}/followers`} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{pet.followers.length}</span>
                  <span className="text-muted-foreground">{pet.followers.length === 1 ? "Follower" : "Followers"}</span>
                </Link>
                {pet.friends && pet.friends.length > 0 && (
                  <Link href={`/user/${username}/pet/${slug}/friends`} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{pet.friends.length}</span>
                    <span className="text-muted-foreground">{pet.friends.length === 1 ? "Friend" : "Friends"}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="about" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          {/* Physical Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Physical Stats
              </CardTitle>
              <CardDescription>Weight, appearance, birthday, and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weight and chart */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Current Weight</div>
                    <div
                      className={`text-lg font-semibold ${isOwner ? 'cursor-pointer underline decoration-dotted underline-offset-4' : ''}`}
                      title={isOwner ? 'Click to log/update weight' : undefined}
                      onClick={() => { if (isOwner) openWeightLogger() }}
                    >
                      {pet.weight || '—'}
                    </div>
                  </div>
                  {(() => {
                    // Compute healthy range from breed data if available
                    const articles = getWikiArticles()
                    const article = pet.breed ? articles.find((a) => a.category === 'breeds' && (a.title.toLowerCase() === pet.breed.toLowerCase() || a.slug === pet.breed.toLowerCase().replace(/\s+/g, '-'))) : undefined
                    const male = article?.breedData?.maleAvgWeightKg
                    const female = article?.breedData?.femaleAvgWeightKg
                    const avgKg = male && female ? (male + female) / 2 : (male || female)
                    const parseWeight = (w?: string): { kg?: number; unit?: string } => {
                      if (!w) return {}
                      const m = w.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|kilograms|lb|lbs|pounds)?/i)
                      if (!m) return {}
                      const num = Number(m[1])
                      const unit = (m[2] || '').toLowerCase()
                      if (!Number.isFinite(num)) return {}
                      if (unit.startsWith('lb') || unit.startsWith('pound')) return { kg: num * 0.453592, unit: 'lb' }
                      return { kg: num, unit: 'kg' }
                    }
                    const current = parseWeight(pet.weight)
                    if (!avgKg) return null
                    const low = avgKg * 0.85
                    const high = avgKg * 1.15
                    const status = current.kg !== undefined ? (current.kg >= low && current.kg <= high ? 'green' : (current.kg >= avgKg * 0.75 && current.kg <= avgKg * 1.25 ? 'yellow' : 'red')) : undefined
                    const color = status === 'green' ? 'text-green-600' : status === 'yellow' ? 'text-amber-600' : 'text-red-600'
                    return (
                      <div className="text-xs flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-amber-500' : status === 'red' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                        <span className="text-muted-foreground">Healthy range:</span>
                        <span className={`font-medium ${color}`}>
                          {low.toFixed(1)}–{high.toFixed(1)} kg
                        </span>
                      </div>
                    )
                  })()}
                  {(() => {
                    // Optional weight history chart (if present on pet)
                    const history = (pet as any).weightHistory as Array<{ date: string; valueKg: number }> | undefined
                    if (!history || history.length < 2) return null
                    const points = history
                      .map((d) => ({ x: new Date(d.date).getTime(), y: d.valueKg }))
                      .sort((a, b) => a.x - b.x)
                    const xs = points.map((p) => p.x)
                    const ys = points.map((p) => p.y)
                    const minX = Math.min(...xs)
                    const maxX = Math.max(...xs)
                    const minY = Math.min(...ys)
                    const maxY = Math.max(...ys)
                    const w = 360
                    const h = 80
                    const px = (x: number) => ((x - minX) / Math.max(1, maxX - minX)) * (w - 10) + 5
                    const py = (y: number) => h - (((y - minY) / Math.max(0.001, maxY - minY)) * (h - 10) + 5)
                    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x)},${py(p.y)}`).join(' ')
                    return (
                      <div className="mt-1">
                        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
                          <path d={d} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" />
                        </svg>
                        <div className="text-[11px] text-muted-foreground">Weight over time</div>
                      </div>
                    )
                  })()}
                </div>

                {/* Appearance and IDs */}
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Appearance</div>
                    <div className="text-sm">{pet.color || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Birthday</div>
                    <div className="text-sm flex items-center gap-2">
                      {birthdayEditing && isOwner ? (
                        <>
                          <input
                            type="date"
                            className="border rounded px-2 py-1 text-sm text-black"
                            value={birthdayDraft}
                            onChange={(e) => setBirthdayDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveBirthday(); if (e.key === 'Escape') setBirthdayEditing(false) }}
                            onBlur={() => setBirthdayEditing(false)}
                          />
                          <Button size="sm" onClick={saveBirthday}>Save</Button>
                        </>
                      ) : (
                        <span
                          className={isOwner ? 'cursor-pointer underline decoration-dotted underline-offset-4' : ''}
                          title={isOwner ? 'Click to edit birthdate' : undefined}
                          onClick={() => { if (isOwner) { setBirthdayDraft(pet.birthday || ''); setBirthdayEditing(true) } }}
                        >
                          {pet.birthday ? formatDate(pet.birthday) : '—'}
                        </span>
                      )}
                      {(() => {
                        if (!pet.birthday) return null
                        const now = new Date()
                        const birth = new Date(pet.birthday)
                        const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
                        if (next < now) next.setFullYear(now.getFullYear() + 1)
                        const diffDays = Math.round((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        if (diffDays >= 0 && diffDays <= 30) {
                          return <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">🎂 Birthday coming up!</span>
                        }
                        return null
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Microchip</div>
                      <div className="text-sm">{pet.microchipId || '—'}{pet.microchipCompany ? ` • ${pet.microchipCompany}` : ''}</div>
                    </div>
                    {pet.microchipId && (
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(pet.microchipId)}>
                        Copy ID
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Breed Summary and Care Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PetBreedSummary pet={pet} />
            <PetCareChecklist pet={pet} />
          </div>

          {/* Activity & Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Activity & Milestones
              </CardTitle>
              <CardDescription>Recent highlights of {pet.name}'s journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {timelineEntries.map((e) => {
                    const reactions = entryReactions(e.id)
                    const love = Object.values(reactions)[0]?.love?.length || 0
                    return (
                      <div key={e.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{formatDate(e.date)}</div>
                            <div className="font-medium">{e.title}</div>
                            {e.description && <div className="text-sm">{e.description}</div>}
                            {e.photos && e.photos.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {e.photos.slice(0, 3).map((url, idx) => (
                                  <img key={idx} src={url} alt="" className="h-24 w-full object-cover rounded" />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" disabled={!currentUser} onClick={() => toggleEntryHeart(e.id)}>
                              <Heart className={`h-4 w-4 mr-1 ${love > 0 ? 'fill-current text-red-500' : ''}`} /> {love}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setOpenCommentsFor((prev) => prev === e.id ? null : e.id)}>
                              Comments
                            </Button>
                          </div>
                        </div>
                        {openCommentsFor === e.id && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                className="flex-1 border rounded px-2 py-1 text-sm"
                                value={newCommentText}
                                onChange={(ev) => setNewCommentText(ev.target.value)}
                                placeholder="Write a comment…"
                                onKeyDown={(ev) => { if (ev.key === 'Enter') addEntryComment() }}
                              />
                              <Button size="sm" onClick={addEntryComment} disabled={!currentUser || !newCommentText.trim()}>Post</Button>
                            </div>
                            <div className="space-y-2">
                              {commentsForEntry(e.id).map((c) => (
                                <div key={c.id} className="text-sm border rounded p-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</div>
                                  </div>
                                  <div>{c.content}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personality Traits */}
              {pet.personality && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Personality
                      </CardTitle>
                      {isOwner && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTraitDrafts(Array.isArray(pet.personality?.traits) ? [...pet.personality.traits] : [])
                            setTraitsOpen(true)
                          }}
                        >
                          Edit Traits
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category chips */}
                    <div className="flex flex-wrap gap-2">
                      {typeof pet.personality.energyLevel === 'number' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                          ⚡ Energy: {pet.personality.energyLevel}/5
                        </span>
                      )}
                      {typeof pet.personality.friendliness === 'number' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-800">
                          🤝 Social: {pet.personality.friendliness}/5
                        </span>
                      )}
                      {typeof pet.personality.independence === 'number' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-800">
                          🌿 Temperament: {pet.personality.independence}/5
                        </span>
                      )}
                    </div>
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
                      <div
                        className="flex flex-wrap gap-2"
                        title={isOwner ? 'Click to edit traits' : undefined}
                        onClick={() => {
                          if (!isOwner) return
                          setTraitDrafts(Array.isArray(pet.personality?.traits) ? [...pet.personality.traits] : [])
                          setTraitsOpen(true)
                        }}
                      >
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
            <PetFavorites
              pet={pet}
              currentUserId={currentUser?.id || null}
              onPetUpdate={(updatedPet) => {
                setPet(updatedPet)
                refreshPetData()
              }}
            />

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

          {/* Medical Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Allergies */}
              <div>
                <p className="text-sm font-medium mb-2">Allergies</p>
                {Array.isArray(pet.allergies) && pet.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {pet.allergies.map((a) => {
                      const sev = (pet as any).allergySeverities?.[a] as 'mild' | 'moderate' | 'severe' | undefined
                      const cls = sev === 'severe' ? 'bg-red-100 text-red-800' : sev === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      const label = sev ? `${a} (${sev})` : a
                      return (
                        <span key={a} className={`px-2 py-0.5 rounded text-xs ${cls}`}>{label}</span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No allergies listed</p>
                )}
              </div>

              {/* Medications */}
              <div>
                <p className="text-sm font-medium mb-2">Medications</p>
                {Array.isArray(pet.medications) && pet.medications.length > 0 ? (
                  <div className="space-y-2">
                    {pet.medications.slice(0, 5).map((m) => (
                      <div key={m.id} className="text-sm flex items-center justify-between border rounded p-2">
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-muted-foreground text-xs">{m.dosage}{m.frequency ? ` • ${m.frequency}` : ''}{m.purpose ? ` • ${m.purpose}` : ''}</div>
                        </div>
                        {m.startDate && (
                          <div className="text-xs text-muted-foreground">Since {formatDate(m.startDate)}</div>
                        )}
                      </div>
                    ))}
                    {pet.medications.length > 5 && (
                      <div className="text-xs text-muted-foreground">+{pet.medications.length - 5} more</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No current medications</p>
                )}
              </div>

              {/* Conditions */}
              <div>
                <p className="text-sm font-medium mb-2">Conditions</p>
                {Array.isArray((pet as any).conditions) && (pet as any).conditions.length > 0 ? (
                  <div className="space-y-2">
                    {(pet as any).conditions.map((c: any) => (
                      <div key={c.id} className="text-sm flex items-center justify-between border rounded p-2">
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-muted-foreground text-xs">Diagnosed {c.diagnosedAt ? formatDate(c.diagnosedAt) : '—'}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800">{c.status || 'Monitoring'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No conditions recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>Adoption papers, certificates, insurance docs, and vet receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pet.microchipCertificateUrl ? (
                <div className="flex items-center justify-between border rounded p-3">
                  <div className="text-sm">
                    <div className="font-medium">Microchip Certificate</div>
                    <div className="text-muted-foreground">Uploaded</div>
                  </div>
                  <a href={pet.microchipCertificateUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm">View</a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              )}
              <p className="text-[11px] text-muted-foreground">Owners can add more documents from the edit page.</p>
            </CardContent>
          </Card>
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
                        {viewerId === owner.id && !medication.endDate && (
                          <div className="mt-2 flex items-center gap-2">
                            <Button size="sm" variant="secondary" data-testid={`mark-given-${medication.id}`} onClick={() => {
                              markMedicationDoseGivenToday(pet.id, medication.id)
                              // Refresh
                              loadPetData()
                            }}>Mark Given Today</Button>
                            <span className="text-xs text-muted-foreground">This month: {getMedicationAdherenceCountThisMonth(pet, medication.id)}</span>
                          </div>
                        )}
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
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pet.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                        onClick={() => {
                          setSelectedPhotoIndex(idx)
                          setPhotoViewerOpen(true)
                        }}
                      >
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`${pet.name} photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button type="button" variant="outline" onClick={() => { setSelectedPhotoIndex(0); setPhotoViewerOpen(true) }}>
                      Start Slideshow
                    </Button>
                  </div>
                  <PhotoViewer
                    photos={pet.photos}
                    petId={pet.id}
                    initialIndex={selectedPhotoIndex}
                    isOpen={photoViewerOpen}
                    onClose={() => setPhotoViewerOpen(false)}
                    petName={pet.name}
                  />
                </>
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
          <PetAchievementsSection achievements={pet.achievements} petName={pet.name} />
        </TabsContent>

        <TabsContent value="friends">
          <div className="space-y-6">
            <FriendRequestsSection pet={pet} onChange={refreshPetData} />
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
                    const assignmentId = pet.friendCategoryAssignments?.[friend.id]
                    const assignedCategory =
                      assignmentId && pet.friendCategories
                        ? pet.friendCategories.find((category) => category.id === assignmentId)
                        : undefined

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
                            <div className="space-y-2">
                              <p className="font-semibold">{friend.name}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {friend.species}
                                </Badge>
                                {assignedCategory ? (
                                  <Badge variant="secondary">{assignedCategory.name}</Badge>
                                ) : pet.friendCategories && pet.friendCategories.length > 0 ? (
                                  <Badge variant="outline">No category</Badge>
                                ) : null}
                              </div>
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
          </div>
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

      {/* Weight Logging Modal */}
      <Dialog open={weightModalOpen} onOpenChange={setWeightModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Weight</DialogTitle>
            <DialogDescription>Add a new weight entry for {pet.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight-date">Date</Label>
              <Input id="weight-date" type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight-value">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight-value"
                  type="number"
                  step="0.1"
                  min="0"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveWeightLog(); if (e.key === 'Escape') setWeightModalOpen(false) }}
                />
                <Select value={weightUnit} onValueChange={(v: 'kg'|'lb') => setWeightUnit(v)}>
                  <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" type="button" onClick={() => setWeightModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveWeightLog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Manager Modal */}
      <Dialog open={photoManagerOpen} onOpenChange={(open) => { setPhotoManagerOpen(open); if (!open) { setSelected(new Set()); setCaptionMode(false); setCaptionDrafts({}) } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Photos</DialogTitle>
            <DialogDescription>Reorder, set primary, remove, or upload new photos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {pet.photos?.length ? `${pet.photos.length} of 20 photos uploaded` : 'No photos yet'}
              </div>
              <div className="flex items-center gap-2">
                {((pet.photos?.length || 0) < 20) ? (
                  <>
                    <Label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-muted/40" htmlFor="pet-photo-upload">
                      <Camera className="h-4 w-4" /> Upload
                    </Label>
                    <input id="pet-photo-upload" type="file" accept="image/*" className="hidden" multiple onChange={async (e) => {
                      const current = (pet.photos?.length || 0)
                      const maxMore = Math.max(0, 20 - current)
                      const files = Array.from(e.target.files || []).slice(0, maxMore)
                      if (files.length === 0) { try { (e.target as any).value=''; } catch {}; return }
                      for (const f of files) { await uploadNewPhoto(f) }
                      if ((e.target.files?.length || 0) > files.length) {
                        alert(`Only ${maxMore} more photo${maxMore===1?'':'s'} allowed (max 20). Extra files were skipped.`)
                      }
                      try { (e.target as any).value = '' } catch {}
                    }} />
                  </>
                ) : (
                  <Button type="button" size="sm" disabled title="Maximum 20 photos reached">Upload</Button>
                )}
              </div>
            </div>
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-2">
                {Object.entries(uploadProgress).map(([name, pct]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[220px]">{name}</span>
                      <span className="text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                ))}
              </div>
            )}

            {selected.size > 0 && !captionMode && (
              <div className="flex flex-wrap items-center gap-2 p-2 border rounded bg-muted/40">
                <span className="text-sm mr-2">{selected.size} selected</span>
                <Button size="sm" variant="outline" onClick={() => {
                  if (!pet.photos) return
                  setSelected(new Set(pet.photos))
                }}>Select All</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                <Button size="sm" variant="destructive" onClick={() => {
                  const count = selected.size
                  if (count === 0) return
                  if (!window.confirm(`Delete ${count} photo${count===1?'':'s'}?`)) return
                  const keep = (pet.photos || []).filter((u: string) => !selected.has(u))
                  const updated: any = { ...pet, photos: keep, avatar: selected.has(pet.avatar) ? (keep[0] || undefined) : pet.avatar }
                  if (pet.photoCaptions) {
                    const pc = { ...pet.photoCaptions }
                    Array.from(selected).forEach((u) => { delete pc[u] })
                    updated.photoCaptions = Object.keys(pc).length ? pc : undefined
                  }
                  updatePet(updated)
                  setSelected(new Set())
                  refreshPetData()
                }}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete selected
                </Button>
                <Button size="sm" variant="outline" disabled={selected.size !== 1} onClick={() => {
                  if (selected.size !== 1) return
                  const url = Array.from(selected)[0]
                  const idx = (pet.photos || []).findIndex((u: string) => u === url)
                  if (idx >= 0) movePhoto(idx, 0)
                  setSelected(new Set())
                }}>
                  Set as primary
                </Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const urls = Array.from(selected)
                  if (urls.length === 0) return
                  const files: Record<string, Uint8Array> = {}
                  let i = 1
                  for (const u of urls) {
                    try {
                      const res = await fetch(u)
                      const ab = await res.arrayBuffer()
                      const ext = (u.split('.').pop() || 'jpg').split('?')[0]
                      const fname = `photo-${i}.${ext}`
                      files[fname] = new Uint8Array(ab)
                      i += 1
                    } catch {}
                  }
                  const zipped = zipSync(files)
                  const blob = new Blob([zipped], { type: 'application/zip' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `${pet.name.replace(/\s+/g,'-')}-photos.zip`
                  document.body.appendChild(a)
                  a.click()
                  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 0)
                }}>
                  <Download className="h-4 w-4 mr-1" /> Download selected
                </Button>
                <Button size="sm" onClick={() => {
                  const drafts: Record<string,string> = {}
                  const pc = pet.photoCaptions || {}
                  Array.from(selected).forEach((u) => drafts[u] = pc[u] || '')
                  setCaptionDrafts(drafts)
                  setCaptionMode(true)
                }}>
                  <Edit className="h-4 w-4 mr-1" /> Add captions
                </Button>
              </div>
            )}

            {captionMode && (
              <div className="space-y-3 border rounded p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Add captions to selected photos</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setCaptionMode(false) }}>Cancel</Button>
                    <Button size="sm" onClick={() => {
                      const next = { ...(pet.photoCaptions || {}) }
                      Object.entries(captionDrafts).forEach(([u, text]) => {
                        const t = (text || '').trim()
                        if (t) next[u] = t; else delete next[u]
                      })
                      updatePet({ ...pet, photoCaptions: Object.keys(next).length ? next : undefined } as any)
                      setCaptionMode(false)
                      setSelected(new Set())
                      refreshPetData()
                    }}>Save Captions</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-auto pr-1">
                  {Array.from(selected).map((u) => (
                    <div key={u} className="flex items-center gap-2 border rounded p-2">
                      <div className="h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img src={u} alt="selected" className="h-full w-full object-cover" />
                      </div>
                      <Input
                        value={captionDrafts[u] || ''}
                        onChange={(e) => setCaptionDrafts((prev) => ({ ...prev, [u]: e.target.value }))}
                        placeholder="Add a caption"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(pet.photos || []).map((url: string, idx: number) => (
                <div
                  key={url}
                  className={`border rounded-lg p-2 space-y-2 bg-card ${selected.has(url) ? 'ring-2 ring-primary' : ''}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { const from = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(from)) movePhoto(from, idx) }}
                >
                  <div className="relative aspect-square overflow-hidden rounded-md">
                    <img src={url} alt="Pet photo" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <label className="inline-flex items-center gap-2 bg-background/70 rounded px-1.5 py-1" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(url)} onCheckedChange={(v) => {
                          setSelected((prev) => {
                            const next = new Set(prev)
                            if (v) next.add(url); else next.delete(url)
                            return next
                          })
                        }} />
                      </label>
                    </div>
                    {idx === 0 && (
                      <span className="absolute bottom-2 left-2 text-[11px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Primary</span>
                    )}
                  </div>
                  {!captionMode && (
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => movePhoto(idx, 0)}>
                        Set Primary
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removePhoto(idx)}>
                        Remove
                      </Button>
                    </div>
                  )}
                  {pet.photoCaptions && pet.photoCaptions[url] && (
                    <div className="text-xs text-muted-foreground truncate" title={pet.photoCaptions[url]}>
                      {pet.photoCaptions[url]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setPhotoManagerOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Traits Selector Modal */}
      <Dialog open={traitsOpen} onOpenChange={setTraitsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Traits</DialogTitle>
            <DialogDescription>Pick up to 10 traits that best describe {pet.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TRAITS.map((trait) => {
                const selected = traitDrafts.includes(trait)
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => {
                      setTraitDrafts((prev) => {
                        if (selected) return prev.filter((t) => t !== trait)
                        if (prev.length >= 10) return prev
                        return [...prev, trait]
                      })
                    }}
                    className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                    aria-pressed={selected}
                  >
                    {trait}
                  </button>
                )
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-trait">Add custom trait</Label>
              <Input
                id="custom-trait"
                placeholder="e.g., Loves belly rubs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.currentTarget.value || '').trim()
                    if (v && !traitDrafts.includes(v) && traitDrafts.length < 10) {
                      setTraitDrafts([...traitDrafts, v])
                    }
                    e.currentTarget.value = ''
                  } else if (e.key === 'Escape') {
                    setTraitsOpen(false)
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Max 10 traits.</p>
            </div>
            {traitDrafts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {traitDrafts.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
                    {t}
                    <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setTraitDrafts(traitDrafts.filter((x) => x !== t))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setTraitsOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveTraits}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
