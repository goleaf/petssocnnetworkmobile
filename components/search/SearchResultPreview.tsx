"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, MessageSquare, ExternalLink, Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { SearchResultHighlight } from "./SearchResultHighlight"
import { formatCommentDate } from "@/lib/utils/date"
import type { User, Pet, BlogPost, WikiArticle, Group, GroupEvent } from "@/lib/types"

interface SearchResultPreviewProps {
  result: {
    type: string
    data: User | Pet | BlogPost | WikiArticle | Group | GroupEvent
  }
  query: string
  isOpen: boolean
  onClose: () => void
}

export function SearchResultPreview({ result, query, isOpen, onClose }: SearchResultPreviewProps) {
  const getResultUrl = () => {
    switch (result.type) {
      case "users":
        return `/user/${(result.data as User).username}`
      case "pets":
        return `/pet/${(result.data as Pet).id}`
      case "blogs":
        return `/blog/${(result.data as BlogPost).id}`
      case "wiki":
        return `/wiki/${(result.data as WikiArticle).id}`
      case "groups":
        return `/groups/${(result.data as Group).slug}`
      case "events":
        const event = result.data as GroupEvent
        const groups = typeof window !== "undefined" ? require("@/lib/storage").getGroups() : []
        const group = groups.find((g: Group) => g.id === event.groupId)
        return group ? `/groups/${group.slug}/events/${event.id}` : "/groups"
      default:
        return "#"
    }
  }

  const renderContent = () => {
    switch (result.type) {
      case "users": {
        const user = result.data as User
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{user.fullName || user.username}</h3>
                  {user.badge && <Badge variant="secondary">{user.badge}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                {user.bio && (
                  <p className="mt-2 text-sm">
                    <SearchResultHighlight text={user.bio} query={query} />
                  </p>
                )}
                {user.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{user.followers?.length || 0} followers</span>
              <span>{user.following?.length || 0} following</span>
            </div>
          </div>
        )
      }

      case "pets": {
        const pet = result.data as Pet
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={pet.avatar} />
                <AvatarFallback>{pet.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{pet.name}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge>{pet.species}</Badge>
                  {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
                  {pet.gender && <Badge variant="outline">{pet.gender}</Badge>}
                  {pet.age && <Badge variant="outline">Age: {pet.age}</Badge>}
                </div>
                {pet.bio && (
                  <p className="text-sm">
                    <SearchResultHighlight text={pet.bio} query={query} />
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      }

      case "blogs": {
        const post = result.data as BlogPost
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                <SearchResultHighlight text={post.title} query={query} />
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatCommentDate(post.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {post.reactions
                    ? Object.values(post.reactions).reduce(
                        (sum, arr) => sum + (arr?.length || 0),
                        0
                      )
                    : post.likes?.length || 0}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {post.comments?.length || 0}
                </div>
              </div>
              <p className="text-sm">
                <SearchResultHighlight text={post.content} query={query} maxLength={300} />
              </p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }

      case "wiki": {
        const article = result.data as WikiArticle
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                <SearchResultHighlight text={article.title} query={query} />
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatCommentDate(article.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.views || 0} views
                </div>
              </div>
              <p className="text-sm">
                <SearchResultHighlight text={article.content || article.summary || ""} query={query} maxLength={300} />
              </p>
              {article.category && (
                <Badge variant="secondary" className="mt-3">
                  {article.category}
                </Badge>
              )}
            </div>
          </div>
        )
      }

      case "groups": {
        const group = result.data as Group
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.memberCount || 0} members
                </div>
              </div>
              {group.description && (
                <p className="text-sm">
                  <SearchResultHighlight text={group.description} query={query} maxLength={300} />
                </p>
              )}
            </div>
          </div>
        )
      }

      case "events": {
        const event = result.data as GroupEvent
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                <SearchResultHighlight text={event.title} query={query} />
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                {event.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatCommentDate(event.startDate)}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {event.attendeeCount || 0} attendees
                </div>
              </div>
              {event.description && (
                <p className="text-sm">
                  <SearchResultHighlight text={event.description} query={query} maxLength={300} />
                </p>
              )}
            </div>
          </div>
        )
      }

      default:
        return <p className="text-sm text-muted-foreground">Preview not available</p>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Result Preview</DialogTitle>
          <DialogDescription>
            Quick preview of the search result. Click "View Full" to see the complete content.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">{renderContent()}</div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button asChild>
            <Link href={getResultUrl()} onClick={onClose}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

