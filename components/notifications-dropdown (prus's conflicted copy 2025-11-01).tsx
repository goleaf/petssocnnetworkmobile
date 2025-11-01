"use client"

import { useState, useEffect } from "react"
import { 
  Bell, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  AtSign, 
  FileText,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"
import { getNotificationsByUserId, getUnreadCount, markAsRead, markAllAsRead, generateFakeNotificationsForUser } from "@/lib/notifications"
import type { Notification } from "@/lib/types"
import { useRouter } from "next/navigation"
import { formatCommentDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

// Helper function to get icon and styling based on notification type
function getNotificationConfig(type: Notification["type"]) {
  switch (type) {
    case "follow":
      return {
        icon: UserPlus,
        bgColor: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-l-[#3b82f6]",
      }
    case "like":
      return {
        icon: Heart,
        bgColor: "bg-red-500/10",
        iconColor: "text-red-600 dark:text-red-400",
        borderColor: "border-l-[#ef4444]",
      }
    case "comment":
      return {
        icon: MessageCircle,
        bgColor: "bg-green-500/10",
        iconColor: "text-green-600 dark:text-green-400",
        borderColor: "border-l-[#22c55e]",
      }
    case "mention":
      return {
        icon: AtSign,
        bgColor: "bg-purple-500/10",
        iconColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-l-[#a855f7]",
      }
    case "post":
      return {
        icon: FileText,
        bgColor: "bg-orange-500/10",
        iconColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-l-[#f97316]",
      }
    default:
      return {
        icon: Bell,
        bgColor: "bg-gray-500/10",
        iconColor: "text-gray-600 dark:text-gray-400",
        borderColor: "border-l-[#6b7280]",
      }
  }
}

export function NotificationsDropdown() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    setIsLoading(true)

    // Automatically generate fake notifications for sarahpaws (user ID "1") on first load
    if (user.id === "1") {
      generateFakeNotificationsForUser(user.id)
    }

    const loadNotifications = () => {
      const userNotifications = getNotificationsByUserId(user.id)
      setNotifications(userNotifications.slice(0, 5)) // Show only 5 most recent
      setUnreadCount(getUnreadCount(user.id))
      setIsLoading(false)
    }

    // Small delay to ensure notifications are generated before loading
    setTimeout(() => {
      loadNotifications()
    }, 100)

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Navigate based on notification type
    if (notification.targetType === "post") {
      router.push(`/blog/${notification.targetId}`)
    } else if (notification.targetType === "user") {
      router.push(`/user/${notification.actorId}`)
    } else if (notification.targetType === "wiki") {
      router.push(`/wiki/${notification.targetId}`)
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
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-400">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white dark:border-gray-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-xs hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-transparent">
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center px-4 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((notification) => {
              const config = getNotificationConfig(notification.type)
              const Icon = config.icon
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "cursor-pointer p-0",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 border-l-4 hover:bg-muted/30 transition-colors",
                    config.borderColor
                  )}>
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", config.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-tight",
                        !notification.read ? "font-semibold" : "font-normal"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCommentDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/notifications")} className="justify-center cursor-pointer hover:bg-transparent focus:bg-transparent">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
