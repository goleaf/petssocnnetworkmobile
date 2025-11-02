"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Heart, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  Calendar,
  Package,
  XCircle,
  Lightbulb,
  Wind
} from "lucide-react"
import type { CareGuide } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { toggleCareGuideLike, incrementCareGuideViews } from "@/lib/storage"
import { useEffect } from "react"
import { CareGuideChecklist } from "./care-guide-checklist"

interface CareGuideDetailProps {
  guide: CareGuide
}

const categoryLabels: Record<string, string> = {
  nutrition: "Nutrition",
  grooming: "Grooming",
  enrichment: "Enrichment",
  "senior-care": "Senior Care",
  "puppy-kitten-care": "Puppy/Kitten Care",
}

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  "bi-weekly": "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "as-needed": "As Needed",
  seasonal: "Seasonal",
}

const seasonLabels: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
  "all-seasons": "All Seasons",
}

export function CareGuideDetail({ guide }: CareGuideDetailProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(user ? guide.likes.includes(user.id) : false)
  const [likesCount, setLikesCount] = useState(guide.likes.length)

  useEffect(() => {
    if (user) {
      incrementCareGuideViews(guide.slug)
    }
  }, [guide.slug, user])

  const handleLike = () => {
    if (!user) return
    const result = toggleCareGuideLike(guide.slug, user.id)
    if (result.success) {
      setIsLiked(result.isLiked)
      setLikesCount((prev) => (result.isLiked ? prev + 1 : prev - 1))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {guide.coverImage && (
          <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg">
            <Image
              src={guide.coverImage}
              alt={guide.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{categoryLabels[guide.category] || guide.category}</Badge>
              {guide.difficulty && (
                <Badge variant="outline">{guide.difficulty}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{guide.title}</h1>
            <p className="text-muted-foreground text-lg">{guide.description}</p>
          </div>
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            disabled={!user}
            className="shrink-0"
          >
            <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current")} />
            {likesCount}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{guide.views} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{frequencyLabels[guide.frequency]}</span>
            {guide.frequencyDetails && <span className="ml-1">({guide.frequencyDetails})</span>}
          </div>
          {guide.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{guide.estimatedTime}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {guide.species.map((s) => (
            <Badge key={s} variant="outline">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Step-by-Step Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {guide.steps
              .sort((a, b) => a.order - b.order)
              .map((step, index) => (
                <div key={step.id} className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {step.order}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                      {step.duration && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{step.duration}</span>
                        </div>
                      )}
                      {step.tips && step.tips.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            <span>Tips:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 ml-6 text-sm text-muted-foreground">
                            {step.tips.map((tip, tipIndex) => (
                              <li key={tipIndex}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {step.warnings && step.warnings.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Warnings:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 ml-6 text-sm text-red-600/80">
                            {step.warnings.map((warning, warnIndex) => (
                              <li key={warnIndex}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < guide.steps.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guide.equipment.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {item.required ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  {item.alternatives && item.alternatives.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Alternatives:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                        {item.alternatives.map((alt, altIndex) => (
                          <li key={altIndex}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Common Mistakes to Avoid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {guide.commonMistakes.map((mistake) => (
              <AccordionItem key={mistake.id} value={mistake.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{mistake.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{mistake.description}</p>
                  {mistake.consequences && (
                    <div>
                      <p className="font-medium text-red-600">Consequences:</p>
                      <p className="text-muted-foreground">{mistake.consequences}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-green-600">How to Avoid:</p>
                    <p className="text-muted-foreground">{mistake.howToAvoid}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Seasonality Notes */}
      {guide.seasonalityNotes && guide.seasonalityNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Seasonal Considerations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {guide.seasonalityNotes.map((note) => (
                <div key={note.season} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">{seasonLabels[note.season] || note.season}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{note.notes}</p>
                  {note.adjustments && note.adjustments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Adjustments:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 ml-2">
                        {note.adjustments.map((adj, adjIndex) => (
                          <li key={adjIndex}>{adj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Downloadable Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Downloadable Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CareGuideChecklist guide={guide} />
        </CardContent>
      </Card>
    </div>
  )
}

