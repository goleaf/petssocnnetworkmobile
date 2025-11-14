/**
 * Groups API - High-level functions for group operations
 */

import type {
  Group,
  GroupMember,
  GroupMemberRole,
  GroupTopic,
  GroupEvent,
  EventRSVP,
  EventRSVPStatus,
  GroupMembershipType,
  GroupEventType,
} from "./types"
import {
  addGroup,
  updateGroup,
  getGroupById,
  getGroupBySlug,
  addGroupMember,
  getGroupMembersByGroupId,
  getUserRoleInGroup,
  isUserMemberOfGroup,
  canUserPost,
  addGroupTopic,
  addGroupEvent,
  updateGroupEvent,
  getGroupEventById,
  getGroupEventsByGroupId,
  getEventRSVPsByEventId,
  addEventRSVP,
  generateGroupSlug,
  generateStorageId,
} from "./storage"
import { addNotification } from "./notifications"

export interface CreateGroupParams {
  name: string
  description: string
  type: Group["type"]
  membershipType: GroupMembershipType
  categoryId: string
  subcategoryId?: string
  coverImage?: string
  avatar?: string
  tags?: string[]
  rules?: string[]
  pinnedRules?: string[]
  welcomeMessage?: string
  city?: string
  ownerId: string
}

export interface JoinGroupParams {
  groupId: string
  userId: string
}

export interface PostToGroupParams {
  groupId: string
  userId: string
  title: string
  content: string
  tags?: string[]
}

export interface ScheduleGroupEventParams {
  groupId: string
  authorId: string
  title: string
  description: string
  eventType: GroupEventType
  startDate: string
  endDate?: string
  location?: string
  address?: string
  maxAttendees?: number
  rsvpRequired?: boolean
  tags?: string[]
  coverImage?: string
  meetingUrl?: string
}

/**
 * Create a new group
 */
export function createGroup(params: CreateGroupParams): Group {
  const slug = generateGroupSlug(params.name)
  const now = new Date().toISOString()

  const group: Group = {
    id: generateStorageId("group"),
    name: params.name,
    slug,
    description: params.description,
    type: params.type,
    membershipType: params.membershipType || "open",
    categoryId: params.categoryId,
    subcategoryId: params.subcategoryId,
    ownerId: params.ownerId,
    coverImage: params.coverImage,
    avatar: params.avatar,
    memberCount: 1,
    topicCount: 0,
    postCount: 0,
    tags: params.tags || [],
    rules: params.rules || [],
    pinnedRules: params.pinnedRules || [],
    moderators: [],
    city: params.city,
    createdAt: now,
    updatedAt: now,
    isFeatured: false,
    welcomeMessage: params.welcomeMessage,
  }

  addGroup(group)

  // Add owner as first member with owner role
  const ownerMember: GroupMember = {
    id: generateStorageId("group_member"),
    groupId: group.id,
    userId: params.ownerId,
    role: "owner",
    joinedAt: now,
    status: "active",
    permissions: {
      canPost: true,
      canComment: true,
      canCreateTopic: true,
      canCreatePoll: true,
      canCreateEvent: true,
      canModerate: true,
      canManageMembers: true,
      canManageSettings: true,
    },
  }

  addGroupMember(ownerMember)

  return group
}

/**
 * Join a group (handles open, request, and invite membership types)
 */
