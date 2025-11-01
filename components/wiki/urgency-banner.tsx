"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"
import type { UrgencyLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

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
      <AlertDescription className={config.textColor}>
        {config.description}
      </AlertDescription>
    </Alert>
  )
}

