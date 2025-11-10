import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { PostCard } from "@/components/feed/PostCard"
import { PostInteractionBar } from "@/components/feed/PostInteractionBar"
import { PostMediaDisplay } from "@/components/feed/PostMediaDisplay"
import { FeedList } from "@/components/feed/FeedList"
import type { PostCardData } from "@/components/feed/PostCard"

// Mock data
const mockPost: PostCardData = {
  id: "1",
  authorId: "user1",
  authorUsername: "johndoe",
  authorDisplayName: "John Doe",
  authorAvatar: "/avatar.jpg",
  content: "This is a test post with some content",
  createdAt: new Date().toISOString(),
  likesCount: 10,
  commentsCount: 5,
  sharesCount: 2,
  savesCount: 3,
  viewsCount: 100,
  isLiked: false,
  isSaved: false,
}

const mockPostWithMedia: PostCardData = {
  ...mockPost,
  id: "2",
  media: [
    {
      id: "m1",
      type: "photo",
      url: "/test-image.jpg",
    },
  ],
}

const mockPostWithMultipleMedia: PostCardData = {
  ...mockPost,
  id: "3",
  media: [
    { id: "m1", type: "photo", url: "/image1.jpg" },
    { id: "m2", type: "photo", url: "/image2.jpg" },
    { id: "m3", type: "photo", url: "/image3.jpg" },
    { id: "m4", type: "photo", url: "/image4.jpg" },
  ],
}

const mockLongPost: PostCardData = {
  ...mockPost,
  id: "4",
  content: "A".repeat(300), // Long content that needs truncation
}

describe("FeedContainer", () => {
  it("renders all feed tabs", () => {
    render(
      <FeedContainer>
        {(feedType) => <div>Feed: {feedType}</div>}
      </FeedContainer>
    )

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Explore")).toBeInTheDocument()
    expect(screen.getByText("Following")).toBeInTheDocument()
    expect(screen.getByText("Local")).toBeInTheDocument()
    expect(screen.getByText("My Pets")).toBeInTheDocument()
  })

  it("renders active feed type content", () => {
    render(
      <FeedContainer>
        {(feedType) => <div data-testid={`feed-${feedType}`}>Feed: {feedType}</div>}
      </FeedContainer>
    )

    // Home feed should be active by default
    expect(screen.getByTestId("feed-home")).toBeInTheDocument()
    expect(screen.getByText("Feed: home")).toBeInTheDocument()
  })

  it("renders with default feed type", () => {
    render(
      <FeedContainer defaultFeed="following">
        {(feedType) => <div data-testid="feed-content">Feed: {feedType}</div>}
      </FeedContainer>
    )

    expect(screen.getByTestId("feed-content")).toHaveTextContent("Feed: following")
  })
})

