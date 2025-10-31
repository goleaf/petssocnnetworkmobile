"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BadgeDisplay } from "@/components/badge-display"
import { RoleBadge } from "@/components/role-badge"
import { getUserById } from "@/lib/storage"
import type { User } from "@/lib/types"
import type { LucideIcon } from "lucide-react"

interface SidebarUserListProps {
  title: string
  icon: LucideIcon
  userIds: string[]
  username: string
  type: "followers" | "following"
  emptyMessage?: string
  viewAllMessage?: string
}

export function SidebarUserList({
  title,
  icon: Icon,
  userIds,
  username,
  type,
  emptyMessage,
  viewAllMessage,
}: SidebarUserListProps) {
  const users = userIds
    .map((id) => getUserById(id))
    .filter((user): user is User => user !== null)
    .slice(0, 5)

  const viewAllHref = `/user/${username}/${type}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user) => (
              <Link key={user.id} href={`/user/${user.username}`}>
                <div className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate flex items-center gap-1 flex-wrap">
                      {user.fullName}
                      <BadgeDisplay user={user} size="sm" />
                      <RoleBadge role={user.role} size="sm" />
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </div>
              </Link>
            ))}
            {userIds.length > 5 && (
              <Link href={viewAllHref}>
                <Button variant="ghost" className="w-full" size="sm">
                  <Icon className="h-4 w-4 mr-2" />
                  {viewAllMessage || `View all ${userIds.length} ${title.toLowerCase()}`}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage || `No ${title.toLowerCase()} yet`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

