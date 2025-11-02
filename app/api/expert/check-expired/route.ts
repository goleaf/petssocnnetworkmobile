/**
 * API Route: Check and Update Expired Expert Profiles
 * 
 * POST: Check for expired expert profiles and update their status
 * Should be called periodically (e.g., via cron job)
 */

import { NextResponse } from "next/server"
import { checkExpiredExpertProfilesAction } from "@/lib/actions/expert"
import { sendRenewalReminders } from "@/lib/utils/expert-renewal"

export async function POST(request: Request) {
  try {
    // Optional: Add authentication/authorization check here
    // const authHeader = request.headers.get("authorization")
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Check and update expired profiles
    const expiredResult = await checkExpiredExpertProfilesAction()

    // Send renewal reminders to experts expiring soon
    const renewalResult = await sendRenewalReminders()

    return NextResponse.json({
      success: true,
      expired: {
        updated: expiredResult.updated,
        expertIds: expiredResult.expired,
      },
      renewalReminders: {
        sent: renewalResult.sent,
        expertIds: renewalResult.expertIds,
      },
    })
  } catch (error) {
    console.error("Error checking expired expert profiles:", error)
    return NextResponse.json(
      { error: "Failed to check expired profiles" },
      { status: 500 }
    )
  }
}

