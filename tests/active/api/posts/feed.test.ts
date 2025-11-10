import { GET } from "../feed/route"
import { NextRequest } from "next/server"
import { initializeStorage, toggleFollow } from "@/lib/storage"
import type { User, Pet, BlogPost } from "@/lib/types"

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
}

const localStorageMock = createLocalStorageMock()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
})

describe("GET /api/posts/feed", () => {
  beforeEach(() => {
    localStorage.clear()
    initializeStorage()
  })

  it("should return all visible posts for viewer", async () => {
    const viewer: User = {
      id: "viewer1",
      email: "viewer@example.com",
      username: "viewer",
      fullName: "Viewer User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([viewer]))

    const author: User = {
      id: "author1",
      email: "author@example.com",
      username: "author",
      fullName: "Author User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
    users.push(author)
    localStorage.setItem("pet_social_users", JSON.stringify(users))

    const pet: Pet = {
      id: "pet1",
      ownerId: "author1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const post: BlogPost = {
      id: "post1",
      petId: "pet1",
      authorId: "author1",
      title: "Test Post",
      content: "This is a test post",
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "public",
    }
    localStorage.setItem("pet_social_blog_posts", JSON.stringify([post]))

    const request = new NextRequest(
      "http://localhost/api/posts/feed?viewerId=viewer1&scope=all"
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toBeDefined()
    expect(data.posts.length).toBeGreaterThan(0)
    expect(data.posts[0].id).toBe("post1")
  })

  it("should enforce privacy - only show public posts to non-followers", async () => {
    const viewer: User = {
      id: "viewer1",
      email: "viewer@example.com",
      username: "viewer",
      fullName: "Viewer User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([viewer]))

    const author: User = {
      id: "author1",
      email: "author@example.com",
      username: "author",
      fullName: "Author User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
    users.push(author)
    localStorage.setItem("pet_social_users", JSON.stringify(users))

    const pet: Pet = {
      id: "pet1",
      ownerId: "author1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const publicPost: BlogPost = {
      id: "post1",
      petId: "pet1",
      authorId: "author1",
      title: "Public Post",
      content: "This is public",
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "public",
    }
    const posts = [publicPost]
    const privatePost: BlogPost = {
      id: "post2",
      petId: "pet1",
      authorId: "author1",
      title: "Private Post",
      content: "This is private",
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "private",
    }
    posts.push(privatePost)
    localStorage.setItem("pet_social_blog_posts", JSON.stringify(posts))

    const request = new NextRequest(
      "http://localhost/api/posts/feed?viewerId=viewer1&scope=all"
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts.length).toBe(1)
    expect(data.posts[0].id).toBe("post1")
  })

  it("should show followers-only posts to followers", async () => {
    const viewer: User = {
      id: "viewer1",
      email: "viewer@example.com",
      username: "viewer",
      fullName: "Viewer User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([viewer]))

    const author: User = {
      id: "author1",
      email: "author@example.com",
      username: "author",
      fullName: "Author User",
      joinedAt: new Date().toISOString(),
      followers: ["viewer1"],
      following: [],
    }
    const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
    users.push(author)
    localStorage.setItem("pet_social_users", JSON.stringify(users))

    // Make viewer follow author
    toggleFollow("viewer1", "author1")

    const pet: Pet = {
      id: "pet1",
      ownerId: "author1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const followersOnlyPost: BlogPost = {
      id: "post1",
      petId: "pet1",
      authorId: "author1",
      title: "Followers Only Post",
      content: "This is for followers only",
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "followers-only",
    }
    localStorage.setItem("pet_social_blog_posts", JSON.stringify([followersOnlyPost]))

    const request = new NextRequest(
      "http://localhost/api/posts/feed?viewerId=viewer1&scope=all"
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts.length).toBe(1)
    expect(data.posts[0].id).toBe("post1")
  })

  it("should filter by following scope", async () => {
    const viewer: User = {
      id: "viewer1",
      email: "viewer@example.com",
      username: "viewer",
      fullName: "Viewer User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: ["author1"],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([viewer]))

    const author1: User = {
      id: "author1",
      email: "author1@example.com",
      username: "author1",
      fullName: "Author 1",
      joinedAt: new Date().toISOString(),
      followers: ["viewer1"],
      following: [],
    }
    const author2: User = {
      id: "author2",
      email: "author2@example.com",
      username: "author2",
      fullName: "Author 2",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
    users.push(author1, author2)
    localStorage.setItem("pet_social_users", JSON.stringify(users))

    const pet1: Pet = {
      id: "pet1",
      ownerId: "author1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    const pet2: Pet = {
      id: "pet2",
      ownerId: "author2",
      name: "Rex",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet1, pet2]))

    const post1: BlogPost = {
      id: "post1",
      petId: "pet1",
      authorId: "author1",
      title: "Post from followed author",
      content: "Content",
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "public",
    }
    const posts = [post1]
    const post2: BlogPost = {
      id: "post2",
      petId: "pet2",
      authorId: "author2",
      title: "Post from unfollowed author",
      content: "Content",
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "public",
    }
    posts.push(post2)
    localStorage.setItem("pet_social_blog_posts", JSON.stringify(posts))

    const request = new NextRequest(
      "http://localhost/api/posts/feed?viewerId=viewer1&scope=following"
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts.length).toBe(1)
    expect(data.posts[0].id).toBe("post1")
  })

  it("should support pagination with cursor", async () => {
    const viewer: User = {
      id: "viewer1",
      email: "viewer@example.com",
      username: "viewer",
      fullName: "Viewer User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([viewer]))

    const author: User = {
      id: "author1",
      email: "author@example.com",
      username: "author",
      fullName: "Author User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
    users.push(author)
    localStorage.setItem("pet_social_users", JSON.stringify(users))

    const pet: Pet = {
      id: "pet1",
      ownerId: "author1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    // Create multiple posts
    const posts: BlogPost[] = []
    for (let i = 0; i < 5; i++) {
      const post: BlogPost = {
        id: `post${i}`,
        petId: "pet1",
        authorId: "author1",
        title: `Post ${i}`,
        content: `Content ${i}`,
        tags: [],
        categories: [],
        likes: [],
        reactions: {
          like: [],
          love: [],
          laugh: [],
          wow: [],
          sad: [],
          angry: [],
        },
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        privacy: "public",
      }
      posts.push(post)
    }
    localStorage.setItem("pet_social_blog_posts", JSON.stringify(posts))

    const request = new NextRequest(
      "http://localhost/api/posts/feed?viewerId=viewer1&scope=all&limit=2"
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts.length).toBe(2)
    expect(data.nextCursor).toBeDefined()
  })

  it("should return 404 if viewer not found", async () => {
    const request = new NextRequest(
      "http://localhost/api/posts/feed?viewerId=nonexistent&scope=all"
    )

    const response = await GET(request)
    expect(response.status).toBe(404)
  })
})

