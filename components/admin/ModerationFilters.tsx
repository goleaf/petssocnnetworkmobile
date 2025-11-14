"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModerationFiltersProps {
  /** Callback when filters change */
  onFiltersChange?: (filters: FilterValues) => void;
  /** Additional CSS classes */
  className?: string;
}

export interface FilterValues {
  contentType?: string[];
  status?: string[];
  priority?: string[];
  ageInDays?: number;
}

/**
 * ModerationFilters provides filtering controls for the moderation dashboard.
 * Updates URL query params to maintain filter state across navigation.
 */
export function ModerationFilters({
  onFiltersChange,
  className,
}: ModerationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [contentTypes, setContentTypes] = useState<string[]>(() => {
    const param = searchParams.get("contentType");
    return param ? param.split(",") : [];
  });

  const [statuses, setStatuses] = useState<string[]>(() => {
    const param = searchParams.get("status");
    return param ? param.split(",") : [];
  });

  const [priorities, setPriorities] = useState<string[]>(() => {
    const param = searchParams.get("priority");
    return param ? param.split(",") : [];
  });

  const [ageInDays, setAgeInDays] = useState<string>(() => {
    return searchParams.get("ageInDays") || "";
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (contentTypes.length > 0) {
      params.set("contentType", contentTypes.join(","));
    }
    if (statuses.length > 0) {
      params.set("status", statuses.join(","));
    }
    if (priorities.length > 0) {
      params.set("priority", priorities.join(","));
    }
    if (ageInDays) {
      params.set("ageInDays", ageInDays);
    }

    // Update URL without triggering navigation
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);

    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange({
        contentType: contentTypes.length > 0 ? contentTypes : undefined,
        status: statuses.length > 0 ? statuses : undefined,
        priority: priorities.length > 0 ? priorities : undefined,
        ageInDays: ageInDays ? parseInt(ageInDays, 10) : undefined,
      });
    }
  }, [contentTypes, statuses, priorities, ageInDays, onFiltersChange]);

  // Toggle filter value in array
  const toggleFilter = (
    value: string,
    currentValues: string[],
    setter: (values: string[]) => void
  ) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter((v) => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setContentTypes([]);
    setStatuses([]);
    setPriorities([]);
    setAgeInDays("");
  };

  // Check if any filters are active
  const hasActiveFilters =
    contentTypes.length > 0 ||
    statuses.length > 0 ||
    priorities.length > 0 ||
    ageInDays !== "";

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="content-type-filter">Content Type</Label>
          <Select
            value={contentTypes[0] || ""}
            onValueChange={(value) => {
              if (value) {
                toggleFilter(value, contentTypes, setContentTypes);
              }
            }}
          >
            <SelectTrigger id="content-type-filter" aria-label="Content Type">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blog">Blog Posts</SelectItem>
              <SelectItem value="wiki">Wiki Articles</SelectItem>
              <SelectItem value="pet">Pet Profiles</SelectItem>
              <SelectItem value="profile">User Profiles</SelectItem>
            </SelectContent>
          </Select>
          {contentTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {contentTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter(type, contentTypes, setContentTypes)}
                >
                  {type}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={statuses[0] || ""}
            onValueChange={(value) => {
              if (value) {
                toggleFilter(value, statuses, setStatuses);
              }
            }}
          >
            <SelectTrigger id="status-filter" aria-label="Status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {statuses.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {statuses.map((status) => (
                <Badge
                  key={status}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter(status, statuses, setStatuses)}
                >
                  {status}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label htmlFor="priority-filter">Priority</Label>
          <Select
            value={priorities[0] || ""}
            onValueChange={(value) => {
              if (value) {
                toggleFilter(value, priorities, setPriorities);
              }
            }}
          >
            <SelectTrigger id="priority-filter" aria-label="Priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          {priorities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {priorities.map((priority) => (
                <Badge
                  key={priority}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleFilter(priority, priorities, setPriorities)}
                >
                  {priority}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Age Filter */}
        <div className="space-y-2">
          <Label htmlFor="age-filter">Max Age (days)</Label>
          <Input
            id="age-filter"
            type="number"
            min="1"
            placeholder="e.g., 7 for last week"
            value={ageInDays}
            onChange={(e) => setAgeInDays(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Show only items from the last N days
          </p>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">Active Filters:</div>
            <div className="text-sm text-muted-foreground">
              {contentTypes.length > 0 && (
                <div>Content Types: {contentTypes.join(", ")}</div>
              )}
              {statuses.length > 0 && (
                <div>Statuses: {statuses.join(", ")}</div>
              )}
              {priorities.length > 0 && (
                <div>Priorities: {priorities.join(", ")}</div>
              )}
              {ageInDays && <div>Max Age: {ageInDays} days</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
