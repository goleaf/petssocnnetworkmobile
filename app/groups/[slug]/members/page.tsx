"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { MemberList } from "@/components/groups/MemberList"
import {
  getGroupBySlug,
  getGroupMembersByGroupId,
  canUserViewGroup,
  canUserManageMembers,
  updateGroupMember,
  removeGroupMember,
  getUserById,
} from "@/lib/storage"
import type { Group, GroupMember } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Search, Users, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function GroupMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundGroup = getGroupBySlug(slug)

    if (!foundGroup) {
      setIsLoading(false)
      router.push("/groups")
      return
    }

    // Check visibility
    if (isAuthenticated && user) {
      if (!canUserViewGroup(foundGroup.id, user.id)) {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    } else {
      if (foundGroup.type === "secret") {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    }

    setGroup(foundGroup)
    const groupMembers = getGroupMembersByGroupId(foundGroup.id)
    setMembers(groupMembers)
    setFilteredMembers(groupMembers)
    setIsLoading(false)
  }, [slug, user, isAuthenticated, router])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = members.filter((member) => {
      const user = getUserById(member.userId)
      if (!user) return false
      return (
        user.fullName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query)
      )
    })
    setFilteredMembers(filtered)
  }, [searchQuery, members])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be logged in to view group members.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const canManage = canUserManageMembers(group.id, user.id)

  const handleRoleChange = (memberId: string, newRole: GroupMember["role"]) => {
    if (!canManage) return

    const member = members.find((m) => m.id === memberId)
    if (!member) return

    updateGroupMember(memberId, { role: newRole })

    // Update local state
    const updatedMembers = members.map((m) =>
      m.id === memberId ? { ...m, role: newRole } : m
    )
    setMembers(updatedMembers)
    setFilteredMembers(updatedMembers)
  }

  const handleRemoveMember = (memberId: string) => {
    if (!canManage) return

    const member = members.find((m) => m.id === memberId)
    if (!member) return

    if (confirm(`Are you sure you want to remove this member from the group?`)) {
      removeGroupMember(group.id, member.userId)

      // Update local state
      const updatedMembers = members.filter((m) => m.id !== memberId)
      setMembers(updatedMembers)
      setFilteredMembers(updatedMembers)
    }
  }

  // Group members by role
  const membersByRole = filteredMembers.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = []
    }
    acc[member.role].push(member)
    return acc
  }, {} as Record<GroupMember["role"], GroupMember[]>)

  const roleOrder: GroupMember["role"][] = ["owner", "admin", "moderator", "member"]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton href={`/groups/${group.slug}`}>Back to Group</BackButton>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({members.length})
                </CardTitle>
                <CardDescription>
                  {group.name} members and moderators
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Members List */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>
                  {searchQuery
                    ? "No members found matching your search"
                    : "No members found"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {roleOrder.map((role) => {
                  const roleMembers = membersByRole[role]
                  if (!roleMembers || roleMembers.length === 0) return null

                  return (
                    <div key={role} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold capitalize">
                          {role === "owner" ? "Owners" : role === "admin" ? "Admins" : role === "moderator" ? "Moderators" : "Members"} ({roleMembers.length})
                        </h3>
                      </div>
                      <MemberList
                        members={roleMembers}
                        currentUserId={user.id}
                        canManageMembers={canManage}
                        onRoleChange={handleRoleChange}
                        onRemoveMember={handleRemoveMember}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

