import type {
  Group,
  GroupMember,
  GroupTopic,
  GroupPoll,
  GroupEvent,
  GroupResource,
  GroupActivity,
  GroupMetrics,
  PollVote,
  EventRSVP,
} from "@/lib/types"
import {
  getGroupMembersByGroupId,
  getGroupTopicsByGroupId,
  getGroupPollsByGroupId,
  getGroupEventsByGroupId,
  getGroupResourcesByGroupId,
  getGroupActivitiesByGroupId,
  getPollVotesByPollId,
  getEventRSVPsByEventId,
  getGroupById,
} from "@/lib/storage"

/**
 * Calculate group metrics for a specific time period
 */
export function getGroupMetrics(
  groupId: string,
  periodDays: 7 | 30 | "all" = 30
): GroupMetrics {
  const now = new Date()
  let periodStart: Date
  let periodEnd: Date = now

  if (periodDays === "all") {
    // Get oldest activity date or group creation date
    const activities = getGroupActivitiesByGroupId(groupId)
    const group = getGroupById(groupId)
    const groupCreatedAt = group ? new Date(group.createdAt) : new Date()
    const oldestActivity = activities.length > 0
      ? new Date(
          activities.reduce((oldest, activity) => {
            const activityDate = new Date(activity.timestamp)
            return activityDate < oldest ? activityDate : oldest
          }, new Date(activities[0].timestamp))
        )
      : groupCreatedAt
    periodStart = oldestActivity < groupCreatedAt ? oldestActivity : groupCreatedAt
  } else {
    periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
  }

  // Get all data
  const members = getGroupMembersByGroupId(groupId)
  const topics = getGroupTopicsByGroupId(groupId)
  const polls = getGroupPollsByGroupId(groupId)
  const events = getGroupEventsByGroupId(groupId)
  const resources = getGroupResourcesByGroupId(groupId)
  const activities = getGroupActivitiesByGroupId(groupId)

  // Filter by period
  const topicsInPeriod = topics.filter(
    (t) => new Date(t.createdAt) >= periodStart && new Date(t.createdAt) <= periodEnd
  )
  const pollsInPeriod = polls.filter(
    (p) => new Date(p.createdAt) >= periodStart && new Date(p.createdAt) <= periodEnd
  )
  const eventsInPeriod = events.filter(
    (e) => new Date(e.createdAt) >= periodStart && new Date(e.createdAt) <= periodEnd
  )
  const resourcesInPeriod = resources.filter(
    (r) => new Date(r.createdAt) >= periodStart && new Date(r.createdAt) <= periodEnd
  )

  // Member metrics
  const totalMembers = members.length
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const newMembersThisWeek = members.filter(
    (m) => new Date(m.joinedAt) >= weekStart
  ).length
  const newMembersThisMonth = members.filter(
    (m) => new Date(m.joinedAt) >= monthStart
  ).length

  // Active members (active in last 7 days)
  const activeMemberIds = new Set<string>()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  activities.forEach((activity) => {
    if (new Date(activity.timestamp) >= sevenDaysAgo) {
      activeMemberIds.add(activity.userId)
    }
  })
  const activeMembers = activeMemberIds.size

  // Inactive members (not active in last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const inactiveMemberIds = new Set<string>()
  members.forEach((member) => {
    const hasRecentActivity = activities.some(
      (activity) =>
        activity.userId === member.userId &&
        new Date(activity.timestamp) >= thirtyDaysAgo
    )
    if (!hasRecentActivity) {
      inactiveMemberIds.add(member.userId)
    }
  })
  const inactiveMembers = inactiveMemberIds.size

  // Topic metrics
  const totalTopics = topics.length
  const topicsThisWeek = topics.filter(
    (t) => new Date(t.createdAt) >= weekStart
  ).length
  const topicsThisMonth = topics.filter(
    (t) => new Date(t.createdAt) >= monthStart
  ).length

  // Count comments (stored in GroupActivity or calculated from topics)
  // For now, we'll use commentCount from topics
  const totalComments = topics.reduce((sum, topic) => sum + topic.commentCount, 0)
  const commentsThisWeek = topicsInPeriod.reduce(
    (sum, topic) => sum + topic.commentCount,
    0
  )
  const commentsThisMonth = topics
    .filter((t) => new Date(t.createdAt) >= monthStart)
    .reduce((sum, topic) => sum + topic.commentCount, 0)

  // Poll metrics
  const totalPolls = polls.length
  const pollsThisWeek = polls.filter(
    (p) => new Date(p.createdAt) >= weekStart
  ).length
  const pollsThisMonth = polls.filter(
    (p) => new Date(p.createdAt) >= monthStart
  ).length

  // Event metrics
  const totalEvents = events.length
  const eventsThisWeek = events.filter(
    (e) => new Date(e.createdAt) >= weekStart
  ).length
  const eventsThisMonth = events.filter(
    (e) => new Date(e.createdAt) >= monthStart
  ).length

  // Resource metrics
  const totalResources = resources.length
  const resourcesThisWeek = resources.filter(
    (r) => new Date(r.createdAt) >= weekStart
  ).length
  const resourcesThisMonth = resources.filter(
    (r) => new Date(r.createdAt) >= monthStart
  ).length

  // Participation metrics
  let totalPollVotes = 0
  let uniquePollVoters = new Set<string>()
  polls.forEach((poll) => {
    const votes = getPollVotesByPollId(poll.id)
    totalPollVotes += votes.length
    votes.forEach((vote) => uniquePollVoters.add(vote.userId))
  })
  const averagePollVotes = totalPolls > 0 ? totalPollVotes / totalPolls : 0
  const pollParticipationRate =
    totalMembers > 0 ? (uniquePollVoters.size / totalMembers) * 100 : 0

  let totalEventRSVPs = 0
  let uniqueEventRSVPers = new Set<string>()
  events.forEach((event) => {
    const rsvps = getEventRSVPsByEventId(event.id)
    totalEventRSVPs += rsvps.filter((r) => r.status === "going").length
    rsvps.forEach((rsvp) => uniqueEventRSVPers.add(rsvp.userId))
  })
  const averageEventRSVPs = totalEvents > 0 ? totalEventRSVPs / totalEvents : 0
  const eventAttendanceRate =
    totalMembers > 0 ? (uniqueEventRSVPers.size / totalMembers) * 100 : 0

  // Daily activity timeline (last 7 days)
  const dailyActivity: GroupMetrics["dailyActivity"] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStart = new Date(date.setHours(0, 0, 0, 0))
    const dateEnd = new Date(date.setHours(23, 59, 59, 999))

    const dayTopics = topics.filter(
      (t) =>
        new Date(t.createdAt) >= dateStart && new Date(t.createdAt) <= dateEnd
    ).length

    const dayComments = topics
      .filter(
        (t) =>
          new Date(t.createdAt) >= dateStart && new Date(t.createdAt) <= dateEnd
      )
      .reduce((sum, topic) => sum + topic.commentCount, 0)

    const dayPolls = polls.filter(
      (p) =>
        new Date(p.createdAt) >= dateStart && new Date(p.createdAt) <= dateEnd
    ).length

    const dayEvents = events.filter(
      (e) =>
        new Date(e.createdAt) >= dateStart && new Date(e.createdAt) <= dateEnd
    ).length

    const dayResources = resources.filter(
      (r) =>
        new Date(r.createdAt) >= dateStart && new Date(r.createdAt) <= dateEnd
    ).length

    const dayNewMembers = members.filter(
      (m) =>
        new Date(m.joinedAt) >= dateStart && new Date(m.joinedAt) <= dateEnd
    ).length

    dailyActivity.push({
      date: dateStart.toISOString().split("T")[0],
      topics: dayTopics,
      comments: dayComments,
      polls: dayPolls,
      events: dayEvents,
      resources: dayResources,
      newMembers: dayNewMembers,
    })
  }

  return {
    // Member metrics
    totalMembers,
    newMembersThisWeek,
    newMembersThisMonth,
    activeMembers,
    inactiveMembers,

    // Engagement metrics
    totalTopics,
    topicsThisWeek,
    topicsThisMonth,
    totalComments,
    commentsThisWeek,
    commentsThisMonth,

    // Content metrics
    totalPolls,
    pollsThisWeek,
    pollsThisMonth,
    totalEvents,
    eventsThisWeek,
    eventsThisMonth,
    totalResources,
    resourcesThisWeek,
    resourcesThisMonth,

    // Participation metrics
    pollParticipationRate: Math.round(pollParticipationRate * 100) / 100,
    eventAttendanceRate: Math.round(eventAttendanceRate * 100) / 100,
    averagePollVotes: Math.round(averagePollVotes * 100) / 100,
    averageEventRSVPs: Math.round(averageEventRSVPs * 100) / 100,

    // Activity timeline
    dailyActivity,

    // Period range
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  }
}

