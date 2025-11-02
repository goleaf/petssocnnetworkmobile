"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  Link as LinkIcon, 
  Edit,
  UserPlus,
  Clock,
  ExternalLink
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
}

export default function WikiQualityDashboard() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingLinks, setRetryingLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/wiki/quality");
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
  };

  const handleRetryLink = async (sourceId: string) => {
    try {
      setRetryingLinks((prev) => new Set(prev).add(sourceId));
      const response = await fetch("/api/wiki/quality/recheck", {
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
      const response = await fetch("/api/wiki/quality/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleId, section }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign reviewer");
      }

      // Show success message (in a real app, use toast)
      alert("Reviewer assigned successfully");
    } catch (error) {
      console.error("Error assigning reviewer:", error);
      alert("Failed to assign reviewer");
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wiki Quality Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage wiki content quality issues
        </p>
      </div>

      <Tabs defaultValue="citations" className="w-full">
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

        <TabsContent value="citations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pages Needing Citations</CardTitle>
              <CardDescription>
                Articles that lack source citations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.citations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pages need citations
                </p>
              ) : (
                <div className="space-y-2">
                  {data.citations.map((item) => (
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignReviewer(item.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Reviewer
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stale Reviews</CardTitle>
              <CardDescription>
                Articles that haven't been reviewed in 6+ months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No stale reviews
                </p>
              ) : (
                <div className="space-y-2">
                  {data.reviews.map((item) => (
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignReviewer(item.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Reviewer
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broken Links</CardTitle>
              <CardDescription>
                External links that are broken or invalid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.links.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No broken links found
                </p>
              ) : (
                <div className="space-y-2">
                  {data.links.map((link) => (
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
                          onClick={() => handleRetryLink(link.id)}
                          disabled={retryingLinks.has(link.id)}
                        >
                          <RefreshCw 
                            className={`h-4 w-4 mr-2 ${retryingLinks.has(link.id) ? "animate-spin" : ""}`}
                          />
                          Retry
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
              {data.orphaned.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No orphaned pages found
                </p>
              ) : (
                <div className="space-y-2">
                  {data.orphaned.map((item) => (
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

