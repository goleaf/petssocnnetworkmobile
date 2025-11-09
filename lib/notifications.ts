import type {
  Notification,
  NotificationCategory,
  NotificationChannel,
  NotificationChannelPreferences,
  NotificationDeliveryStatus,
  NotificationDigestPreferences,
  NotificationHistoryEntry,
  NotificationPriority,
  NotificationSettings,
  NotificationType,
  NotificationTypePreference,
} from "./types"
import {
  NOTIFICATION_CREATED_EVENT,
  NOTIFICATIONS_UPDATED_EVENT,
  maybeTriggerPushNotification,
} from "./push-notifications"

const STORAGE_KEY = "pet_social_notifications"
const HISTORY_STORAGE_KEY = "pet_social_notifications_history"
const DIGEST_QUEUE_STORAGE_KEY = "pet_social_notification_digest_queue"
const MAX_NOTIFICATIONS = 100
const MAX_HISTORY_ENTRIES = 500

const DEFAULT_PRIORITY: NotificationPriority = "normal"
const DEFAULT_CATEGORY: NotificationCategory = "social"
const DEFAULT_CHANNELS: NotificationChannel[] = ["in_app"]

const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
}

const DEFAULT_CHANNEL_PREFERENCES: Record<NotificationChannel, NotificationChannelPreferences> = {
  in_app: {
    enabled: true,
    frequency: "real-time",
    categories: ["social", "community", "system", "promotions", "reminders"],
    priorityThreshold: "low",
  },
  email: {
    enabled: true,
    frequency: "daily",
    categories: ["social", "community", "reminders"],
    priorityThreshold: "normal",
  },
  push: {
    enabled: true,
    frequency: "real-time",
    categories: ["social", "community", "system"],
    priorityThreshold: "normal",
  },
  digest: {
    enabled: true,
    frequency: "daily",
    categories: ["social", "community", "promotions", "reminders"],
    priorityThreshold: "low",
  },
  sms: {
    enabled: false,
    frequency: "real-time",
    categories: ["system"],
    priorityThreshold: "urgent",
  },
}

const DEFAULT_TYPE_PREFERENCES: Partial<Record<NotificationType, NotificationTypePreference>> = {
  follow: { enabled: true, channels: ["in_app", "push"] },
  like: { enabled: true, channels: ["in_app", "push"] },
  comment: { enabled: true, channels: ["in_app", "push", "email"] },
  mention: { enabled: true, channels: ["in_app", "push", "email"] },
  post: { enabled: true, channels: ["in_app", "digest", "email"] },
  friend_request: { enabled: true, channels: ["in_app", "push", "email"] },
  friend_request_accepted: { enabled: true, channels: ["in_app", "email"] },
  friend_request_declined: { enabled: true, channels: ["in_app"] },
  friend_request_cancelled: { enabled: true, channels: ["in_app"] },
  message: { enabled: true, channels: ["in_app", "push"] },
  watch_update: { enabled: true, channels: ["in_app", "push", "email"] },
}

const DEFAULT_DIGEST_PREFERENCES: NotificationDigestPreferences = {
  enabled: true,
  interval: "daily",
  timeOfDay: "08:00",
  dayOfWeek: "monday",
  categories: ["social", "community", "promotions", "reminders"],
  includeUnreadOnly: true,
}

const DEFAULT_MUTED_CATEGORIES: NotificationCategory[] = []

const nowIso = () => new Date().toISOString()

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function cloneChannelPreferences(
  prefs: Partial<Record<NotificationChannel, NotificationChannelPreferences>>,
): Partial<Record<NotificationChannel, NotificationChannelPreferences>> {
  const result: Partial<Record<NotificationChannel, NotificationChannelPreferences>> = {}
  for (const channel of Object.keys(prefs) as NotificationChannel[]) {
    const pref = prefs[channel]
    if (pref) {
      result[channel] = {
        ...pref,
        categories: [...pref.categories],
      }
    }
  }
  return result
}

function cloneTypePreferences(
  prefs: Partial<Record<NotificationType, NotificationTypePreference>>,
): Partial<Record<NotificationType, NotificationTypePreference>> {
  const result: Partial<Record<NotificationType, NotificationTypePreference>> = {}
  for (const type of Object.keys(prefs) as NotificationType[]) {
    const pref = prefs[type]
    if (pref) {
      result[type] = {
        ...pref,
        channels: [...pref.channels],
      }
    }
  }
  return result
}

