"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, CheckCircle, Phone, MapPin, BookOpen, ExternalLink } from "lucide-react"
import type { UrgencyLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getEmergencyActions } from "@/lib/utils/emergency"
import Link from "next/link"

interface UrgencyBannerProps {
  urgency: UrgencyLevel
  className?: string
}

export function UrgencyBanner({ urgency, className }: UrgencyBannerProps) {
  const urgencyConfig = {
    emergency: {
      variant: "destructive" as const,
      title: "Emergency - Seek Immediate Veterinary Care",
      description: "This condition requires immediate veterinary attention. Do not delay seeking professional help.",
      icon: AlertTriangle,
      bgColor: "bg-red-50 dark:bg-red-950",
      borderColor: "border-red-500",
      textColor: "text-red-800 dark:text-red-200",
      iconColor: "text-red-600 dark:text-red-400",
    },
    urgent: {
      variant: "default" as const,
      title: "Urgent - Consult a Veterinarian Soon",
      description: "This condition should be evaluated by a veterinarian as soon as possible.",
      icon: Clock,
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-500",
      textColor: "text-orange-800 dark:text-orange-200",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    routine: {
      variant: "default" as const,
      title: "Routine Care",
      description: "This is general health information. Consult your veterinarian for specific concerns about your pet.",
      icon: CheckCircle,
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-500",
      textColor: "text-blue-800 dark:text-blue-200",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  }

  const config = urgencyConfig[urgency]
  const Icon = config.icon
  const emergencyActions = getEmergencyActions(urgency)

  return (
    <Alert
      variant={config.variant}
      className={cn(
        "mb-6",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("h-4 w-4", config.iconColor)} />
      <AlertTitle className={config.textColor}>{config.title}</AlertTitle>
      <AlertDescription className={cn(config.textColor, "space-y-3")}>
        <p>{config.description}</p>
        
        {/* Emergency/Urgent CTAs */}
        {emergencyActions && (urgency === "emergency" || urgency === "urgent") && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-current/20">
            {urgency === "emergency" && (
              <>
                <Button
                  asChild
                  variant="destructive"
                  size="sm"
                  className={cn(
                    "font-semibold",
                    config.textColor,
                    "bg-red-600 hover:bg-red-700 text-white border-0"
                  )}
                >
                  <a href={emergencyActions.phoneUrl} className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Call Emergency
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "font-medium",
                    config.textColor,
                    "border-current/40 hover:bg-current/10"
                  )}
                >
                  <a href={emergencyActions.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Find Nearby Clinic
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "font-medium",
                config.textColor,
                "border-current/40 hover:bg-current/10"
              )}
            >
              <Link href={emergencyActions.clinicFinderUrl}>
                <MapPin className="h-4 w-4" />
                Local Clinics
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "font-medium",
                config.textColor,
                "border-current/40 hover:bg-current/10"
              )}
            >
              <Link href={emergencyActions.guidelinesUrl}>
                <BookOpen className="h-4 w-4" />
                Emergency Guidelines
              </Link>
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

