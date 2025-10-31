import type { GroupMemberRole } from "@/lib/types"
import {
  getGroupMember,
  getUserRoleInGroup,
  canUserModerate,
  canUserPost,
  canUserComment,
  canUserCreateTopic,
  canUserManageMembers,
  canUserManageSettings,
} from "@/lib/storage"

/**
 * Check if a user has a specific role in a group
 */
export function hasRole(
  groupId: string,
  userId: string,
  role: GroupMemberRole | GroupMemberRole[]
): boolean {
  const userRole = getUserRoleInGroup(groupId, userId)
  if (!userRole) return false

  if (Array.isArray(role)) {
    return role.includes(userRole)
  }

  return userRole === role
}

/**
 * Check if a user is the owner of a group
 */
export function isOwner(groupId: string, userId: string): boolean {
  return hasRole(groupId, userId, "owner")
}

/**
 * Check if a user is an admin of a group
 */
export function isAdmin(groupId: string, userId: string): boolean {
  return hasRole(groupId, userId, ["owner", "admin"])
}

/**
 * Check if a user is a moderator of a group
 */
export function isModerator(groupId: string, userId: string): boolean {
  return hasRole(groupId, userId, ["owner", "admin", "moderator"])
}

/**
 * Check if a user is a member of a group
 */
export function isMember(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  return member !== undefined
}

/**
 * Get all permissions for a user in a group
 */
export function getUserPermissions(groupId: string, userId: string) {
  const member = getGroupMember(groupId, userId)
  if (!member) {
    return {
      canView: false,
      canPost: false,
      canComment: false,
      canCreateTopic: false,
      canCreatePoll: false,
      canCreateEvent: false,
      canModerate: false,
      canManageMembers: false,
      canManageSettings: false,
    }
  }

  return {
    canView: true,
    canPost: canUserPost(groupId, userId),
    canComment: canUserComment(groupId, userId),
    canCreateTopic: canUserCreateTopic(groupId, userId),
    canCreatePoll: member.permissions?.canCreatePoll ?? false,
    canCreateEvent: member.permissions?.canCreateEvent ?? false,
    canModerate: canUserModerate(groupId, userId),
    canManageMembers: canUserManageMembers(groupId, userId),
    canManageSettings: canUserManageSettings(groupId, userId),
  }
}

/**
 * Check if a user can perform an action based on their role
 */
export function canPerformAction(
  groupId: string,
  userId: string,
  action: string
): boolean {
  const permissions = getUserPermissions(groupId, userId)

  switch (action) {
    case "view":
      return permissions.canView
    case "post":
      return permissions.canPost
    case "comment":
      return permissions.canComment
    case "create_topic":
      return permissions.canCreateTopic
    case "create_poll":
      return permissions.canCreatePoll
    case "create_event":
      return permissions.canCreateEvent
    case "moderate":
      return permissions.canModerate
    case "manage_members":
      return permissions.canManageMembers
    case "manage_settings":
      return permissions.canManageSettings
    default:
      return false
  }
}

/**
 * Get role hierarchy for comparison
 */
export function getRoleHierarchy(role: GroupMemberRole): number {
  switch (role) {
    case "owner":
      return 4
    case "admin":
      return 3
    case "moderator":
      return 2
    case "member":
      return 1
    default:
      return 0
  }
}

/**
 * Check if a role can manage another role
 */
export function canRoleManageRole(
  managerRole: GroupMemberRole,
  targetRole: GroupMemberRole
): boolean {
  const managerLevel = getRoleHierarchy(managerRole)
  const targetLevel = getRoleHierarchy(targetRole)

  // Owners can manage everyone
  if (managerRole === "owner") return true

  // Admins can manage moderators and members
  if (managerRole === "admin") {
    return targetRole === "moderator" || targetRole === "member"
  }

  // Moderators can only manage members
  if (managerRole === "moderator") {
    return targetRole === "member"
  }

  // Members can't manage anyone
  return false
}

