"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Info,
  AlertCircle,
  Shield,
  GraduationCap,
  Heart,
  Leaf,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type CalloutType =
  | "vet-tip"
  | "safety-warning"
  | "checklist"
  | "info"
  | "tip"
  | "warning"
  | "success"
  | "note"
  | "important"
  | "best-practice"

interface MDXCalloutProps {
  type: CalloutType
  title?: string
  children: React.ReactNode
  className?: string
}

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>
    variant: "default" | "destructive"
    defaultTitle: string
    bgColor: string
    borderColor: string
    iconColor: string
  }
> = {
  "vet-tip": {
    icon: Stethoscope,
    variant: "default",
    defaultTitle: "Vet Tip",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  "safety-warning": {
    icon: AlertTriangle,
    variant: "destructive",
    defaultTitle: "Safety Warning",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-600",
  },
  checklist: {
    icon: CheckCircle2,
    variant: "default",
    defaultTitle: "Checklist",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
  },
  info: {
    icon: Info,
    variant: "default",
    defaultTitle: "Info",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  tip: {
    icon: Lightbulb,
    variant: "default",
    defaultTitle: "Tip",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  warning: {
    icon: AlertCircle,
    variant: "default",
    defaultTitle: "Warning",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-600",
  },
  success: {
    icon: CheckCircle2,
    variant: "default",
    defaultTitle: "Success",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
  },
  note: {
    icon: Shield,
    variant: "default",
    defaultTitle: "Note",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  important: {
    icon: AlertTriangle,
    variant: "destructive",
    defaultTitle: "Important",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-600",
  },
  "best-practice": {
    icon: GraduationCap,
    variant: "default",
    defaultTitle: "Best Practice",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
}

export function MDXCallout({ type, title, children, className }: MDXCalloutProps) {
  const config = calloutConfig[type]
  const Icon = config.icon
  const displayTitle = title || config.defaultTitle

  return (
    <Alert
      variant={config.variant}
      className={cn(
        "rounded-lg border-2",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <AlertTitle className="font-semibold mb-1">{displayTitle}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {children}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

