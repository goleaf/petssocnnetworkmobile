"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBreedSummary, extractBreedSummary } from "@/lib/utils/wiki-pet-helpers"
import type { Pet, WikiArticle } from "@/lib/types"
import { Dna, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface PetBreedSummaryProps {
  pet: Pet
}

export function PetBreedSummary({ pet }: PetBreedSummaryProps) {
  const [breedArticle, setBreedArticle] = useState<WikiArticle | null>(null)

  useEffect(() => {
    const article = getBreedSummary(pet)
    setBreedArticle(article)
  }, [pet])

  if (!pet.breed || !breedArticle) {
    return null
  }

  const summary = extractBreedSummary(breedArticle)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Breed Information</CardTitle>
          </div>
          <Badge variant="outline" className="capitalize">
            {pet.breed}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {summary}
        </p>
        <Link href={`/wiki/${breedArticle.slug}`}>
          <Button variant="outline" size="sm" className="w-full">
            Read Full Breed Guide
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

