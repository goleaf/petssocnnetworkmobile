import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isModerator } from "@/lib/auth-server";
import { getRecentChanges, type QueueFilters } from "@/lib/storage/edit-requests";

/**
 * GET /api/admin/moderation/recent-changes
 * Returns paginated list of recent edit requests with diff previews
 * Requires moderator role
 * 
 * Query Parameters:
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 50) - Number of items per page
 * - contentType: string[] - Filter by content type (blog, wiki, pet, profile)
 * - status: string[] - Filter by status (pending, approved, rejected)
 * - priority: string[] - Filter by priority (low, normal, high, urgent)
 * - ageInDays: number - Filter by age in days (default: 30)
 * 
 * Response:
 * {
 *   "items": EditRequest[],
 *   "total": number,
 *   "page": number,
 *   "limit": number,
 *   "totalPages": number,
 *   "metadata": {
 *     "filters": { ... },
 *     "availableFilters": { ... }
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check moderator permission
    const currentUser = await getCurrentUser();
    if (!currentUser || !(await isModerator())) {
      return NextResponse.json(
        { error: "Unauthorized. Moderator access required." },
        { status: 403 }
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

    // Status filter (can be multiple)
    const statusParam = searchParams.get("status");
    if (statusParam) {
      const statuses = statusParam.split(",").map(s => s.trim());
      const validStatuses = ["pending", "approved", "rejected"];
      const invalidStatuses = statuses.filter(s => !validStatuses.includes(s));
      
      if (invalidStatuses.length > 0) {
        return NextResponse.json(
          { 
            error: `Invalid status(es): ${invalidStatuses.join(", ")}. Valid statuses: ${validStatuses.join(", ")}` 
          },
          { status: 400 }
        );
      }
      
      filters.status = statuses;
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

    // Get recent changes with filters and pagination
    const result = await getRecentChanges(filters, { page, limit });

    // Build metadata for filtering UI
    const metadata = {
      filters: {
        contentType: filters.contentType || [],
        status: filters.status || [],
        priority: filters.priority || [],
        ageInDays: filters.ageInDays || 30,
      },
      availableFilters: {
        contentType: ["blog", "wiki", "pet", "profile"],
        status: ["pending", "approved", "rejected"],
        priority: ["low", "normal", "high", "urgent"],
      },
    };

    return NextResponse.json(
      {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
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
    console.error("Error fetching recent changes:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
