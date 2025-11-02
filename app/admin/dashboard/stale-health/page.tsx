import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subDays } from "date-fns"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function StaleHealthPage() {
  const ninetyDaysAgo = subDays(new Date(), 90)
  
  const articles = await prisma.article.findMany({
    where: {
      type: "health",
      updatedAt: {
        lt: ninetyDaysAgo,
      },
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "asc",
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
        <h1 className="text-3xl font-bold mb-2">Stale Health Pages</h1>
        <p className="text-muted-foreground">
          {articles.length} health pages not updated in the last 90 days
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stale Articles</CardTitle>
          <CardDescription>Health pages that need updating</CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No stale health pages found</p>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => {
                const daysSinceUpdate = Math.floor(
                  (new Date().getTime() - article.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div key={article.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{article.status}</Badge>
                          <span className="font-medium">{article.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Slug: {article.slug}</div>
                          <div>Last Updated: {article.updatedAt.toLocaleString()}</div>
                          <div className="text-orange-600">
                            Days since update: {daysSinceUpdate}
                          </div>
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

