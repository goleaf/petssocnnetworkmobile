import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth-server"
import { checkEditSubmissionRateLimit } from "@/lib/server-rate-limit"
import { createEditRequest } from "@/lib/storage/edit-requests"
import { 
  calculateBlogDiff, 
  calculateWikiDiff, 
  calculatePetDiff, 
  calculateProfileDiff,
  extractLinks 
} from "@/lib/diff-utils"

/**
 * Validation schema for edit request creation
 */
const createEditRequestSchema = z.object({
  contentType: z.enum(["blog", "wiki", "pet", "profile"]),
  contentId: z.string().min(1, "Content ID is required"),
  originalContent: z.record(z.unknown()),
  editedContent: z.record(z.unknown()),
  reason: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})

/**
 * POST /api/admin/moderation/edit-requests
 * Creates a new edit request for content moderation
 * 
 * Requires authentication
 * Enforces rate limits: 10 edits/hour, 50 edits/day
 * 
 * @param request - Next.js request object
 * @returns Edit request ID and confirmation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    // 2. Check rate limits
    const rateLimitResult = checkEditSubmissionRateLimit(currentUser.id)
    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs / 1000)
      const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60)
      
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            retryAfterSeconds,
            retryAfterMinutes,
            remaining: rateLimitResult.remaining,
          }
        },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
          }
        }
      )
    }

    // 3. Validate request body
    const body = await request.json()
    const validation = createEditRequestSchema.safeParse(body)

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

    const { contentType, contentId, originalContent, editedContent, reason, priority } = validation.data

    // 4. Calculate diff based on content type
    let changes: Record<string, unknown>
    switch (contentType) {
      case "blog":
        changes = calculateBlogDiff(
          originalContent as Parameters<typeof calculateBlogDiff>[0],
          editedContent as Parameters<typeof calculateBlogDiff>[0]
        )
        break
      case "wiki":
        changes = calculateWikiDiff(
          originalContent as Parameters<typeof calculateWikiDiff>[0],
          editedContent as Parameters<typeof calculateWikiDiff>[0]
        )
        break
      case "pet":
        changes = calculatePetDiff(
          originalContent as Parameters<typeof calculatePetDiff>[0],
          editedContent as Parameters<typeof calculatePetDiff>[0]
        )
        break
      case "profile":
        changes = calculateProfileDiff(
          originalContent as Parameters<typeof calculateProfileDiff>[0],
          editedContent as Parameters<typeof calculateProfileDiff>[0]
        )
        break
      default:
        return NextResponse.json(
          { error: "Unsupported content type", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
    }

    // Check if there are any actual changes
    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { error: "No changes detected", code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    // 5. Classify edit (COI, health, new page, images)
    const classification = classifyEdit(contentType, changes, editedContent, currentUser.id, contentId)

    // 6. Create edit request
    const editRequest = await createEditRequest({
      contentType,
      contentId,
      userId: currentUser.id,
      changes,
      reason,
      priority,
      isCOI: classification.isCOI,
      isFlaggedHealth: classification.isFlaggedHealth,
      isNewPage: classification.isNewPage,
      hasImages: classification.hasImages,
      categories: classification.categories,
    })

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        editRequestId: editRequest.id,
        message: "Edit request submitted successfully. Your changes will be reviewed by a moderator.",
        classification: {
          isCOI: classification.isCOI,
          isFlaggedHealth: classification.isFlaggedHealth,
          isNewPage: classification.isNewPage,
          hasImages: classification.hasImages,
        },
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          retryAfterMs: rateLimitResult.retryAfterMs,
        }
      },
      { 
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        }
      }
    )
  } catch (error) {
    console.error("Error creating edit request:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: error.message, code: "NOT_FOUND" },
          { status: 404 }
        )
      }
      
      if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        return NextResponse.json(
          { error: error.message, code: "CONFLICT" },
          { status: 409 }
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

/**
 * Classification result for edit requests
 */
interface EditClassification {
  isCOI: boolean
  isFlaggedHealth: boolean
  isNewPage: boolean
  hasImages: boolean
  categories: string[]
}

/**
 * Classifies an edit request based on content and metadata
 * 
 * @param contentType - Type of content being edited
 * @param changes - Calculated diff of changes
 * @param editedContent - Full edited content object
 * @param userId - ID of user making the edit
 * @param contentId - ID of content being edited
 * @returns Classification flags and categories
 */
function classifyEdit(
  contentType: string,
  changes: Record<string, unknown>,
  editedContent: Record<string, unknown>,
  userId: string,
  contentId: string
): EditClassification {
  const classification: EditClassification = {
    isCOI: false,
    isFlaggedHealth: false,
    isNewPage: false,
    hasImages: false,
    categories: [],
  }

  // Check for new page (content ID starts with "new-" or is a temporary ID)
  if (contentId.startsWith("new-") || contentId.startsWith("temp-") || contentId.startsWith("draft-")) {
    classification.isNewPage = true
    classification.categories.push("new-pages")
  }

  // Check for health-related content
  const healthKeywords = [
    "health", "medical", "disease", "illness", "symptom", "treatment", 
    "medication", "vaccine", "vet", "veterinary", "diagnosis", "prescription",
    "surgery", "emergency", "poison", "toxic", "injury", "pain"
  ]
  
  const contentText = JSON.stringify(editedContent).toLowerCase()
  const hasHealthKeywords = healthKeywords.some(keyword => contentText.includes(keyword))
  
  if (hasHealthKeywords || (contentType === "wiki" && editedContent.category === "health")) {
    classification.isFlaggedHealth = true
    classification.categories.push("flagged-health")
  }

  // Check for Conflict of Interest (COI)
  // COI is flagged if user is editing content they created or have a relationship with
  if (editedContent.authorId === userId || editedContent.ownerId === userId) {
    classification.isCOI = true
    classification.categories.push("coi-edits")
  }

  // Check for brand/product mentions (potential COI)
  const brandKeywords = ["buy", "purchase", "discount", "sale", "affiliate", "sponsored", "partner"]
  const hasBrandKeywords = brandKeywords.some(keyword => contentText.includes(keyword))
  
  if (hasBrandKeywords) {
    classification.isCOI = true
    if (!classification.categories.includes("coi-edits")) {
      classification.categories.push("coi-edits")
    }
  }

  // Check for images in changes or content
  const hasImageChanges = Object.keys(changes).some(key => 
    key.toLowerCase().includes("image") || 
    key.toLowerCase().includes("photo") ||
    key.toLowerCase().includes("avatar") ||
    key.toLowerCase().includes("cover")
  )
  
  const hasImageContent = 
    editedContent.coverImage ||
    editedContent.avatarUrl ||
    editedContent.images ||
    (editedContent.media && Array.isArray(editedContent.media) && editedContent.media.length > 0)
  
  if (hasImageChanges || hasImageContent) {
    classification.hasImages = true
    classification.categories.push("image-reviews")
  }

  // Check for links (potential spam or malicious content)
  const links = extractLinks(contentText)
  if (links.length > 0) {
    classification.categories.push("link-review")
  }

  // Check for regulatory/legal content
  const legalKeywords = ["law", "legal", "regulation", "policy", "compliance", "license", "permit"]
  const hasLegalKeywords = legalKeywords.some(keyword => contentText.includes(keyword))
  
  if (hasLegalKeywords) {
    classification.categories.push("regulatory-review")
  }

  return classification
}

