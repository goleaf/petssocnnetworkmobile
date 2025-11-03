import {
  toggleWatch,
  isWatching,
  getWatchEntriesByUserId,
  getWatchEntriesForTarget,
  getWatchEntryByTarget,
  notifyWatchers,
} from "../storage"
import { getNotificationsByUserId, markAsRead } from "../notifications"

describe("Watch functionality", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe("toggleWatch", () => {
    it("should create a new watch entry when not watching", () => {
      const userId = "user1"
      const targetId = "post1"
      const targetType = "post" as const
      const watchEvents = ["update", "comment"]

      const result = toggleWatch(userId, targetId, targetType, watchEvents)

      expect(result.enabled).toBe(true)
      expect(result.userId).toBe(userId)
      expect(result.targetId).toBe(targetId)
      expect(result.targetType).toBe(targetType)
      expect(result.watchEvents).toEqual(watchEvents)
    })

    it("should toggle enabled state when already watching", () => {
      const userId = "user1"
      const targetId = "post1"
      const targetType = "post" as const
      const watchEvents = ["update", "comment"]

      // Create watch entry
      toggleWatch(userId, targetId, targetType, watchEvents)
      
      // Toggle it off
      const result = toggleWatch(userId, targetId, targetType, watchEvents)

      expect(result.enabled).toBe(false)
    })
  })

  describe("isWatching", () => {
    it("should return false when not watching", () => {
      const userId = "user1"
      const targetId = "post1"
      const targetType = "post" as const

      expect(isWatching(userId, targetId, targetType)).toBe(false)
    })

    it("should return true when watching", () => {
      const userId = "user1"
      const targetId = "post1"
      const targetType = "post" as const
      const watchEvents = ["update"]

      toggleWatch(userId, targetId, targetType, watchEvents)

      expect(isWatching(userId, targetId, targetType)).toBe(true)
    })
  })

  describe("getWatchEntriesByUserId", () => {
    it("should return only enabled watch entries for user", () => {
      const userId = "user1"
      const userId2 = "user2"

      toggleWatch(userId, "post1", "post", ["update"])
      toggleWatch(userId, "post2", "post", ["comment"])
      toggleWatch(userId, "wiki1", "wiki", ["update"])
      toggleWatch(userId2, "post3", "post", ["update"])

      // Toggle one off
      toggleWatch(userId, "post2", "post", ["comment"])

      const entries = getWatchEntriesByUserId(userId)

      expect(entries.length).toBe(2)
      expect(entries.every((e) => e.userId === userId)).toBe(true)
      expect(entries.every((e) => e.enabled)).toBe(true)
    })
  })

  describe("getWatchEntriesForTarget", () => {
    it("should return all enabled watchers for a target", () => {
      toggleWatch("user1", "post1", "post", ["update"])
      toggleWatch("user2", "post1", "post", ["update"])
      toggleWatch("user3", "post1", "post", ["update"])

      // Toggle one off
      toggleWatch("user2", "post1", "post", ["update"])

      const entries = getWatchEntriesForTarget("post1", "post")

      expect(entries.length).toBe(2)
      expect(entries.some((e) => e.userId === "user1")).toBe(true)
      expect(entries.some((e) => e.userId === "user3")).toBe(true)
    })
  })

  describe("notifyWatchers", () => {
    it("should notify all watchers of an update event", () => {
      const targetId = "post1"
      const targetType = "post" as const

      toggleWatch("watcher1", targetId, targetType, ["update"])
      toggleWatch("watcher2", targetId, targetType, ["update"])

      notifyWatchers(targetId, targetType, "update", "author1", "John", "Test Post")

      const notifications1 = getNotificationsByUserId("watcher1")
      const notifications2 = getNotificationsByUserId("watcher2")

      expect(notifications1.length).toBeGreaterThan(0)
      expect(notifications2.length).toBeGreaterThan(0)
      expect(notifications1[0]?.type).toBe("watch_update")
      expect(notifications2[0]?.type).toBe("watch_update")
    })

    it("should not notify watchers if event type is not being watched", () => {
      const targetId = "post1"
      const targetType = "post" as const

      toggleWatch("watcher1", targetId, targetType, ["comment"]) // Only watching comments, not updates

      notifyWatchers(targetId, targetType, "update", "author1", "John", "Test Post")

      const notifications = getNotificationsByUserId("watcher1")
      expect(notifications.filter((n) => n.type === "watch_update")).toHaveLength(0)
    })

    it("should not notify the actor who triggered the event", () => {
      const targetId = "post1"
      const targetType = "post" as const

      toggleWatch("author1", targetId, targetType, ["update"]) // Author is watching their own post

      notifyWatchers(targetId, targetType, "update", "author1", "John", "Test Post")

      const notifications = getNotificationsByUserId("author1")
      expect(notifications.filter((n) => n.type === "watch_update")).toHaveLength(0)
    })

    it("should create separate notifications when multiple events happen", () => {
      const targetId = "wiki1"
      const targetType = "wiki" as const

      toggleWatch("watcher1", targetId, targetType, ["update", "comment", "reaction"])

      // Trigger multiple events
      notifyWatchers(targetId, targetType, "update", "author1", "John", "Test Wiki")
      notifyWatchers(targetId, targetType, "comment", "author2", "Jane", "Test Wiki")
      notifyWatchers(targetId, targetType, "reaction", "author3", "Bob", "Test Wiki")

      const notifications = getNotificationsByUserId("watcher1")
      const watchUpdateNotifications = notifications.filter((n) => n.type === "watch_update")
      
      // Should have separate notifications for each event type
      expect(watchUpdateNotifications.length).toBe(3)
    })
  })
})

