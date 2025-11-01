"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCareChecklist, extractChecklistItems } from "@/lib/utils/wiki-pet-helpers"
import type { Pet, WikiArticle } from "@/lib/types"
import { CheckCircle2, Heart, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface PetCareChecklistProps {
  pet: Pet
}

export function PetCareChecklist({ pet }: PetCareChecklistProps) {
  const [careArticles, setCareArticles] = useState<WikiArticle[]>([])

  useEffect(() => {
    const articles = getCareChecklist(pet)
    setCareArticles(articles)
  }, [pet])

  if (careArticles.length === 0) {
    return null
  }

  // Get checklist items from the first (most relevant) article
  const primaryArticle = careArticles[0]
  const checklistItems = extractChecklistItems(primaryArticle, 5)

  if (checklistItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Care Checklist</CardTitle>
          </div>
          <Link href={`/wiki/${primaryArticle.slug}`}>
            <Button variant="ghost" size="sm">
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-4">
          {checklistItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
        {careArticles.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">More care guides:</span>
            {careArticles.slice(1, 3).map((article) => (
              <Link key={article.id} href={`/wiki/${article.slug}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {article.title.length > 30 ? `${article.title.substring(0, 30)}...` : article.title}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

