"use client"

interface UserActivity {
  timestamp: number
  action: string
  content?: string
}

const userActivities = new Map<string, UserActivity[]>()
const recentContent = new Map<string, string[]>()

export function trackActivity(userId: string, action: string, content?: string): void {
  const activities = userActivities.get(userId) || []
  activities.push({
    timestamp: Date.now(),
    action,
    content,
  })

  // Keep only last 50 activities
  if (activities.length > 50) {
    activities.shift()
  }

  userActivities.set(userId, activities)

  // Track content for duplicate detection
  if (content) {
    const contents = recentContent.get(userId) || []
    contents.push(content)
    if (contents.length > 10) {
      contents.shift()
    }
    recentContent.set(userId, contents)
  }
}

export function detectSuspiciousActivity(userId: string): {
  isSuspicious: boolean
  reasons: string[]
} {
  const activities = userActivities.get(userId) || []
  const reasons: string[] = []
  const now = Date.now()

  // Check for rapid actions (more than 10 in last minute)
  const recentActions = activities.filter((a) => now - a.timestamp < 60000)
  if (recentActions.length > 10) {
    reasons.push("Rapid action rate detected")
  }

  // Check for repeated identical actions
  const actionCounts = new Map<string, number>()
  recentActions.forEach((a) => {
    actionCounts.set(a.action, (actionCounts.get(a.action) || 0) + 1)
  })

  actionCounts.forEach((count, action) => {
    if (count > 5) {
      reasons.push(`Repeated ${action} actions`)
    }
  })

  // Check for duplicate content
  const contents = recentContent.get(userId) || []
  const uniqueContents = new Set(contents.map((c) => c.toLowerCase().trim()))
  if (contents.length > 3 && uniqueContents.size < contents.length / 2) {
    reasons.push("Duplicate content detected")
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  }
}

export function clearUserActivity(userId: string): void {
  userActivities.delete(userId)
  recentContent.delete(userId)
}

export function getRecentContent(userId: string): string[] {
  return recentContent.get(userId) || []
}
