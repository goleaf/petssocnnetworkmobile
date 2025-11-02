import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ModerationCasesPage() {
  const cases = await prisma.moderationQueue.findMany({
    where: {
      status: {
        in: ["pending", "in_review"],
      },
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
        <h1 className="text-3xl font-bold mb-2">Open Moderation Cases</h1>
        <p className="text-muted-foreground">
          {cases.length} cases currently open
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Cases</CardTitle>
          <CardDescription>Cases pending review or in progress</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No open cases found</p>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            caseItem.priority === "urgent"
                              ? "destructive"
                              : caseItem.priority === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {caseItem.priority}
                        </Badge>
                        <Badge
                          variant={
                            caseItem.status === "in_review" ? "default" : "secondary"
                          }
                        >
                          {caseItem.status}
                        </Badge>
                        <Badge variant="outline">{caseItem.contentType}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Content ID: {caseItem.contentId}</div>
                        <div>Report Count: {caseItem.reportCount}</div>
                        <div>Created: {caseItem.createdAt.toLocaleString()}</div>
                        {caseItem.assignedTo && (
                          <div>Assigned to: {caseItem.assignedTo}</div>
                        )}
                        {caseItem.autoFlagged && (
                          <div className="text-orange-600">Auto-flagged: {caseItem.autoReason}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

