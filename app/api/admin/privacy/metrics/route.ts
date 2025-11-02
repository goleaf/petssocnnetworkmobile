import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import type { PrivacyRequestMetrics } from "@/lib/types"
import { isAfter } from "date-fns"

// Mock storage - replace with actual database calls
let mockPrivacyRequests: any[] = []

/**
 * GET /api/admin/privacy/metrics
 * Returns privacy request metrics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const now = new Date()

    // Calculate metrics
    const totalRequests = mockPrivacyRequests.length
    const pendingRequests = mockPrivacyRequests.filter((req) => req.status === "pending").length
    const inProgressRequests = mockPrivacyRequests.filter((req) => req.status === "in_progress").length
    const completedRequests = mockPrivacyRequests.filter((req) => req.status === "completed").length
    const overdueRequests = mockPrivacyRequests.filter((req) => {
      if (req.status === "completed" || req.status === "rejected") return false
      return isAfter(now, new Date(req.slaDeadline))
    }).length

    // Calculate average completion time
    const completed = mockPrivacyRequests.filter((req) => req.status === "completed" && req.completedAt && req.requestedAt)
    const avgCompletionTime = completed.length > 0
      ? completed.reduce((sum, req) => {
          const start = new Date(req.requestedAt).getTime()
          const end = new Date(req.completedAt).getTime()
          return sum + (end - start) / (1000 * 60 * 60) // Convert to hours
        }, 0) / completed.length
      : 0

    // Calculate SLA compliance rate
    const requestsWithSla = mockPrivacyRequests.filter(
      (req) => req.status === "completed" && req.completedAt && req.slaDeadline
    )
    const compliantRequests = requestsWithSla.filter((req) => {
      return new Date(req.completedAt) <= new Date(req.slaDeadline)
    }).length
    const slaComplianceRate = requestsWithSla.length > 0
      ? (compliantRequests / requestsWithSla.length) * 100
      : 100

    // Requests by type
    const requestsByType = {
      data_export: mockPrivacyRequests.filter((req) => req.type === "data_export").length,
      data_deletion: mockPrivacyRequests.filter((req) => req.type === "data_deletion").length,
      content_takedown: mockPrivacyRequests.filter((req) => req.type === "content_takedown").length,
    }

    // Requests by priority
    const requestsByPriority = {
      low: mockPrivacyRequests.filter((req) => req.priority === "low").length,
      normal: mockPrivacyRequests.filter((req) => req.priority === "normal").length,
      high: mockPrivacyRequests.filter((req) => req.priority === "high").length,
      urgent: mockPrivacyRequests.filter((req) => req.priority === "urgent").length,
    }

    const metrics: PrivacyRequestMetrics = {
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      overdueRequests,
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
      requestsByType,
      requestsByPriority,
    }

    return NextResponse.json(
      { metrics },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching privacy metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