export function joinGroup(params: JoinGroupParams): {
  success: boolean
  status: "joined" | "pending" | "invite-required" | "error"
  message?: string
  member?: GroupMember
} {
  const { groupId, userId } = params
  const group = getGroupById(groupId)

  if (!group) {
    return {
      success: false,
      status: "error",
      message: "Group not found",
    }
  }

  // Check if user is already a member
  if (isUserMemberOfGroup(groupId, userId)) {
    return {
      success: false,
      status: "error",
      message: "Already a member of this group",
    }
  }

  // Check membership type
  const membershipType = group.membershipType || "open"

  if (membershipType === "invite") {
    return {
      success: false,
      status: "invite-required",
      message: "This group requires an invitation to join",
    }
  }

  const now = new Date().toISOString()
  const status = membershipType === "request" ? "pending" : "active"

  const member: GroupMember = {
    id: generateStorageId("group_member"),
    groupId,
    userId,
    role: "member",
    joinedAt: now,
    status,
    permissions: {
      canPost: status === "active",
      canComment: status === "active",
      canCreateTopic: false,
      canCreatePoll: false,
      canCreateEvent: false,
      canModerate: false,
      canManageMembers: false,
      canManageSettings: false,
    },
  }

  addGroupMember(member)

  if (status === "active") {
    // Update member count
    const updatedGroup: Group = {
      ...group,
      memberCount: group.memberCount + 1,
      updatedAt: now,
    }
    updateGroup(groupId, updatedGroup)
  }

  // Notify group admins/mods if request membership
  if (status === "pending") {
    const moderators = group.moderators || []
    const members = getGroupMembersByGroupId(groupId)
    const adminsAndMods = members.filter(
      (m) => m.role === "admin" || m.role === "moderator" || m.role === "owner"
    )

    adminsAndMods.forEach((admin) => {
      addNotification({
        userId: admin.userId,
        type: "friend_request", // Using existing type as placeholder
        actorId: userId,
        targetId: groupId,
        targetType: "user",
        message: `New join request for ${group.name}`,
        metadata: {
          groupId,
          requestUserId: userId,
          type: "group_join_request",
        },
      })
    })
  }

  return {
    success: true,
    status: status === "active" ? "joined" : "pending",
    message:
      status === "active"
        ? "Successfully joined the group"
        : "Join request submitted. Waiting for approval.",
    member,
  }
}

/**
 * Post to a group (creates a topic/post)
 */
export function postToGroup(params: PostToGroupParams): {
  success: boolean
  topic?: GroupTopic
  message?: string
} {
  const { groupId, userId, title, content, tags } = params

  const group = getGroupById(groupId)
  if (!group) {
    return {
      success: false,
      message: "Group not found",
    }
  }

  // Check if user can post
  if (!canUserPost(groupId, userId)) {
    return {
      success: false,
      message: "You don't have permission to post in this group",
    }
  }

  const now = new Date().toISOString()

  const topic: GroupTopic = {
    id: generateStorageId("group_topic"),
    groupId,
    authorId: userId,
    title,
    content,
    tags: tags || [],
    reactions: {},
    viewCount: 0,
    commentCount: 0,
    createdAt: now,
    updatedAt: now,
    status: "active",
    isPinned: false,
    isLocked: false,
  }

  addGroupTopic(topic)

  // Update group post count
  const updatedGroup: Group = {
    ...group,
    postCount: group.postCount + 1,
    topicCount: group.topicCount + 1,
    updatedAt: now,
  }
  updateGroup(groupId, updatedGroup)

  return {
    success: true,
    topic,
    message: "Post created successfully",
  }
}

/**
 * Schedule a group event with RSVP support
 */
export function scheduleGroupEvent(params: ScheduleGroupEventParams): {
  success: boolean
  event?: GroupEvent
  message?: string
} {
  const { groupId, authorId, title, description, eventType, startDate, endDate, location, address, maxAttendees, rsvpRequired, tags, coverImage, meetingUrl } =
    params

  const group = getGroupById(groupId)
  if (!group) {
    return {
      success: false,
      message: "Group not found",
    }
  }

  // Check permissions - simplified for now, would check canCreateEvent
  const userRole = getUserRoleInGroup(groupId, authorId)
  if (!userRole || userRole === null) {
    return {
      success: false,
      message: "You must be a member to create events",
    }
  }

  const now = new Date().toISOString()

  const event: GroupEvent = {
    id: generateStorageId("group_event"),
    groupId,
    authorId,
    title,
    description,
    eventType,
    startDate,
    endDate,
    location,
    address,
    maxAttendees,
    rsvpRequired: rsvpRequired ?? true,
    tags: tags || [],
    coverImage,
    meetingUrl,
    attendeeCount: 0,
    createdAt: now,
    updatedAt: now,
    isCancelled: false,
    reminderSent: false,
  }

  addGroupEvent(event)

  return {
    success: true,
    event,
    message: "Event created successfully",
  }
}

/**
 * RSVP to a group event
 */
