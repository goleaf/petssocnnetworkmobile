"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { getNotificationsByUserId, markAsRead, markAsUnread, markAllAsRead, deleteNotification } from "@/lib/notifications"
import { getUserById } from "@/lib/storage"
import type { Notification } from "@/lib/types"
import { Bell, Check, UserPlus, Heart, MessageCircle, AtSign, FileText, Trash2, Search, SortAsc, SortDesc, X, Filter, Calendar, BarChart3, Settings2, Archive, MoreVertical, Clock, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "follow":
      return UserPlus
    case "like":
      return Heart
    case "comment":
      return MessageCircle
    case "mention":
      return AtSign
    case "post":
      return FileText
    default:
      return Bell
  }
}

const getNotificationTypeLabel = (type: Notification["type"]) => {
  switch (type) {
    case "follow":
      return "follow"
    case "like":
      return "like"
    case "comment":
      return "comment"
    case "mention":
      return "mention"
    case "post":
      return "post"
    default:
      return "all"
  }
}

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "follow":
      return "text-blue-500 bg-blue-500/10"
    case "like":
      return "text-red-500 bg-red-500/10"
    case "comment":
      return "text-green-500 bg-green-500/10"
    case "mention":
      return "text-purple-500 bg-purple-500/10"
    case "post":
      return "text-orange-500 bg-orange-500/10"
    default:
      return "text-muted-foreground bg-muted"
  }
}

