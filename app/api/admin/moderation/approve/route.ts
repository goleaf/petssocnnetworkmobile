import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser, isModerator } from "@/lib/auth-server"
import { approveEditRequest, getEditRequest } from "@/lib/storage/edit-requests"

/**
 * Validation schema for edit request approval
 */
const approveEditRequestSchema = z.object({
  editRequestId: z.string().min(1, "Edit request ID is required"),
})

/**
 * POST /api/admin/moderation/approve
 * Approves an edit request and applies changes to content
 * 
 * Requires moderator role
 * 
 * This endpoint:
 * 1. Validates moderator permissions
 * 2. Approves the edit request
 * 3. Applies changes to actual content
 * 4. Logs action to audit trail
 * 5. Sends notification to user
 * 
 * @param request - Next.js request object
 * @returns Approved edit request details
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication and moderator permission
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const hasModeratorRole = await isModerator()
    if (!hasModeratorRole) {
      return NextResponse.json(
        { error: "Forbidden. Moderator access required.", code: "FORBIDDEN" },
        { status: 403 }
      )
    }

    // 2. Validate request body
    const body = await request.json()
    const validation = approveEditRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          code: "VALIDATION_ERROR",
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { editRequestId } = validation.data

    // 3. Verify edit request exists and is pending
    const existingRequest = await getEditRequest(editRequestId)
    if (!existingRequest) {
      return NextResponse.json(
        { error: "Edit request not found", code: "NOT_FOUND" },
        { status: 404 }
      )
    }

    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { 
          error: `Edit request is not pending (current status: ${existingRequest.status})`, 
          code: "CONFLICT" 
        },
        { status: 409 }
      )
    }

    // 4. Approve edit request (this also applies changes, logs to audit, and sends notification)
    const approvedRequest = await approveEditRequest(editRequestId, currentUser.id)

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Edit request approved successfully",
        editRequest: {
          id: approvedRequest.id,
          contentType: approvedRequest.contentType,
          contentId: approvedRequest.contentId,
          status: approvedRequest.status,
          reviewedBy: approvedRequest.reviewedBy,
          reviewedAt: approvedRequest.reviewedAt,
        }
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        }
      }
    )
  } catch (error) {
    console.error("Error approving edit request:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: error.message, code: "NOT_FOUND" },
          { status: 404 }
        )
      }
      
      if (error.message.includes("not pending")) {
        return NextResponse.json(
          { error: error.message, code: "CONFLICT" },
          { status: 409 }
        )
      }

      if (error.message.includes("permission") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: error.message, code: "FORBIDDEN" },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
