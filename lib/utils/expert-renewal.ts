/**
 * Expert Renewal Reminder Utilities
 * Handles checking for experts needing renewal reminders
 */

import { getExpertsNeedingRenewalAction } from "@/lib/actions/expert"
import { addNotification } from "@/lib/notifications"
import type { ExpertProfile } from "@/lib/types"

/**
 * Send renewal reminders to experts whose credentials expire within 30 days
 */
export async function sendRenewalReminders(): Promise<{
  sent: number
  expertIds: string[]
}> {
  try {
    const expertsNeedingRenewal = await getExpertsNeedingRenewalAction()
    
    const expertIds: string[] = []
    
    for (const expert of expertsNeedingRenewal) {
      // Calculate days until expiry
      if (!expert.expiresAt) continue
      
      const expiresAt = new Date(expert.expiresAt)
      const now = new Date()
      const daysUntilExpiry = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Send notification
      await addNotification({
        id: `renewal-reminder-${expert.id}-${Date.now()}`,
        userId: expert.userId,
        type: "message",
        actorId: "system",
        targetId: expert.id,
        targetType: "user",
        message: `Your expert verification expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}. Please renew your credentials to continue approving health revisions.`,
        read: false,
        createdAt: new Date().toISOString(),
        priority: daysUntilExpiry <= 7 ? "high" : "normal",
        category: "reminders",
      })
      
      expertIds.push(expert.userId)
    }
    
    return {
      sent: expertIds.length,
      expertIds,
    }
  } catch (error) {
    console.error("Error sending renewal reminders:", error)
    return { sent: 0, expertIds: [] }
  }
}

/**
 * Check and update expired expert profiles
 * Should be called periodically (e.g., daily cron job)
 */
export async function checkAndUpdateExpiredProfiles(): Promise<{
  updated: number
  expired: string[]
}> {
  try {
    const { checkExpiredExpertProfilesAction } = await import("@/lib/actions/expert")
    return await checkExpiredExpertProfilesAction()
  } catch (error) {
    console.error("Error checking expired profiles:", error)
    return { updated: 0, expired: [] }
  }
}

