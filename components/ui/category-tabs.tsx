"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TabItem {
  value: string
  label: string
  icon?: LucideIcon | string
  color?: string
  badge?: number | string
  hidden?: boolean
}

interface CategoryTabsProps {
  value: string
  onValueChange: (value: string) => void
  items: TabItem[]
  className?: string
  tabsListClassName?: string
  defaultGridCols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  showLabels?: {
    mobile?: boolean
    desktop?: boolean
  }
  renderContent?: (item: TabItem) => React.ReactNode
  additionalTabs?: TabItem[]
  children?: React.ReactNode
}

const DEFAULT_GRID_COLS = {
  mobile: 3,
  tablet: 4,
  desktop: 7,
}

const DEFAULT_SHOW_LABELS = {
  mobile: false,
  desktop: true,
}

export function CategoryTabs({
  value,
  onValueChange,
  items,
  className,
  tabsListClassName,
  defaultGridCols = DEFAULT_GRID_COLS,
  showLabels = DEFAULT_SHOW_LABELS,
  renderContent,
  additionalTabs = [],
  children,
}: CategoryTabsProps) {
  const gridCols = { ...DEFAULT_GRID_COLS, ...defaultGridCols }
  const labelVisibility = { ...DEFAULT_SHOW_LABELS, ...showLabels }

  // Filter out hidden items
  const visibleItems = items.filter((item) => !item.hidden)
  const allTabs = [...visibleItems, ...additionalTabs]

  const getGridClassName = () => {
    // Tailwind grid classes - use explicit classes
    const gridClasses: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
    }

    const mobile = gridClasses[gridCols.mobile || 3] || "grid-cols-3"
    const tablet = gridCols.tablet ? `md:${gridClasses[gridCols.tablet] || "grid-cols-4"}` : "md:grid-cols-4"
    const desktop = gridCols.desktop ? `lg:${gridClasses[gridCols.desktop] || "grid-cols-7"}` : "lg:grid-cols-7"
    return `grid w-full ${mobile} ${tablet} ${desktop}`
  }

  const renderIcon = (item: TabItem) => {
    if (!item.icon) return null

    // Handle string icons (emojis) with color background
    if (typeof item.icon === "string") {
      const getColorClass = (hexColor?: string) => {
        if (!hexColor) return "bg-blue-100 dark:bg-blue-900/20"
        const colorMap: Record<string, string> = {
          "#3b82f6": "bg-blue-100 dark:bg-blue-900/20",
          "#8b5cf6": "bg-purple-100 dark:bg-purple-900/20",
          "#10b981": "bg-green-100 dark:bg-green-900/20",
          "#f59e0b": "bg-amber-100 dark:bg-amber-900/20",
          "#ef4444": "bg-red-100 dark:bg-red-900/20",
          "#ec4899": "bg-pink-100 dark:bg-pink-900/20",
          "#f97316": "bg-orange-100 dark:bg-orange-900/20",
          "#06b6d4": "bg-cyan-100 dark:bg-cyan-900/20",
        }
        return colorMap[hexColor] || "bg-gray-100 dark:bg-gray-900/20"
      }

      return (
        <span
          className={cn(
            "text-base flex items-center justify-center w-5 h-5 rounded",
            getColorClass(item.color)
          )}
        >
          {item.icon}
        </span>
      )
    }

    // Handle Lucide icons with colored borders (not filled)
    const IconComponent = item.icon as LucideIcon
    const iconColor = item.color || "text-muted-foreground"
    
    // Map color classes to border colors
    const getBorderColor = (colorClass?: string): string => {
      if (!colorClass) return "border-blue-500"
      const colorMap: Record<string, string> = {
        "text-blue-500": "border-blue-500",
        "text-sky-500": "border-sky-500",
        "text-purple-500": "border-purple-500",
        "text-green-500": "border-green-500",
        "text-amber-500": "border-amber-500",
        "text-red-500": "border-red-500",
        "text-pink-500": "border-pink-500",
        "text-orange-500": "border-orange-500",
        "text-indigo-500": "border-indigo-500",
        "text-cyan-500": "border-cyan-500",
        "text-gray-500": "border-gray-500",
      }
      return colorMap[colorClass] || "border-blue-500"
    }

    return (
      <div className={cn("p-1 rounded flex items-center justify-center", getBorderColor(item.color))}>
        <IconComponent className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
    )
  }

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList className={cn(getGridClassName(), "mb-6", tabsListClassName)}>
        {allTabs.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2">
            {renderIcon(item)}
            {(labelVisibility.desktop !== false && (
              <span className={cn(labelVisibility.mobile === false && "hidden sm:inline")}>
                {item.label}
              </span>
            )) ||
              (labelVisibility.mobile === true && <span>{item.label}</span>)}
            {item.badge !== undefined && item.badge !== null && (
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {renderContent &&
        allTabs.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {renderContent(item)}
          </TabsContent>
        ))}
      {children}
    </Tabs>
  )
}

