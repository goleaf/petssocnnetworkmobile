/**
 * Admin Wiki Flagged Revisions Page
 * 
 * Lists flagged wiki revisions that need expert review
 */

import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export default async function WikiRevisions() {
  let rows: any[] = []
  
  try {
    rows = await prisma.flaggedRevision.findMany({
      where: {
        status: 'pending',
        type: {
          in: ['Health', 'Regulation'], // Only show Health & Regulations
        },
      },
      orderBy: { flaggedAt: 'asc' },
      take: 50,
    })
  } catch (error) {
    console.warn('Flagged revisions: Database not available', error)
  }

  // Check if revision is stale (>12 months old)
  const isStale = (flaggedAt: Date) => {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    return flaggedAt < twelveMonthsAgo
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      Health: 'destructive',
      Regulation: 'secondary',
    }
    return (
      <Badge variant={variants[type] || 'default'}>{type}</Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'default',
      approved: 'secondary',
      'changes-requested': 'outline',
      'rolled-back': 'outline',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Flagged Wiki Revisions</h1>
        <p className="text-muted-foreground mt-1">Review wiki revisions flagged for expert approval</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No flagged revisions</p>
              <p className="text-sm mt-2">Revisions will appear here when flagged for expert review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Article</th>
                    <th className="py-3 px-4">Revision</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Flagged</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const stale = isStale(r.flaggedAt)
                    return (
                      <tr key={r.id} className="border-b last:border-none hover:bg-accent/50">
                        <td className="py-3 px-4 font-mono text-xs">{r.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 font-mono text-xs">{r.articleId.slice(0, 8)}</td>
                        <td className="py-3 px-4 font-mono text-xs">{r.revisionId.slice(0, 8)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getTypeBadge(r.type)}
                            {stale && (
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                Stale review
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(r.flaggedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {r.assignedTo ? (
                            <span className="text-xs font-mono">{r.assignedTo.slice(0, 8)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/admin/wiki/revisions/${r.id}`}>
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

