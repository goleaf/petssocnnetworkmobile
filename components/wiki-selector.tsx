"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookOpen, X } from "lucide-react"
import { getWikiArticles } from "@/lib/storage"
import type { WikiArticle } from "@/lib/types"

interface WikiSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  maxSelections?: number
  placeholder?: string
}

export function WikiSelector({
  selectedIds,
  onChange,
  maxSelections = 5,
  placeholder = "Select related wiki articles...",
}: WikiSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([])
  const [pendingArticleId, setPendingArticleId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const articles = getWikiArticles()
    setWikiArticles(articles)
  }, [])

  const selectedArticles = wikiArticles.filter((wiki) => selectedIds.includes(wiki.id))

  const filteredArticles = wikiArticles.filter(
    (wiki) =>
      wiki.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wiki.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wiki.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (wikiId: string) => {
    if (maxSelections && selectedIds.length >= maxSelections && !selectedIds.includes(wikiId)) {
      return
    }

    if (!selectedIds.includes(wikiId)) {
      onChange([...selectedIds, wikiId])
    }
  }

  const handleRemove = (wikiId: string) => {
    onChange(selectedIds.filter((id) => id !== wikiId))
  }

  const availableArticles = filteredArticles.filter((wiki) => !selectedIds.includes(wiki.id))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search wiki articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select
          value={pendingArticleId}
          onValueChange={(articleId) => {
            handleSelect(articleId)
            setPendingArticleId(undefined)
          }}
          disabled={maxSelections ? selectedIds.length >= maxSelections : false}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={placeholder}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Add Article</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableArticles.length === 0 ? (
              <SelectItem value="__no_articles__" disabled>
                {searchQuery ? "No articles found" : "No articles available"}
              </SelectItem>
            ) : (
              availableArticles.slice(0, 20).map((wiki) => (
                <SelectItem key={wiki.id} value={wiki.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{wiki.title}</span>
                    <span className="text-xs text-muted-foreground">{wiki.category}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedArticles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[3rem]">
          {selectedArticles.map((wiki) => (
            <Badge
              key={wiki.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="max-w-[200px] truncate">{wiki.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemove(wiki.id)}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