describe("PostCard", () => {
  it("renders post content correctly", () => {
    render(<PostCard post={mockPost} />)

    expect(screen.getByText(mockPost.content)).toBeInTheDocument()
    expect(screen.getByText(mockPost.authorDisplayName)).toBeInTheDocument()
    expect(screen.getByText(`@${mockPost.authorUsername}`)).toBeInTheDocument()
  })

  it("displays pet tags when present", () => {
    const postWithPets: PostCardData = {
      ...mockPost,
      petTags: [
        { id: "pet1", name: "Max" },
        { id: "pet2", name: "Luna" },
      ],
    }

    render(<PostCard post={postWithPets} />)

    expect(screen.getByText("Max")).toBeInTheDocument()
    expect(screen.getByText("Luna")).toBeInTheDocument()
  })

  it("truncates long content and shows Read more button", () => {
    render(<PostCard post={mockLongPost} />)

    const readMoreButton = screen.getByText("Read more")
    expect(readMoreButton).toBeInTheDocument()

    fireEvent.click(readMoreButton)

    expect(screen.queryByText("Read more")).not.toBeInTheDocument()
  })

  it("calls onLike when like button is clicked", () => {
    const onLike = jest.fn()
    const { container } = render(<PostCard post={mockPost} onLike={onLike} />)

    // Find the like button by its icon
    const likeButtons = container.querySelectorAll('button')
    const likeButton = Array.from(likeButtons).find(btn => 
      btn.querySelector('.lucide-heart')
    )
    
    expect(likeButton).toBeTruthy()
    fireEvent.click(likeButton!)

    expect(onLike).toHaveBeenCalledWith(mockPost.id)
  })

  it("calls onComment when comment button is clicked", () => {
    const onComment = jest.fn()
    const { container } = render(<PostCard post={mockPost} onComment={onComment} />)

    // Find the comment button by its icon
    const buttons = container.querySelectorAll('button')
    const commentButton = Array.from(buttons).find(btn => 
      btn.querySelector('.lucide-message-circle')
    )
    
    expect(commentButton).toBeTruthy()
    fireEvent.click(commentButton!)

    expect(onComment).toHaveBeenCalledWith(mockPost.id)
  })

  it("calls onShare when share button is clicked", () => {
    const onShare = jest.fn()
    const { container } = render(<PostCard post={mockPost} onShare={onShare} />)

    // Find the share button by its icon
    const buttons = container.querySelectorAll('button')
    const shareButton = Array.from(buttons).find(btn => 
      btn.querySelector('.lucide-share2')
    )
    
    expect(shareButton).toBeTruthy()
    fireEvent.click(shareButton!)

    expect(onShare).toHaveBeenCalledWith(mockPost.id)
  })
})

describe("PostInteractionBar", () => {
  it("displays engagement counts correctly", () => {
    render(
      <PostInteractionBar
        postId="1"
        likesCount={42}
        commentsCount={10}
        sharesCount={5}
        savesCount={3}
        viewsCount={200}
      />
    )

    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("200")).toBeInTheDocument()
  })

  it("formats large counts correctly", () => {
    render(
      <PostInteractionBar
        postId="1"
        likesCount={1500}
        commentsCount={2500000}
        sharesCount={0}
        savesCount={0}
        viewsCount={0}
      />
    )

    expect(screen.getByText("1.5K")).toBeInTheDocument()
    expect(screen.getByText("2.5M")).toBeInTheDocument()
  })

  it("shows liked state correctly", () => {
    const { container } = render(
      <PostInteractionBar
        postId="1"
        likesCount={10}
        commentsCount={0}
        sharesCount={0}
        savesCount={0}
        viewsCount={0}
        isLiked={true}
      />
    )

    const likeButton = container.querySelector('[class*="text-red-500"]')
    expect(likeButton).toBeInTheDocument()
  })

  it("shows saved state correctly", () => {
    const { container } = render(
      <PostInteractionBar
        postId="1"
        likesCount={0}
        commentsCount={0}
        sharesCount={0}
        savesCount={0}
        viewsCount={0}
        isSaved={true}
      />
    )

    const saveButton = container.querySelector('[class*="text-primary"]')
    expect(saveButton).toBeInTheDocument()
  })
})

describe("PostMediaDisplay", () => {
  it("renders single image correctly", () => {
    render(
      <PostMediaDisplay
        media={[{ id: "m1", type: "photo", url: "/test.jpg" }]}
      />
    )

    const image = screen.getByAltText("Post image")
    expect(image).toBeInTheDocument()
  })

  it("renders video with play button", () => {
    render(
      <PostMediaDisplay
        media={[
          {
            id: "v1",
            type: "video",
            url: "/test.mp4",
            thumbnail: "/thumb.jpg",
          },
        ]}
      />
    )

    const playButton = screen.getByLabelText("Play video")
    expect(playButton).toBeInTheDocument()
  })

  it("renders multiple images in grid", () => {
    render(<PostMediaDisplay media={mockPostWithMultipleMedia.media!} />)

    const images = screen.getAllByAltText(/Post image/)
    expect(images).toHaveLength(4)
  })

  it("shows carousel navigation for many images", () => {
    const manyImages = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      type: "photo" as const,
      url: `/image${i}.jpg`,
    }))

    render(<PostMediaDisplay media={manyImages} />)

    expect(screen.getByLabelText("Previous image")).toBeInTheDocument()
    expect(screen.getByLabelText("Next image")).toBeInTheDocument()
    expect(screen.getByText("1 / 10")).toBeInTheDocument()
  })
})

