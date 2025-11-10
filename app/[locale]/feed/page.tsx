import { FeedContainer } from "@/components/feed/FeedContainer"
import { CreatePostButton } from "@/components/posts/CreatePostButton"
import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { feedService } from "@/lib/services/feed-service"
import type { PostCardData } from "@/components/feed/PostCard"

export default async function FeedPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch initial feed data
  const feedData = await feedService.getFeed(user.id, {
    type: 'home',
    limit: 20,
  })

  // Transform to PostCardData format
  const initialPosts: PostCardData[] = feedData.posts.map((post: any) => {
    const media = Array.isArray(post.media) ? post.media : []
    
    return {
      id: post.id,
      authorId: post.authorUserId,
      authorUsername: post.author?.username || 'unknown',
      authorDisplayName: post.author?.fullName || post.author?.username || 'Unknown User',
      authorAvatar: post.author?.avatar || '/placeholder-user.jpg',
      content: post.textContent || '',
      media: media.map((m: any) => ({
        id: m.id || '',
        type: (m.type || 'photo') as 'photo' | 'video',
        url: m.url || '',
        thumbnail: m.thumbnailUrl,
      })),
      petTags: post.pet ? [{ id: post.pet.id, name: post.pet.name }] : [],
      createdAt: post.createdAt.toISOString(),
      likesCount: post._count?.likes || 0,
      commentsCount: post._count?.comments || 0,
      sharesCount: post._count?.shares || 0,
      savesCount: post._count?.saves || 0,
      viewsCount: post._count?.views || 0,
      isLiked: false, // TODO: Check if user liked
      isSaved: false, // TODO: Check if user saved
    }
  })

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-3xl font-bold">Feed</h1>
        <CreatePostButton />
      </div>

      <FeedContainer
        initialPosts={initialPosts}
        feedType="home"
        userId={user.id}
      />
    </div>
  )
}
