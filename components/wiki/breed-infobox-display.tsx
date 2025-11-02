import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, AlertCircle } from "lucide-react"
import { type BreedInfoboxOutput } from "@/lib/schemas/breed-infobox"

interface BreedInfoboxDisplayProps {
  breedData: BreedInfoboxOutput
}

// Helper function to render rating bars
function RatingBar({ value, label }: { value: number; label: string }) {
  const filledBars = value
  const emptyBars = 5 - value

  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex gap-0.5">
        {Array.from({ length: filledBars }).map((_, i) => (
          <div key={`filled-${i}`} className="h-2 w-6 bg-primary rounded-sm" />
        ))}
        {Array.from({ length: emptyBars }).map((_, i) => (
          <div key={`empty-${i}`} className="h-2 w-6 bg-muted rounded-sm" />
        ))}
      </div>
    </div>
  )
}

// Helper function to format tag name for display
function formatTagName(tag: string): string {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function BreedInfoboxDisplay({ breedData }: BreedInfoboxDisplayProps) {
  const hasData = Object.keys(breedData).length > 0

  if (!hasData) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{breedData.officialName}</CardTitle>
        </div>
        {breedData.aliases && breedData.aliases.length > 0 && (
          <div className="text-sm text-muted-foreground mt-1">
            Also known as: {breedData.aliases.join(", ")}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Computed Tags Section */}
        {breedData.computedTags && breedData.computedTags.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Key Characteristics</div>
              <div className="flex flex-wrap gap-2">
                {breedData.computedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {formatTagName(tag)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="border-t" />
          </>
        )}

        {/* Basic Information */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Basic Information</div>
          
          {breedData.originCountry && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Origin</span>
              <span className="font-medium">{breedData.originCountry}</span>
            </div>
          )}

          {breedData.sizeClass && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium capitalize">{breedData.sizeClass}</span>
            </div>
          )}

          {(breedData.maleAvgWeightKg || breedData.femaleAvgWeightKg) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Average Weight</span>
              <div className="flex gap-4">
                {breedData.maleAvgWeightKg && (
                  <span className="font-medium">
                    ♂ {breedData.maleAvgWeightKg}kg
                  </span>
                )}
                {breedData.femaleAvgWeightKg && (
                  <span className="font-medium">
                    ♀ {breedData.femaleAvgWeightKg}kg
                  </span>
                )}
              </div>
            </div>
          )}

          {(breedData.maleAvgHeightCm || breedData.femaleAvgHeightCm) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Average Height</span>
              <div className="flex gap-4">
                {breedData.maleAvgHeightCm && (
                  <span className="font-medium">
                    ♂ {breedData.maleAvgHeightCm}cm
                  </span>
                )}
                {breedData.femaleAvgHeightCm && (
                  <span className="font-medium">
                    ♀ {breedData.femaleAvgHeightCm}cm
                  </span>
                )}
              </div>
            </div>
          )}

          {breedData.lifeExpectancyYears && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Life Expectancy</span>
              <span className="font-medium">{breedData.lifeExpectancyYears} years</span>
            </div>
          )}

          {breedData.coatType && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Coat Type</span>
              <span className="font-medium">{breedData.coatType}</span>
            </div>
          )}
        </div>

        {/* Ratings */}
        {(breedData.activityNeeds || breedData.trainability) && (
          <>
            <div className="border-t" />
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Behavioral Traits</div>
              {breedData.activityNeeds && (
                <RatingBar value={breedData.activityNeeds} label="Activity Needs" />
              )}
              {breedData.trainability && (
                <RatingBar value={breedData.trainability} label="Trainability" />
              )}
            </div>
          </>
        )}

        {/* Grooming & Care */}
        {(breedData.shedding || breedData.groomingFrequency || breedData.careLevel) && (
          <>
            <div className="border-t" />
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Care Requirements</div>
              
              {breedData.shedding && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Shedding</span>
                  <span className="font-medium capitalize">{breedData.shedding}</span>
                </div>
              )}

              {breedData.droolScale !== undefined && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Drool Scale</div>
                  <RatingBar value={breedData.droolScale} label="" />
                </div>
              )}

              {breedData.groomingFrequency && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Grooming</span>
                  <span className="font-medium">
                    {breedData.groomingFrequency === "bi-weekly" 
                      ? "Bi-weekly" 
                      : breedData.groomingFrequency.charAt(0).toUpperCase() + breedData.groomingFrequency.slice(1)}
                  </span>
                </div>
              )}

              {breedData.careLevel && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Care Level</span>
                  <span className="font-medium capitalize">{breedData.careLevel}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Color Variants */}
        {breedData.colorVariants && breedData.colorVariants.length > 0 && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Color Variants</div>
              <div className="flex flex-wrap gap-2">
                {breedData.colorVariants.map((color) => (
                  <Badge key={color} variant="outline" className="text-xs">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Temperament Tags */}
        {breedData.temperamentTags && breedData.temperamentTags.length > 0 && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Temperament</div>
              <div className="flex flex-wrap gap-2">
                {breedData.temperamentTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Health Risks */}
        {breedData.commonHealthRisks && breedData.commonHealthRisks.length > 0 && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Common Health Risks
              </div>
              <ul className="space-y-1 text-sm">
                {breedData.commonHealthRisks.map((risk) => (
                  <li key={risk} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Recognition Bodies */}
        {breedData.recognitionBodies && breedData.recognitionBodies.length > 0 && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Recognition Bodies</div>
              <div className="flex flex-wrap gap-2">
                {breedData.recognitionBodies.map((body) => (
                  <Badge key={body} variant="secondary" className="text-xs">
                    {body}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Working Roles */}
        {breedData.workingRoles && breedData.workingRoles.length > 0 && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Working Roles</div>
              <div className="flex flex-wrap gap-2">
                {breedData.workingRoles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recommended Enrichment */}
        {breedData.recommendedEnrichment && breedData.recommendedEnrichment.length > 0 && (
          <>
            <div className="border-t" />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Recommended Enrichment</div>
              <ul className="space-y-1 text-sm">
                {breedData.recommendedEnrichment.map((activity) => (
                  <li key={activity} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

