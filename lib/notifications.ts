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
