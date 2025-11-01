import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all',
        destructive:
          'bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-md hover:shadow-lg transition-all focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground shadow-md hover:shadow-lg transition-all',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const isDisabled = disabled || loading

  // Helper function to detect if there's an icon/SVG in children
  const hasLeftIcon = (children: React.ReactNode): boolean => {
    if (!children || loading) return loading // Loading state always has Loader2 icon
    
    const childrenArray = React.Children.toArray(children)
    return childrenArray.some((child) => {
      if (React.isValidElement(child)) {
        // Check if it's an SVG element
        if (child.type === 'svg') return true
        
        // Check if it's a lucide-react icon component (they usually have className with 'lucide')
        const childProps = child.props as any
        const className = childProps?.className
        if (className && typeof className === 'string') {
          if (className.includes('lucide') || className.includes('icon')) return true
        }
        
        // Check component name for common icon components
        const componentType = (child.type as any)
        if (typeof componentType === 'function') {
          const name = componentType.name || componentType.displayName
          if (name && (
            name.includes('Icon') || 
            name === 'Loader2' ||
            name === 'Edit' ||
            name === 'Edit2' ||
            name === 'Send' ||
            name === 'Heart' ||
            name === 'Trash2' ||
            name === 'Plus' ||
            name === 'PenSquare'
          )) return true
        }
      }
      return false
    })
  }

  // Helper function to wrap text content with padding if icon exists
  const processChildren = (children: React.ReactNode, hasIcon: boolean): React.ReactNode => {
    if (!hasIcon || !children) return children
    
    const childrenArray = React.Children.toArray(children)
    if (childrenArray.length === 0) return children
    
    return React.Children.map(childrenArray, (child, index) => {
      if (React.isValidElement(child)) {
        const childType = child.type as any
        
        // Skip SVG and icon components - return as is
        if (childType === 'svg') return child
        
        const childProps = child.props as any
        const className = childProps?.className
        
        // Skip if it's an icon component
        if (className && typeof className === 'string') {
          if (className.includes('lucide') || className.includes('icon')) return child
        }
        
        // Skip icon components by name
        if (typeof childType === 'function') {
          const name = childType.name || childType.displayName
          if (name && (name.includes('Icon') || name === 'Loader2' || name === 'Edit' || name === 'Edit2')) {
            return child
          }
        }
        
        // If it's a span with text, add padding class
        if (childType === 'span' || childType === 'p' || childType === 'div') {
          return React.cloneElement(child, {
            key: index,
            className: cn(childProps?.className, 'pr-2'),
          })
        }
      }
      
      // For strings and numbers (text content), wrap with padding
      if (typeof child === 'string' || typeof child === 'number') {
        return <span key={index} className="pr-2">{child}</span>
      }
      
      return child
    })
  }

  // When asChild is true, we must pass exactly one child to Slot
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  const hasIcon = hasLeftIcon(children) || loading

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          {loadingText && <span className="pr-2">{loadingText}</span>}
        </>
      )}
      {!loading && processChildren(children, hasIcon)}
    </Comp>
  )
}

export { Button, buttonVariants }
