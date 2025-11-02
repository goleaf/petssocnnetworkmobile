"use server"

/**
 * Server Actions for Expert Profile operations
 * Handles expert verification workflow: application → verify → expire → revoke
 */

import { prisma } from "@/lib/prisma"
import type { ExpertProfile } from "@/lib/types"

/**
 * Create or update expert profile application
 */
export async function submitExpertApplicationAction(
  userId: string,
  data: {
    credential: string
    licenseNo?: string
    region?: string
    documents: Array<{
      name: string
      url: string
      type: string
      uploadedAt: string
    }>
    expiresAt?: string
  }
): Promise<{ success: boolean; error?: string; profile?: ExpertProfile }> {
  try {
    // Check if user already has a profile
    const existing = await prisma.expertProfile.findFirst({
      where: { userId },
    })

    if (existing && existing.status === "pending") {
      return { success: false, error: "You already have a pending verification request" }
    }

    if (existing && existing.status === "verified") {
      return { success: false, error: "You are already verified as an expert" }
    }

    const profile = existing
      ? await prisma.expertProfile.update({
          where: { id: existing.id },
          data: {
            credential: data.credential,
            licenseNo: data.licenseNo,
            region: data.region,
            status: "pending",
            documents: data.documents as any,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            verifiedAt: null,
            revokedAt: null,
            reviewedBy: null,
            reviewNotes: null,
          },
        })
      : await prisma.expertProfile.create({
          data: {
            userId,
            credential: data.credential,
            licenseNo: data.licenseNo,
            region: data.region,
            status: "pending",
            documents: data.documents as any,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          },
        })

    return {
      success: true,
      profile: mapPrismaExpertToExpertProfile(profile),
    }
  } catch (error) {
    console.error("Error submitting expert application:", error)
    return { success: false, error: "Failed to submit application" }
  }
}

/**
 * Get expert profile by user ID
 */
export async function getExpertProfileByUserIdAction(
  userId: string
): Promise<ExpertProfile | null> {
  try {
    const profile = await prisma.expertProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return profile ? mapPrismaExpertToExpertProfile(profile) : null
  } catch (error) {
    console.error("Error fetching expert profile:", error)
    return null
  }
}

/**
 * Get all expert profiles (for admin)
 */
export async function getAllExpertProfilesAction(
  status?: "pending" | "verified" | "expired" | "revoked"
): Promise<ExpertProfile[]> {
  try {
    const profiles = await prisma.expertProfile.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return profiles.map(mapPrismaExpertToExpertProfile)
  } catch (error) {
    console.error("Error fetching expert profiles:", error)
    return []
  }
}

/**
 * Approve expert verification
 */
export async function approveExpertProfileAction(
  profileId: string,
  reviewerId: string,
  reviewNotes?: string,
  expiresAt?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.expertProfile.update({
      where: { id: profileId },
      data: {
        status: "verified",
        verifiedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error approving expert profile:", error)
    return { success: false, error: "Failed to approve expert profile" }
  }
}

/**
 * Reject expert verification
 */
export async function rejectExpertProfileAction(
  profileId: string,
  reviewerId: string,
  reviewNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.expertProfile.update({
      where: { id: profileId },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error rejecting expert profile:", error)
    return { success: false, error: "Failed to reject expert profile" }
  }
}

/**
 * Revoke expert verification
 */
export async function revokeExpertProfileAction(
  profileId: string,
  reviewerId: string,
  reviewNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.expertProfile.update({
      where: { id: profileId },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error revoking expert profile:", error)
    return { success: false, error: "Failed to revoke expert profile" }
  }
}

/**
 * Check and update expired expert profiles
 * Should be run periodically (e.g., via cron job)
 */
export async function checkExpiredExpertProfilesAction(): Promise<{
  updated: number
  expired: string[]
}> {
  try {
    const now = new Date()
    const expiredProfiles = await prisma.expertProfile.findMany({
      where: {
        status: "verified",
        expiresAt: {
          not: null,
          lte: now,
        },
      },
    })

    if (expiredProfiles.length === 0) {
      return { updated: 0, expired: [] }
    }

    await prisma.expertProfile.updateMany({
      where: {
        id: {
          in: expiredProfiles.map((p) => p.id),
        },
      },
      data: {
        status: "expired",
      },
    })

    return {
      updated: expiredProfiles.length,
      expired: expiredProfiles.map((p) => p.userId),
    }
  } catch (error) {
    console.error("Error checking expired expert profiles:", error)
    return { updated: 0, expired: [] }
  }
}

/**
 * Check if user is a verified expert (not expired or revoked)
 */
export async function isExpertVerifiedAction(userId: string): Promise<boolean> {
  try {
    const profile = await prisma.expertProfile.findFirst({
      where: {
        userId,
        status: "verified",
        expiresAt: {
          OR: [
            null, // No expiry
            { gt: new Date() }, // Not yet expired
          ],
        },
      },
    })

    return !!profile
  } catch (error) {
    console.error("Error checking expert verification:", error)
    return false
  }
}

/**
 * Get experts that need renewal reminders (expiring within 30 days)
 */
export async function getExpertsNeedingRenewalAction(): Promise<ExpertProfile[]> {
  try {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const profiles = await prisma.expertProfile.findMany({
      where: {
        status: "verified",
        expiresAt: {
          not: null,
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
    })

    return profiles.map(mapPrismaExpertToExpertProfile)
  } catch (error) {
    console.error("Error fetching experts needing renewal:", error)
    return []
  }
}

/**
 * Map Prisma ExpertProfile to ExpertProfile type
 */
function mapPrismaExpertToExpertProfile(profile: any): ExpertProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    credential: profile.credential,
    licenseNo: profile.licenseNo || undefined,
    region: profile.region || undefined,
    status: profile.status as "pending" | "verified" | "expired" | "revoked",
    verifiedAt: profile.verifiedAt?.toISOString(),
    expiresAt: profile.expiresAt?.toISOString(),
    revokedAt: profile.revokedAt?.toISOString(),
    documents: (profile.documents as any) || undefined,
    reviewNotes: profile.reviewNotes || undefined,
    reviewedBy: profile.reviewedBy || undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}