function mergeChannelPreferences(
  defaults: Partial<Record<NotificationChannel, NotificationChannelPreferences>>,
  overrides?: Partial<Record<NotificationChannel, NotificationChannelPreferences>>,
): Partial<Record<NotificationChannel, NotificationChannelPreferences>> {
  const base = cloneChannelPreferences(defaults)
  if (!overrides) return base

  for (const channel of Object.keys(overrides) as NotificationChannel[]) {
    const override = overrides[channel]
    if (!override) continue
    const current = base[channel] ?? {
      enabled: true,
      frequency: "real-time",
      categories: [],
      priorityThreshold: DEFAULT_PRIORITY,
    }
    base[channel] = {
      ...current,
      ...override,
      categories: override.categories && override.categories.length > 0 ? [...override.categories] : [...current.categories],
    }
  }

  return base
}

function mergeTypePreferences(
  defaults: Partial<Record<NotificationType, NotificationTypePreference>>,
  overrides?: Partial<Record<NotificationType, NotificationTypePreference>>,
): Partial<Record<NotificationType, NotificationTypePreference>> {
  const base = cloneTypePreferences(defaults)
  if (!overrides) return base

  for (const type of Object.keys(overrides) as NotificationType[]) {
    const override = overrides[type]
    if (!override) continue
    const current = base[type] ?? { enabled: true, channels: ["in_app"] }
    base[type] = {
      ...current,
      ...override,
      channels: override.channels && override.channels.length > 0 ? [...override.channels] : [...current.channels],
    }
  }

  return base
}

function mergeSettings(defaults: NotificationSettings, overrides: Partial<NotificationSettings>): NotificationSettings {
  return {
    ...defaults,
    ...overrides,
    channelPreferences: mergeChannelPreferences(defaults.channelPreferences, overrides.channelPreferences),
    typePreferences: mergeTypePreferences(defaults.typePreferences, overrides.typePreferences),
    digestSchedule: overrides.digestSchedule
      ? {
          ...defaults.digestSchedule,
          ...overrides.digestSchedule,
          categories:
            overrides.digestSchedule.categories && overrides.digestSchedule.categories.length > 0
              ? [...overrides.digestSchedule.categories]
              : [...defaults.digestSchedule.categories],
        }
      : { ...defaults.digestSchedule, categories: [...defaults.digestSchedule.categories] },
    quietHours: overrides.quietHours ? { ...overrides.quietHours } : defaults.quietHours,
    mutedCategories: overrides.mutedCategories ? [...overrides.mutedCategories] : [...(defaults.mutedCategories ?? [])],
    updatedAt: overrides.updatedAt ?? defaults.updatedAt,
  }
}

export function createDefaultNotificationSettings(userId: string): NotificationSettings {
  return {
    userId,
    channelPreferences: mergeChannelPreferences(DEFAULT_CHANNEL_PREFERENCES, undefined) as Record<
      NotificationChannel,
      NotificationChannelPreferences
    >,
    typePreferences: mergeTypePreferences(DEFAULT_TYPE_PREFERENCES, undefined),
    digestSchedule: {
      ...DEFAULT_DIGEST_PREFERENCES,
      categories: [...DEFAULT_DIGEST_PREFERENCES.categories],
    },
    mutedCategories: [...DEFAULT_MUTED_CATEGORIES],
    previewContent: true,
    showOnLockScreen: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      days: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
      allowCritical: true,
    },
    updatedAt: nowIso(),
  }
}

export function getNotificationSettings(userId: string): NotificationSettings {
  const defaults = createDefaultNotificationSettings(userId)
  if (typeof window === "undefined" || !userId) {
    return defaults
  }

  const raw = window.localStorage.getItem(`notification_settings_${userId}`)
  if (!raw) return defaults

  try {
    const parsed = JSON.parse(raw) as NotificationSettings
    return mergeSettings(defaults, parsed)
  } catch {
    return defaults
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === "undefined") return

  const normalized: NotificationSettings = {
    ...settings,
    channelPreferences: mergeChannelPreferences(DEFAULT_CHANNEL_PREFERENCES, settings.channelPreferences) as Record<
      NotificationChannel,
      NotificationChannelPreferences
    >,
    typePreferences: mergeTypePreferences(DEFAULT_TYPE_PREFERENCES, settings.typePreferences),
    digestSchedule: {
      ...DEFAULT_DIGEST_PREFERENCES,
      ...settings.digestSchedule,
      categories:
        settings.digestSchedule.categories && settings.digestSchedule.categories.length > 0
          ? [...settings.digestSchedule.categories]
          : [...DEFAULT_DIGEST_PREFERENCES.categories],
    },
    mutedCategories: settings.mutedCategories ? [...settings.mutedCategories] : [],
    quietHours: settings.quietHours ? { ...settings.quietHours } : undefined,
    updatedAt: nowIso(),
  }

  window.localStorage.setItem(`notification_settings_${settings.userId}`, JSON.stringify(normalized))
  dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId: settings.userId, reason: "notification_settings" })
}

