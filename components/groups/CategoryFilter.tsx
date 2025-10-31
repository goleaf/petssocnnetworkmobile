"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GroupCategory } from "@/lib/types"

interface CategoryFilterProps {
  categories: GroupCategory[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full">
      <TabsList className="flex-wrap h-auto p-1">
        <TabsTrigger value="all">All</TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className="flex items-center gap-2"
          >
            <span>{category.icon}</span>
            <span className="hidden sm:inline">{category.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

