"use client"

import * as React from "react"
import { LayoutGrid } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import type { GroupCategory } from "@/lib/types"
import type { LucideIcon } from "lucide-react"

interface CategorySelectorProps {
  value: string
  onValueChange: (value: string) => void
  categories: GroupCategory[]
  className?: string
  iconMap?: Record<string, LucideIcon>
}

export function CategorySelector({
  value,
  onValueChange,
  categories,
  className,
  iconMap = {},
}: CategorySelectorProps) {
  const getDisplayLabel = (categoryId: string): string => {
    if (categoryId === "all") return "All Categories"
    
    // Check if it's a subcategory
    for (const category of categories) {
      const subcategory = category.subcategories?.find((sub) => sub.id === categoryId)
      if (subcategory) {
        return `${category.name} > ${subcategory.name}`
      }
      
      if (category.id === categoryId) {
        return category.name
      }
    }
    
    return "Unknown"
  }

  const getDisplayIcon = (categoryId: string): React.ReactNode => {
    if (categoryId === "all") {
      return <LayoutGrid className="h-4 w-4" />
    }

    // Check if it's a subcategory
    for (const category of categories) {
      const subcategory = category.subcategories?.find((sub) => sub.id === categoryId)
      if (subcategory) {
        const Icon = iconMap[category.id]
        return Icon ? <Icon className="h-4 w-4" /> : null
      }
      
      if (category.id === categoryId) {
        const Icon = iconMap[category.id]
        return Icon ? <Icon className="h-4 w-4" /> : null
      }
    }
    
    return null
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {getDisplayIcon(value)}
            <span>{getDisplayLabel(value)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* All Categories Option */}
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span>All Categories</span>
          </div>
        </SelectItem>

        {/* Categories with Subcategories */}
        {categories.map((category) => {
          const Icon = iconMap[category.id]
          const hasSubcategories = category.subcategories && category.subcategories.length > 0

          if (hasSubcategories) {
            return (
              <SelectGroup key={category.id}>
                <SelectLabel>
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="font-semibold">{category.name}</span>
                  </div>
                </SelectLabel>
                {/* Category itself */}
                <SelectItem value={category.id}>
                  <div className="flex items-center gap-2 pl-6">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>All {category.name}</span>
                  </div>
                </SelectItem>
                {/* Subcategories */}
                {category.subcategories?.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-muted-foreground">└─</span>
                      <span>{subcategory.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )
          }

          // Category without subcategories
          return (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{category.name}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

