"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, FileText, Plus } from "lucide-react"
import Link from "next/link"

interface NoResultsHelpersProps {
  query: string
  entityType: "wiki" | "posts" | "all"
}

export function NoResultsHelpers({ query, entityType }: NoResultsHelpersProps) {
  if (!query.trim()) {
    return null
  }

  const encodedQuery = encodeURIComponent(query)

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {entityType === "wiki" || entityType === "all" ? (
            <div className="flex items-start gap-4">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  No wiki article found for &quot;{query}&quot;.
                </p>
                <Link href={`/wiki/create?query=${encodedQuery}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create wiki stub
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}

          {entityType === "posts" || entityType === "all" ? (
            <div className="flex items-start gap-4">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  No posts found. Post a Question about &quot;{query}&quot;?
                </p>
                <Link href={`/blog/create?type=question&query=${encodedQuery}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Post a Question
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

