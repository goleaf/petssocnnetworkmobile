"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GroupCategory } from "@/lib/types"
import { getAnimalConfigLucide } from "@/lib/animal-types"
import { GraduationCap, Heart, HeartHandshake, UtensilsCrossed } from "lucide-react"

interface CategoryFilterProps {
  categories: GroupCategory[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

// Map category IDs to animal types or custom icons
const getCategoryIcon = (categoryId: string) => {
  // Map specific categories to animal types
  const categoryToAnimalMap: Record<string, string> = {
    "cat-dogs": "dog",
    "cat-cats": "cat",
    "cat-birds": "bird",
    "cat-small-pets": "rabbit",
  }
  
  const animalType = categoryToAnimalMap[categoryId]
  if (animalType) {
    return getAnimalConfigLucide(animalType)
  }
  
  // Map non-animal categories to icons
  const customIconMap: Record<string, { icon: any; color: string }> = {
    "cat-training": { icon: GraduationCap, color: "text-red-500" },
    "cat-health": { icon: Heart, color: "text-pink-500" },
    "cat-adoption": { icon: HeartHandshake, color: "text-orange-500" },
    "cat-nutrition": { icon: UtensilsCrossed, color: "text-cyan-500" },
  }
  
  return customIconMap[categoryId]
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
        {categories.map((category) => {
          const iconConfig = getCategoryIcon(category.id)
          const IconComponent = iconConfig?.icon
          
          return (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-2"
            >
              {IconComponent && (
                <IconComponent className={`h-4 w-4 ${iconConfig.color || "text-muted-foreground"}`} />
              )}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}