function dispatchNotificationEvent(eventName: string, detail: Record<string, unknown>) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return []
  return safeParse<Notification[]>(localStorage.getItem(STORAGE_KEY), [])
}

export function getNotificationsByUserId(userId: string): Notification[] {
  return getNotifications()
    .filter((n) => n.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime(),
    )
}

export function getUnreadCount(userId: string): number {
  return getNotifications().filter((n) => n.userId === userId && !n.read).length
}

function isChannelAllowed(
  channel: NotificationChannel,
  notification: Notification,
  settings: NotificationSettings,
): boolean {
  const channelPref = settings.channelPreferences?.[channel]
  if (!channelPref || !channelPref.enabled) return false

  const priority = notification.priority ?? DEFAULT_PRIORITY
  if (PRIORITY_WEIGHT[priority] < PRIORITY_WEIGHT[channelPref.priorityThreshold]) return false

  const category = notification.category ?? DEFAULT_CATEGORY
  if (settings.mutedCategories?.includes(category)) return false
  if (channelPref.categories.length > 0 && !channelPref.categories.includes(category)) return false

  if (channel === "digest" && !settings.digestSchedule.enabled) {
    return false
  }

  const typePref = settings.typePreferences?.[notification.type]
  if (typePref) {
    if (!typePref.enabled) return false
    if (typePref.priority && PRIORITY_WEIGHT[priority] < PRIORITY_WEIGHT[typePref.priority]) return false
    if (typePref.channels.length > 0 && !typePref.channels.includes(channel)) return false
    if (typePref.muteUntil && new Date(typePref.muteUntil).getTime() > Date.now()) return false
  }

  return true
}

function resolveNotificationChannels(notification: Notification, settings: NotificationSettings): NotificationChannel[] {
  const preferred = notification.channels && notification.channels.length > 0 ? notification.channels : DEFAULT_CHANNELS
  const unique = Array.from(new Set(preferred))
  const allowed = unique.filter((channel) => isChannelAllowed(channel, notification, settings))

  if (allowed.length === 0) {
    const fallback: NotificationChannel = "in_app"
    if (isChannelAllowed(fallback, notification, settings)) {
      allowed.push(fallback)
    } else if (unique.length > 0) {
      allowed.push(unique[0]!)
    } else {
      allowed.push(fallback)
    }
  }

  return allowed
}

function determineDigestTimestamp(settings: NotificationSettings): string | undefined {
  const schedule = settings.digestSchedule
  if (!schedule?.enabled) return undefined

  const [hourStr = "8", minuteStr = "0"] = schedule.timeOfDay.split(":")
  const hour = Number.parseInt(hourStr, 10)
  const minute = Number.parseInt(minuteStr, 10)

  const now = new Date()
  const scheduled = new Date(now)
  scheduled.setSeconds(0, 0)
  scheduled.setHours(Number.isNaN(hour) ? 8 : hour, Number.isNaN(minute) ? 0 : minute, 0, 0)

  if (schedule.interval === "daily") {
    if (scheduled.getTime() <= now.getTime()) {
      scheduled.setDate(scheduled.getDate() + 1)
    }
  } else {
    if (scheduled.getTime() <= now.getTime()) {
      scheduled.setDate(scheduled.getDate() + 7)
    }
  }

  return scheduled.toISOString()
}

