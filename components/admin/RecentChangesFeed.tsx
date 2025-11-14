"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiffViewer } from "@/components/diff-viewer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditRequest, PaginatedResult } from "@/lib/types/moderation";

export interface RecentChangesFeedProps {
  /** Filters to apply to the feed */
  filters?: {
    contentType?: string[];
    status?: string[];
    priority?: string[];
    ageInDays?: number;
  };
  /** Number of items per page */
  pageSize?: number;
  /** Callback when approve button is clicked */
  onApprove?: (id: string) => void;
  /** Callback when reject button is clicked */
  onReject?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RecentChangesFeed displays a paginated list of edit requests with visual diffs
 * and moderation actions. Integrates with the existing diff viewer component.
 */
export function RecentChangesFeed({
  filters = {},
  pageSize = 10,
  onApprove,
  onReject,
  className,
}: RecentChangesFeedProps) {
  const [data, setData] = useState<PaginatedResult<EditRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch edit requests from API
  useEffect(() => {
    const fetchEditRequests = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });

        // Add filters to query params
        if (filters.contentType?.length) {
          params.append("contentType", filters.contentType.join(","));
        }
        if (filters.status?.length) {
          params.append("status", filters.status.join(","));
        }
        if (filters.priority?.length) {
          params.append("priority", filters.priority.join(","));
        }
        if (filters.ageInDays) {
          params.append("ageInDays", filters.ageInDays.toString());
        }

        const response = await fetch(`/api/admin/moderation/recent-changes?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch edit requests: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEditRequests();
  }, [page, pageSize, filters]);

  // Handle approve action
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      if (onApprove) {
        await onApprove(id);
      }
      // Refresh the feed after action
      setPage(page); // Trigger re-fetch
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject action
  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      if (onReject) {
        await onReject(id);
      }
      // Refresh the feed after action
      setPage(page); // Trigger re-fetch
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle diff expansion
  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Format content type for display
  const formatContentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center text-muted-foreground">
          No edit requests found matching the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Edit Request List */}
      {data.items.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base">
                    {formatContentType(request.contentType)} Edit
                  </CardTitle>
                  <Badge variant={getPriorityColor(request.priority)}>
                    {request.priority}
                  </Badge>
                  <Badge variant={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  {request.metadata.isCOI && (
                    <Badge variant="outline" className="text-orange-600">
                      COI
                    </Badge>
                  )}
                  {request.metadata.isFlaggedHealth && (
                    <Badge variant="outline" className="text-red-600">
                      Health
                    </Badge>
                  )}
                  {request.metadata.isNewPage && (
                    <Badge variant="outline" className="text-blue-600">
                      New Page
                    </Badge>
                  )}
                  {request.metadata.hasImages && (
                    <Badge variant="outline" className="text-purple-600">
                      Images
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>Content ID: {request.contentId}</span>
                  <span className="mx-2">•</span>
                  <span>User: {request.userId}</span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center gap-1 inline-flex">
                    <Clock className="h-3 w-3" />
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>
                {request.reason && (
                  <div className="text-sm">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {request.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(request.id)}
                    disabled={actionLoading === request.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(request.id)}
                    disabled={actionLoading === request.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Toggle Diff Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(request.id)}
              className="mb-2"
            >
              {expandedId === request.id ? "Hide" : "Show"} Changes
            </Button>

            {/* Diff Viewer */}
            {expandedId === request.id && (
              <div className="mt-4">
                <DiffViewer
                  oldValue={request.changes.oldValue || ""}
                  newValue={request.changes.newValue || ""}
                  leftTitle="Original"
                  rightTitle="Proposed"
                  showCopyButton={false}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Pagination Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages} ({data.totalCount} total items)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!data.hasPreviousPage || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!data.hasNextPage || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
