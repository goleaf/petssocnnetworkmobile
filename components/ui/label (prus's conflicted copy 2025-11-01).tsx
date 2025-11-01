'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean
  description?: string
  icon?: LucideIcon
  iconClassName?: string
}

function Label({
  className,
  required,
  description,
  icon: Icon,
  iconClassName,
  children,
  ...props
}: LabelProps) {
  return (
    <div className="space-y-1.5">
      <LabelPrimitive.Root
        data-slot="label"
        className={cn(
          'flex items-center gap-2 text-sm font-semibold leading-tight text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {Icon && (
          <Icon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
        )}
        {children}
        {required && (
          <Badge
            variant="outline"
            className="ml-1 h-5 px-1.5 text-xs font-normal text-muted-foreground border-muted-foreground/30"
          >
            Required
          </Badge>
        )}
      </LabelPrimitive.Root>
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  )
}

export { Label }
