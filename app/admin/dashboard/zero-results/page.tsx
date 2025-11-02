import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subDays } from "date-fns"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ZeroResultsPage() {
  const twentyFourHoursAgo = subDays(new Date(), 1)
  
  const searches = await prisma.searchTelemetry.findMany({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
      hasResults: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  // Group by query to show frequency
  const queryCounts = searches.reduce((acc, search) => {
    acc[search.query] = (acc[search.query] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topQueries = Object.entries(queryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Zero-Result Searches</h1>
        <p className="text-muted-foreground">
          {searches.length} searches with no results in the last 24 hours
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Zero-Result Queries</CardTitle>
          <CardDescription>Most frequent searches with no results</CardDescription>
        </CardHeader>
        <CardContent>
          {topQueries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No zero-result searches found</p>
          ) : (
            <div className="space-y-4">
              {topQueries.map(([query, count]) => (
                <div key={query} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{count} times</Badge>
                        <span className="font-medium">{query}</span>
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