export function rsvpToEvent(
  eventId: string,
  userId: string,
  status: EventRSVPStatus,
  shareLocation?: boolean
): {
  success: boolean
  rsvp?: EventRSVP
  message?: string
} {
  const event = getGroupEventById(eventId)
  if (!event) {
    return {
      success: false,
      message: "Event not found",
    }
  }

  const now = new Date().toISOString()

  const rsvp: EventRSVP = {
    id: generateStorageId("event_rsvp"),
    eventId,
    userId,
    status,
    respondedAt: now,
    shareLocation: shareLocation || false,
  }

  addEventRSVP(rsvp)

  // Update event attendee count
  const updatedAttendeeCount = getEventRSVPsByEventId(eventId).filter(
    (r) => r.status === "going"
  ).length
  updateGroupEvent(eventId, { attendeeCount: updatedAttendeeCount })

  return {
    success: true,
    rsvp,
    message: "RSVP submitted successfully",
  }
}

/**
 * Send event reminder notifications
 */
export function sendEventReminders(eventId: string): {
  success: boolean
  remindersSent: number
} {
  // This would typically be called by a scheduled job
  const event = getGroupEventById(eventId)
  if (!event) {
    return {
      success: false,
      remindersSent: 0,
    }
  }

  // Only send if reminder hasn't been sent and event is in the future
  if (event.reminderSent || new Date(event.startDate) < new Date()) {
    return {
      success: false,
      remindersSent: 0,
    }
  }

  // Get all RSVPs with status "going" or "maybe"
  const rsvps = getEventRSVPsByEventId(eventId)
  const attendeeIds = rsvps
    .filter((r) => r.status === "going" || r.status === "maybe")
    .map((r) => r.userId)

  // Send reminders to attendees
  attendeeIds.forEach((userId) => {
    addNotification({
      userId,
      type: "message", // Using existing type as placeholder
      actorId: event.authorId,
      targetId: eventId,
      targetType: "post",
      message: `Reminder: ${event.title} is coming up soon!`,
      metadata: {
        eventId,
        type: "event_reminder",
      },
    })
  })

  // Mark reminder as sent
  updateGroupEvent(eventId, {
    reminderSent: true,
    reminderSentAt: new Date().toISOString(),
  })

  return {
    success: true,
    remindersSent: attendeeIds.length,
  }
}


export interface CreateGroupResourceParams {
  groupId: string
  createdBy: string
  title: string
  description?: string
  url?: string
  type?: "link" | "file" | "note"
  tags?: string[]
}

/**
 * Create a group resource
 */
export function createGroupResource(params: CreateGroupResourceParams): {
  success: boolean
  message?: string
  resource?: import("./types").GroupResource
} {
  const group = getGroupById(params.groupId)
  if (!group) {
    return {
      success: false,
      message: "Group not found",
    }
  }

  // Check if user is a member
  if (!isUserMemberOfGroup(params.groupId, params.createdBy)) {
    return {
      success: false,
      message: "You must be a member of this group to create resources",
    }
  }

  // Validate required fields
  if (!params.title || params.title.trim().length === 0) {
    return {
      success: false,
      message: "Title is required",
    }
  }

  // Validate URL for link type
  if (params.type === "link" && (!params.url || params.url.trim().length === 0)) {
    return {
      success: false,
      message: "URL is required for link resources",
    }
  }

  const now = new Date().toISOString()
  const resource: import("./types").GroupResource = {
    id: generateStorageId("resource"),
    groupId: params.groupId,
    createdBy: params.createdBy,
    title: params.title.trim(),
    description: params.description?.trim(),
    url: params.url?.trim(),
    type: params.type || "link",
    tags: params.tags,
    createdAt: now,
    updatedAt: now,
  }

  const { addGroupResource } = require("./storage")
  addGroupResource(resource)

  // Send notification to group members (optional)
  addNotification({
    userId: group.ownerId,
    type: "message",
    actorId: params.createdBy,
    targetId: resource.id,
    targetType: "post",
    message: `New resource added to ${group.name}: ${resource.title}`,
    metadata: {
      groupId: params.groupId,
      resourceId: resource.id,
      type: "group_resource",
    },
  })

  return {
    success: true,
    resource,
  }
}
