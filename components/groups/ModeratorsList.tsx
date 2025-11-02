"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shield, Crown, UserCog } from "lucide-react"
import Link from "next/link"
import { getUserById, getGroupMembersByGroupId } from "@/lib/storage"
import type { Group, GroupMember, User } from "@/lib/types"

interface ModeratorsListProps {
  group: Group
  maxDisplay?: number
}

export function ModeratorsList({ group, maxDisplay = 5 }: ModeratorsListProps) {
  const members = getGroupMembersByGroupId(group.id)
  const moderatorsAndAdmins = members.filter(
    (m) => m.role === "moderator" || m.role === "admin" || m.role === "owner"
  )

  if (moderatorsAndAdmins.length === 0) {
    return null
  }

  const displayModerators = moderatorsAndAdmins.slice(0, maxDisplay)
  const hasMore = moderatorsAndAdmins.length > maxDisplay

  const getRoleIcon = (role: GroupMember["role"]) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "admin":
        return <Shield className="h-3 w-3" />
      case "moderator":
        return <UserCog className="h-3 w-3" />
      default:
        return null
    }
  }

  const getRoleBadge = (role: GroupMember["role"]) => {
    switch (role) {
      case "owner":
        return "Owner"
      case "admin":
        return "Admin"
      case "moderator":
        return "Mod"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Moderators & Admins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayModerators.map((member) => {
            const user = getUserById(member.userId) as User | undefined
            if (!user) return null

            return (
              <Link
                key={member.id}
                href={`/user/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{user.fullName}</p>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {getRoleBadge(member.role)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </Link>
            )
          })}
          {hasMore && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{moderatorsAndAdmins.length - maxDisplay} more
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

