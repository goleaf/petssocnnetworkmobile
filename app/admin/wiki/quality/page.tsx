/**
 * Admin Wiki Quality Page
 * 
 * Lists quality issues: stale health pages, missing citations, orphaned pages, broken links
 * Includes filters, pagination, and assign reviewer functionality
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  Link as LinkIcon, 
  Edit,
  UserPlus,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface QualityItem {
  id: string;
  slug: string;
  title: string;
  type: string;
  updatedAt?: string;
  lastReviewedAt?: string | null;
  lastRevisionRev?: number;
  assignedTo?: string | null;
}

interface BrokenLink extends QualityItem {
  sourceId: string;
  url: string;
  isValid: boolean | null;
  brokenAt: string | null;
  lastChecked: string | null;
  article: {
    id: string;
    slug: string;
    title: string;
    type: string;
  };
}

interface QualityData {
  citations: QualityItem[];
  reviews: QualityItem[];
  links: BrokenLink[];
  orphaned: QualityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminWikiQualityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingLinks, setRetryingLinks] = useState<Set<string>>(new Set());
  const [assigningReviewer, setAssigningReviewer] = useState<Set<string>>(new Set());

  const activeTab = searchParams.get("tab") || "citations";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const typeFilter = searchParams.get("type") || "";
  const searchQuery = searchParams.get("search") || "";

  const fetchQualityData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("tab", activeTab);
      params.set("page", page.toString());
      if (typeFilter) params.set("type", typeFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/wiki/quality?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch quality data");
      }
      const qualityData = await response.json();
      setData(qualityData);
    } catch (error) {
      console.error("Error fetching quality data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, typeFilter, searchQuery]);

  useEffect(() => {
    fetchQualityData();
  }, [fetchQualityData]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    params.delete("page"); // Reset to page 1 when changing tabs
    router.push(`/admin/wiki/quality?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/wiki/quality?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 when filtering
    router.push(`/admin/wiki/quality?${params.toString()}`);
  };

  const handleRetryLink = async (sourceId: string) => {
    try {
      setRetryingLinks((prev) => new Set(prev).add(sourceId));
      const response = await fetch("/api/admin/wiki/quality/recheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to recheck link");
      }

      // Refresh the data
      await fetchQualityData();
    } catch (error) {
      console.error("Error retrying link:", error);
      alert("Failed to recheck link");
    } finally {
      setRetryingLinks((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
  };

  const handleAssignReviewer = async (articleId: string, section?: string) => {
    try {
      setAssigningReviewer((prev) => new Set(prev).add(articleId));
      const response = await fetch("/api/admin/wiki/quality/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleId, section }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign reviewer");
      }

      // Refresh the data
      await fetchQualityData();
      alert("Reviewer assigned successfully");
    } catch (error) {
      console.error("Error assigning reviewer:", error);
      alert("Failed to assign reviewer");
    } finally {
      setAssigningReviewer((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    }
  };

  const openEditor = (slug: string, type: string, section?: string) => {
    const editUrl = `/wiki/${slug}/edit${section ? `#${section}` : ""}`;
    window.open(editUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Failed to load quality data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTypeOptions = () => {
    const types = new Set<string>();
    if (activeTab === "citations") {
      data.citations.forEach((item) => types.add(item.type));
    } else if (activeTab === "reviews") {
      data.reviews.forEach((item) => types.add(item.type));
    } else if (activeTab === "links") {
      data.links.forEach((link) => types.add(link.article.type));
    } else if (activeTab === "orphaned") {
      data.orphaned.forEach((item) => types.add(item.type));
    }
    return Array.from(types).sort();
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case "citations":
        return data.citations;
      case "reviews":
        return data.reviews;
      case "links":
        return data.links;
      case "orphaned":
        return data.orphaned;
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wiki Quality Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage wiki content quality issues
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="citations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Citations ({data.citations.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Stale Reviews ({data.reviews.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Broken Links ({data.links.length})
          </TabsTrigger>
          <TabsTrigger value="orphaned" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Orphaned ({data.orphaned.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select
            value={typeFilter || "__all"}
            onValueChange={(value) => handleFilterChange("type", value === "__all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All types</SelectItem>
              {getTypeOptions().map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="citations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pages Needing Citations</CardTitle>
              <CardDescription>
                Articles that lack source citations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pages need citations
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/wiki/${item.slug}`}
                            className="font-semibold hover:underline"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Rev {item.lastRevisionRev || 0}
                            </span>
                            {item.updatedAt && (
                              <span className="text-sm text-muted-foreground">
                                Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                              </span>
                            )}
                            {item.assignedTo && (
                              <Badge variant="secondary" className="text-xs">
                                Assigned: {item.assignedTo.slice(0, 8)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignReviewer(item.id)}
                            disabled={assigningReviewer.has(item.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {assigningReviewer.has(item.id) ? "Assigning..." : "Assign Reviewer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditor(item.slug, item.type)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {data.page} of {data.totalPages} ({data.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= data.totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stale Health Pages</CardTitle>
              <CardDescription>
                Health pages that haven't been reviewed in 12+ months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No stale reviews
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/wiki/${item.slug}`}
                            className="font-semibold hover:underline"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Rev {item.lastRevisionRev || 0}
                            </span>
                            {item.lastReviewedAt && (
                              <span className="text-sm text-muted-foreground">
                                Last reviewed {formatDistanceToNow(new Date(item.lastReviewedAt), { addSuffix: true })}
                              </span>
                            )}
                            {item.assignedTo && (
                              <Badge variant="secondary" className="text-xs">
                                Assigned: {item.assignedTo.slice(0, 8)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignReviewer(item.id)}
                            disabled={assigningReviewer.has(item.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {assigningReviewer.has(item.id) ? "Assigning..." : "Assign Reviewer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditor(item.slug, item.type)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {data.page} of {data.totalPages} ({data.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= data.totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broken External Links</CardTitle>
              <CardDescription>
                External links that are broken or invalid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No broken links found
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {(currentItems as BrokenLink[]).map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/wiki/${link.article.slug}`}
                              className="font-semibold hover:underline"
                            >
                              {link.article.title}
                            </Link>
                            <Badge variant="outline">{link.article.type}</Badge>
                          </div>
                          <div className="mt-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {link.title || link.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {link.lastChecked && (
                              <span className="text-xs text-muted-foreground">
                                Last checked: {formatDistanceToNow(new Date(link.lastChecked), { addSuffix: true })}
                              </span>
                            )}
                            {link.brokenAt && (
                              <Badge variant="destructive" className="text-xs">
                                Broken {formatDistanceToNow(new Date(link.brokenAt), { addSuffix: true })}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryLink(link.sourceId)}
                            disabled={retryingLinks.has(link.sourceId)}
                          >
                            <RefreshCw 
                              className={`h-4 w-4 mr-2 ${retryingLinks.has(link.sourceId) ? "animate-spin" : ""}`}
                            />
                            Re-check
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditor(link.article.slug, link.article.type, `source-${link.sourceId}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Section
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {data.page} of {data.totalPages} ({data.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= data.totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orphaned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orphaned Pages</CardTitle>
              <CardDescription>
                Articles that don't link to or from other articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No orphaned pages found
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/wiki/${item.slug}`}
                            className="font-semibold hover:underline"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{item.type}</Badge>
                            {item.updatedAt && (
                              <span className="text-sm text-muted-foreground">
                                Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                              </span>
                            )}
                            {item.assignedTo && (
                              <Badge variant="secondary" className="text-xs">
                                Assigned: {item.assignedTo.slice(0, 8)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignReviewer(item.id)}
                            disabled={assigningReviewer.has(item.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {assigningReviewer.has(item.id) ? "Assigning..." : "Assign Reviewer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditor(item.slug, item.type)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {data.page} of {data.totalPages} ({data.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= data.totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

