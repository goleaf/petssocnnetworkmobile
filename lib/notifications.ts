import type { Notification } from "./types"

const STORAGE_KEY = "pet_social_notifications"

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function getNotificationsByUserId(userId: string): Notification[] {
  return getNotifications()
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getUnreadCount(userId: string): number {
  return getNotifications().filter((n) => n.userId === userId && !n.read).length
}

export function addNotification(notification: Notification) {
  if (typeof window === "undefined") return
  const notifications = getNotifications()
  notifications.unshift(notification)

  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.pop()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

export function markAsRead(notificationId: string) {
  if (typeof window === "undefined") return
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notificationId)

  if (index !== -1) {
    notifications[index].read = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }
}

export function markAllAsRead(userId: string) {
  if (typeof window === "undefined") return
  const notifications = getNotifications()

  notifications.forEach((n) => {
    if (n.userId === userId) {
      n.read = true
    }
  })

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

export function deleteNotification(notificationId: string) {
  if (typeof window === "undefined") return
  const notifications = getNotifications().filter((n) => n.id !== notificationId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

// Helper functions to create specific notification types
export function createFollowNotification(followerId: string, followedUserId: string, followerName: string) {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: followedUserId,
    type: "follow",
    actorId: followerId,
    targetId: followedUserId,
    targetType: "user",
    message: `${followerName} started following you`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  addNotification(notification)
}

export function createLikeNotification(
  likerId: string,
  targetUserId: string,
  targetId: string,
  targetType: "post" | "wiki",
  likerName: string,
  targetTitle: string,
) {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: targetUserId,
    type: "like",
    actorId: likerId,
    targetId,
    targetType,
    message: `${likerName} liked your ${targetType}: "${targetTitle}"`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  addNotification(notification)
}

export function createCommentNotification(
  commenterId: string,
  postAuthorId: string,
  postId: string,
  commenterName: string,
  postTitle: string,
) {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: postAuthorId,
    type: "comment",
    actorId: commenterId,
    targetId: postId,
    targetType: "post",
    message: `${commenterName} commented on your post: "${postTitle}"`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  addNotification(notification)
}

export function createPostNotification(
  authorId: string,
  followerId: string,
  postId: string,
  authorName: string,
  postTitle: string,
) {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: followerId,
    type: "post",
    actorId: authorId,
    targetId: postId,
    targetType: "post",
    message: `${authorName} published a new post: "${postTitle}"`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  addNotification(notification)
}

export function createMentionNotification(
  mentionerId: string,
  mentionedUserId: string,
  postId: string,
  mentionerName: string,
  postTitle: string,
) {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: mentionedUserId,
    type: "mention",
    actorId: mentionerId,
    targetId: postId,
    targetType: "post",
    message: `${mentionerName} mentioned you in a post: "${postTitle}"`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  addNotification(notification)
}

/**
 * Generate fake notifications for all possible types
 * This is useful for testing and demonstration purposes
 */
export function generateFakeNotificationsForUser(userId: string) {
  if (typeof window === "undefined") return

  // Clear existing notifications for this user first
  const existingNotifications = getNotifications()
  const filteredNotifications = existingNotifications.filter((n) => n.userId !== userId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotifications))

  const now = new Date()
  const fakeNotifications: Notification[] = []

  // 1. Follow notifications (targetType: "user")
  fakeNotifications.push({
    id: `notif_${Date.now()}_follow1`,
    userId,
    type: "follow",
    actorId: "2",
    targetId: userId,
    targetType: "user",
    message: "mikecatlover started following you",
    read: false,
    createdAt: new Date(now.getTime() - 5 * 60000).toISOString(), // 5 minutes ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_follow2`,
    userId,
    type: "follow",
    actorId: "3",
    targetId: userId,
    targetType: "user",
    message: "emmabirds started following you",
    read: false,
    createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
  })

  // 2. Like notifications - Post (targetType: "post")
  fakeNotifications.push({
    id: `notif_${Date.now()}_like_post1`,
    userId,
    type: "like",
    actorId: "4",
    targetId: "1",
    targetType: "post",
    message: 'alexrabbits liked your post: "Our Amazing Day at the Beach"',
    read: false,
    createdAt: new Date(now.getTime() - 10 * 60000).toISOString(), // 10 minutes ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_like_post2`,
    userId,
    type: "like",
    actorId: "5",
    targetId: "2",
    targetType: "post",
    message: 'jessicadogs liked your post: "Lunas First Agility Class"',
    read: true,
    createdAt: new Date(now.getTime() - 1 * 3600000).toISOString(), // 1 hour ago
  })

  // 3. Like notifications - Wiki (targetType: "wiki")
  fakeNotifications.push({
    id: `notif_${Date.now()}_like_wiki1`,
    userId,
    type: "like",
    actorId: "6",
    targetId: "1",
    targetType: "wiki",
    message: 'davidcats liked your wiki: "Complete Guide to Dog Nutrition"',
    read: false,
    createdAt: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 minutes ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_like_wiki2`,
    userId,
    type: "like",
    actorId: "7",
    targetId: "2",
    targetType: "wiki",
    message: 'lisapets liked your wiki: "Cat Behavior: Understanding Your Feline Friend"',
    read: true,
    createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(), // 3 hours ago
  })

  // 4. Comment notifications (targetType: "post")
  fakeNotifications.push({
    id: `notif_${Date.now()}_comment1`,
    userId,
    type: "comment",
    actorId: "8",
    targetId: "1",
    targetType: "post",
    message: 'robertpaws commented on your post: "Our Amazing Day at the Beach"',
    read: false,
    createdAt: new Date(now.getTime() - 20 * 60000).toISOString(), // 20 minutes ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_comment2`,
    userId,
    type: "comment",
    actorId: "9",
    targetId: "3",
    targetType: "post",
    message: 'amandadogs commented on your post: "Kiwi Learned a New Trick!"',
    read: true,
    createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_comment3`,
    userId,
    type: "comment",
    actorId: "10",
    targetId: "2",
    targetType: "post",
    message: 'chrispets commented on your post: "Whiskers New Favorite Toy"',
    read: false,
    createdAt: new Date(now.getTime() - 30 * 60000).toISOString(), // 30 minutes ago
  })

  // 5. Mention notifications (targetType: "post")
  fakeNotifications.push({
    id: `notif_${Date.now()}_mention1`,
    userId,
    type: "mention",
    actorId: "2",
    targetId: "4",
    targetType: "post",
    message: 'mikecatlover mentioned you in a post: "Whiskers Daily Adventures"',
    read: false,
    createdAt: new Date(now.getTime() - 8 * 60000).toISOString(), // 8 minutes ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_mention2`,
    userId,
    type: "mention",
    actorId: "3",
    targetId: "5",
    targetType: "post",
    message: 'emmabirds mentioned you in a post: "Kiwi Training Session"',
    read: true,
    createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
  })

  // 6. Post notifications (targetType: "post")
  fakeNotifications.push({
    id: `notif_${Date.now()}_post1`,
    userId,
    type: "post",
    actorId: "4",
    targetId: "6",
    targetType: "post",
    message: 'alexrabbits published a new post: "Bunny Playtime Fun"',
    read: false,
    createdAt: new Date(now.getTime() - 12 * 60000).toISOString(), // 12 minutes ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_post2`,
    userId,
    type: "post",
    actorId: "5",
    targetId: "7",
    targetType: "post",
    message: 'jessicadogs published a new post: "Rescue Dog Success Story"',
    read: true,
    createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(), // 5 hours ago
  })

  fakeNotifications.push({
    id: `notif_${Date.now()}_post3`,
    userId,
    type: "post",
    actorId: "6",
    targetId: "8",
    targetType: "post",
    message: 'davidcats published a new post: "Cat Photography Tips"',
    read: false,
    createdAt: new Date(now.getTime() - 25 * 60000).toISOString(), // 25 minutes ago
  })

  // Add all notifications
  fakeNotifications.forEach((notification) => {
    addNotification(notification)
  })

  return fakeNotifications.length
}