/**
 * Export metrics as CSV
 */
export function exportMetricsAsCSV(metrics: GroupMetrics, groupName: string): string {
  const lines: string[] = []
  lines.push(`Group Analytics - ${groupName}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push("")
  lines.push("Member Metrics")
  lines.push(`Total Members,${metrics.totalMembers}`)
  lines.push(`New Members (This Week),${metrics.newMembersThisWeek}`)
  lines.push(`New Members (This Month),${metrics.newMembersThisMonth}`)
  lines.push(`Active Members,${metrics.activeMembers}`)
  lines.push(`Inactive Members,${metrics.inactiveMembers}`)
  lines.push("")
  lines.push("Engagement Metrics")
  lines.push(`Total Topics,${metrics.totalTopics}`)
  lines.push(`Topics (This Week),${metrics.topicsThisWeek}`)
  lines.push(`Topics (This Month),${metrics.topicsThisMonth}`)
  lines.push(`Total Comments,${metrics.totalComments}`)
  lines.push(`Comments (This Week),${metrics.commentsThisWeek}`)
  lines.push(`Comments (This Month),${metrics.commentsThisMonth}`)
  lines.push("")
  lines.push("Content Metrics")
  lines.push(`Total Polls,${metrics.totalPolls}`)
  lines.push(`Polls (This Week),${metrics.pollsThisWeek}`)
  lines.push(`Polls (This Month),${metrics.pollsThisMonth}`)
  lines.push(`Total Events,${metrics.totalEvents}`)
  lines.push(`Events (This Week),${metrics.eventsThisWeek}`)
  lines.push(`Events (This Month),${metrics.eventsThisMonth}`)
  lines.push(`Total Resources,${metrics.totalResources}`)
  lines.push(`Resources (This Week),${metrics.resourcesThisWeek}`)
  lines.push(`Resources (This Month),${metrics.resourcesThisMonth}`)
  lines.push("")
  lines.push("Participation Metrics")
  lines.push(`Poll Participation Rate,${metrics.pollParticipationRate}%`)
  lines.push(`Event Attendance Rate,${metrics.eventAttendanceRate}%`)
  lines.push(`Average Poll Votes,${metrics.averagePollVotes}`)
  lines.push(`Average Event RSVPs,${metrics.averageEventRSVPs}`)
  lines.push("")
  lines.push("Daily Activity (Last 7 Days)")
  lines.push("Date,Topics,Comments,Polls,Events,Resources,New Members")
  metrics.dailyActivity.forEach((day) => {
    lines.push(
      `${day.date},${day.topics},${day.comments},${day.polls},${day.events},${day.resources},${day.newMembers}`
    )
  })

  return lines.join("\n")
}

