"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// ScrollArea and Separator replaced with standard HTML
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GitCompare, Plus, Minus, FileText, Clock, User } from "lucide-react"
import type { WikiRevision, RevisionDiff } from "@/lib/types"
import { getWikiRevisionById } from "@/lib/storage"

interface RevisionDiffViewerProps {
  articleId: string
  currentRevisionId: string
  revisions: WikiRevision[]
  onSelectRevision?: (revisionId: string) => void
}

export function RevisionDiffViewer({
  articleId,
  currentRevisionId,
  revisions,
  onSelectRevision,
}: RevisionDiffViewerProps) {
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>(currentRevisionId)
  const [compareWithId, setCompareWithId] = useState<string | null>(null)
  const NO_COMPARISON_VALUE = "__previous"

  const selectedRevision = revisions.find((r) => r.id === selectedRevisionId)
  const compareRevision = compareWithId
    ? revisions.find((r) => r.id === compareWithId)
    : selectedRevision
    ? revisions.find((r) => r.rev === selectedRevision.rev - 1)
    : null

  const diff = selectedRevision?.diff

  const handleRevisionChange = (revisionId: string) => {
    setSelectedRevisionId(revisionId)
    onSelectRevision?.(revisionId)
  }

  return (
    <div className="space-y-4">
      {/* Revision Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Viewing Revision</Label>
              <Select value={selectedRevisionId} onValueChange={handleRevisionChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {revisions.map((rev) => (
                    <SelectItem key={rev.id} value={rev.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant={rev.status === "stable" ? "default" : "secondary"}>
                          Rev {rev.rev}
                        </Badge>
                        <span className="text-sm">{rev.summary || "No summary"}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Compare With</Label>
              <Select
                value={compareWithId ?? NO_COMPARISON_VALUE}
                onValueChange={(value) =>
                  setCompareWithId(value === NO_COMPARISON_VALUE ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Previous revision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COMPARISON_VALUE}>Previous revision</SelectItem>
                  {revisions
                    .filter((r) => r.id !== selectedRevisionId)
                    .map((rev) => (
                      <SelectItem key={rev.id} value={rev.id}>
                        Rev {rev.rev} - {rev.summary || "No summary"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedRevision && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(selectedRevision.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Author ID: {selectedRevision.authorId}
              </div>
              <Badge variant={getStatusVariant(selectedRevision.status)}>
                {selectedRevision.status}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diff View */}
      {diff && (
        <Card>
          <CardHeader>
            <CardTitle>Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-y-auto">
              <div className="space-y-6">
                {/* Added Blocks */}
                {diff.added.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-green-600">Added ({diff.added.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {diff.added.map((block) => (
                        <div
                          key={block.id}
                          className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg"
                        >
                          <BlockContent block={block} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modified Blocks */}
                {diff.modified.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-blue-600">
                        Modified ({diff.modified.length})
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {diff.modified.map((change) => (
                        <div
                          key={change.blockId}
                          className="space-y-2 border rounded-lg p-4"
                        >
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded">
                            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">
                              Original:
                            </p>
                            <BlockContent block={change.original} />
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                              Modified:
                            </p>
                            <BlockContent block={change.modified} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deleted Blocks */}
                {diff.deleted.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Minus className="h-4 w-4 text-red-600" />
                      <h3 className="font-semibold text-red-600">Deleted ({diff.deleted.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {diff.deleted.map((block) => (
                        <div
                          key={block.id}
                          className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg"
                        >
                          <BlockContent block={block} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Infobox Changes */}
                {diff.infoboxChanges && Object.keys(diff.infoboxChanges).length > 0 && (
                  <div>
                    <hr className="my-4" />
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-purple-600">Infobox Changes</h3>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(diff.infoboxChanges).map(([key, change]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">{key}</p>
                          {change.original !== undefined && (
                            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded mb-2">
                              <p className="text-xs text-muted-foreground mb-1">Original:</p>
                              <p className="text-sm">
                                {typeof change.original === "object"
                                  ? JSON.stringify(change.original, null, 2)
                                  : String(change.original)}
                              </p>
                            </div>
                          )}
                          {change.modified !== undefined && (
                            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                              <p className="text-xs text-muted-foreground mb-1">Modified:</p>
                              <p className="text-sm">
                                {typeof change.modified === "object"
                                  ? JSON.stringify(change.modified, null, 2)
                                  : String(change.modified)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diff.added.length === 0 &&
                  diff.modified.length === 0 &&
                  diff.deleted.length === 0 &&
                  (!diff.infoboxChanges ||
                    Object.keys(diff.infoboxChanges).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No changes to display</p>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BlockContent({ block }: { block: any }) {
  return (
    <div className="text-sm">
      {block.type === "heading" && (
        <h4 className="font-semibold">{block.content}</h4>
      )}
      {block.type === "paragraph" && <p>{block.content}</p>}
      {block.type === "list" && (
        <ul className="list-disc list-inside">
          {Array.isArray(block.content) &&
            block.content.map((item: string, i: number) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {block.type === "image" && (
        <div>
          <img src={block.content} alt={block.metadata?.alt || ""} className="max-w-full rounded" />
        </div>
      )}
      {block.type === "code" && (
        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
          <code>{block.content}</code>
        </pre>
      )}
      {block.type === "quote" && (
        <blockquote className="border-l-4 pl-4 italic">{block.content}</blockquote>
      )}
    </div>
  )
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "stable":
      return "default"
    case "approved":
      return "default"
    case "pending":
      return "secondary"
    case "rejected":
      return "destructive"
    default:
      return "outline"
  }
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}

