"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Fence, Droplets, Dog, Shield, AlertTriangle, ParkingCircle } from "lucide-react"
import type { Place } from "@/lib/types"

interface AmenityBadgesProps {
  place: Place
  showAll?: boolean
  className?: string
}

export function AmenityBadges({ place, showAll = false, className = "" }: AmenityBadgesProps) {
  const features = [
    {
      key: "fenced",
      label: "Fenced",
      icon: Fence,
      value: place.fenced,
      variant: "default" as const,
    },
    {
      key: "smallDogArea",
      label: "Small Dog Area",
      icon: Dog,
      value: place.smallDogArea,
      variant: "default" as const,
    },
    {
      key: "waterStation",
      label: "Water Station",
      icon: Droplets,
      value: place.waterStation,
      variant: "default" as const,
    },
  ]

  const activeFeatures = features.filter((f) => f.value)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Feature Badges */}
      {activeFeatures.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Features
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <Badge key={feature.key} variant={feature.variant} className="gap-1.5">
                  <Icon className="h-3 w-3" />
                  {feature.label}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Amenities */}
      {place.amenities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {(showAll ? place.amenities : place.amenities.slice(0, 6)).map((amenity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {!showAll && place.amenities.length > 6 && (
              <Badge variant="secondary" className="text-xs">
                +{place.amenities.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Hazards */}
      {place.hazards.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-4 w-4" />
            Hazards
          </h4>
          <div className="flex flex-wrap gap-2">
            {place.hazards.map((hazard, idx) => (
              <Badge key={idx} variant="outline" className="text-xs border-orange-300 text-orange-700">
                {hazard}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Parking Info */}
      {place.parkingInfo && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <ParkingCircle className="h-4 w-4" />
            Parking
          </h4>
          <p className="text-sm text-muted-foreground">{place.parkingInfo}</p>
        </div>
      )}
    </div>
  )
}

