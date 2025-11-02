import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function QueueBacklogPage() {
  const items = await prisma.moderationQueue.findMany({
    where: {
      status: "pending",
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
    take: 100,
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Queue Backlog</h1>
        <p className="text-muted-foreground">
          {items.length} items pending in the moderation queue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Queue Items</CardTitle>
          <CardDescription>Items awaiting moderation</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No items in queue backlog</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const daysSinceCreation = Math.floor(
                  (new Date().getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              item.priority === "urgent"
                                ? "destructive"
                                : item.priority === "high"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.priority}
                          </Badge>
                          <Badge variant="outline">{item.contentType}</Badge>
                          {item.autoFlagged && (
                            <Badge variant="secondary">Auto-flagged</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Content ID: {item.contentId}</div>
                          <div>Report Count: {item.reportCount}</div>
                          <div>Created: {item.createdAt.toLocaleString()}</div>
                          <div className="text-orange-600">
                            Days in queue: {daysSinceCreation}
                          </div>
                          {item.autoReason && (
                            <div>Auto-reason: {item.autoReason}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

