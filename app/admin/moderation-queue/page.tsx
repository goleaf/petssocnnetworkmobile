"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  AlertCircle,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type {
  ModerationQueueItem,
  ModerationContentType,
  ModerationAction,
} from "@/lib/types"
import {
  getQueueItemsByType,
  processModerationAction,
  assignToModerator,
} from "@/lib/utils/moderation-queue"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

const CONTENT_TYPE_LABELS: Record<ModerationContentType, string> = {
  post: "Posts",
  comment: "Comments",
  media: "Media Uploads",
  wiki_revision: "Wiki Revisions",
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-gray-500",
}

export default function ModerationQueuePage() {
  const [activeTab, setActiveTab] = useState<ModerationContentType>("post")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [sortBy, setSortBy] = useState<"priority" | "aiScore" | "createdAt">("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [items, setItems] = useState<ModerationQueueItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [action, setAction] = useState<ModerationAction>("approve")
  const [justification, setJustification] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadQueue()
  }, [activeTab, page, sortBy, sortOrder])

  const loadQueue = () => {
    setLoading(true)
    try {
      const result = getQueueItemsByType(activeTab, { page, pageSize }, {
        status: "pending",
        sortBy,
        sortOrder,
      })
      setItems(result.items)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error("Error loading queue:", error)
      toast.error("Failed to load moderation queue")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedItem || !justification.trim()) {
      toast.error("Please provide a justification for this action")
      return
    }

    setProcessing(true)
    try {
      const result = processModerationAction(
        selectedItem.id,
        action,
        "current-user-id", // TODO: Get from auth
        justification
      )

      if (result.success) {
        toast.success(`Item ${action}d successfully`)
        setActionDialogOpen(false)
        setSelectedItem(null)
        setJustification("")
        loadQueue()
      } else {
        toast.error(result.error || "Failed to process action")
      }
    } catch (error) {
      console.error("Error processing action:", error)
      toast.error("An error occurred while processing the action")
    } finally {
      setProcessing(false)
    }
  }

  const handleSort = (field: "priority" | "aiScore" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const SortButton = ({ field }: { field: "priority" | "aiScore" | "createdAt" }) => {
    const isActive = sortBy === field
    const Icon = isActive && sortOrder === "asc" ? SortAsc : SortDesc
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(field)}
        className="h-8 w-8 p-0"
      >
        <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
      </Button>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            Review and moderate content across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as ModerationContentType)
            setPage(1)
          }}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(CONTENT_TYPE_LABELS).map((contentType) => (
              <TabsContent key={contentType} value={contentType} className="mt-6">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items in queue
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {items.length} of {total} items
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          Page {page} of {totalPages}
                        </Badge>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content ID</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              Priority
                              <SortButton field="priority" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              AI Score
                              <SortButton field="aiScore" />
                            </div>
                          </TableHead>
                          <TableHead>Reports</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              Created
                              <SortButton field="createdAt" />
                            </div>
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">
                              {item.contentId.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={PRIORITY_COLORS[item.priority]}
                                variant="default"
                              >
                                {item.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.aiScore !== undefined ? (
                                <Badge variant="outline">{item.aiScore}</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>{item.reportCount}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog
                                  open={actionDialogOpen && selectedItem?.id === item.id}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setSelectedItem(item)
                                      setAction("approve")
                                      setJustification("")
                                    } else {
                                      setSelectedItem(null)
                                    }
                                    setActionDialogOpen(open)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setAction("approve")
                                        setJustification("")
                                        setActionDialogOpen(true)
                                      }}
                                    >
                                      Review
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Moderation Action</DialogTitle>
                                      <DialogDescription>
                                        Select an action and provide justification
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Action</Label>
                                        <Select
                                          value={action}
                                          onValueChange={(v) =>
                                            setAction(v as ModerationAction)
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="approve">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                Approve
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="reject">
                                              <div className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                Reject
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="redact">
                                              <div className="flex items-center gap-2">
                                                <Edit className="h-4 w-4 text-yellow-500" />
                                                Redact
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="delete">
                                              <div className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                Delete
                                              </div>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="justification">
                                          Justification <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                          id="justification"
                                          value={justification}
                                          onChange={(e) => setJustification(e.target.value)}
                                          placeholder="Provide a reason for this action..."
                                          rows={4}
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setActionDialogOpen(false)
                                            setSelectedItem(null)
                                            setJustification("")
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={handleAction}
                                          disabled={processing || !justification.trim()}
                                        >
                                          {processing ? "Processing..." : "Submit"}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

