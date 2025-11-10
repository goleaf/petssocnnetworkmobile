"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import type { Group, GroupMember, User } from "@/lib/types"
import {
  getGroupCategoryById,
  getUserById,
  isUserMemberOfGroup,
  removeGroupMember,
  canUserManageSettings,
  getDefaultGroupVisibility,
  getUserRoleInGroup,
} from "@/lib/storage"
import { joinGroup } from "@/lib/groups"
import { getAnimalConfigLucide } from "@/lib/animal-types"
import {
  Users,
  Settings,
  Lock,
  Eye,
  EyeOff,
  UserPlus as UserPlusIcon,
  Share2,
  Clock,
  Flag,
  BellOff,
  LogOut,
  Check,
  CheckCircle,
  MoreHorizontal,
  UserCheck,
} from "lucide-react"

interface GroupHeaderProps {
  group: Group
  members: GroupMember[]
  onJoin?: () => void
  onLeave?: () => void
}

const getCategoryIcon = (categoryId: string) => {
  const categoryToAnimalMap: Record<string, string> = {
    "cat-dogs": "dog",
    "cat-cats": "cat",
    "cat-birds": "bird",
    "cat-small-pets": "rabbit",
  }

  const animalType = categoryToAnimalMap[categoryId]
  if (animalType) {
    return getAnimalConfigLucide(animalType)
  }

  const customIconMap: Record<string, { icon: any; color: string }> = {
    "cat-training": { icon: CheckCircle, color: "text-red-500" },
    "cat-health": { icon: Check, color: "text-pink-500" },
    "cat-adoption": { icon: Flag, color: "text-orange-500" },
    "cat-nutrition": { icon: UserPlusIcon, color: "text-emerald-500" },
  }

  return customIconMap[categoryId]
}

const getCoverImage = (group: Group) => {
  if (group.coverImage) return group.coverImage
  const seed = group.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10) || "default"
  return `https://picsum.photos/seed/${seed}/1500/500`
}

const getAvatarImage = (group: Group) => {
  if (group.avatar) return group.avatar
  const name = encodeURIComponent(group.name)
  const color = group.visibility?.content === "members" ? "2563eb" : "10b981"
  return `https://ui-avatars.com/api/?name=${name}&background=${color}&color=fff&size=200`
}

