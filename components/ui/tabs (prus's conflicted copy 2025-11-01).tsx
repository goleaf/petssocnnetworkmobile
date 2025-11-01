'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-12 w-fit items-end justify-center rounded-lg p-2 pb-0 gap-1 [&>button]:flex [&>button]:items-center',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-white dark:data-[state=active]:bg-input/30 data-[state=active]:text-foreground data-[state=active]:border-b-[4px] data-[state=active]:border-b-muted-foreground/40 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring data-[state=active]:border-input text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-8px)] flex-1 items-center justify-center gap-1.5 rounded-md rounded-b-none border border-transparent border-b-transparent px-2 py-2 text-sm font-medium whitespace-nowrap focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer data-[state=inactive]:hover:bg-accent/50 data-[state=inactive]:hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:flex [&_svg]:items-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'flex-1 outline-none',
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
