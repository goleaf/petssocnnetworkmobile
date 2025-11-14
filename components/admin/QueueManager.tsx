"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DiffViewer } from "@/components/diff-viewer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BulkOperationsPanel, BulkOperationResult } from "@/components/admin/BulkOperationsPanel";
import type {
  EditRequest,
  PaginatedResult,
  QueueType,
  QueueFilters,
} from "@/lib/types/moderation";

export interface QueueManagerProps {
  /** Type of queue to display */
  queueType: QueueType;
  /** Additional filters to apply */
  filters?: QueueFilters;
  /** Number of items per page */
  pageSize?: number;
  /** Callback when approve button is clicked */
  onApprove?: (id: string) => Promise<void>;
  /** Callback when reject button is clicked */
  onReject?: (id: string) => Promise<void>;
  /** Callback when bulk operation is requested */
  onBulkOperation?: (operation: "approve" | "reject", ids: string[]) => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * QueueManager is a reusable component for displaying and managing specialized
 * moderation queues. It supports bulk selection, filtering, sorting, and displays
 * queue-specific metadata based on the queue type.
 */
export function QueueManager({
  queueType,
  filters = {},
  pageSize = 20,
  onApprove,
  onReject,
  onBulkOperation,
  className,
}: QueueManagerProps) {
  const [data, setData] = useState<PaginatedResult<EditRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"createdAt" | "priority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Get queue title based on type
  const getQueueTitle = () => {
    switch (queueType) {
      case "new-pages":
        return "New Pages Queue";
      case "flagged-health":
        return "Flagged Health Content Queue";
      case "coi-edits":
        return "Conflict of Interest Edits Queue";
      case "image-reviews":
        return "Image Reviews Queue";
      default:
        return "Moderation Queue";
    }
  };

  // Get queue description
  const getQueueDescription = () => {
    switch (queueType) {
      case "new-pages":
        return "Review newly created content before it goes live";
      case "flagged-health":
        return "Health-related content requiring expert review";
      case "coi-edits":
        return "Edits that may have potential conflicts of interest";
      case "image-reviews":
        return "Content with uploaded images requiring review";
      default:
        return "";
    }
  };

  // Fetch queue items from API
  useEffect(() => {
    const fetchQueueItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
          sortBy,
          sortOrder,
        });

        // Add additional filters
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

        const response = await fetch(
          `/api/admin/moderation/queues/${queueType}?${params}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch queue items: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchQueueItems();
  }, [queueType, page, pageSize, sortBy, sortOrder, filters]);

  // Handle individual approve action
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      if (onApprove) {
        await onApprove(id);
      }
      // Refresh the queue after action
      setPage(page);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle individual reject action
  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      if (onReject) {
        await onReject(id);
      }
      // Refresh the queue after action
      setPage(page);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle bulk revert via API
  const handleBulkRevert = async (ids: string[], reason: string): Promise<BulkOperationResult> => {
    try {
      const response = await fetch("/api/admin/moderation/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "revert",
          targetIds: ids,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to revert items: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Refresh the queue after operation
      setPage(page);
      
      return data.result;
    } catch (error) {
      console.error("Bulk revert failed:", error);
      throw error;
    }
  };

  // Handle bulk range block via API
  const handleBulkRangeBlock = async (ids: string[], reason: string): Promise<BulkOperationResult> => {
    try {
      const response = await fetch("/api/admin/moderation/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "range-block",
          targetIds: ids,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to block users: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Refresh the queue after operation
      setPage(page);
      
      return data.result;
    } catch (error) {
      console.error("Bulk range block failed:", error);
      throw error;
    }
  };

  // Toggle single item selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    if (!data) return;

    const currentPageIds = data.items
      .filter((item) => item.status === "pending")
      .map((item) => item.id);

    if (currentPageIds.every((id) => selectedIds.has(id))) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.add(id));
        return next;
      });
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

  // Check if all current page items are selected
  const isAllSelected = data
    ? data.items
        .filter((item) => item.status === "pending")
        .every((item) => selectedIds.has(item.id))
    : false;

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
        <CardHeader>
          <CardTitle>{getQueueTitle()}</CardTitle>
          <p className="text-sm text-muted-foreground">{getQueueDescription()}</p>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          No items in this queue. Great job keeping up with moderation!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Queue Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{getQueueTitle()}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getQueueDescription()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]" aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Operations Panel */}
      {selectedIds.size > 0 && (
        <BulkOperationsPanel
          items={data.items
            .filter((item) => selectedIds.has(item.id))
            .map((item) => ({
              id: item.id,
              label: `${formatContentType(item.contentType)} - ${item.contentId}`,
              description: item.reason,
            }))}
          selectedIds={Array.from(selectedIds)}
          onSelectionChange={(ids) => setSelectedIds(new Set(ids))}
          onBulkRevert={handleBulkRevert}
          onBulkRangeBlock={handleBulkRangeBlock}
          loading={loading}
        />
      )}

      {/* Queue Items Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected && data.items.some((i) => i.status === "pending")}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((request) => (
              <>
                <TableRow key={request.id}>
                  <TableCell>
                    {request.status === "pending" && (
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={() => toggleSelection(request.id)}
                        aria-label={`Select ${request.contentType} edit`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {formatContentType(request.contentType)}
                        </span>
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {request.contentId}
                      </div>
                      {request.reason && (
                        <div className="text-sm">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
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
                      {request.metadata.categories?.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-gray-600">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="text-muted-foreground">
                        User: {request.userId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(request.id)}
                      >
                        {expandedId === request.id ? "Hide" : "Show"} Changes
                      </Button>
                      {request.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {/* Expanded Diff Row */}
                {expandedId === request.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/30">
                      <div className="py-4">
                        <DiffViewer
                          oldValue={request.changes.oldValue || ""}
                          newValue={request.changes.newValue || ""}
                          leftTitle="Original"
                          rightTitle="Proposed"
                          showCopyButton={false}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </Card>

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
