"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Shield,
  Crown,
  UserCog,
  UserX,
  MoreVertical,
  Mail,
  Calendar,
} from "lucide-react"
import type { GroupMember } from "@/lib/types"
import { getUserById } from "@/lib/storage"
import type { User } from "@/lib/types"
import { formatDate } from "@/lib/utils/date"

interface MemberListProps {
  members: GroupMember[]
  currentUserId: string
  canManageMembers: boolean
  onRoleChange?: (memberId: string, newRole: GroupMember["role"]) => void
  onRemoveMember?: (memberId: string) => void
}

export function MemberList({
  members,
  currentUserId,
  canManageMembers,
  onRoleChange,
  onRemoveMember,
}: MemberListProps) {
  const getRoleIcon = (role: GroupMember["role"]) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "moderator":
        return <UserCog className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: GroupMember["role"]) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        )
      case "admin":
        return (
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        )
      case "moderator":
        return (
          <Badge variant="outline" className="gap-1">
            <UserCog className="h-3 w-3" />
            Moderator
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Member
          </Badge>
        )
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<GroupMember["role"], number> = {
      owner: 4,
      admin: 3,
      moderator: 2,
      member: 1,
    }
    return roleOrder[b.role] - roleOrder[a.role]
  })

  return (
    <div className="space-y-4">
      {sortedMembers.map((member) => {
        const user = getUserById(member.userId) as User | undefined
        if (!user) return null

        const isCurrentUser = member.userId === currentUserId
        const canChangeRole = canManageMembers && !isCurrentUser && member.role !== "owner"

        return (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Link href={`/user/${user.username}`}>
                    <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 ring-primary transition-all">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/user/${user.username}`}>
                        <h3 className="font-semibold hover:underline">{user.fullName}</h3>
                      </Link>
                      {getRoleBadge(member.role)}
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {formatDate(member.joinedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {canManageMembers && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canChangeRole && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onRoleChange?.(member.id, "admin")}
                            disabled={member.role === "admin"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRoleChange?.(member.id, "moderator")}
                            disabled={member.role === "moderator"}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRoleChange?.(member.id, "member")}
                            disabled={member.role === "member"}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          // Message user - future feature
                        }}
                        disabled
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Message User
                      </DropdownMenuItem>
                      {canChangeRole && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onRemoveMember?.(member.id)}
                            className="text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove from Group
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

