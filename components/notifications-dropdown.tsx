"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Mail, Smartphone, CalendarClock, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"
import { getNotificationsByUserId, getUnreadCount, markAsRead, markAllAsRead, getNotificationSettings } from "@/lib/notifications"
import type { Notification as AppNotification, NotificationChannel, NotificationPriority } from "@/lib/types"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  NOTIFICATIONS_UPDATED_EVENT,
  hasRequestedPermission,
  requestNotificationPermission,
  supportsPushNotifications,
} from "@/lib/push-notifications"
import { Badge } from "@/components/ui/badge"

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
}

const PRIORITY_BADGE_VARIANT: Record<NotificationPriority, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  normal: "secondary",
  high: "secondary",
  urgent: "destructive",
}

const CHANNEL_ICONS: Record<NotificationChannel, LucideIcon> = {
  in_app: Bell,
  push: Smartphone,
  email: Mail,
  digest: CalendarClock,
}

export function NotificationsDropdown() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [previewAllowed, setPreviewAllowed] = useState(true)

  const loadNotifications = useCallback(() => {
    if (!user) return
    const userNotifications = getNotificationsByUserId(user.id)
    setNotifications(userNotifications.slice(0, 5))
    setUnreadCount(getUnreadCount(user.id))
  }, [user])

  useEffect(() => {
    if (!user) return

    loadNotifications()
    // Load preview setting
    try {
      const s = getNotificationSettings(user.id)
      setPreviewAllowed(s.previewContent !== false)
    } catch {}

    const handleNotificationsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail
      if (!detail || detail.userId !== user.id) return
      loadNotifications()
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated)

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated)
    }
  }, [user, loadNotifications])

  useEffect(() => {
    if (!user) return
    if (!supportsPushNotifications()) return
    if (Notification.permission === "granted") {
      void requestNotificationPermission()
      return
    }

    if (hasRequestedPermission()) return

    const timer = window.setTimeout(() => {
      void requestNotificationPermission()
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [user])

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id)
    if (!notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)))

    // Navigate based on notification type
    if (notification.targetType === "post") {
      router.push(`/blog/${notification.targetId}`)
    } else if (notification.targetType === "user") {
      router.push(`/user/${notification.actorId}`)
    } else if (notification.targetType === "wiki") {
      router.push(`/wiki/${notification.targetId}`)
    } else if (notification.targetType === "pet") {
      router.push(`/pet/${notification.targetId}`)
    }
  }

  const handleMarkAllRead = () => {
    if (!user) return
    markAllAsRead(user.id)
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <>
            {notifications.map((notification) => {
              const priority: NotificationPriority = notification.priority ?? "normal"
              const channels: NotificationChannel[] =
                notification.channels && notification.channels.length > 0
                  ? notification.channels
                  : ["in_app"]

              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 cursor-pointer ${!notification.read ? "bg-muted/50" : ""}`}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center justify-between gap-2 text-[10px] uppercase">
                      <Badge variant={PRIORITY_BADGE_VARIANT[priority]} className="px-2 py-0.5">
                        {PRIORITY_LABELS[priority]}
                      </Badge>
                      {notification.batchCount && notification.batchCount > 1 && (
                        <Badge variant="outline" className="px-2 py-0.5">
                          Batch ×{notification.batchCount}
                        </Badge>
                      )}
                      <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                        {channels.slice(0, 3).map((channel) => {
                          const Icon = CHANNEL_ICONS[channel]
                          return <Icon key={`${notification.id}-${channel}`} className="h-3 w-3" />
                        })}
                      </div>
                    </div>
                    <p className="text-sm leading-snug line-clamp-2">
                      {previewAllowed ? notification.message : (notification.type === 'message' ? 'New message' : 'New notification')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.updatedAt ?? notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/notifications")} className="justify-center">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
