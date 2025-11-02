"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink, Info } from "lucide-react"
import type { Pet, WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"

interface BreedInfoProps {
  pet: Pet
  className?: string
}

export function BreedInfo({ pet, className }: BreedInfoProps) {
  const breedArticle = React.useMemo(() => {
    if (!pet.breedId && !pet.breed) return null
    
    const allArticles = getWikiArticles()
    
    // Try to find by breedId first
    if (pet.breedId) {
      const byId = allArticles.find((a) => a.id === pet.breedId)
      if (byId && byId.type === "breed") return byId
    }
    
    // Fallback to breed name match
    if (pet.breed) {
      const byName = allArticles.find(
        (a) =>
          a.type === "breed" &&
          (a.title.toLowerCase() === pet.breed.toLowerCase() ||
            a.slug === pet.breed.toLowerCase().replace(/\s+/g, "-"))
      )
      if (byName) return byName
    }
    
    return null
  }, [pet])
  
  if (!breedArticle) {
    return null
  }
  
  const breedData = breedArticle.breedData
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            About {pet.breed || "this breed"}
          </CardTitle>
          <Badge variant="secondary">Breed Info</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {breedArticle.coverImage && (
          <div className="relative w-full h-48 overflow-hidden rounded-lg">
            <img
              src={breedArticle.coverImage}
              alt={breedArticle.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {breedData && (
          <div className="grid grid-cols-2 gap-3">
            {breedData.sizeClass && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Size</p>
                <p className="font-medium text-sm capitalize">
                  {breedData.sizeClass}
                </p>
              </div>
            )}
            
            {breedData.lifeExpectancyYears && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lifespan</p>
                <p className="font-medium text-sm">
                  {breedData.lifeExpectancyYears} years
                </p>
              </div>
            )}
            
            {breedData.originCountry && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Origin</p>
                <p className="font-medium text-sm">
                  {breedData.originCountry}
                </p>
              </div>
            )}
            
            {breedData.coatType && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Coat</p>
                <p className="font-medium text-sm capitalize">
                  {breedData.coatType}
                </p>
              </div>
            )}
            
            {breedData.energyLevel && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Energy Level</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded ${
                        level <= (breedData.energyLevel || 0)
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {breedArticle.blocks && breedArticle.blocks.length > 0 && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {breedArticle.blocks
                .find((b) => b.type === "paragraph" || b.type === "text")
                ?.content || breedArticle.content || ""}
            </p>
          </div>
        )}
        
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/wiki/${breedArticle.slug}`}>
            <BookOpen className="h-4 w-4 mr-2" />
            Read full breed guide
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

