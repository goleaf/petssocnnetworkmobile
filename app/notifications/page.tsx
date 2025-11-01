"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getNotificationsByUserId,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  generateFakeNotificationsForUser,
  getNotificationHistoryByUserId,
  performNotificationAction,
  getNotificationSettings,
} from "@/lib/notifications"
import type {
  Notification,
  NotificationDeliveryStatus,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationHistoryEntry,
  NotificationSettings,
  NotificationAction,
} from "@/lib/types"
import {
  Bell,
  Trash2,
  Check,
  Sparkles,
  Mail,
  Smartphone,
  CalendarClock,
  History,
  Filter,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NOTIFICATIONS_UPDATED_EVENT } from "@/lib/push-notifications"
import { cn } from "@/lib/utils"

const CHANNEL_META: Record<NotificationChannel, { label: string; icon: LucideIcon }> = {
  in_app: { label: "In-app", icon: Bell },
  email: { label: "Email", icon: Mail },
  push: { label: "Push", icon: Smartphone },
  digest: { label: "Digest", icon: CalendarClock },
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  social: "Social",
  community: "Community",
  system: "System",
  promotions: "Promotions",
  reminders: "Reminders",
}

const CATEGORY_FILTER_OPTIONS: Array<{ value: "all" | NotificationCategory; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "social", label: CATEGORY_LABELS.social },
  { value: "community", label: CATEGORY_LABELS.community },
  { value: "system", label: CATEGORY_LABELS.system },
  { value: "promotions", label: CATEGORY_LABELS.promotions },
  { value: "reminders", label: CATEGORY_LABELS.reminders },
]

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
}

const PRIORITY_FILTER_OPTIONS: Array<{ value: "all" | NotificationPriority; label: string }> = [
  { value: "all", label: "All priorities" },
  { value: "low", label: PRIORITY_LABELS.low },
  { value: "normal", label: PRIORITY_LABELS.normal },
  { value: "high", label: PRIORITY_LABELS.high },
  { value: "urgent", label: PRIORITY_LABELS.urgent },
]

const CHANNEL_FILTER_OPTIONS: Array<{ value: "all" | NotificationChannel; label: string }> = [
  { value: "all", label: "All channels" },
  { value: "in_app", label: CHANNEL_META.in_app.label },
  { value: "push", label: CHANNEL_META.push.label },
  { value: "email", label: CHANNEL_META.email.label },
  { value: "digest", label: CHANNEL_META.digest.label },
]

const PRIORITY_STYLES: Record<NotificationPriority, string> = {
  low: "bg-muted text-muted-foreground border-transparent",
  normal: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-transparent",
  high: "bg-orange-500/15 text-orange-600 border border-orange-500/30",
  urgent: "bg-red-500 text-white border border-red-500",
}

const PRIORITY_ICONS: Partial<Record<NotificationPriority, LucideIcon>> = {
  high: AlertTriangle,
  urgent: AlertTriangle,
}

const DELIVERY_STATUS_LABELS: Record<NotificationDeliveryStatus["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  delivered: "Delivered",
  failed: "Failed",
  skipped: "Skipped",
}

