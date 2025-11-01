"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface CardHeaderWithIconProps {
  title: string
  description?: string
  icon: LucideIcon
  iconClassName?: string
  className?: string
}

export function CardHeaderWithIcon({
  title,
  description,
  icon: Icon,
  iconClassName,
  className,
}: CardHeaderWithIconProps) {
  return (
    <div
      className={cn(
        "relative -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-gradient-to-br from-muted/30 via-muted/20 to-background rounded-t-xl",
        className
      )}
    >
      {/* Two-line accent at the very top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute top-[1px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
      
      <div className="relative flex items-center gap-2 mb-2 px-4 sm:px-6">
        <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0", iconClassName)} />
        <h3 className="text-lg sm:text-xl font-semibold leading-none">{title}</h3>
      </div>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 ml-6 sm:ml-7 px-4 sm:px-6">{description}</p>
      )}
    </div>
  )
}
