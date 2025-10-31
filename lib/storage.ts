import type { User, Pet, BlogPost, Comment, WikiArticle, Activity } from "./types"
import { mockUsers, mockPets, mockBlogPosts, mockComments, mockWikiArticles } from "./mock-data"

const STORAGE_KEYS = {
  USERS: "pet_social_users",
  PETS: "pet_social_pets",
  BLOG_POSTS: "pet_social_blog_posts",
  COMMENTS: "pet_social_comments",
  WIKI_ARTICLES: "pet_social_wiki_articles",
  ACTIVITIES: "pet_social_activities",
  CURRENT_USER: "pet_social_current_user",
}

// Helper function to generate slug from pet name
export function generatePetSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

// Initialize storage with mock data if empty
export function initializeStorage() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers))
  }
  if (!localStorage.getItem(STORAGE_KEYS.PETS)) {
    // Generate slugs for all pets if they don't have them
    const petsWithSlugs = mockPets.map((pet) => ({
      ...pet,
      slug: pet.slug || generatePetSlug(pet.name),
    }))
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(petsWithSlugs))
  } else {
    // Ensure existing pets have slugs
    const existingPets = JSON.parse(localStorage.getItem(STORAGE_KEYS.PETS) || "[]") as Pet[]
    const updatedPets = existingPets.map((pet) => ({
      ...pet,
      slug: pet.slug || generatePetSlug(pet.name),
    }))
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updatedPets))
  }
  if (!localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)) {
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(mockBlogPosts))
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(mockComments))
  }
  if (!localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES)) {
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(mockWikiArticles))
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]))
  }
  // Don't auto-login users - they must login manually
}

// User operations
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  if (!userId) return null
  const users = getUsers()
  return users.find((u) => u.id === userId) || null
}

export function setCurrentUser(userId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId)
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  return data ? JSON.parse(data) : []
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username === username)
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function updateUser(userId: string, updates: Partial<User>) {
  if (typeof window === "undefined") return
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  }
}

export function toggleFollow(followerId: string, followingId: string) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const followerIndex = users.findIndex((u) => u.id === followerId)
  const followingIndex = users.findIndex((u) => u.id === followingId)

  if (followerIndex === -1 || followingIndex === -1) return

  const follower = users[followerIndex]
  const following = users[followingIndex]

  // Check if already following
  const isFollowing = follower.following.includes(followingId)

  if (isFollowing) {
    // Unfollow
    follower.following = follower.following.filter((id) => id !== followingId)
    following.followers = following.followers.filter((id) => id !== followerId)
  } else {
    // Follow
    follower.following.push(followingId)
    following.followers.push(followerId)
  }

  users[followerIndex] = follower
  users[followingIndex] = following

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

// Pet operations
export function getPets(): Pet[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PETS)
  return data ? JSON.parse(data) : []
}

export function getPetById(id: string): Pet | undefined {
  return getPets().find((p) => p.id === id)
}

export function getPetsByOwnerId(ownerId: string): Pet[] {
  return getPets().filter((p) => p.ownerId === ownerId)
}

export function getPetByUsernameAndSlug(username: string, slug: string): Pet | undefined {
  const users = getUsers()
  const owner = users.find((u) => u.username === username)
  if (!owner) return undefined
  
  const pets = getPets()
  return pets.find((p) => p.ownerId === owner.id && (p.slug === slug || !p.slug && p.id === slug))
}

export function updatePet(pet: Pet) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === pet.id)
  if (index !== -1) {
    pets[index] = pet
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
  }
}

export function addPet(pet: Pet) {
  if (typeof window === "undefined") return
  const pets = getPets()
  // Generate slug if not provided
  if (!pet.slug) {
    pet.slug = generatePetSlug(pet.name)
  }
  pets.push(pet)
  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
}

// Blog post operations
export function getBlogPosts(): BlogPost[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)
  return data ? JSON.parse(data) : []
}

export function getBlogPostById(id: string): BlogPost | undefined {
  return getBlogPosts().find((p) => p.id === id)
}

export function getBlogPostsByPetId(petId: string): BlogPost[] {
  return getBlogPosts().filter((p) => p.petId === petId)
}

export function addBlogPost(post: BlogPost) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  posts.unshift(post)
  localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
}