export function GroupHeader({ group, members, onJoin, onLeave }: GroupHeaderProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [copyLabel, setCopyLabel] = useState("Copy link")
  const [inviteRecipient, setInviteRecipient] = useState("")
  const [inviteNote, setInviteNote] = useState("")
  const [inviteStatus, setInviteStatus] = useState("")
  const [supportsNativeShare, setSupportsNativeShare] = useState(false)

  const category = getGroupCategoryById(group.categoryId)
  const iconConfig = category ? getCategoryIcon(category.id) : undefined
  const IconComponent = iconConfig?.icon

  const isMember = user ? isUserMemberOfGroup(group.id, user.id) : false
  const userRole = user ? getUserRoleInGroup(group.id, user.id) : null
  const canManage = user ? canUserManageSettings(group.id, user.id) : false

  const visibility = group.visibility ?? getDefaultGroupVisibility(group.type)
  const isContentMembersOnly = visibility.content === "members"
  const isHiddenFromDiscovery = !visibility.discoverable && group.type !== "secret"

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/groups/${group.slug}`)
      setSupportsNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
    }
  }, [group.slug])

  const handleCopyLink = async () => {
    if (!shareLink || typeof navigator === "undefined" || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyLabel("Copied!")
      setTimeout(() => setCopyLabel("Copy link"), 2000)
    } catch (error) {
      console.error("Copy failed", error)
    }
  }

  const handleNativeShare = async () => {
    if (!supportsNativeShare || !shareLink) return
    try {
      await navigator.share({
        title: group.name,
        text: group.tagline || group.description,
        url: shareLink,
      })
    } catch (error) {
      console.error("Native share cancelled", error)
    }
  }

  const handleInvite = () => {
    const target = inviteRecipient.trim() || "friends"
    setInviteStatus(`Invite queued for ${target}`)
  }

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev)
  }

  const handleReport = () => {
    alert("Thanks for flagging this group—moderators will review the report.")
  }

  const handleJoin = async () => {
    if (!user || isJoining) return

    setIsJoining(true)
    try {
      const result = joinGroup({
        groupId: group.id,
        userId: user.id,
      })

      if (result.success) {
        if (onJoin) {
          onJoin()
        } else {
          router.refresh()
        }
        if (result.status === "pending") {
          console.log("Join request submitted")
        }
      } else {
        console.error(result.message || "Failed to join group")
      }
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = () => {
    if (!user || !isMember || isJoining) return
    setIsJoining(true)
    try {
      removeGroupMember(group.id, user.id)
      if (onLeave) {
        onLeave()
      } else {
        router.refresh()
      }
    } finally {
      setIsJoining(false)
    }
  }

  const memberUsers = useMemo<User[]>(() => {
    return members
      .map((member) => getUserById(member.userId))
      .filter((maybeUser): maybeUser is User => Boolean(maybeUser))
  }, [members])

  const featuredMembers = useMemo(() => {
    const pool = [...memberUsers]
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 10)
  }, [memberUsers])

  const overflowCount = Math.max(0, memberUsers.length - featuredMembers.length)

  const joinLabel =
    group.membershipType === "request"
      ? "Request to Join"
      : group.membershipType === "invite"
      ? "Request Invite"
      : "Join"

  const requestIcon =
    group.membershipType === "request" || group.membershipType === "invite" ? (
      <Clock className="h-4 w-4" />
    ) : (
      <UserPlusIcon className="h-4 w-4" />
    )

  return (
    <div className="relative bg-slate-950">
      <div className="relative h-[320px] md:h-[420px] w-full overflow-hidden">
        <Image
          src={getCoverImage(group)}
          alt={group.name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute left-6 bottom-6 flex flex-wrap items-end gap-6">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500/40 to-emerald-500/10 blur-3xl" />
            <Avatar className="relative h-40 w-40 border-4 border-white shadow-2xl">
              <AvatarImage src={getAvatarImage(group)} alt={group.name} />
              <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2 text-white/90 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg tracking-tight">
                {group.name}
              </h1>
              {group.isVerified && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-4 w-4" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm md:text-base text-white/80">
              {group.tagline || group.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-white/70">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{group.memberCount} members</span>
              </div>
              {isContentMembersOnly && (
                <Badge variant="outline" className="gap-1 border-white/40 text-white/80">
                  <Lock className="h-3 w-3" />
                  Members-only content
                </Badge>
              )}
              {isHiddenFromDiscovery && (
                <Badge variant="outline" className="gap-1 border-white/40 text-white/80">
                  <EyeOff className="h-3 w-3" />
                  Hidden from search
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {category && (
                <Badge
                  style={{
                    backgroundColor: `${category.color || "#3b82f6"}20`,
                    color: category.color || "#3b82f6",
                  }}
                  className="gap-1"
                >
                  {IconComponent && <IconComponent className={`h-3 w-3 ${iconConfig?.color || ""}`} />}
                  {category.name}
                </Badge>
              )}
              {group.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="-mt-20 rounded-3xl border bg-background/90 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Organized community tools, moderation, and engagement for pet owners.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAuthenticated ? (
                isMember ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="flex items-center gap-2 border-muted-foreground text-muted-foreground"
                  >
                    <UserCheck className="h-4 w-4" />
                    You&apos;re a member
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
                    onClick={handleJoin}
                    disabled={isJoining}
                  >
                    <span className="flex items-center gap-1">
                      {requestIcon}
                      {isJoining ? "Processing..." : joinLabel}
                    </span>
                  </Button>
                )
              ) : (
                <Button size="sm" onClick={() => router.push("/auth/login")}>
                  <UserPlusIcon className="h-4 w-4" />
                  Join Group
                </Button>
              )}
              {canManage && (
                <Link href={`/groups/${group.slug}/settings`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <UserPlusIcon className="h-4 w-4" />
                    Invite Members
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Invite members</DialogTitle>
                    <DialogDescription>
                      Share a link or send a note to invite others into this community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <Label htmlFor="invite-recipient">Invite by email or username</Label>
                    <Input
                      id="invite-recipient"
                      value={inviteRecipient}
                      onChange={(event) => setInviteRecipient(event.target.value)}
                      placeholder="sarahpaws@example.com"
                    />
                    <Label htmlFor="invite-note">Message</Label>
                    <Textarea
                      id="invite-note"
                      value={inviteNote}
                      onChange={(event) => setInviteNote(event.target.value)}
                      placeholder="Let me know if you need more info..."
                      className="min-h-[80px]"
                    />
                    <Button
                      className="w-full"
                      onClick={handleInvite}
                      disabled={!inviteRecipient.trim()}
                      size="sm"
                    >
                      Send invite
                    </Button>
                    {inviteStatus && (
                      <p className="text-xs text-muted-foreground">{inviteStatus}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost" size="sm">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    Share Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Share {group.name}</DialogTitle>
                    <DialogDescription>
                      Copy the invite link or use your device share sheet to spread the word.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <Input readOnly value={shareLink} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={handleCopyLink} disabled={!shareLink}>
                        {copyLabel}
                      </Button>
                      {supportsNativeShare && (
                        <Button size="sm" variant="outline" onClick={handleNativeShare}>
                          Open share sheet
                        </Button>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost" size="sm">
                        Done
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMuteToggle}>
                    <BellOff className="h-4 w-4 mr-2" />
                    {isMuted ? "Unmute" : "Mute"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLeave} disabled={!isMember} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Leave group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {group.memberCount} members
            </span>
            <span className="h-1 w-1 rounded-full bg-muted" />
            <span>{group.postCount} posts</span>
            <span className="h-1 w-1 rounded-full bg-muted" />
            <span>{group.topicCount} topics</span>
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                {featuredMembers.map((member) => (
                  <Avatar key={member.id} className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.fullName} />
                    <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {overflowCount > 0 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-muted text-xs text-muted-foreground">
                  +{overflowCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
