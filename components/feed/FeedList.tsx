"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PostCard, type PostCardData } from "./PostCard"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface FeedListProps {
  initialPosts: PostCardData[]
  onLoadMore?: () => Promise<PostCardData[]>
  hasMore?: boolean
}

const MAX_POSTS_IN_DOM = 200
const POSTS_BEFORE_LOAD_MORE_BUTTON = 20

export function FeedList({ initialPosts, onLoadMore, hasMore = false }: FeedListProps) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const scrollPositionRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Save scroll position before unmount (for back navigation)
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositionRef.current = window.scrollY
      sessionStorage.setItem('feedScrollPosition', String(window.scrollY))
    }

    window.addEventListener('beforeunload', saveScrollPosition)
    return () => {
      saveScrollPosition()
      window.removeEventListener('beforeunload', saveScrollPosition)
    }
  }, [])

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('feedScrollPosition')
    if (savedPosition) {
      const position = parseInt(savedPosition, 10)
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, position)
      })
    }
  }, [])

  // Show load more button after 20 posts
  useEffect(() => {
    setShowLoadMoreButton(posts.length >= POSTS_BEFORE_LOAD_MORE_BUTTON)
  }, [posts.length])

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loading || !hasMore) return

    setLoading(true)
    try {
      const newPosts = await onLoadMore()
      setPosts((prev) => {
        const combined = [...prev, ...newPosts]
        // Limit DOM to 200 posts, remove oldest from top
        if (combined.length > MAX_POSTS_IN_DOM) {
          const removedCount = combined.length - MAX_POSTS_IN_DOM
          // Adjust scroll position to maintain visual position
          if (containerRef.current) {
            const firstPost = containerRef.current.children[removedCount] as HTMLElement
            if (firstPost) {
              const offsetTop = firstPost.offsetTop
              requestAnimationFrame(() => {
                window.scrollBy(0, -offsetTop)
              })
            }
          }
          return combined.slice(removedCount)
        }
        return combined
      })
    } catch (error) {
      console.error("Failed to load more posts:", error)
    } finally {
      setLoading(false)
    }
  }, [onLoadMore, loading, hasMore])

  // Set up IntersectionObserver for automatic loading at 80% scroll
  useEffect(() => {
    if (!hasMore || !showLoadMoreButton) {
      return
    }

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && !loading) {
        handleLoadMore()
      }
    }, options)

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, showLoadMoreButton, loading, handleLoadMore])

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      )
    )

    // TODO: Call API to like/unlike post
  }

  const handleSave = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isSaved: !post.isSaved,
            }
          : post
      )
    )

    // TODO: Call API to save/unsave post
  }

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail or open comment modal
    console.log("Comment on post:", postId)
  }

  const handleShare = (postId: string) => {
    // TODO: Open share modal
    console.log("Share post:", postId)
  }

  const handleReport = (postId: string) => {
    // TODO: Open report modal
    console.log("Report post:", postId)
  }

  const handleHide = (postId: string) => {
    // Remove from feed
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    // TODO: Call API to hide post
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-0" ref={containerRef}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
          onReport={handleReport}
          onHide={handleHide}
        />
      ))}

      {/* Intersection observer trigger - positioned at 80% of content */}
      {hasMore && showLoadMoreButton && (
        <div
          ref={loadMoreTriggerRef}
          className="h-px"
          aria-hidden="true"
        />
      )}

      {/* Loading spinner during fetch */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Load More button appears after 20 posts */}
      {hasMore && showLoadMoreButton && !loading && (
        <div className="flex justify-center py-8">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            size="lg"
          >
            Load More
          </Button>
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          You&apos;re all caught up!
        </div>
      )}
    </div>
  )
}
