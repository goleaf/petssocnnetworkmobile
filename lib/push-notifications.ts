import type {
  Notification as AppNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationSettings,
  NotificationType,
  NotificationTypePreference,
} from "./types"

const SERVICE_WORKER_URL = "/notification-sw.js"
const PERMISSION_REQUESTED_KEY = "pet_social_notification_permission_requested"

const DEFAULT_PRIORITY: NotificationPriority = "normal"
const DEFAULT_CATEGORY: NotificationCategory = "social"

const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
}

const DEFAULT_PUSH_CHANNEL = {
  enabled: true,
  frequency: "real-time" as const,
  categories: ["social", "community", "system"] as NotificationCategory[],
  priorityThreshold: "normal" as NotificationPriority,
}

const DEFAULT_DIGEST = {
  enabled: true,
  interval: "daily" as const,
  timeOfDay: "08:00",
  categories: ["social", "community", "promotions", "reminders"] as NotificationCategory[],
  includeUnreadOnly: true,
}

function buildDefaultSettings(userId: string): NotificationSettings {
  return {
    userId,
    channelPreferences: {
      push: { ...DEFAULT_PUSH_CHANNEL },
    },
    typePreferences: {},
    digestSchedule: { ...DEFAULT_DIGEST },
    mutedCategories: [],
    updatedAt: new Date(0).toISOString(),
  }
}

export const NOTIFICATION_CREATED_EVENT = "pet_social_notification_created"
export const NOTIFICATIONS_UPDATED_EVENT = "pet_social_notifications_updated"

function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator
}

function mergeTypePreferences(
  defaults: Partial<Record<NotificationType, NotificationTypePreference>>,
  overrides?: Partial<Record<NotificationType, NotificationTypePreference>>,
) {
  if (!overrides) return defaults
  const merged: Partial<Record<NotificationType, NotificationTypePreference>> = { ...defaults }
  for (const key of Object.keys(overrides) as NotificationType[]) {
    const override = overrides[key]
    if (!override) continue
    const base = merged[key] ?? { enabled: true, channels: ["in_app", "push"] }
    merged[key] = {
      ...base,
      ...override,
      channels: override.channels && override.channels.length > 0 ? [...override.channels] : base.channels,
    }
  }
  return merged
}

function getNotificationSettingsForUser(userId: string): NotificationSettings | null {
  if (typeof window === "undefined") return null

  const fallback = buildDefaultSettings(userId)

  try {
    const stored = window.localStorage.getItem(`notification_settings_${userId}`)
    if (!stored) return fallback

    const parsed = JSON.parse(stored) as NotificationSettings
    const pushPreferences = parsed.channelPreferences?.push ?? fallback.channelPreferences.push

    return {
      ...fallback,
      ...parsed,
      channelPreferences: {
        ...fallback.channelPreferences,
        ...parsed.channelPreferences,
        push: {
          ...fallback.channelPreferences.push,
          ...pushPreferences,
          categories:
            pushPreferences?.categories && pushPreferences.categories.length > 0
              ? pushPreferences.categories
              : fallback.channelPreferences.push.categories,
        },
      },
      typePreferences: mergeTypePreferences(fallback.typePreferences ?? {}, parsed.typePreferences),
      mutedCategories: parsed.mutedCategories ?? fallback.mutedCategories,
    }
  } catch {
    return fallback
  }
}

