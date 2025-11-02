import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subDays } from "date-fns"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function FlaggedEditsPage() {
  const oneDayAgo = subDays(new Date(), 1)
  
  const revisions = await prisma.revision.findMany({
    where: {
      approvedAt: null,
      createdAt: {
        lt: oneDayAgo,
      },
      article: {
        type: "health",
      },
    },
    include: {
      article: true,
    },
    orderBy: {
      createdAt: "asc",
    },
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
        <h1 className="text-3xl font-bold mb-2">Flagged Wiki Edits</h1>
        <p className="text-muted-foreground">
          {revisions.length} revisions pending approval for more than 24 hours
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Revisions</CardTitle>
          <CardDescription>Wiki edits awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No flagged edits found</p>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision) => (
                <div key={revision.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Revision {revision.rev}</Badge>
                        <span className="font-medium">{revision.article.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Article: {revision.article.slug}</div>
                        <div>Author: {revision.authorId}</div>
                        <div>Created: {revision.createdAt.toLocaleString()}</div>
                        {revision.summary && (
                          <div className="mt-2">Summary: {revision.summary}</div>
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

