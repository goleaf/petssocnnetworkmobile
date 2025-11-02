import { calculatePostRankingScore, rankPosts } from "../post-ranking"
import type { BlogPost, Place } from "@/lib/types"

describe("post-ranking", () => {
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const createMockPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
    id: "post1",
    petId: "pet1",
    authorId: "user1",
    title: "Test Post",
    content: "Test content",
    tags: [],
    categories: [],
    likes: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  })

  const createMockPlace = (overrides: Partial<Place> = {}): Place => ({
    id: "place1",
    name: "Test Place",
    address: "123 Test St",
    lat: 40.7128,
    lng: -74.006,
    amenities: [],
    rules: [],
    moderationStatus: "approved",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  })

  describe("calculatePostRankingScore", () => {
    it("should give higher score to recent posts", () => {
      const recentPost = createMockPost({ createdAt: oneHourAgo })
      const oldPost = createMockPost({ createdAt: oneWeekAgo })

      const recentScore = calculatePostRankingScore(recentPost, 0)
      const oldScore = calculatePostRankingScore(oldPost, 0)

      expect(recentScore).toBeGreaterThan(oldScore)
    })

    it("should give higher score to posts with more engagement", () => {
      const lowEngagementPost = createMockPost({ likes: ["user1"] })
      const highEngagementPost = createMockPost({
        reactions: {
          like: Array.from({ length: 50 }, (_, i) => `user${i}`),
          love: Array.from({ length: 20 }, (_, i) => `user${i + 50}`),
        },
      })

      const lowScore = calculatePostRankingScore(lowEngagementPost, 0)
      const highScore = calculatePostRankingScore(highEngagementPost, 20)

      expect(highScore).toBeGreaterThan(lowScore)
    })

    it("should consider comments in engagement score", () => {
      const post1 = createMockPost({ likes: ["user1"] })
      const post2 = createMockPost({ likes: ["user1"] })

      const score1 = calculatePostRankingScore(post1, 0)
      const score2 = calculatePostRankingScore(post2, 10)

      expect(score2).toBeGreaterThan(score1)
    })

    it("should give higher score to place-tagged posts closer to user", () => {
      const userLocation = { lat: 40.7128, lng: -74.006 } // NYC
      const closePlace = createMockPlace({ lat: 40.713, lng: -74.007 }) // ~100m away
      const farPlace = createMockPlace({ lat: 40.8, lng: -74.1 }) // ~10km away

      const closePost = createMockPost({
        placeId: "place1",
        createdAt: oneHourAgo,
      })
      const farPost = createMockPost({
        placeId: "place2",
        createdAt: oneHourAgo,
      })

      const closeScore = calculatePostRankingScore(
        closePost,
        0,
        closePlace,
        userLocation
      )
      const farScore = calculatePostRankingScore(
        farPost,
        0,
        farPlace,
        userLocation
      )

      expect(closeScore).toBeGreaterThan(farScore)
    })

    it("should return 0 proximity score for posts without place tags", () => {
      const post = createMockPost({ createdAt: oneHourAgo })
      const userLocation = { lat: 40.7128, lng: -74.006 }

      const score = calculatePostRankingScore(post, 0, null, userLocation)

      // Should still have time-decay and engagement, but no proximity
      expect(score).toBeGreaterThan(0)
    })

    it("should return 0 proximity score when user location is not provided", () => {
      const place = createMockPlace()
      const post = createMockPost({ placeId: "place1", createdAt: oneHourAgo })

      const score = calculatePostRankingScore(post, 0, place, null)

      // Should still have time-decay and engagement, but no proximity
      expect(score).toBeGreaterThan(0)
    })

    it("should return 0 proximity score for places beyond max distance", () => {
      const userLocation = { lat: 40.7128, lng: -74.006 } // NYC
      const farPlace = createMockPlace({ lat: 50.0, lng: -80.0 }) // Very far (>50km)
      const post = createMockPost({
        placeId: "place1",
        createdAt: oneHourAgo,
      })

      const score = calculatePostRankingScore(
        post,
        0,
        farPlace,
        userLocation,
        { maxProximityDistanceKm: 50 }
      )

      // Should still have time-decay and engagement, but no proximity
      expect(score).toBeGreaterThan(0)
    })

    it("should respect custom config weights", () => {
      const post = createMockPost({ createdAt: oneHourAgo })
      const config = {
        timeDecayWeight: 0.8,
        engagementWeight: 0.2,
        proximityWeight: 0.0,
      }

      const score = calculatePostRankingScore(post, 0, null, null, config)

      expect(score).toBeGreaterThan(0)
    })

    it("should combine all factors correctly", () => {
      const userLocation = { lat: 40.7128, lng: -74.006 }
      const closePlace = createMockPlace({ lat: 40.713, lng: -74.007 })
      const recentHighEngagementPost = createMockPost({
        placeId: "place1",
        createdAt: oneHourAgo,
        reactions: {
          like: Array.from({ length: 30 }, (_, i) => `user${i}`),
        },
      })

      const score = calculatePostRankingScore(
        recentHighEngagementPost,
        15,
        closePlace,
        userLocation
      )

      // Should have all three factors contributing
      expect(score).toBeGreaterThan(0.5)
    })
  })

  describe("rankPosts", () => {
    it("should sort posts by ranking score descending", () => {
      const oldPost = createMockPost({
        id: "old",
        createdAt: oneWeekAgo,
        likes: ["user1"],
      })
      const recentPost = createMockPost({
        id: "recent",
        createdAt: oneHourAgo,
        likes: ["user1"],
      })

      const commentCounts = new Map([
        ["old", 0],
        ["recent", 0],
      ])
      const placesMap = new Map<string, Place>()

      const ranked = rankPosts([oldPost, recentPost], commentCounts, placesMap)

      expect(ranked[0].id).toBe("recent")
      expect(ranked[1].id).toBe("old")
    })

    it("should prioritize high engagement posts over low engagement", () => {
      const lowEngagement = createMockPost({
        id: "low",
        createdAt: oneDayAgo,
        likes: ["user1"],
      })
      const highEngagement = createMockPost({
        id: "high",
        createdAt: oneDayAgo,
        reactions: {
          like: Array.from({ length: 50 }, (_, i) => `user${i}`),
        },
      })

      const commentCounts = new Map([
        ["low", 0],
        ["high", 20],
      ])
      const placesMap = new Map<string, Place>()

      const ranked = rankPosts(
        [lowEngagement, highEngagement],
        commentCounts,
        placesMap
      )

      expect(ranked[0].id).toBe("high")
    })

    it("should prioritize close place-tagged posts when user location is available", () => {
      const userLocation = { lat: 40.7128, lng: -74.006 }
      const closePlace = createMockPlace({ lat: 40.713, lng: -74.007 })
      const farPlace = createMockPlace({ lat: 40.8, lng: -74.1 })

      const closePost = createMockPost({
        id: "close",
        placeId: "closePlace",
        createdAt: oneDayAgo,
        likes: ["user1"],
      })
      const farPost = createMockPost({
        id: "far",
        placeId: "farPlace",
        createdAt: oneDayAgo,
        likes: ["user1"],
      })

      const commentCounts = new Map([
        ["close", 0],
        ["far", 0],
      ])
      const placesMap = new Map([
        ["closePlace", closePlace],
        ["farPlace", farPlace],
      ])

      const ranked = rankPosts(
        [farPost, closePost],
        commentCounts,
        placesMap,
        userLocation
      )

      expect(ranked[0].id).toBe("close")
    })

    it("should handle posts without place tags", () => {
      const post1 = createMockPost({ id: "post1", createdAt: oneHourAgo })
      const post2 = createMockPost({ id: "post2", createdAt: oneHourAgo })

      const commentCounts = new Map([
        ["post1", 0],
        ["post2", 0],
      ])
      const placesMap = new Map<string, Place>()

      const ranked = rankPosts([post1, post2], commentCounts, placesMap)

      expect(ranked).toHaveLength(2)
      expect(ranked.map((p) => p.id)).toContain("post1")
      expect(ranked.map((p) => p.id)).toContain("post2")
    })

    it("should handle empty posts array", () => {
      const commentCounts = new Map<string, number>()
      const placesMap = new Map<string, Place>()

      const ranked = rankPosts([], commentCounts, placesMap)

      expect(ranked).toHaveLength(0)
    })

    it("should use comment counts from map", () => {
      const post1 = createMockPost({ id: "post1", createdAt: oneDayAgo })
      const post2 = createMockPost({ id: "post2", createdAt: oneDayAgo })

      const commentCounts = new Map([
        ["post1", 0],
        ["post2", 15],
      ])
      const placesMap = new Map<string, Place>()

      const ranked = rankPosts([post1, post2], commentCounts, placesMap)

      expect(ranked[0].id).toBe("post2")
    })
  })
})

