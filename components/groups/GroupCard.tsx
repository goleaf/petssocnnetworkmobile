"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Eye, EyeOff, GraduationCap, Heart, HeartHandshake, UtensilsCrossed } from "lucide-react"
import type { Group } from "@/lib/types"
import { getGroupCategoryById, getDefaultGroupVisibility } from "@/lib/storage"
import { getAnimalConfigLucide } from "@/lib/animal-types"

interface GroupCardProps {
  group: Group
  viewMode?: "grid" | "list"
  onTagClick?: (tag: string) => void
}

// Map category IDs to animal types or custom icons
const getCategoryIcon = (categoryId: string) => {
  // Map specific categories to animal types
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
  
  // Map non-animal categories to icons
  const customIconMap: Record<string, { icon: any; color: string }> = {
    "cat-training": { icon: GraduationCap, color: "text-red-500" },
    "cat-health": { icon: Heart, color: "text-pink-500" },
    "cat-adoption": { icon: HeartHandshake, color: "text-orange-500" },
    "cat-nutrition": { icon: UtensilsCrossed, color: "text-cyan-500" },
  }
  
  return customIconMap[categoryId]
}

export function GroupCard({ group, viewMode = "grid", onTagClick }: GroupCardProps) {
  const category = getGroupCategoryById(group.categoryId)
  const iconConfig = category ? getCategoryIcon(category.id) : undefined
  const IconComponent = iconConfig?.icon
  const visibility = group.visibility ?? getDefaultGroupVisibility(group.type)
  const isContentMembersOnly = visibility.content === "members"
  const isHiddenFromDiscovery = !visibility.discoverable && group.type !== "secret"
  
  // Generate placeholder images using free services
  const getCoverImage = () => {
    if (group.coverImage) return group.coverImage
    // Use Picsum Photos with seed for consistent random images per group
    const seed = group.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10) || "default"
    return `https://picsum.photos/seed/${seed}/400/128`
  }

  const getAvatarImage = () => {
    if (group.avatar) return group.avatar
    // Use UI Avatars for placeholder avatars
    const name = encodeURIComponent(group.name)
    const bgColor = category?.color?.replace("#", "") || "3b82f6"
    return `https://ui-avatars.com/api/?name=${name}&background=${bgColor}&color=fff&size=48`
  }
  
  const getTypeIcon = () => {
    switch (group.type) {
      case "closed":
        return <Lock className="h-3 w-3" />
      case "secret":
        return <EyeOff className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTypeLabel = () => {
    switch (group.type) {
      case "closed":
        return "Closed"
      case "secret":
        return "Secret"
      default:
        return "Open"
    }
  }

  // List view layout
  if (viewMode === "list") {
    return (
      <Link href={`/groups/${group.slug}`}>
        <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Cover Image - Left side */}
            <div className="relative w-full h-48 sm:w-48 sm:h-48 flex-shrink-0 overflow-hidden bg-muted">
              <Image
                src={getCoverImage()}
                alt={group.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Content - Right side */}
            <CardContent className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Header with Name, Badge, and Category */}
                <div className="mb-3">
                  <h3 className="font-semibold text-xl leading-tight line-clamp-1 mb-2">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {category && IconComponent && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{
                          borderColor: category.color || "#3b82f6",
                          color: category.color || "#3b82f6",
                        }}
                      >
                        <IconComponent className={`h-3 w-3 mr-1 ${iconConfig.color || ""}`} />
                        {category.name}
                      </Badge>
                    )}
                    {group.type !== "open" && (
                      <Badge variant="secondary" className="flex-shrink-0 gap-1 text-xs px-2 py-0.5">
                        {getTypeIcon()}
                        {getTypeLabel()}
                      </Badge>
                    )}
                    {isContentMembersOnly && (
                      <Badge variant="outline" className="flex-shrink-0 gap-1 text-xs px-2 py-0.5">
                        <Lock className="h-3 w-3" />
                        Members-only content
                      </Badge>
                    )}
                    {isHiddenFromDiscovery && (
                      <Badge variant="outline" className="flex-shrink-0 gap-1 text-xs px-2 py-0.5">
                        <EyeOff className="h-3 w-3" />
                        Hidden from search
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {group.description}
                </p>

                {/* Stats and Tags */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{group.memberCount}</span>
                    <span>members</span>
                  </div>
                  {group.topicCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{group.topicCount}</span>
                      <span>topics</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.slice(0, 4).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-accent transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (onTagClick) {
                            onTagClick(tag)
                          }
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {group.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{group.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    )
  }

  // Grid view layout (default)
  return (
    <Link href={`/groups/${group.slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer h-full p-0">
        {/* Cover Image - Always show */}
        <div className="relative h-32 w-full overflow-hidden bg-muted">
          <Image
            src={getCoverImage()}
            alt={group.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-background shadow-sm">
                <AvatarImage src={getAvatarImage()} alt={group.name} />
                <AvatarFallback className="text-sm md:text-base font-semibold">
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h3 className="font-semibold text-base md:text-lg leading-tight line-clamp-1 mb-1">
                {group.name}
              </h3>

              {/* Category and Type Badges */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mb-1.5 md:mb-2">
                {category && IconComponent && (
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{
                      borderColor: category.color || "#3b82f6",
                      color: category.color || "#3b82f6",
                    }}
                  >
                    <IconComponent className={`h-3 w-3 mr-0.5 md:mr-1 ${iconConfig.color || ""}`} />
                    <span className="hidden sm:inline">{category.name}</span>
                  </Badge>
                )}
                {group.type !== "open" && (
                  <Badge variant="secondary" className="flex-shrink-0 gap-0.5 md:gap-1 text-xs px-1.5 md:px-2 py-0.5">
                    {getTypeIcon()}
                    <span className="hidden sm:inline">{getTypeLabel()}</span>
                  </Badge>
                )}
                {isContentMembersOnly && (
                  <Badge variant="outline" className="flex-shrink-0 gap-0.5 md:gap-1 text-xs px-1.5 md:px-2 py-0.5">
                    <Lock className="h-3 w-3" />
                    <span className="hidden sm:inline">Members-only content</span>
                  </Badge>
                )}
                {isHiddenFromDiscovery && (
                  <Badge variant="outline" className="flex-shrink-0 gap-0.5 md:gap-1 text-xs px-1.5 md:px-2 py-0.5">
                    <EyeOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Hidden from search</span>
                  </Badge>
                )}
              </div>

              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
            <div className="flex items-center gap-1 md:gap-1.5">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span>{group.memberCount} members</span>
            </div>
            {group.topicCount > 0 && (
              <div className="flex items-center gap-1 md:gap-1.5">
                <span>{group.topicCount} topics</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {group.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (onTagClick) {
                      onTagClick(tag)
                    }
                  }}
                >
                  #{tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{group.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