describe("FeedList", () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it("renders list of posts", () => {
    const posts = [mockPost, mockPostWithMedia]
    render(<FeedList initialPosts={posts} />)

    expect(screen.getAllByText(mockPost.content)).toHaveLength(2)
  })

  it("shows empty state when no posts", () => {
    render(<FeedList initialPosts={[]} />)

    expect(screen.getByText("No posts to display")).toBeInTheDocument()
  })

  it("shows Load More button after 20 posts", () => {
    const manyPosts = Array.from({ length: 25 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    
    render(<FeedList initialPosts={manyPosts} hasMore={true} />)

    expect(screen.getByText("Load More")).toBeInTheDocument()
  })

  it("does not show Load More button with fewer than 20 posts", () => {
    const fewPosts = Array.from({ length: 15 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    
    render(<FeedList initialPosts={fewPosts} hasMore={true} />)

    expect(screen.queryByText("Load More")).not.toBeInTheDocument()
  })

  it("calls onLoadMore when Load More is clicked", async () => {
    const manyPosts = Array.from({ length: 25 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    const onLoadMore = jest.fn().mockResolvedValue([mockPostWithMedia])
    
    render(
      <FeedList
        initialPosts={manyPosts}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    )

    const loadMoreButton = screen.getByText("Load More")
    fireEvent.click(loadMoreButton)

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalled()
    })
  })

  it("shows loading spinner during fetch", async () => {
    const manyPosts = Array.from({ length: 25 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    const onLoadMore = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([mockPostWithMedia]), 100))
    )
    
    const { container } = render(
      <FeedList
        initialPosts={manyPosts}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    )

    const loadMoreButton = screen.getByText("Load More")
    fireEvent.click(loadMoreButton)

    // Loading spinner should appear (look for the Loader2 icon with animate-spin class)
    await waitFor(() => {
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  it("shows end of feed message when no more posts", () => {
    const posts = Array.from({ length: 25 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    
    render(<FeedList initialPosts={posts} hasMore={false} />)

    expect(screen.getByText("You're all caught up!")).toBeInTheDocument()
  })

  it("sets up IntersectionObserver for infinite scroll", () => {
    const manyPosts = Array.from({ length: 25 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    
    render(
      <FeedList
        initialPosts={manyPosts}
        hasMore={true}
        onLoadMore={jest.fn()}
      />
    )

    expect(global.IntersectionObserver).toHaveBeenCalled()
  })

  it("limits DOM to 200 posts", async () => {
    const initialPosts = Array.from({ length: 195 }, (_, i) => ({
      ...mockPost,
      id: `post-${i}`,
    }))
    const newPosts = Array.from({ length: 20 }, (_, i) => ({
      ...mockPost,
      id: `new-post-${i}`,
    }))
    const onLoadMore = jest.fn().mockResolvedValue(newPosts)
    
    const { container } = render(
      <FeedList
        initialPosts={initialPosts}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    )

    const loadMoreButton = screen.getByText("Load More")
    fireEvent.click(loadMoreButton)

    await waitFor(() => {
      const postCards = container.querySelectorAll('[class*="border-b"]')
      // Should have at most 200 posts in DOM
      expect(postCards.length).toBeLessThanOrEqual(200)
    })
  })

  it("handles post interactions", () => {
    const { container } = render(<FeedList initialPosts={[mockPost]} />)

    expect(screen.getByText(mockPost.content)).toBeInTheDocument()

    // Verify interaction buttons are present
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
    
    // Verify like button exists
    const likeButton = Array.from(buttons).find(btn => 
      btn.querySelector('.lucide-heart')
    )
    expect(likeButton).toBeTruthy()
  })
})
