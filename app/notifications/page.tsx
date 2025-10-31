"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getNotificationsByUserId, markAsRead, markAllAsRead, deleteNotification } from "@/lib/notifications"
import type { Notification } from "@/lib/types"
import { Bell, Trash2, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    loadNotifications()
  }, [user, router])

  const loadNotifications = () => {
    if (!user) return
    const userNotifications = getNotificationsByUserId(user.id)
    setNotifications(userNotifications)
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllRead = () => {
    if (!user) return
    markAllAsRead(user.id)
    loadNotifications()
  }

  const handleDelete = (id: string) => {
    deleteNotification(id)
    loadNotifications()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.targetType === "post") {
      router.push(`/blog/${notification.targetId}`)
    } else if (notification.targetType === "user") {
      router.push(`/user/${notification.actorId}`)
    } else if (notification.targetType === "wiki") {
      router.push(`/wiki/${notification.targetId}`)
    }
  }

  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">Stay updated with your activity</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Unread ({notifications.filter((n) => !n.read).length})
          </Button>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

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
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !notification.read ? "border-primary/50 bg-muted/30" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1" onClick={() => handleNotificationClick(notification)}>
                    <p className="text-sm mb-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(notification.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
