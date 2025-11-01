"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormLabelProps extends React.ComponentProps<typeof Label> {
  tooltip?: string
  icon?: LucideIcon
  iconClassName?: string
}

export function FormLabel({
  className,
  required,
  description,
  tooltip,
  icon: Icon,
  iconClassName,
  children,
  ...props
}: FormLabelProps) {
  const labelContent = (
    <Label
      required={required}
      description={description}
      icon={Icon}
      iconClassName={iconClassName}
      className={cn("text-sm font-medium", className)}
      {...props}
    >
      {children}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Label>
  )

  return tooltip ? (
    <TooltipProvider>{labelContent}</TooltipProvider>
  ) : (
    labelContent
  )
}

