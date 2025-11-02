"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, Circle, ClipboardList, ExternalLink } from "lucide-react"
import type { Pet, WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"
import { getStorage, setStorage } from "@/lib/storage"

interface CareChecklistProps {
  pet: Pet
  className?: string
}

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  frequency?: string
}

function getCareChecklistItems(pet: Pet, careArticles: WikiArticle[]): ChecklistItem[] {
  const items: ChecklistItem[] = []
  const storageKey = `care_checklist_${pet.id}`
  
  // Get saved checklist state
  const savedState = getStorage<Record<string, boolean>>(storageKey) || {}
  
  // Find care guides relevant to pet species
  const relevantArticles = careArticles.filter(
    (article) =>
      article.category === "care" &&
      (!article.species || article.species.includes(pet.species))
  )
  
  // Extract checklist items from care articles
  relevantArticles.forEach((article) => {
    if (article.blocks) {
      article.blocks.forEach((block) => {
        if (block.type === "checklist" && "items" in block) {
          const checklistItems = block.items as string[]
          checklistItems.forEach((item, index) => {
            const itemId = `${article.id}_${index}`
            items.push({
              id: itemId,
              text: item,
              checked: savedState[itemId] || false,
            })
          })
        }
      })
    }
  })
  
  // Add common care items if no specific guides found
  if (items.length === 0) {
    const commonItems = [
      "Annual vet checkup",
      "Vaccinations up to date",
      "Flea and tick prevention",
      "Dental care",
      "Grooming",
      "Exercise routine",
      "Nutrition review",
    ]
    
    commonItems.forEach((item, index) => {
      const itemId = `common_${index}`
      items.push({
        id: itemId,
        text: item,
        checked: savedState[itemId] || false,
      })
    })
  }
  
  return items.slice(0, 10) // Limit to 10 items
}

export function CareChecklist({ pet, className }: CareChecklistProps) {
  const careArticles = React.useMemo(() => {
    return getWikiArticles().filter((a) => a.category === "care")
  }, [])
  
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    return getCareChecklistItems(pet, careArticles)
  })
  
  const handleToggle = (itemId: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    setItems(newItems)
    
    // Save state
    const storageKey = `care_checklist_${pet.id}`
    const savedState: Record<string, boolean> = {}
    newItems.forEach((item) => {
      savedState[item.id] = item.checked
    })
    setStorage(storageKey, savedState)
  }
  
  const checkedCount = items.filter((item) => item.checked).length
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Care Checklist
          </CardTitle>
          <Badge variant="secondary">
            {checkedCount}/{items.length}
          </Badge>
        </div>
        {items.length > 0 && (
          <div className="mt-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No care checklist available for this pet type.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="mt-0.5"
                />
                <label
                  className={`flex-1 text-sm cursor-pointer ${
                    item.checked ? "line-through text-muted-foreground" : ""
                  }`}
                  onClick={() => handleToggle(item.id)}
                >
                  {item.text}
                </label>
                {item.checked ? (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {careArticles.length > 0 && (
          <Button asChild variant="outline" size="sm" className="w-full mt-4">
            <Link href="/wiki?category=care">
              View all care guides
              <ExternalLink className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