function normalizeNotification(notification: Notification, settings: NotificationSettings): Notification {
  const id = notification.id ?? `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const createdAt = notification.createdAt ?? nowIso()
  const priority = notification.priority ?? DEFAULT_PRIORITY
  const category = notification.category ?? DEFAULT_CATEGORY
  const channels = resolveNotificationChannels(notification, settings)
  const digestScheduledFor =
    channels.includes("digest") && settings.digestSchedule.enabled
      ? notification.digestScheduledFor ?? determineDigestTimestamp(settings)
      : notification.digestScheduledFor

  const deliveries = channels.map<NotificationDeliveryStatus>((channel) => {
    const existing = notification.deliveries?.find((delivery) => delivery.channel === channel)
    if (existing) {
      return {
        ...existing,
        lastUpdatedAt: existing.lastUpdatedAt ?? createdAt,
      }
    }

    const status: NotificationDeliveryStatus["status"] =
      channel === "in_app" ? "delivered" : channel === "digest" ? "scheduled" : "pending"

    return {
      channel,
      status,
      lastUpdatedAt: createdAt,
      ...(channel === "digest" && digestScheduledFor ? { scheduledFor: digestScheduledFor } : {}),
    }
  })

  return {
    ...notification,
    id,
    priority,
    category,
    channels,
    deliveries,
    createdAt,
    updatedAt: notification.updatedAt ?? createdAt,
    digestScheduledFor,
  }
}

function saveNotifications(notifications: Notification[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)))
}

function formatActorNames(names: string[], totalCount: number): string {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)))

  if (uniqueNames.length === 0) {
    return totalCount > 1 ? `${totalCount} users` : "Someone"
  }

  if (uniqueNames.length === 1) {
    const [name] = uniqueNames
    return totalCount > 1 ? `${name} and ${totalCount - 1} others` : name
  }

  if (uniqueNames.length === 2) {
    const [first, second] = uniqueNames
    return totalCount > 2 ? `${first}, ${second}, and ${totalCount - 2} others` : `${first} and ${second}`
  }

  const [first, second, third] = uniqueNames
  return totalCount > 3 ? `${first}, ${second}, and ${totalCount - 2} others` : `${first}, ${second}, and ${third}`
}

function buildBatchMessage(
  existing: Notification,
  incoming: Notification,
  batchCount: number,
  actorNames: string[],
): string {
  const actorsText = formatActorNames(actorNames, batchCount)
  const targetTitle =
    (incoming.metadata?.targetTitle as string | undefined) ??
    (existing.metadata?.targetTitle as string | undefined)
  const targetLabel =
    (incoming.metadata?.targetTypeLabel as string | undefined) ??
    (existing.metadata?.targetTypeLabel as string | undefined) ??
    existing.targetType

  switch (existing.type) {
    case "like":
      return `${actorsText} liked your ${targetLabel}${targetTitle ? `: "${targetTitle}"` : ""}`
    case "comment":
      return `${actorsText} commented on your ${targetLabel}${targetTitle ? `: "${targetTitle}"` : ""}`
    case "mention":
      return `${actorsText} mentioned you in a ${targetLabel}${targetTitle ? `: "${targetTitle}"` : ""}`
    case "follow":
      return `${actorsText} started following you`
    default:
      return `${actorsText} triggered ${batchCount} ${existing.type.replace(/_/g, " ")} updates`
  }
}

function mergeBatchedNotifications(existing: Notification, incoming: Notification): Notification {
  const batchCount = (existing.batchCount ?? 1) + 1

  const namesFromExisting = Array.isArray(existing.metadata?.actorNames)
    ? (existing.metadata?.actorNames as string[])
    : []
  const names: string[] = [
    ...namesFromExisting,
    (existing.metadata?.actorName as string | undefined) ?? "",
    (incoming.metadata?.actorName as string | undefined) ?? "",
  ].filter(Boolean)

  const uniqueActorNames = Array.from(new Set(names)).slice(0, 3)

  const deliveries = (existing.deliveries ?? []).map((delivery) => {
    if (delivery.channel === "in_app") {
      return {
        ...delivery,
        status: "delivered",
        lastUpdatedAt: nowIso(),
      }
    }

    if (delivery.channel === "digest") {
      return delivery
    }

    return {
      ...delivery,
      status: "pending",
      lastUpdatedAt: nowIso(),
    }
  })

  recordHistoryEvent({
    notificationId: existing.id,
    userId: existing.userId,
    type: "batched",
    channel: "in_app",
    detail: {
      previousCount: existing.batchCount ?? 1,
      mergedWith: incoming.id,
    },
  })

  return {
    ...existing,
    message: buildBatchMessage(existing, incoming, batchCount, uniqueActorNames),
    batchCount,
    read: false,
    updatedAt: nowIso(),
    deliveries,
    metadata: {
      ...existing.metadata,
      ...incoming.metadata,
      actorNames: uniqueActorNames,
      latestActorName: incoming.metadata?.actorName,
    },
  }
}

function insertNotificationWithBatching(existing: Notification[], incoming: Notification): Notification[] {
  if (incoming.batchKey) {
    const index = existing.findIndex(
      (n) => n.userId === incoming.userId && n.batchKey === incoming.batchKey && !n.read,
    )

    if (index !== -1) {
      const merged = mergeBatchedNotifications(existing[index]!, incoming)
      const remaining = [...existing]
      remaining.splice(index, 1)
      return [merged, ...remaining].slice(0, MAX_NOTIFICATIONS)
    }
  }

  return [incoming, ...existing].slice(0, MAX_NOTIFICATIONS)
}

type DigestQueueItem = {
  userId: string
  scheduledFor: string
  notificationIds: string[]
  interval: NotificationDigestPreferences["interval"]
  createdAt: string
}

function enqueueDigest(notification: Notification, schedule: NotificationDigestPreferences) {
  if (typeof window === "undefined") return
  if (!notification.digestScheduledFor) return

  const queue = safeParse<DigestQueueItem[]>(localStorage.getItem(DIGEST_QUEUE_STORAGE_KEY), [])
  const existing = queue.find(
    (item) => item.userId === notification.userId && item.scheduledFor === notification.digestScheduledFor,
  )

  if (existing) {
    if (!existing.notificationIds.includes(notification.id)) {
      existing.notificationIds.push(notification.id)
    }
  } else {
    queue.push({
      userId: notification.userId,
      scheduledFor: notification.digestScheduledFor,
      notificationIds: [notification.id],
      interval: schedule.interval,
      createdAt: nowIso(),
    })
  }

  localStorage.setItem(DIGEST_QUEUE_STORAGE_KEY, JSON.stringify(queue))

  recordHistoryEvent({
    notificationId: notification.id,
    userId: notification.userId,
    type: "digest_scheduled",
    channel: "digest",
    detail: { scheduledFor: notification.digestScheduledFor },
  })
}

function recordHistoryEvent(event: Omit<NotificationHistoryEntry, "id" | "timestamp">) {
  if (typeof window === "undefined") return
  const history = safeParse<NotificationHistoryEntry[]>(localStorage.getItem(HISTORY_STORAGE_KEY), [])
  const entry: NotificationHistoryEntry = {
    ...event,
    id: `history_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    timestamp: nowIso(),
  }
  history.unshift(entry)

  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES
  }

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
}