const DELIVERY_STATUS_CLASSES: Record<NotificationDeliveryStatus["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
  scheduled: "bg-blue-500/15 text-blue-600 border border-blue-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30",
  failed: "bg-red-500/15 text-red-600 border border-red-500/30",
  skipped: "bg-slate-500/15 text-slate-600 border border-slate-500/30",
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all")
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "all">("all")
  const [history, setHistory] = useState<NotificationHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  const loadNotifications = useCallback(() => {
    if (!user) return
    setNotifications(getNotificationsByUserId(user.id))
  }, [user])

  const loadHistory = useCallback(() => {
    if (!user) return
    setHistory(getNotificationHistoryByUserId(user.id, 60))
  }, [user])

  const loadSettings = useCallback(() => {
    if (!user) return
    setSettings(getNotificationSettings(user.id))
  }, [user])

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    loadNotifications()
    loadSettings()
    loadHistory()

    if (user.id === "1") {
      generateFakeNotificationsForUser(user.id)
      setTimeout(() => {
        loadNotifications()
        loadHistory()
      }, 200)
    }
  }, [user, router, loadNotifications, loadSettings, loadHistory])

  useEffect(() => {
    if (!user) return

    const handleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail
      if (detail?.userId && detail.userId !== user.id) return
      loadNotifications()
      if (showHistory) {
        loadHistory()
      }
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdated)
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdated)
    }
  }, [user, loadNotifications, loadHistory, showHistory])

  useEffect(() => {
    if (showHistory) {
      loadHistory()
    }
  }, [showHistory, loadHistory])

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id)
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const handleMarkAllRead = useCallback(() => {
    if (!user) return
    markAllAsRead(user.id)
    setNotifications((prev) =>
      prev.map((notification) => (notification.userId === user.id ? { ...notification, read: true } : notification)),
    )
  }, [user])

  const handleDelete = useCallback((id: string) => {
    deleteNotification(id)
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const handleGenerateFakeNotifications = useCallback(() => {
    if (!user) return
    generateFakeNotificationsForUser(user.id)
    setTimeout(() => {
      loadNotifications()
      loadHistory()
      loadSettings()
    }, 200)
  }, [user, loadNotifications, loadHistory, loadSettings])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id)
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        )
      }

      if (notification.targetType === "post") {
        router.push(`/blog/${notification.targetId}`)
      } else if (notification.targetType === "user") {
        router.push(`/user/${notification.actorId}`)
      } else if (notification.targetType === "wiki") {
        router.push(`/wiki/${notification.targetId}`)
      } else if (notification.targetType === "pet") {
        router.push(`/pet/${notification.targetId}`)
      }
    },
    [router],
  )

  const handleAction = useCallback(
    (notification: Notification, action: NotificationAction) => {
      if (!user) return
      if (action.requiresConfirmation && !window.confirm("Are you sure you want to continue?")) return

      const updated = performNotificationAction(notification.id, user.id, action.id, action.metadata)

      if (action.action === "view" && action.targetUrl) {
        router.push(action.targetUrl)
      }

      if (action.action === "accept" || action.action === "decline" || action.action === "dismiss") {
        markAsRead(notification.id)
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        )
      }

      if (updated) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
        )
      } else {
        loadNotifications()
      }

      if (showHistory) {
        loadHistory()
      }
    },
    [user, router, loadNotifications, loadHistory, showHistory],
  )

  if (!user) return null

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread" && notification.read) return false
    if (categoryFilter !== "all" && (notification.category ?? "social") !== categoryFilter) return false
    if (priorityFilter !== "all" && (notification.priority ?? "normal") !== priorityFilter) return false
    if (
      channelFilter !== "all" &&
      !(notification.channels && notification.channels.length > 0
        ? notification.channels
        : ["in_app"]
      ).includes(channelFilter)
    ) {
      return false
    }
    return true
  })

  const describeHistoryEntry = (entry: NotificationHistoryEntry) => {
    const channelLabel = entry.channel ? CHANNEL_META[entry.channel]?.label ?? entry.channel : ""
    switch (entry.type) {
      case "created":
        return "Notification created"
      case "delivered":
        return channelLabel ? `Delivered via ${channelLabel}` : "Notification delivered"
      case "read":
        return "Marked as read"
      case "deleted":
        return "Notification deleted"
      case "batched":
        return "Merged into a grouped notification"
      case "digest_scheduled":
        return entry.detail?.scheduledFor
          ? `Added to digest (${new Date(String(entry.detail.scheduledFor)).toLocaleString()})`
          : "Added to digest queue"
      case "action":
        return entry.detail?.actionId ? `Action taken: ${String(entry.detail.actionId)}` : "Action taken"
      default:
        return entry.type
    }
  }

  const channelSummaries = (["in_app", "push", "email", "digest"] as NotificationChannel[]).map((channel) => {
    const preference = settings?.channelPreferences?.[channel]
    return {
      channel,
      meta: CHANNEL_META[channel],
      enabled: preference?.enabled ?? false,
      frequency: preference?.frequency ?? "real-time",
      categories: preference?.categories ?? [],
      priorityThreshold: preference?.priorityThreshold ?? "normal",
    }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with activity across all channels</p>
        </div>

        {settings && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Delivery preferences</CardTitle>
              <CardDescription>Channel availability, frequency, and priority thresholds</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {channelSummaries.map(({ channel, meta, enabled, frequency, categories, priorityThreshold }) => (
                <div
                  key={channel}
                  className={cn(
                    "rounded-lg border p-3 flex flex-col gap-2",
                    !enabled && "opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <meta.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                    <Badge variant={enabled ? "secondary" : "outline"} className={cn(!enabled && "text-muted-foreground")}>
                      {enabled ? "On" : "Muted"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Frequency: {enabled ? frequency.replace("-", " ") : "n/a"}</p>
                    <p>Priority ≥ {PRIORITY_LABELS[priorityThreshold]}</p>
                    {enabled && categories.length > 0 && (
                      <p>Categories: {categories.map((category) => CATEGORY_LABELS[category] ?? category).join(", ")}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              All
            </Button>
            <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
              Unread ({unreadCount})
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={showHistory ? "default" : "outline"} size="sm" onClick={() => setShowHistory((prev) => !prev)}>
              <History className="h-4 w-4 mr-2" />
              {showHistory ? "Hide history" : "Show history"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleGenerateFakeNotifications}>
              <Sparkles className="h-4 w-4 mr-2" />
              Demo data
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>

          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as NotificationCategory | "all")}>
            <SelectTrigger size="sm" className="min-w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as NotificationPriority | "all")}>
            <SelectTrigger size="sm" className="min-w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as NotificationChannel | "all")}>
            <SelectTrigger size="sm" className="min-w-[140px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showHistory && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notification history</CardTitle>
            <CardDescription>Recent delivery attempts, batch updates, and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notification history recorded yet.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm">{describeHistoryEntry(entry)}</p>
                    {entry.detail?.scheduledFor && (
                      <p className="text-xs text-muted-foreground">
                        Scheduled for {new Date(String(entry.detail.scheduledFor)).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const priority = notification.priority ?? "normal"
            const category = notification.category ?? "social"
            const channels =
              notification.channels && notification.channels.length > 0
                ? notification.channels
                : (["in_app"] as NotificationChannel[])
            const deliveries = notification.deliveries ?? []
            const PriorityIcon = PRIORITY_ICONS[priority]

            return (
              <Card
                key={notification.id}
                className={cn(
                  "transition-colors",
                  !notification.read ? "border-primary/60 bg-muted/40" : "hover:bg-muted/40",
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.read && <Badge variant="secondary">Unread</Badge>}
                        <Badge className={cn("capitalize", PRIORITY_STYLES[priority])}>
                          {PriorityIcon && <PriorityIcon className="h-3 w-3" />}
                          {PRIORITY_LABELS[priority]}
                        </Badge>
                        <Badge variant="outline">{CATEGORY_LABELS[category] ?? category}</Badge>
                        {notification.batchCount && notification.batchCount > 1 && (
                          <Badge variant="outline">Batch of {notification.batchCount}</Badge>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="text-left w-full"
                      >
                        <p className="text-sm font-medium leading-6">{notification.message}</p>
                        {typeof notification.metadata?.targetTitle === "string" && (
                          <p className="text-xs text-muted-foreground">
                            {(notification.metadata?.targetTypeLabel as string | undefined) ?? "Item"}: {notification.metadata.targetTitle}
                          </p>
                        )}
                        {Array.isArray(notification.metadata?.actorNames) && notification.metadata.actorNames.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            Participants: {(notification.metadata.actorNames as string[]).join(", ")}
                          </p>
                        )}
                      </button>

                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.updatedAt ?? notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        {channels.map((channel) => {
                          const meta = CHANNEL_META[channel]
                          return (
                            <Badge key={`${notification.id}-${channel}`} variant="outline" className="gap-1">
                              <meta.icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          )
                        })}
                      </div>

                      {deliveries.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {deliveries.map((delivery) => {
                            const deliveryMeta = CHANNEL_META[delivery.channel]
                            const DeliveryIcon = deliveryMeta?.icon
                            return (
                              <Badge
                                key={`${notification.id}-${delivery.channel}-${delivery.status}`}
                                className={cn("gap-1", DELIVERY_STATUS_CLASSES[delivery.status])}
                              >
                                {DeliveryIcon && <DeliveryIcon className="h-3 w-3" />}
                                {DELIVERY_STATUS_LABELS[delivery.status]}
                              </Badge>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <DeleteButton
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          title="Delete"
                          showIcon
                        />
                      </div>
                    </div>
                  </div>

                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {notification.actions.map((action) => (
                        <Button
                          key={`${notification.id}-${action.id}`}
                          variant={action.action === "view" ? "outline" : "secondary"}
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAction(notification, action)
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
