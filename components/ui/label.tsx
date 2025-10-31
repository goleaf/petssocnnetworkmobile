'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean
  description?: string
}

function Label({
  className,
  required,
  description,
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
        {children}
        {required && (
          <span className="text-destructive font-normal" aria-label="required">
            *
          </span>
        )}
      </LabelPrimitive.Root>
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  )
}

export { Label }