export function getNotificationHistoryByUserId(userId: string, limit = 50): NotificationHistoryEntry[] {
  if (typeof window === "undefined") return []
  const history = safeParse<NotificationHistoryEntry[]>(localStorage.getItem(HISTORY_STORAGE_KEY), [])
  return history.filter((entry) => entry.userId === userId).slice(0, limit)
}

export function updateNotificationDeliveryStatus(
  notificationId: string,
  channel: NotificationChannel,
  status: NotificationDeliveryStatus["status"],
  detail?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return

  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notificationId)
  if (index === -1) return

  const updatedDeliveries = (notifications[index]!.deliveries ?? []).map((delivery) =>
    delivery.channel === channel
      ? {
          ...delivery,
          status,
          lastUpdatedAt: nowIso(),
          ...(detail?.scheduledFor ? { scheduledFor: String(detail.scheduledFor) } : {}),
          ...(detail?.errorMessage ? { errorMessage: String(detail.errorMessage) } : {}),
        }
      : delivery,
  )

  const updatedNotification: Notification = {
    ...notifications[index]!,
    deliveries: updatedDeliveries,
    updatedAt: nowIso(),
  }

  const next = [...notifications]
  next[index] = updatedNotification
  saveNotifications(next)

  const eventType: NotificationHistoryEntry["type"] =
    status === "delivered" ? "delivered" : status === "scheduled" ? "digest_scheduled" : "action"

  recordHistoryEvent({
    notificationId,
    userId: updatedNotification.userId,
    type: eventType,
    channel,
    detail,
  })

  dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId: updatedNotification.userId })
}

export function performNotificationAction(
  notificationId: string,
  userId: string,
  actionId: string,
  metadata?: Record<string, unknown>,
): Notification | null {
  if (typeof window === "undefined") return null

  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notificationId && n.userId === userId)
  if (index === -1) return null

  const current = notifications[index]!
  const updated: Notification = {
    ...current,
    metadata: {
      ...current.metadata,
      lastActionTaken: actionId,
      lastActionAt: nowIso(),
      lastActionMetadata: metadata,
    },
    updatedAt: nowIso(),
  }

  const next = [...notifications]
  next[index] = updated
  saveNotifications(next)

  recordHistoryEvent({
    notificationId,
    userId,
    type: "action",
    detail: { actionId, metadata },
  })

  dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId })
  return updated
}

export function addNotification(notification: Notification) {
  if (typeof window === "undefined") return
  const settings = getNotificationSettings(notification.userId)
  const normalized = normalizeNotification(notification, settings)
  const notifications = getNotifications()
  const updatedList = insertNotificationWithBatching(notifications, normalized)

  saveNotifications(updatedList)

  dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId: normalized.userId })
  dispatchNotificationEvent(NOTIFICATION_CREATED_EVENT, { userId: normalized.userId, notification: normalized })

  recordHistoryEvent({
    notificationId: normalized.id,
    userId: normalized.userId,
    type: "created",
    channel: "in_app",
    detail: { channels: normalized.channels },
  })

  if (normalized.channels?.includes("digest") && normalized.digestScheduledFor) {
    enqueueDigest(normalized, settings.digestSchedule)
  }

  if (normalized.channels?.includes("push")) {
    void maybeTriggerPushNotification(normalized).then((delivered) => {
      updateNotificationDeliveryStatus(
        normalized.id,
        "push",
        delivered ? "delivered" : "failed",
        delivered ? undefined : { errorMessage: "Push delivery failed or permission denied" },
      )
    })
  }
}

/**
 * Create a notification from partial notification data
 * This is a convenience wrapper around addNotification that accepts partial Notification objects
 */
