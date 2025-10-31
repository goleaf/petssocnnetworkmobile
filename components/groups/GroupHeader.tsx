"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Settings,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  MessageSquare,
  Calendar,
  FileText,
  FolderOpen,
  BarChart3,
  Shield,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import type { Group } from "@/lib/types"
import {
  getGroupCategoryById,
  getGroupMember,
  isUserMemberOfGroup,
  addGroupMember,
  removeGroupMember,
  canUserManageSettings,
  getUserRoleInGroup,
} from "@/lib/storage"
import { useRouter } from "next/navigation"

interface GroupHeaderProps {
  group: Group
  onJoin?: () => void
  onLeave?: () => void
}

export function GroupHeader({ group, onJoin, onLeave }: GroupHeaderProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  
  const category = getGroupCategoryById(group.categoryId)
  const isMember = user ? isUserMemberOfGroup(group.id, user.id) : false
  const userRole = user ? getUserRoleInGroup(group.id, user.id) : null
  const canManage = user ? canUserManageSettings(group.id, user.id) : false

  // Generate placeholder images using free services
  const getCoverImage = () => {
    if (group.coverImage) return group.coverImage
    // Use Picsum Photos with seed for consistent random images per group
    const seed = group.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10) || "default"
    return `https://picsum.photos/seed/${seed}/1200/256`
  }

  const getAvatarImage = () => {
    if (group.avatar) return group.avatar
    // Use UI Avatars for placeholder avatars
    const name = encodeURIComponent(group.name)
    const bgColor = category?.color?.replace("#", "") || "3b82f6"
    return `https://ui-avatars.com/api/?name=${name}&background=${bgColor}&color=fff&size=96`
  }

  const handleJoin = async () => {
    if (!user || isJoining) return
    
    setIsJoining(true)
    try {
      const now = new Date().toISOString()
      addGroupMember({
        id: `mem-${group.id}-${user.id}`,
        groupId: group.id,
        userId: user.id,
        role: "member",
        joinedAt: now,
        permissions: {
          canPost: true,
          canComment: true,
          canCreateTopic: true,
          canCreatePoll: false,
          canCreateEvent: false,
          canModerate: false,
          canManageMembers: false,
          canManageSettings: false,
        },
      })
      
      if (onJoin) {
        onJoin()
      } else {
        router.refresh()
      }
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
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

  const getTypeIcon = () => {
    switch (group.type) {
      case "closed":
        return <Lock className="h-4 w-4" />
      case "secret":
        return <EyeOff className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getTypeLabel = () => {
    switch (group.type) {
      case "closed":
        return "Closed Group"
      case "secret":
        return "Secret Group"
      default:
        return "Open Group"
    }
  }

  return (
    <div className="relative">
      {/* Cover Image - Always show */}
      <div className="relative h-64 w-full overflow-hidden bg-muted">
        <Image
          src={getCoverImage()}
          alt={group.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative -mt-16 pb-6">
        <div className="bg-card rounded-lg border shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={getAvatarImage()} alt={group.name} />
                <AvatarFallback className="text-3xl">
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {category && (
                <div
                  className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `${category.color || "#3b82f6"}20`,
                    color: category.color || "#3b82f6",
                  }}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{group.name}</h1>
                    {group.type !== "open" && (
                      <Badge variant="secondary" className="gap-1">
                        {getTypeIcon()}
                        {getTypeLabel()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{group.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAuthenticated ? (
                    <>
                      {isMember ? (
                        <>
                          {canManage && (
                            <Link href={`/groups/${group.slug}/settings`}>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLeave}
                            disabled={isJoining || userRole === "owner"}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            {isJoining ? "Leaving..." : "Leave Group"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleJoin}
                          disabled={isJoining}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {isJoining ? "Joining..." : "Join Group"}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/groups/${group.slug}/members`}>
                              <Users className="h-4 w-4 mr-2" />
                              Members
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/groups/${group.slug}/topics`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Topics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/groups/${group.slug}/events`}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Events
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/groups/${group.slug}/resources`}>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Resources
                            </Link>
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/groups/${group.slug}/analytics`}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Analytics
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/groups/${group.slug}/moderation`}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Moderation
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => router.push("/auth/login")}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Group
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{group.memberCount}</span>
                  <span className="text-sm text-muted-foreground">members</span>
                </div>
                {group.topicCount > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{group.topicCount}</span>
                    <span className="text-sm text-muted-foreground">topics</span>
                  </div>
                )}
                {group.postCount > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{group.postCount}</span>
                    <span className="text-sm text-muted-foreground">posts</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

