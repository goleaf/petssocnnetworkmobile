"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WarningDialog } from "./WarningDialog"
import {
  getGroupMembersByGroupId,
  getGroupWarningsByUserId,
  getWarningCount,
  getUserBan,
  isUserBannedFromGroup,
  banGroupMember,
  unbanGroupMember,
  getGroupBansByGroupId,
  getUserById,
  addGroupWarning,
} from "@/lib/storage"
import type { Group, GroupMember, GroupWarning, GroupBan } from "@/lib/types"
import { MoreVertical, Shield, AlertTriangle, Ban, UserX } from "lucide-react"

interface MemberModerationProps {
  group: Group
  currentUserId: string
  onMemberAction?: () => void
}

export function MemberModeration({
  group,
  currentUserId,
  onMemberAction,
}: MemberModerationProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)

  const members = getGroupMembersByGroupId(group.id)
  const bans = getGroupBansByGroupId(group.id)

  const handleIssueWarning = (memberId: string) => {
    setSelectedMemberId(memberId)
    setWarningDialogOpen(true)
  }

  const handleWarningConfirm = (
    level: 1 | 2 | 3,
    reason: string,
    notes?: string
  ) => {
    if (!selectedMemberId) return

    const warning: GroupWarning = {
      id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      userId: selectedMemberId,
      issuedBy: currentUserId,
      level,
      reason,
      notes,
      createdAt: new Date().toISOString(),
    }

    addGroupWarning(warning)

    // Auto-ban after 3 warnings (if level 3)
    const warningCount = getWarningCount(group.id, selectedMemberId)
    if (level === 3 || warningCount >= 3) {
      const ban: GroupBan = {
        id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId: group.id,
        userId: selectedMemberId,
        bannedBy: currentUserId,
        reason: `Auto-banned after ${warningCount + 1} warnings`,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      banGroupMember(ban)
    }

    onMemberAction?.()
  }

  const handleBan = (memberId: string, permanent: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${permanent ? "permanently" : "temporarily"} ban this member?`
      )
    ) {
      return
    }

    const ban: GroupBan = {
      id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      userId: memberId,
      bannedBy: currentUserId,
      reason: "Banned by moderator",
      expiresAt: permanent ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    banGroupMember(ban)
    onMemberAction?.()
  }

  const handleUnban = (memberId: string) => {
    unbanGroupMember(group.id, memberId, currentUserId)
    onMemberAction?.()
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      owner: "default",
      admin: "default",
      moderator: "secondary",
      member: "secondary",
    }
    return (
      <Badge variant={variants[role] || "secondary"}>{role}</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Member Management</h3>
        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Warnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const user = getUserById(member.userId)
                  const warnings = getGroupWarningsByUserId(group.id, member.userId)
                  const warningCount = warnings.length
                  const ban = getUserBan(group.id, member.userId)
                  const isBanned = isUserBannedFromGroup(group.id, member.userId)

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user?.username || `User ${member.userId.slice(0, 8)}`}
                          </span>
                          {user?.fullName && (
                            <span className="text-xs text-muted-foreground">
                              {user.fullName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        {warningCount > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {warningCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isBanned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleIssueWarning(member.userId)}
                              disabled={isBanned}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Issue Warning
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBan(member.userId, false)}
                              disabled={isBanned || member.role === "owner"}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban (7 days)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBan(member.userId, true)}
                              disabled={isBanned || member.role === "owner"}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban (Permanent)
                            </DropdownMenuItem>
                            {isBanned && ban && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleUnban(member.userId)}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Unban
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banned Members */}
      {bans.filter((b) => b.isActive).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Banned Members</h3>
          <Card>
            <CardHeader>
              <CardTitle>Active Bans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Ban Type</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bans
                    .filter((ban) => ban.isActive)
                    .map((ban) => {
                      const user = getUserById(ban.userId)
                      const isExpired = ban.expiresAt
                        ? new Date(ban.expiresAt) < new Date()
                        : false

                      if (isExpired) return null

                      return (
                        <TableRow key={ban.id}>
                          <TableCell>
                            {user?.username || `User ${ban.userId.slice(0, 8)}`}
                          </TableCell>
                          <TableCell>
                            {ban.expiresAt ? (
                              <Badge variant="outline">Temporary</Badge>
                            ) : (
                              <Badge variant="destructive">Permanent</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ban.expiresAt
                              ? new Date(ban.expiresAt).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {ban.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnban(ban.userId)}
                            >
                              Unban
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <WarningDialog
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        userName={
          selectedMemberId
            ? getUserById(selectedMemberId)?.username || `User ${selectedMemberId.slice(0, 8)}`
            : ""
        }
        onConfirm={handleWarningConfirm}
      />
    </div>
  )
}

