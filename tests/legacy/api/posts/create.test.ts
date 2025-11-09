import { POST } from "../create/route"
import { NextRequest } from "next/server"
import { initializeStorage } from "@/lib/storage"
import type { User, Pet } from "@/lib/types"

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

describe("POST /api/posts/create", () => {
  beforeEach(() => {
    localStorage.clear()
    initializeStorage()
  })

  it("should create a post with text only", async () => {
    const user: User = {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
      fullName: "Test User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([user]))

    const pet: Pet = {
      id: "pet1",
      ownerId: "user1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const requestBody = {
      text: "This is a test post",
      media: [],
      authorId: "user1",
      petId: "pet1",
      visibility: "public",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.post).toBeDefined()
    expect(data.post.content).toBe("This is a test post")
    expect(data.post.authorId).toBe("user1")
    expect(data.post.petId).toBe("pet1")
    expect(data.post.privacy).toBe("public")
    expect(data.entities).toBeDefined()
    expect(data.entities.ranges).toBeDefined()
  })

  it("should create a post with media", async () => {
    const user: User = {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
      fullName: "Test User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([user]))

    const pet: Pet = {
      id: "pet1",
      ownerId: "user1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const requestBody = {
      text: "Check out this photo!",
      media: [
        { type: "image", url: "https://example.com/image.jpg" },
        { type: "video", url: "https://example.com/video.mp4" },
        { type: "link", url: "https://example.com", title: "Example" },
      ],
      authorId: "user1",
      petId: "pet1",
      visibility: "public",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.post.media).toBeDefined()
    expect(data.post.media.images).toHaveLength(1)
    expect(data.post.media.videos).toHaveLength(1)
    expect(data.post.media.links).toHaveLength(1)
  })

  it("should create a post with poll", async () => {
    const user: User = {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
      fullName: "Test User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([user]))

    const pet: Pet = {
      id: "pet1",
      ownerId: "user1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const requestBody = {
      text: "What's your favorite pet?",
      media: [],
      poll: {
        question: "What's your favorite pet?",
        options: [
          { text: "Dogs" },
          { text: "Cats" },
          { text: "Birds" },
        ],
        allowMultiple: false,
      },
      authorId: "user1",
      petId: "pet1",
      visibility: "public",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.post.poll).toBeDefined()
    expect(data.post.poll.question).toBe("What's your favorite pet?")
    expect(data.post.poll.options).toHaveLength(3)
  })

  it("should create a post with placeId", async () => {
    const user: User = {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
      fullName: "Test User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([user]))

    const pet: Pet = {
      id: "pet1",
      ownerId: "user1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const requestBody = {
      text: "At the dog park!",
      media: [],
      placeId: "place123",
      authorId: "user1",
      petId: "pet1",
      visibility: "public",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.post.placeId).toBe("place123")
  })

  it("should extract hashtags from text", async () => {
    const user: User = {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
      fullName: "Test User",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([user]))

    const pet: Pet = {
      id: "pet1",
      ownerId: "user1",
      name: "Fluffy",
      species: "dog",
      followers: [],
    }
    localStorage.setItem("pet_social_pets", JSON.stringify([pet]))

    const requestBody = {
      text: "This is #awesome and #cool!",
      media: [],
      authorId: "user1",
      petId: "pet1",
      visibility: "public",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.post.hashtags).toContain("awesome")
    expect(data.post.hashtags).toContain("cool")
  })

  it("should validate required fields", async () => {
    const requestBody = {
      text: "",
      media: [],
      authorId: "user1",
      petId: "pet1",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("should return 404 if author not found", async () => {
    const requestBody = {
      text: "Test post",
      media: [],
      authorId: "nonexistent",
      petId: "pet1",
      visibility: "public",
    }

    const request = new NextRequest("http://localhost/api/posts/create", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
  })
})

