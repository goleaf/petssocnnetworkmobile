"use client"

import { useState, useCallback } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeedList } from "./FeedList"
import { FilterPanel, FeedFilters } from "./FilterPanel"
import { PostCardData } from "./PostCard"

interface FeedContainerProps {
  initialPosts: PostCardData[]
  feedType?: 'home' | 'explore' | 'following' | 'local' | 'my-pets'
  userId: string
}

export function FeedContainer({
  initialPosts,
  feedType = 'home',
  userId,
}: FeedContainerProps) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [filters, setFilters] = useState<FeedFilters>({
    contentTypes: [],
    dateRange: 'all',
    highQualityOnly: false,
    topics: [],
    mutedWords: [],
  })

  const activeFilterCount = 
    filters.contentTypes.length +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.highQualityOnly ? 1 : 0) +
    filters.topics.length +
    filters.mutedWords.length

  const buildQueryParams = useCallback((cursorParam?: string) => {
    const params = new URLSearchParams()
    params.set('type', feedType)
    params.set('limit', '20')
    
    if (cursorParam) {
      params.set('cursor', cursorParam)
    }

    if (filters.contentTypes.length > 0) {
      params.set('contentTypes', filters.contentTypes.join(','))
    }

    if (filters.dateRange !== 'all') {
      if (filters.dateRange === 'custom') {
        if (filters.customDateStart) {
          params.set('dateStart', new Date(filters.customDateStart).toISOString())
        }
        if (filters.customDateEnd) {
          params.set('dateEnd', new Date(filters.customDateEnd).toISOString())
        }
      } else {
        // Calculate date range
        const now = new Date()
        let startDate: Date
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7))
            break
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1))
            break
          default:
            startDate = new Date(0)
        }
        
        params.set('dateStart', startDate.toISOString())
      }
    }

    if (filters.topics.length > 0) {
      params.set('topics', filters.topics.join(','))
    }

    if (filters.highQualityOnly) {
      params.set('highQualityOnly', 'true')
    }

    return params
  }, [feedType, filters])

  const loadFeed = useCallback(async (cursorParam?: string) => {
    try {
      const params = buildQueryParams(cursorParam)
      const response = await fetch(`/api/feed?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load feed')
      }

      const data = await response.json()
      
      // Filter out muted words on client side
      let filteredPosts = data.posts
      if (filters.mutedWords.length > 0) {
        filteredPosts = data.posts.filter((post: PostCardData) => {
          if (!post.content) return true
          const content = post.content.toLowerCase()
          return !filters.mutedWords.some((word) => 
            content.includes(word.toLowerCase())
          )
        })
      }

      return {
        posts: filteredPosts,
        nextCursor: data.nextCursor,
        hasMore: data.hasMore,
      }
    } catch (error) {
      console.error('Error loading feed:', error)
      return {
        posts: [],
        nextCursor: undefined,
        hasMore: false,
      }
    }
  }, [buildQueryParams, filters.mutedWords])

  const handleLoadMore = useCallback(async () => {
    const result = await loadFeed(cursor)
    setCursor(result.nextCursor)
    setHasMore(result.hasMore)
    return result.posts
  }, [loadFeed, cursor])

  const handleApplyFilters = useCallback(async () => {
    // Reset and reload feed with new filters
    const result = await loadFeed()
    setPosts(result.posts)
    setCursor(result.nextCursor)
    setHasMore(result.hasMore)
  }, [loadFeed])

  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-lg font-semibold capitalize">{feedType} Feed</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterPanelOpen(true)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="px-4 flex flex-wrap gap-2">
          {filters.contentTypes.map((type) => (
            <Badge key={type} variant="secondary">
              {type.replace('_', ' ')}
            </Badge>
          ))}
          {filters.dateRange !== 'all' && (
            <Badge variant="secondary">
              {filters.dateRange === 'custom' ? 'Custom Date' : filters.dateRange}
            </Badge>
          )}
          {filters.highQualityOnly && (
            <Badge variant="secondary">High Quality</Badge>
          )}
          {filters.topics.map((topic) => (
            <Badge key={topic} variant="secondary">
              #{topic}
            </Badge>
          ))}
          {filters.mutedWords.length > 0 && (
            <Badge variant="outline">
              {filters.mutedWords.length} muted word{filters.mutedWords.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Feed List */}
      <FeedList
        initialPosts={posts}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />

      {/* Filter Panel */}
      <FilterPanel
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
      />
    </div>
  )
}
