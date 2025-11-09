import { linkifyEntities } from "../linkify-entities"
import { initializeStorage } from "@/lib/storage"
import type { User, WikiArticle } from "@/lib/types"

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

describe("linkifyEntities", () => {
  beforeEach(() => {
    localStorage.clear()
    initializeStorage()
  })

  it("should extract mentions with ranges", () => {
    const user: User = {
      id: "user1",
      email: "john@example.com",
      username: "john",
      fullName: "John Doe",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }
    localStorage.setItem("pet_social_users", JSON.stringify([user]))

    const text = "Hey @john and @jane, check this out!"
    const result = linkifyEntities(text)

    expect(result.ranges).toHaveLength(2)
    expect(result.ranges[0]).toMatchObject({
      startIndex: 4,
      endIndex: 9,
      entityId: "user1",
      type: "mention",
      text: "@john",
    })
    expect(result.ranges[1]).toMatchObject({
      startIndex: 14,
      endIndex: 19,
      entityId: "jane", // User not found, uses username as ID
      type: "mention",
      text: "@jane",
    })
  })

  it("should extract hashtags with ranges", () => {
    const text = "This is #awesome and #cool!"
    const result = linkifyEntities(text)

    expect(result.ranges).toHaveLength(2)
    expect(result.ranges[0]).toMatchObject({
      startIndex: 8,
      endIndex: 16,
      entityId: "awesome",
      type: "hashtag",
      text: "#awesome",
    })
    expect(result.ranges[1]).toMatchObject({
      startIndex: 21,
      endIndex: 26,
      entityId: "cool",
      type: "hashtag",
      text: "#cool",
    })
  })

  it("should extract wiki terms with ranges", () => {
    const wikiArticle: WikiArticle = {
      id: "wiki1",
      title: "Dog Training",
      slug: "dog-training",
      category: "training",
      content: "Content about dog training",
      authorId: "author1",
      views: 0,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("pet_social_wiki_articles", JSON.stringify([wikiArticle]))

    const text = "Learn about Dog Training today!"
    const result = linkifyEntities(text)

    expect(result.ranges.length).toBeGreaterThan(0)
    const wikiRange = result.ranges.find((r) => r.type === "wiki")
    expect(wikiRange).toMatchObject({
      entityId: "wiki1",
      type: "wiki",
      text: "Dog Training",
    })
  })

  it("should handle overlapping entities correctly", () => {
    const text = "@john #john"
    const result = linkifyEntities(text)

    // Should handle both mention and hashtag with same name
    expect(result.ranges.length).toBeGreaterThan(0)
  })

  it("should return empty ranges for empty text", () => {
    const result = linkifyEntities("")
    expect(result.ranges).toEqual([])
  })

  it("should not extract mentions from email addresses", () => {
    const text = "Contact me at john@example.com"
    const result = linkifyEntities(text)

    const mentions = result.ranges.filter((r) => r.type === "mention")
    expect(mentions.length).toBe(0)
  })

  it("should extract all entity types together", () => {
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
    const wikiArticle: WikiArticle = {
      id: "wiki1",
      title: "Dog Training",
      slug: "dog-training",
      category: "training",
      content: "Content about dog training",
      authorId: "author1",
      views: 0,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("pet_social_wiki_articles", JSON.stringify([wikiArticle]))

    const text = "Hey @testuser, check out #pets and Dog Training!"
    const result = linkifyEntities(text)

    expect(result.ranges.length).toBeGreaterThan(2)
    expect(result.ranges.some((r) => r.type === "mention")).toBe(true)
    expect(result.ranges.some((r) => r.type === "hashtag")).toBe(true)
  })
})