export function updateBlogPost(post: BlogPost) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const index = posts.findIndex((p) => p.id === post.id)
  if (index !== -1) {
    posts[index] = post
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
  }
}

export function deleteBlogPost(postId: string) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const filteredPosts = posts.filter((p) => p.id !== postId)
  localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(filteredPosts))
}

export function togglePostReaction(postId: string, userId: string, reactionType: string) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const index = posts.findIndex((p) => p.id === postId)
  if (index !== -1) {
    if (!posts[index].reactions) {
      posts[index].reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      }
    }
    const reactions = posts[index].reactions!
    const reactionArray = reactions[reactionType as keyof typeof reactions] || []
    const hasReacted = reactionArray.includes(userId)
    
    if (hasReacted) {
      // Remove reaction
      reactions[reactionType as keyof typeof reactions] = reactionArray.filter((id) => id !== userId)
    } else {
      // Remove from other reactions first (user can only have one reaction)
      Object.keys(reactions).forEach((key) => {
        if (key !== reactionType) {
          reactions[key as keyof typeof reactions] = reactions[key as keyof typeof reactions].filter(
            (id) => id !== userId
          )
        }
      })
      // Add reaction
      reactions[reactionType as keyof typeof reactions] = [...reactionArray, userId]
    }
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
  }
}

// Comment operations
export function getComments(): Comment[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS)
  return data ? JSON.parse(data) : []
}

export function getCommentsByPostId(postId: string): Comment[] {
  return getComments().filter((c) => c.postId === postId)
}

export function getCommentsByWikiArticleId(articleId: string): Comment[] {
  return getComments().filter((c) => c.wikiArticleId === articleId)
}

export function addComment(comment: Comment) {
  if (typeof window === "undefined") return
  const comments = getComments()
  comments.push(comment)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
}

export function updateComment(commentId: string, content: string) {
  if (typeof window === "undefined") return
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index !== -1) {
    comments[index].content = content
    comments[index].updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  }
}

export function deleteComment(commentId: string) {
  if (typeof window === "undefined") return
  const comments = getComments()
  // Delete the comment and all its replies
  const filteredComments = comments.filter((c) => c.id !== commentId && c.parentCommentId !== commentId)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filteredComments))
}

export function toggleCommentReaction(commentId: string, userId: string, reactionType: string) {
  if (typeof window === "undefined") return
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index !== -1) {
    if (!comments[index].reactions) {
      comments[index].reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      }
    }
    const reactions = comments[index].reactions!
    const reactionArray = reactions[reactionType as keyof typeof reactions] || []
    const hasReacted = reactionArray.includes(userId)
    
    if (hasReacted) {
      // Remove reaction
      reactions[reactionType as keyof typeof reactions] = reactionArray.filter((id) => id !== userId)
    } else {
      // Remove from other reactions first (user can only have one reaction)
      Object.keys(reactions).forEach((key) => {
        if (key !== reactionType) {
          reactions[key as keyof typeof reactions] = reactions[key as keyof typeof reactions].filter(
            (id) => id !== userId
          )
        }
      })
      // Add reaction
      reactions[reactionType as keyof typeof reactions] = [...reactionArray, userId]
    }
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  }
}

// Wiki operations
export function getWikiArticles(): WikiArticle[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES)
  return data ? JSON.parse(data) : []
}

export function getWikiArticleBySlug(slug: string): WikiArticle | undefined {
  return getWikiArticles().find((a) => a.slug === slug)
}

export function getWikiArticlesByCategory(category: string): WikiArticle[] {
  return getWikiArticles().filter((a) => a.category === category)
}

export function updateWikiArticle(article: WikiArticle) {
  if (typeof window === "undefined") return
  const articles = getWikiArticles()
  const index = articles.findIndex((a) => a.id === article.id)
  if (index !== -1) {
    articles[index] = article
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(articles))
  }
}

// Activity operations
export function getActivities(): Activity[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES)
  return data ? JSON.parse(data) : []
}

export function addActivity(activity: Activity) {
  if (typeof window === "undefined") return
  const activities = getActivities()
  activities.unshift(activity)
  // Keep only last 100 activities
  if (activities.length > 100) {
    activities.pop()
  }
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities))
}
