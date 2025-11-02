import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subDays } from "date-fns"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ReportsPage() {
  const twentyFourHoursAgo = subDays(new Date(), 1)
  
  const reports = await prisma.contentReport.findMany({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
    include: {
      reason: true,
    },
    orderBy: {
      createdAt: "desc",
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
        <h1 className="text-3xl font-bold mb-2">New Reports (24h)</h1>
        <p className="text-muted-foreground">
          {reports.length} reports created in the last 24 hours
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Reports submitted in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reports found</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            report.status === "pending"
                              ? "destructive"
                              : report.status === "resolved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {report.status}
                        </Badge>
                        <Badge variant="outline">{report.reason.name}</Badge>
                        <Badge variant="outline">{report.contentType}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Content ID: {report.contentId}</div>
                        <div>Reporter: {report.reporterId}</div>
                        <div>Created: {report.createdAt.toLocaleString()}</div>
                        {report.description && (
                          <p className="mt-2">{report.description}</p>
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