function allowsPushNotification(notification: AppNotification): boolean {
  if (!isNotificationSupported()) return false

  const settings = getNotificationSettingsForUser(notification.userId)
  if (!settings) return true

  const channelPref = settings.channelPreferences?.push
  if (!channelPref?.enabled) return false

  const priority = notification.priority ?? DEFAULT_PRIORITY
  if (PRIORITY_WEIGHT[priority] < PRIORITY_WEIGHT[channelPref.priorityThreshold]) {
    return false
  }

  const category = notification.category ?? DEFAULT_CATEGORY
  if (channelPref.categories.length > 0 && !channelPref.categories.includes(category)) {
    return false
  }

  if (settings.mutedCategories?.includes(category)) {
    return false
  }

  const typePref = settings.typePreferences?.[notification.type]
  if (typePref) {
    if (!typePref.enabled) return false
    if (typePref.priority && PRIORITY_WEIGHT[priority] < PRIORITY_WEIGHT[typePref.priority]) return false
    if (typePref.channels.length > 0 && !typePref.channels.includes("push")) return false
    if (typePref.muteUntil && new Date(typePref.muteUntil).getTime() > Date.now()) return false
  }

  return true
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null

  try {
    const existing = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL)
    if (existing) return existing
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" })
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied"

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    if (Notification.permission === "granted") {
      await registerServiceWorker()
    }
    return Notification.permission
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PERMISSION_REQUESTED_KEY, "true")
  }

  const permission = await Notification.requestPermission()
  if (permission === "granted") {
    await registerServiceWorker()
  }

  return permission
}

export function hasRequestedPermission(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(PERMISSION_REQUESTED_KEY) === "true"
}

function buildNotificationUrl(notification: AppNotification): string {
  if (notification.type === "message") {
    return "/notifications"
  }

  // Handle mention notifications with thread deep links
  if (notification.type === "mention" && notification.metadata) {
    const threadType = notification.metadata.threadType as string | undefined
    const groupSlug = notification.metadata.groupSlug as string | undefined
    const threadId = notification.targetId
    const commentId = notification.metadata.commentId as string | undefined
    const postId = notification.metadata.postId as string | undefined

    if (threadType === "group_topic" && groupSlug && threadId) {
      return `/groups/${groupSlug}/topics/${threadId}`
    }

    if (threadType === "comment" && postId) {
      return `/blog/${postId}${commentId ? `#comment-${commentId}` : ""}`
    }
  }

  if (notification.targetType === "post" && notification.targetId) {
    return `/blog/${notification.targetId}`
  }

  if (notification.targetType === "user" && notification.actorId) {
    return `/user/${notification.actorId}`
  }

  if (notification.targetType === "wiki" && notification.targetId) {
    return `/wiki/${notification.targetId}`
  }

  return "/notifications"
}

export function getNotificationTitle(notification: AppNotification): string {
  switch (notification.type) {
    case "follow":
      return "New Follower"
    case "like":
      return "New Like"
    case "comment":
      return "New Comment"
    case "mention":
      return "You Were Mentioned"
    case "post":
      return "New Post"
    case "friend_request":
      return "Friend Request"
    case "friend_request_accepted":
      return "Friend Request Accepted"
    case "friend_request_declined":
      return "Friend Request Declined"
    case "friend_request_cancelled":
      return "Friend Request Cancelled"
    case "message":
      return "New Message"
    default:
      return "New Activity"
  }
}

export async function maybeTriggerPushNotification(notification: AppNotification): Promise<boolean> {
  if (!isNotificationSupported()) return false
  if (notification.channels && !notification.channels.includes("push")) return false
  if (!allowsPushNotification(notification)) return false
  if (Notification.permission !== "granted") return false

  const settings = getNotificationSettingsForUser(notification.userId)
  const title = getNotificationTitle(notification)
  // Mask preview content if user disabled previews
  const previewAllowed = settings?.previewContent !== false
  const maskedBody = previewAllowed ? notification.message : title

  const options: NotificationOptions = {
    body: maskedBody,
    tag: notification.id,
    data: {
      url: buildNotificationUrl(notification),
      notificationId: notification.id,
      // Stub: enforcement hint for native layers to hide on lock screen
      lockScreenPolicy: settings?.showOnLockScreen === false ? "hide" : "show",
    },
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    renotify: false,
    // Stub: silence sounds if previews are hidden on lock screen or quiet hours in effect (extend later)
    silent: settings?.showOnLockScreen === false,
  }

  try {
    const registration = await registerServiceWorker()
    if (registration?.showNotification) {
      await registration.showNotification(title, options)
      return true
    }

    new Notification(title, options)
    return true
  } catch {
    return false
  }
}

export function supportsPushNotifications(): boolean {
  return isNotificationSupported() && isServiceWorkerSupported()
}