type NotificationFilter = "all" | "unread" | "follow" | "like" | "comment" | "mention" | "post"
type SortOrder = "newest" | "oldest"
type TimeFilter = "all" | "today" | "yesterday" | "week" | "month"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [showStats, setShowStats] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Wait a bit for auth to initialize from localStorage
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only redirect if we've checked and user is still null
    if (isInitialized && !user) {
      router.push("/")
      return
    }
    
    if (user) {
      loadNotifications()
    }
  }, [user, router, isInitialized])

  const loadNotifications = () => {
    if (!user) return
    const userNotifications = getNotificationsByUserId(user.id)
    setNotifications(userNotifications)
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
    loadNotifications()
  }

  const handleMarkAsUnread = (id: string) => {
    markAsUnread(id)
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
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => {
      deleteNotification(id)
    })
    loadNotifications()
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const handleBatchMarkRead = () => {
    selectedIds.forEach((id) => {
      markAsRead(id)
    })
    loadNotifications()
    setSelectedIds(new Set())
  }

  const handleClearAll = () => {
    if (!user) return
    const userNotifications = getNotificationsByUserId(user.id)
    userNotifications.forEach((notification) => {
      deleteNotification(notification.id)
    })
    loadNotifications()
    setSelectedIds(new Set())
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedNotifications.map((n) => n.id)))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleNotificationClick = (notification: Notification) => {
    if (selectMode) {
      handleToggleSelect(notification.id)
      return
    }

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

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications

    // Apply read/unread filter
    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.read)
    } else if (filter !== "all") {
      filtered = filtered.filter((n) => n.type === filter)
    }

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)

      filtered = filtered.filter((n) => {
        const date = new Date(n.createdAt)
        switch (timeFilter) {
          case "today":
            return date >= today
          case "yesterday":
            return date >= yesterday && date < today
          case "week":
            return date >= weekAgo
          case "month":
            return date >= monthAgo
          default:
            return true
        }
      })
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((n) => n.message.toLowerCase().includes(query))
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [notifications, filter, searchQuery, sortOrder, timeFilter])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    filteredAndSortedNotifications.forEach((notification) => {
      const date = new Date(notification.createdAt)
      let groupKey: string

      if (date >= today) {
        groupKey = "Today"
      } else {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (date >= yesterday) {
          groupKey = "Yesterday"
        } else {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          if (date >= weekAgo) {
            groupKey = "This Week"
          } else {
            groupKey = format(date, "MMMM yyyy")
          }
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })

    return groups
  }, [filteredAndSortedNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Calculate statistics
  const stats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter((n) => !n.read).length
    const today = notifications.filter((n) => {
      const date = new Date(n.createdAt)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      return date >= todayStart
    }).length
    const thisWeek = notifications.filter((n) => {
      const date = new Date(n.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date >= weekAgo
    }).length

    const byType = {
      follow: notifications.filter((n) => n.type === "follow").length,
      like: notifications.filter((n) => n.type === "like").length,
      comment: notifications.filter((n) => n.type === "comment").length,
      mention: notifications.filter((n) => n.type === "mention").length,
      post: notifications.filter((n) => n.type === "post").length,
    }

    return { total, unread, today, thisWeek, byType }
  }, [notifications])

  // Reusable notification list component
  const renderNotificationList = () => {
    if (filteredAndSortedNotifications.length === 0) {
      const emptyMessages: Record<NotificationFilter, { title: string; description: string }> = {
        all: {
          title: searchQuery ? "No notifications match your search" : "No notifications yet",
          description: searchQuery ? "Try a different search term" : "You'll see notifications about likes, comments, follows, and more here.",
        },
        unread: {
          title: "No unread notifications",
          description: "All caught up! You don't have any unread notifications.",
        },
        follow: {
          title: "No follow notifications",
          description: "You don't have any follow notifications yet.",
        },
        like: {
          title: "No like notifications",
          description: "You don't have any like notifications yet.",
        },
        comment: {
          title: "No comment notifications",
          description: "You don't have any comment notifications yet.",
        },
        mention: {
          title: "No mention notifications",
          description: "You don't have any mention notifications yet.",
        },
        post: {
          title: "No post notifications",
          description: "You don't have any post notifications yet.",
        },
      }

      const emptyMessage = emptyMessages[filter] || emptyMessages.all

      return (
        <Card className="border-dashed">
          <CardContent className="p-12 md:p-16 text-center">
            <Bell className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">{emptyMessage.title}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">{emptyMessage.description}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
          <div key={groupKey} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-wide px-1">
              {groupKey}
            </h3>
            {groupNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const iconColor = getNotificationColor(notification.type)
              const actorUser = getUserById(notification.actorId)

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    !notification.read && "border-primary/50 bg-primary/5",
                    selectMode && selectedIds.has(notification.id) && "border-primary bg-primary/10",
                    !selectMode && "cursor-pointer",
                    selectMode && "cursor-pointer"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="py-1 px-4">
                    <div className="flex items-start gap-4">
                      {selectMode && (
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => handleToggleSelect(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                      )}
                      <div className={cn("flex-shrink-0 rounded-lg h-10 w-10 flex items-center justify-center", iconColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          {actorUser && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/user/${actorUser.username}`)
                              }}
                              className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={actorUser.avatar || "/placeholder.svg"} alt={actorUser.fullName} />
                                <AvatarFallback className="text-xs">{actorUser.fullName.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className={cn("text-sm leading-relaxed break-words", !notification.read && "font-medium")}>
                                {notification.message}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!selectMode && (
                        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 self-center" onClick={(e) => e.stopPropagation()}>
                          {!notification.read ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="bg-white dark:bg-gray-900"
                            >
                              <Check className="h-4 w-4" />
                              Read
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsUnread(notification.id)}
                              className="bg-white dark:bg-gray-900"
                            >
                              <Clock className="h-4 w-4" />
                              Unread
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const handleArchiveOld = () => {
    if (!user) return
    const now = new Date()
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt)
      if (date < monthAgo && notification.read) {
        deleteNotification(notification.id)
      }
    })
    loadNotifications()
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-4xl font-bold">Notifications</h1>
              <Badge variant="secondary">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg">Stay updated with your activity</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="h-8 px-2 sm:px-3 bg-white dark:bg-gray-900 flex items-center gap-2"
            >
              <Checkbox
                checked={showStats}
                onCheckedChange={(checked) => setShowStats(checked === true)}
                className="h-4 w-4 pointer-events-none"
              />
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Statistics</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total"
              value={stats.total}
              icon={Bell}
              iconBgColor="bg-gray-100 dark:bg-gray-900/20"
              iconColor="text-gray-600 dark:text-gray-400"
            />
            <StatCard
              label="Unread"
              value={stats.unread}
              icon={Clock}
              iconBgColor="bg-red-100 dark:bg-red-900/20"
              iconColor="text-red-600 dark:text-red-400"
              valueColor="text-red-600 dark:text-red-400"
            />
            <StatCard
              label="Today"
              value={stats.today}
              icon={TrendingUp}
              iconBgColor="bg-green-100 dark:bg-green-900/20"
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatCard
              label="This Week"
              value={stats.thisWeek}
              icon={Calendar}
              iconBgColor="bg-blue-100 dark:bg-blue-900/20"
              iconColor="text-blue-600 dark:text-blue-400"
            />
          </div>
        )}

        {/* Search, Sort and Actions - All in one line */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 sm:h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="min-w-[140px] h-8 flex-shrink-0 bg-white dark:bg-gray-900">
              <Calendar className="h-3 w-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="min-w-[130px] h-8 flex-shrink-0 bg-white dark:bg-gray-900">
              {sortOrder === "newest" ? (
                <>
                  <SortDesc className="h-3 w-3 mr-1.5" />
                  <SelectValue>Newest</SelectValue>
                </>
              ) : (
                <>
                  <SortAsc className="h-3 w-3 mr-1.5" />
                  <SelectValue>Oldest</SelectValue>
                </>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
          {selectMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex-shrink-0 bg-white dark:bg-gray-900">
                {selectedIds.size === filteredAndSortedNotifications.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleBatchMarkRead} className="flex-shrink-0 bg-white dark:bg-gray-900">
                    <Check />
                    Read ({selectedIds.size})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="flex-shrink-0">
                    <Trash2 />
                    Delete ({selectedIds.size})
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                setSelectMode(false)
                setSelectedIds(new Set())
              }} className="flex-shrink-0 bg-white dark:bg-gray-900">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)} className="flex-shrink-0 bg-white dark:bg-gray-900">
                Select
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="flex-shrink-0 bg-white dark:bg-gray-900">
                  <Check />
                  Mark all read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleArchiveOld} className="hidden sm:inline-flex flex-shrink-0 bg-white dark:bg-gray-900">
                <Archive />
                <span className="hidden md:inline">Archive old</span>
                <span className="md:hidden">Archive</span>
              </Button>
              {notifications.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearAll} className="flex-shrink-0">
                  <Trash2 />
                  Clear all
                </Button>
              )}
            </>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as NotificationFilter)} className="mb-3">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="gap-1.5 whitespace-nowrap">
              <Bell className="h-4 w-4 text-muted-foreground" />
              All
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-muted">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5 whitespace-nowrap">
              <Clock className="h-4 w-4 text-red-500" />
              Unread
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-primary">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="follow" className="gap-1.5 whitespace-nowrap">
              <UserPlus className="h-4 w-4 text-blue-500" />
              Follows
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-muted">
                {stats.byType.follow}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="like" className="gap-1.5 whitespace-nowrap">
              <Heart className="h-4 w-4 text-pink-500" />
              Likes
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-muted">
                {stats.byType.like}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="comment" className="gap-1.5 whitespace-nowrap">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              Comments
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-muted">
                {stats.byType.comment}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="mention" className="gap-1.5 whitespace-nowrap">
              <AtSign className="h-4 w-4 text-violet-500" />
              Mentions
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-muted">
                {stats.byType.mention}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="post" className="gap-1.5 whitespace-nowrap">
              <FileText className="h-4 w-4 text-amber-500" />
              Posts
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-muted">
                {stats.byType.post}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* All filter types use the same content */}
          <TabsContent value="all" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
          <TabsContent value="unread" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
          <TabsContent value="follow" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
          <TabsContent value="like" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
          <TabsContent value="comment" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
          <TabsContent value="mention" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
          <TabsContent value="post" className="mt-3 [&[data-state=active]]:!animate-none [&[data-state=active]]:!transition-none [&[data-state=active]]:!duration-0 [&[data-state=active]]:!transform-none [&[data-state=active]]:!opacity-100 [&[data-state=inactive]]:!animate-none [&[data-state=inactive]]:!transition-none [&[data-state=inactive]]:!duration-0 [&[data-state=inactive]]:!transform-none">
            {renderNotificationList()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
