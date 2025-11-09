"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye, Clock, TrendingUp } from "lucide-react"
import type { CareGuide } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useMediaPolicy } from "@/lib/hooks/use-media-policy"
import { getOptimizedImageUrl } from "@/lib/performance/cdn"

interface CareGuideCardProps {
  guide: CareGuide
  className?: string
}

const categoryLabels: Record<string, string> = {
  nutrition: "Nutrition",
  grooming: "Grooming",
  enrichment: "Enrichment",
  "senior-care": "Senior Care",
  "puppy-kitten-care": "Puppy/Kitten Care",
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function CareGuideCard({ guide, className }: CareGuideCardProps) {
  const { reducedQuality, minimalBlocked, allowOnce } = useMediaPolicy()
  return (
    <Link href={`/care-guides/${guide.slug}`}>
      <Card className={cn("hover:shadow-lg transition-shadow h-full flex flex-col", className)}>
        {guide.coverImage && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            {minimalBlocked ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/70 text-center">
                <div>
                  <div className="mb-2 text-xs">Media blocked on cellular (Minimal)</div>
                  <button
                    type="button"
                    className="rounded bg-primary px-3 py-1 text-primary-foreground"
                    onClick={allowOnce}
                  >
                    Load image
                  </button>
                </div>
              </div>
            ) : (
              <Image
                src={reducedQuality ? getOptimizedImageUrl(guide.coverImage, { quality: 60 }) : guide.coverImage}
                alt={guide.title}
                fill
                className="object-cover"
              />
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold line-clamp-2">{guide.title}</h3>
            <Badge variant="secondary" className="shrink-0">
              {categoryLabels[guide.category] || guide.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {guide.description}
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {guide.species.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Badge>
            ))}
            {guide.difficulty && (
              <Badge className={cn("text-xs", difficultyColors[guide.difficulty])}>
                {guide.difficulty}
              </Badge>
            )}
          </div>
          {guide.estimatedTime && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{guide.estimatedTime}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{guide.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{guide.likes.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{guide.steps.length} steps</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
