import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isModerator } from "@/lib/auth-server";
import { getQueueItems, type QueueFilters } from "@/lib/storage/edit-requests";

/**
 * Valid queue types
 */
const VALID_QUEUE_TYPES = ["new-pages", "flagged-health", "coi-edits", "image-reviews"] as const;
type QueueType = typeof VALID_QUEUE_TYPES[number];

/**
 * GET /api/admin/moderation/queues/[type]
 * Returns paginated list of edit requests for a specific queue type
 * Requires moderator role
 * 
 * Queue Types:
 * - new-pages: Newly created content requiring review
 * - flagged-health: Health-related edits requiring expert review
 * - coi-edits: Potential conflict of interest edits
 * - image-reviews: Content with images requiring review
 * 
 * Query Parameters:
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 50) - Number of items per page
 * - contentType: string[] - Filter by content type (blog, wiki, pet, profile)
 * - priority: string[] - Filter by priority (low, normal, high, urgent)
 * - ageInDays: number - Filter by age in days
 * - categories: string[] - Filter by hidden categories
 * 
 * Response:
 * {
 *   "items": EditRequest[],
 *   "total": number,
 *   "page": number,
 *   "limit": number,
 *   "totalPages": number,
 *   "queueType": string,
 *   "metadata": {
 *     "filters": { ... },
 *     "availableFilters": { ... }
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
): Promise<NextResponse> {
  try {
    // Check moderator permission
    const currentUser = await getCurrentUser();
    if (!currentUser || !(await isModerator())) {
      return NextResponse.json(
        { error: "Unauthorized. Moderator access required." },
        { status: 403 }
      );
    }

    // Validate queue type
    const queueType = params.type;
    if (!VALID_QUEUE_TYPES.includes(queueType as QueueType)) {
      return NextResponse.json(
        { 
          error: `Invalid queue type: ${queueType}. Valid types: ${VALID_QUEUE_TYPES.join(", ")}` 
        },
        { status: 400 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: "Invalid page number. Must be >= 1." },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 100." },
        { status: 400 }
      );
    }

    // Filter parameters
    const filters: QueueFilters = {};

    // Content type filter (can be multiple)
    const contentTypeParam = searchParams.get("contentType");
    if (contentTypeParam) {
      const contentTypes = contentTypeParam.split(",").map(t => t.trim());
      const validContentTypes = ["blog", "wiki", "pet", "profile"];
      const invalidTypes = contentTypes.filter(t => !validContentTypes.includes(t));
      
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { 
            error: `Invalid content type(s): ${invalidTypes.join(", ")}. Valid types: ${validContentTypes.join(", ")}` 
          },
          { status: 400 }
        );
      }
      
      filters.contentType = contentTypes;
    }

    // Priority filter (can be multiple)
    const priorityParam = searchParams.get("priority");
    if (priorityParam) {
      const priorities = priorityParam.split(",").map(p => p.trim());
      const validPriorities = ["low", "normal", "high", "urgent"];
      const invalidPriorities = priorities.filter(p => !validPriorities.includes(p));
      
      if (invalidPriorities.length > 0) {
        return NextResponse.json(
          { 
            error: `Invalid priority(ies): ${invalidPriorities.join(", ")}. Valid priorities: ${validPriorities.join(", ")}` 
          },
          { status: 400 }
        );
      }
      
      filters.priority = priorities;
    }

    // Age filter
    const ageInDaysParam = searchParams.get("ageInDays");
    if (ageInDaysParam) {
      const ageInDays = parseInt(ageInDaysParam, 10);
      
      if (isNaN(ageInDays) || ageInDays < 1) {
        return NextResponse.json(
          { error: "Invalid ageInDays. Must be a positive integer." },
          { status: 400 }
        );
      }
      
      filters.ageInDays = ageInDays;
    }

    // Categories filter (can be multiple)
    const categoriesParam = searchParams.get("categories");
    if (categoriesParam) {
      const categories = categoriesParam.split(",").map(c => c.trim());
      filters.categories = categories;
    }

    // Get queue items with filters and pagination
    const result = await getQueueItems(
      queueType as QueueType,
      filters,
      { page, limit }
    );

    // Build metadata for filtering UI
    const metadata = {
      filters: {
        contentType: filters.contentType || [],
        priority: filters.priority || [],
        ageInDays: filters.ageInDays,
        categories: filters.categories || [],
      },
      availableFilters: {
        contentType: ["blog", "wiki", "pet", "profile"],
        priority: ["low", "normal", "high", "urgent"],
      },
      queueDescription: getQueueDescription(queueType as QueueType),
    };

    return NextResponse.json(
      {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        queueType,
        metadata,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(`Error fetching queue items for ${params.type}:`, error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Returns a description for each queue type
 */
function getQueueDescription(queueType: QueueType): string {
  switch (queueType) {
    case "new-pages":
      return "Newly created content requiring initial review and approval";
    case "flagged-health":
      return "Health-related edits that require expert review for accuracy";
    case "coi-edits":
      return "Edits that may have conflict of interest concerns";
    case "image-reviews":
      return "Content containing images that require moderation";
    default:
      return "";
  }
}
