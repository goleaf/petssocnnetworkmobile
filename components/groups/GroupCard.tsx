"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Eye, EyeOff } from "lucide-react"
import type { Group } from "@/lib/types"
import { getGroupCategoryById } from "@/lib/storage"

interface GroupCardProps {
  group: Group
}

export function GroupCard({ group }: GroupCardProps) {
  const category = getGroupCategoryById(group.categoryId)
  
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

  return (
    <Link href={`/groups/${group.slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer h-full">
        {/* Cover Image */}
        {group.coverImage && (
          <div className="relative h-32 w-full overflow-hidden">
            <Image
              src={group.coverImage}
              alt={group.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12 border-2 border-background">
                <AvatarImage src={group.avatar} alt={group.name} />
                <AvatarFallback>
                  {group.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {category && (
                <div 
                  className="absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-background"
                  style={{ backgroundColor: category.color || "#3b82f6" }}
                >
                  <span className="text-xs">{category.icon}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                  {group.name}
                </h3>
                {group.type !== "open" && (
                  <Badge variant="secondary" className="flex-shrink-0 gap-1 text-xs">
                    {getTypeIcon()}
                    {getTypeLabel()}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {group.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{group.memberCount} members</span>
                </div>
                {group.topicCount > 0 && (
                  <span>{group.topicCount} topics</span>
                )}
              </div>

              {/* Tags */}
              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {group.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
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
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

