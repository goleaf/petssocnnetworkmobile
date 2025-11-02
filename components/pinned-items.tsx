"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PinButton } from "@/components/ui/pin-button"
import { usePinnedItems } from "@/lib/pinned-items"
import { getBlogPostById, getPetById, getWikiArticleBySlug, getWikiArticles } from "@/lib/storage"
import { getUsers } from "@/lib/storage"
import type { PinnedItem, BlogPost, Pet, WikiArticle } from "@/lib/types"
import Link from "next/link"
import { BookOpen, PawPrint, FileText, Pin } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

export function PinnedItems() {
  const { pinnedItems, loadPinnedItems } = usePinnedItems()
  const [items, setItems] = useState<Array<PinnedItem & { data?: BlogPost | Pet | WikiArticle }>>([])

  useEffect(() => {
    loadPinnedItems()
  }, [loadPinnedItems])

  useEffect(() => {
    const loadItems = () => {
      const loadedItems = pinnedItems.map((pinnedItem) => {
        let data: BlogPost | Pet | WikiArticle | undefined

        if (pinnedItem.type === "post") {
          data = getBlogPostById(pinnedItem.itemId)
        } else if (pinnedItem.type === "pet") {
          data = getPetById(pinnedItem.itemId)
        } else if (pinnedItem.type === "wiki") {
          // Try by slug first, then by ID
          data = getWikiArticleBySlug(pinnedItem.itemId)
          if (!data) {
            // If not found by slug, try finding by ID
            const allArticles = getWikiArticles()
            data = allArticles.find((a) => a.id === pinnedItem.itemId)
          }
        }

        return { ...pinnedItem, data }
      })

      setItems(loadedItems.filter((item) => item.data))
    }

    loadItems()
  }, [pinnedItems])

  if (items.length === 0) {
    return null
  }

  const getItemIcon = (type: PinnedItem["type"]) => {
    switch (type) {
      case "post":
        return BookOpen
      case "pet":
        return PawPrint
      case "wiki":
        return FileText
    }
  }

  const getItemUrl = (item: PinnedItem & { data?: BlogPost | Pet | WikiArticle }) => {
    if (!item.data) return "#"

    if (item.type === "post") {
      return `/blog/${item.itemId}`
    } else if (item.type === "pet") {
      const pet = item.data as Pet
      const users = getUsers()
      const owner = users.find((u) => u.id === pet.ownerId)
      return owner ? getPetUrlFromPet(pet, owner.username) : "#"
    } else if (item.type === "wiki") {
      const article = item.data as WikiArticle
      return `/wiki/${article.slug}`
    }

    return "#"
  }

  const getItemTitle = (item: PinnedItem & { data?: BlogPost | Pet | WikiArticle }) => {
    if (item.title) return item.title

    if (!item.data) return "Unknown"

    if (item.type === "post") {
      return (item.data as BlogPost).title
    } else if (item.type === "pet") {
      return (item.data as Pet).name
    } else if (item.type === "wiki") {
      return (item.data as WikiArticle).title
    }

    return "Unknown"
  }

  const getItemDescription = (item: PinnedItem & { data?: BlogPost | Pet | WikiArticle }) => {
    if (item.description) return item.description

    if (!item.data) return ""

    if (item.type === "post") {
      return (item.data as BlogPost).content.substring(0, 100) + "..."
    } else if (item.type === "pet") {
      return (item.data as Pet).bio || ""
    } else if (item.type === "wiki") {
      return (item.data as WikiArticle).content.substring(0, 100) + "..."
    }

    return ""
  }

  const getItemImage = (item: PinnedItem & { data?: BlogPost | Pet | WikiArticle }) => {
    if (item.image) return item.image

    if (!item.data) return undefined

    if (item.type === "post") {
      const post = item.data as BlogPost
      return post.coverImage || post.media?.images?.[0]
    } else if (item.type === "pet") {
      return (item.data as Pet).avatar
    } else if (item.type === "wiki") {
      return (item.data as WikiArticle).coverImage
    }

    return undefined
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="h-5 w-5" />
          Pinned Items
        </CardTitle>
        <p className="text-xs text-muted-foreground">Your pinned items (max 3)</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = getItemIcon(item.type)
            const url = getItemUrl(item)
            const title = getItemTitle(item)
            const description = getItemDescription(item)
            const image = getItemImage(item)

            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
              >
                {image ? (
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                    <img src={image} alt={title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={url} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-semibold text-sm truncate">{title}</p>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {item.type}
                        </Badge>
                      </div>
                      {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.pinnedAt)}
                      </p>
                    </Link>
                    <PinButton
                      type={item.type}
                      itemId={item.itemId}
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