export function createNotification(partial: Partial<Notification> & { userId: string; type: NotificationType; message: string }) {
  const notification: Notification = {
    id: partial.id ?? `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    userId: partial.userId,
    type: partial.type,
    actorId: partial.actorId,
    targetId: partial.targetId,
    targetType: partial.targetType ?? "post",
    message: partial.message,
    read: partial.read ?? false,
    createdAt: partial.createdAt ?? nowIso(),
    priority: partial.priority,
    category: partial.category,
    channels: partial.channels,
    batchKey: partial.batchKey,
    metadata: partial.metadata,
    actions: partial.actions,
    deliveries: partial.deliveries,
    updatedAt: partial.updatedAt,
    digestScheduledFor: partial.digestScheduledFor,
  }
  addNotification(notification)
}

export function markAsRead(notificationId: string) {
  if (typeof window === "undefined") return
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notificationId)

  if (index !== -1) {
    const notification = notifications[index]!
    if (notification.read) return

    const updatedDeliveries = (notification.deliveries ?? []).map((delivery) =>
      delivery.channel === "in_app"
        ? {
            ...delivery,
            status: "delivered",
            lastUpdatedAt: nowIso(),
          }
        : delivery,
    )

    const updated: Notification = {
      ...notification,
      read: true,
      deliveries: updatedDeliveries,
      updatedAt: nowIso(),
    }

    const next = [...notifications]
    next[index] = updated
    saveNotifications(next)

    recordHistoryEvent({
      notificationId: updated.id,
      userId: updated.userId,
      type: "read",
    })

    dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId: updated.userId })
  }
}

export function markAllAsRead(userId: string) {
  if (typeof window === "undefined") return
  const notifications = getNotifications()
  let changed = false

  const updated = notifications.map((notification) => {
    if (notification.userId !== userId || notification.read) {
      return notification
    }

    changed = true
    recordHistoryEvent({
      notificationId: notification.id,
      userId,
      type: "read",
    })

    return {
      ...notification,
      read: true,
      updatedAt: nowIso(),
      deliveries: (notification.deliveries ?? []).map((delivery) =>
        delivery.channel === "in_app"
          ? { ...delivery, status: "delivered", lastUpdatedAt: nowIso() }
          : delivery,
      ),
    }
  })

  if (!changed) return

  saveNotifications(updated)
  dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId })
}

export function deleteNotification(notificationId: string) {
  if (typeof window === "undefined") return
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === notificationId)
  if (index === -1) return

  const [removed] = notifications.splice(index, 1)
  saveNotifications(notifications)

  recordHistoryEvent({
    notificationId: removed.id,
    userId: removed.userId,
    type: "deleted",
  })

  dispatchNotificationEvent(NOTIFICATIONS_UPDATED_EVENT, { userId: removed.userId })
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
    createdAt: nowIso(),
    priority: "normal",
    category: "social",
    channels: ["in_app", "push", "email"],
    metadata: {
      actorName: followerName,
      targetTypeLabel: "profile",
    },
    actions: [
      {
        id: "view-profile",
        label: "View profile",
        action: "view",
        targetUrl: `/user/${followerId}`,
      },
    ],
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
    createdAt: nowIso(),
    priority: "normal",
    category: "social",
    channels: ["in_app", "push"],
    batchKey: `${targetType}_${targetId}_likes`,
    metadata: {
      actorName: likerName,
      targetTitle,
      targetTypeLabel: targetType === "post" ? "post" : "wiki article",
      actorId: likerId,
    },
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
    createdAt: nowIso(),
    priority: "high",
    category: "social",
    channels: ["in_app", "push", "email"],
    batchKey: `post_${postId}_comments`,
    metadata: {
      actorName: commenterName,
      targetTitle: postTitle,
      targetTypeLabel: "post",
      actorId: commenterId,
    },
    actions: [
      {
        id: "view-post",
        label: "View discussion",
        action: "view",
        targetUrl: `/blog/${postId}`,
      },
    ],
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
    createdAt: nowIso(),
    priority: "normal",
    category: "community",
    channels: ["in_app", "digest", "email"],
    metadata: {
      targetTitle: postTitle,
      targetTypeLabel: "post",
      actorName: authorName,
      actorId: authorId,
    },
    actions: [
      {
        id: "read-post",
        label: "Read now",
        action: "view",
        targetUrl: `/blog/${postId}`,
      },
    ],
  }
  addNotification(notification)
}

export function createFriendRequestNotification(params: {
  senderPetId: string
  senderPetName: string
  receiverPetId: string
  receiverPetName: string
  receiverOwnerId: string
}) {
  const { senderPetId, senderPetName, receiverPetId, receiverPetName, receiverOwnerId } = params
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: receiverOwnerId,
    type: "friend_request",
    actorId: senderPetId,
    targetId: receiverPetId,
    targetType: "pet",
    message: `${senderPetName} wants to be friends with ${receiverPetName}`,
    read: false,
    createdAt: nowIso(),
    priority: "high",
    category: "social",
    channels: ["in_app", "push", "email"],
    metadata: {
      actorName: senderPetName,
      targetName: receiverPetName,
      actorId: senderPetId,
    },
    actions: [
      {
        id: "view-profile",
        label: "View pet",
        action: "view",
        targetUrl: `/pet/${senderPetId}`,
      },
      {
        id: "accept-request",
        label: "Accept",
        action: "accept",
      },
      {
        id: "decline-request",
        label: "Decline",
        action: "decline",
        requiresConfirmation: true,
      },
    ],
  }
  addNotification(notification)
}

export function createFriendRequestAcceptedNotification(params: {
  senderPetId: string
  senderPetName: string
  receiverPetId: string
  receiverPetName: string
  senderOwnerId: string
}) {
  const { senderPetId, senderPetName, receiverPetId, receiverPetName, senderOwnerId } = params
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: senderOwnerId,
    type: "friend_request_accepted",
    actorId: receiverPetId,
    targetId: receiverPetId,
    targetType: "pet",
    message: `${receiverPetName} accepted your friend request for ${senderPetName}`,
    read: false,
    createdAt: nowIso(),
    priority: "normal",
    category: "social",
    channels: ["in_app", "email"],
    metadata: {
      actorName: receiverPetName,
      targetName: senderPetName,
      actorId: receiverPetId,
    },
    actions: [
      {
        id: "send-message",
        label: "Send message",
        action: "view",
        targetUrl: `/pet/${receiverPetId}`,
      },
    ],
  }
  addNotification(notification)
}

export function createFriendRequestDeclinedNotification(params: {
  senderPetId: string
  senderPetName: string
  receiverPetId: string
  receiverPetName: string
  senderOwnerId: string
}) {
  const { senderPetId, senderPetName, receiverPetId, receiverPetName, senderOwnerId } = params
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: senderOwnerId,
    type: "friend_request_declined",
    actorId: receiverPetId,
    targetId: receiverPetId,
    targetType: "pet",
    message: `${receiverPetName} declined your friend request for ${senderPetName}`,
    read: false,
    createdAt: nowIso(),
    priority: "normal",
    category: "social",
    channels: ["in_app"],
    metadata: {
      actorName: receiverPetName,
      targetName: senderPetName,
      actorId: receiverPetId,
    },
  }
  addNotification(notification)
}

export function createFriendRequestCancelledNotification(params: {
  senderPetId: string
  senderPetName: string
  receiverPetId: string
  receiverPetName: string
  receiverOwnerId: string
}) {
  const { senderPetId, senderPetName, receiverPetId, receiverPetName, receiverOwnerId } = params
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: receiverOwnerId,
    type: "friend_request_cancelled",
    actorId: senderPetId,
    targetId: receiverPetId,
    targetType: "pet",
    message: `${senderPetName} cancelled the friend request to ${receiverPetName}`,
    read: false,
    createdAt: nowIso(),
    priority: "normal",
    category: "social",
    channels: ["in_app"],
    metadata: {
      actorName: senderPetName,
      targetName: receiverPetName,
      actorId: senderPetId,
    },
  }
  addNotification(notification)
}

export function createMentionNotification(params: {
  mentionerId: string
  mentionerName: string
  mentionedUserId: string
  threadId: string
  threadType: "comment" | "group_topic"
  threadTitle?: string
  groupSlug?: string
  commentId?: string
  postId?: string
}) {
  const {
    mentionerId,
    mentionerName,
    mentionedUserId,
    threadId,
    threadType,
    threadTitle,
    groupSlug,
    commentId,
    postId,
  } = params

  // Determine deep link URL based on thread type
  let targetUrl: string
  if (threadType === "group_topic" && groupSlug) {
    targetUrl = `/groups/${groupSlug}/topics/${threadId}`
  } else if (threadType === "comment" && postId) {
    targetUrl = `/blog/${postId}${commentId ? `#comment-${commentId}` : ""}`
  } else {
    targetUrl = "/notifications"
  }

  const targetTypeLabel = threadType === "group_topic" ? "thread" : "comment"
  const batchKey = `mention_${threadType}_${threadId}_${mentionedUserId}`

  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    userId: mentionedUserId,
    type: "mention",
    actorId: mentionerId,
    targetId: threadId,
    targetType: threadType === "group_topic" ? "post" : "post", // Using "post" as generic target type
    message: threadTitle
      ? `${mentionerName} mentioned you in a ${targetTypeLabel}: "${threadTitle}"`
      : `${mentionerName} mentioned you in a ${targetTypeLabel}`,
    read: false,
    createdAt: nowIso(),
    priority: "high",
    category: "social",
    channels: ["in_app", "push", "email"],
    batchKey, // Used to prevent duplicate notifications for same thread mention
    metadata: {
      actorName: mentionerName,
      targetTitle: threadTitle,
      targetTypeLabel,
      actorId: mentionerId,
      threadType,
      groupSlug,
      commentId,
      postId,
    },
    actions: [
      {
        id: "view-thread",
        label: "View thread",
        action: "view",
        targetUrl,
      },
    ],
  }

  addNotification(notification)
}

export function generateFakeNotificationsForUser(userId: string) {
  if (typeof window === "undefined") return

  // Remove existing notifications for the user but preserve others
  const preservedNotifications = getNotifications().filter((notification) => notification.userId !== userId)
  saveNotifications(preservedNotifications)

  // Reset notification settings to ensure full feature coverage
  saveNotificationSettings(createDefaultNotificationSettings(userId))

  const baseTime = Date.now()
  const buildTimestamp = (minutesAgo: number) => new Date(baseTime - minutesAgo * 60 * 1000).toISOString()

  const curatedNotifications: Notification[] = [
    {
      id: `notif_${baseTime}_friend_request`,
      userId,
      type: "friend_request",
      actorId: "pet_luna",
      targetId: "pet_bella",
      targetType: "pet",
      message: "Luna the Husky wants to be friends with Bella",
      read: false,
      createdAt: buildTimestamp(5),
      priority: "high",
      category: "social",
      channels: ["in_app", "push", "email"],
      metadata: {
        actorName: "Luna the Husky",
        targetName: "Bella",
        actorId: "pet_luna",
      },
      actions: [
        { id: "view-profile", label: "View pet", action: "view", targetUrl: "/pet/pet_luna" },
        { id: "accept-request", label: "Accept", action: "accept" },
        { id: "decline-request", label: "Decline", action: "decline", requiresConfirmation: true },
      ],
    },
    {
      id: `notif_${baseTime}_mention`,
      userId,
      type: "mention",
      actorId: "user_sarah",
      targetId: "post_training_tips",
      targetType: "post",
      message: "Sarah mentioned you in a training tips discussion",
      read: false,
      createdAt: buildTimestamp(22),
      priority: "high",
      category: "community",
      channels: ["in_app", "push", "email"],
      metadata: {
        actorName: "Sarah Johnson",
        targetTitle: "Winter Training Routine",
        targetTypeLabel: "post",
        actorId: "user_sarah",
      },
      actions: [
        { id: "view-mention", label: "Open discussion", action: "view", targetUrl: "/blog/post_training_tips" },
      ],
    },
    {
      id: `notif_${baseTime}_digest`,
      userId,
      type: "post",
      actorId: "system",
      targetId: "weekly_digest",
      targetType: "post",
      message: "Your weekly activity digest is scheduled for tomorrow at 8:00 AM",
      read: false,
      createdAt: buildTimestamp(180),
      priority: "low",
      category: "reminders",
      channels: ["digest", "email"],
      metadata: {
        targetTitle: "Weekly activity digest",
        targetTypeLabel: "digest",
      },
    },
    {
      id: `notif_${baseTime}_system_update`,
      userId,
      type: "post",
      actorId: "system",
      targetId: "system_notice",
      targetType: "post",
      message: "New safety guidelines are live for pet meetups in your area",
      read: false,
      createdAt: buildTimestamp(360),
      priority: "normal",
      category: "system",
      channels: ["in_app", "email"],
      metadata: {
        targetTitle: "Safety guideline update",
        targetTypeLabel: "announcement",
      },
      actions: [
        { id: "view-guidelines", label: "Read update", action: "view", targetUrl: "/wiki/safety-guidelines" },
      ],
    },
  ]

  curatedNotifications.forEach((notification) => addNotification(notification))

  // Generate additional activity to showcase batching and channel delivery
  createCommentNotification(
    "user_carlos",
    userId,
    "post_training_tips",
    "Carlos Ramirez",
    "Winter Training Routine",
  )

  createPostNotification(
    "creator_petshelter",
    userId,
    "post_adoption_drive",
    "Happy Tails Shelter",
    "Adoption Drive Highlights",
  )

  createLikeNotification("user_max", userId, "post_adoption_drive", "post", "Max the Beagle", "Adoption Drive Highlights")
  createLikeNotification("user_willow", userId, "post_adoption_drive", "post", "Willow the Corgi", "Adoption Drive Highlights")
  createLikeNotification("user_oliver", userId, "post_adoption_drive", "post", "Oliver the Cat", "Adoption Drive Highlights")
}
